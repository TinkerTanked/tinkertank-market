# EKS Deployment Guide for TinkerTank Market

This guide covers deploying tinkertank-market to the new EKS cluster with Aurora Serverless v2 database.

## Prerequisites

### 1. Deploy Aurora Database

First, enable and deploy the Aurora database in the infrastructure repo:

```bash
cd /Users/alien/Development/tinkertank/tinkertank-infra/environments/dev

# Enable Aurora
echo 'enable_aurora = true' >> terraform.tfvars

# Deploy Aurora
terraform init  # Only needed if first time
terraform plan
terraform apply
```

**Cost**: ~$43-60/month at minimum capacity (0.5-2 ACUs)

### 2. Get Database Connection String

After Aurora is deployed, get the DATABASE_URL:

```bash
cd /Users/alien/Development/tinkertank/tinkertank-infra/environments/dev
terraform output -raw aurora_database_url
```

This will output something like:
```
postgresql://postgres:RANDOM_PASSWORD@tinkertank-dev-market.cluster-xxx.ap-southeast-2.rds.amazonaws.com:5432/tinkertank_market
```

### 3. Install AWS Load Balancer Controller

The new deployment uses AWS ALB instead of nginx Ingress. Install the AWS Load Balancer Controller:

```bash
# Get your cluster name
kubectl config current-context

# Add IAM policy for ALB Controller
curl -o iam_policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.7.0/docs/install/iam_policy.json
aws iam create-policy \
    --policy-name AWSLoadBalancerControllerIAMPolicy \
    --policy-document file://iam_policy.json

# Install via Helm
helm repo add eks https://aws.github.io/eks-charts
helm repo update

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=tinkertank-dev \
  --set serviceAccount.create=true \
  --set serviceAccount.name=aws-load-balancer-controller
```

Verify installation:
```bash
kubectl get deployment -n kube-system aws-load-balancer-controller
```

### 4. Update GitHub Secrets

Update the following GitHub secrets in the tinkertank-market repository:

1. **DATABASE_URL**: The Aurora connection string from step 2
2. **AWS_REGION**: `ap-southeast-2` (if not already set)
3. **AWS_ACCOUNT_ID**: Your AWS account ID
4. **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**: Stripe publishable key
5. **STRIPE_SECRET_KEY**: Stripe secret key
6. **STRIPE_WEBHOOK_SECRET**: Stripe webhook secret
7. **ADMIN_USERNAME**: Admin panel username
8. **ADMIN_PASSWORD**: Admin panel password

## Deployment Options

### Option 1: GitHub Actions (Recommended)

1. **Merge the feature branch** (or deploy from it):

```bash
cd /Users/alien/Development/tinkertank/tinkertank-market

# Push the feature branch
git push -u origin feature/eks-deployment

# Option A: Create a PR and merge to main
# Option B: Deploy directly from feature branch via workflow_dispatch
```

2. **Trigger the workflow**:
   - Go to GitHub Actions
   - Select "Deploy TinkerTank Market" workflow
   - Click "Run workflow"
   - Select `feature/eks-deployment` branch
   - Choose environment: `production`

3. **Monitor the deployment**:
   - Watch GitHub Actions logs
   - Monitor pods: `kubectl get pods -l app=tinkertank-market -w`

### Option 2: Manual Deployment (Testing)

For testing before pushing to GitHub:

```bash
cd /Users/alien/Development/tinkertank/tinkertank-market

# Build and push Docker image
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export AWS_REGION=ap-southeast-2
export REPO_NAME=tinkertank-market
export IMAGE_TAG=$(git rev-parse HEAD)

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build for ARM64 (Bottlerocket/Graviton)
docker buildx build --platform linux/arm64 \
  -t $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPO_NAME:$IMAGE_TAG \
  --push .

# Deploy to EKS
aws eks update-kubeconfig --name tinkertank-dev --region $AWS_REGION

# Substitute environment variables
export NODE_ENV=production
export DATABASE_URL="<from terraform output>"
export NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="<your key>"
export STRIPE_SECRET_KEY="<your key>"
export STRIPE_WEBHOOK_SECRET="<your secret>"
export NEXT_PUBLIC_APP_URL="https://tinkertank.rocks"
export ADMIN_USERNAME="<your username>"
export ADMIN_PASSWORD="<your password>"
export GITHUB_SHA=$IMAGE_TAG
export AWS_DEFAULT_REGION=$AWS_REGION

# Generate deployment manifest
envsubst < .github/k8s/deployment-template.yml > deployment.yml

# Apply
kubectl apply -f deployment.yml

# Wait for rollout
kubectl rollout status deployment/tinkertank-market-production -n default

# Run migrations
POD_NAME=$(kubectl get pods -l app=tinkertank-market,environment=production -o jsonpath='{.items[0].metadata.name}')
kubectl exec $POD_NAME -- npx prisma migrate deploy
```

## Post-Deployment

### 1. Verify Deployment

```bash
# Check pods
kubectl get pods -l app=tinkertank-market

# Check service
kubectl get svc tinkertank-market-production

# Check ingress and get ALB DNS
kubectl get ingress tinkertank-market-production
kubectl describe ingress tinkertank-market-production
```

The ALB DNS name will be in the ingress output, something like:
```
k8s-default-tinkerta-xxx-123456789.ap-southeast-2.elb.amazonaws.com
```

### 2. Update DNS

Point your domain `tinkertank.rocks` to the ALB:

```bash
# Get the ALB hostname
ALB_HOSTNAME=$(kubectl get ingress tinkertank-market-production -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
echo "ALB Hostname: $ALB_HOSTNAME"

# Create/update Route53 record (or your DNS provider)
# Create an ALIAS record pointing tinkertank.rocks -> ALB hostname
```

### 3. Configure SSL Certificate

The current Ingress is configured for HTTP/HTTPS but needs an ACM certificate:

1. **Request a certificate** in AWS Certificate Manager:
```bash
aws acm request-certificate \
  --domain-name tinkertank.rocks \
  --validation-method DNS \
  --region ap-southeast-2
```

2. **Validate the certificate** via DNS (follow ACM console instructions)

3. **Update the Ingress** with the certificate ARN:
```bash
# Get cert ARN
CERT_ARN=$(aws acm list-certificates --region ap-southeast-2 --query 'CertificateSummaryList[?DomainName==`tinkertank.rocks`].CertificateArn' --output text)

# Update the deployment template
# Uncomment and update this line in .github/k8s/deployment-template.yml:
# alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:REGION:ACCOUNT:certificate/CERT_ID
```

### 4. Test the Application

```bash
# Port-forward for immediate testing
kubectl port-forward svc/tinkertank-market-production 3000:80

# Or test via ALB
curl http://$ALB_HOSTNAME
```

### 5. Monitor Application

```bash
# View logs
kubectl logs -l app=tinkertank-market --tail=100 -f

# Check resource usage
kubectl top pods -l app=tinkertank-market

# Check events
kubectl get events --sort-by='.lastTimestamp' | grep tinkertank-market
```

## Architecture

### Current Setup
- **EKS Cluster**: `tinkertank-dev` (Kubernetes 1.34)
- **Nodes**: 2x t4g.medium (managed) + Karpenter (Bottlerocket, ARM64)
- **Database**: Aurora Serverless v2 PostgreSQL (0.5-2 ACUs)
- **Load Balancer**: AWS Application Load Balancer (ALB)
- **Replicas**: 2 pods with pod anti-affinity
- **Resources**: 500m CPU, 512Mi RAM (request), 1 CPU, 1Gi RAM (limit)

### Cost Estimate
- **EKS Control Plane**: $72/month
- **Worker Nodes**: ~$50/month (2x t4g.medium)
- **Aurora Serverless**: ~$43-60/month
- **ALB**: ~$22/month + data transfer
- **NAT Gateway**: ~$32/month
- **Total**: ~$219-236/month

## Troubleshooting

### Pods not starting
```bash
kubectl describe pod <pod-name>
kubectl logs <pod-name>
```

### Database connection issues
```bash
# Test from pod
kubectl exec -it <pod-name> -- sh
nc -zv tinkertank-dev-market.cluster-xxx.ap-southeast-2.rds.amazonaws.com 5432
```

### ALB not created
```bash
# Check ALB controller logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller

# Check ingress events
kubectl describe ingress tinkertank-market-production
```

### Migration fails
```bash
# Run manually
POD_NAME=$(kubectl get pods -l app=tinkertank-market -o jsonpath='{.items[0].metadata.name}')
kubectl exec -it $POD_NAME -- npx prisma migrate deploy
```

## Rollback

If something goes wrong:

```bash
# Rollback to previous deployment
kubectl rollout undo deployment/tinkertank-market-production

# Or rollback to specific revision
kubectl rollout history deployment/tinkertank-market-production
kubectl rollout undo deployment/tinkertank-market-production --to-revision=<number>
```

## Next Steps

1. **Enable GuardDuty**: Security monitoring (~$30/month)
```bash
cd /Users/alien/Development/tinkertank/tinkertank-infra/environments/dev
echo 'enable_guardduty = true' >> terraform.tfvars
echo 'guardduty_alert_emails = ["your-email@example.com"]' >> terraform.tfvars
terraform apply
```

2. **Set up monitoring**: CloudWatch Container Insights, Prometheus, Grafana

3. **Configure autoscaling**: HPA for pods, Karpenter for nodes

4. **Backup strategy**: Aurora automated backups + manual snapshots before major changes

5. **CI/CD improvements**: 
   - Add staging environment
   - Canary deployments
   - Automated testing before deployment

## Support

For issues:
1. Check this guide's troubleshooting section
2. Review GitHub Actions logs
3. Check `KARPENTER_ISSUES.md` in tinkertank-infra repo
4. Review EKS cluster status: `kubectl get nodes -o wide`
