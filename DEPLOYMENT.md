# TinkerTank Market - Deployment Guide

## Prerequisites

1. **GitHub Secrets** - Add the following secrets to your repository:
   - `AWS_ACCOUNT_ID` - Your AWS account ID
   - `AWS_ACCESS_KEY_ID` - AWS access key for ECR and S3
   - `AWS_SECRET_ACCESS_KEY` - AWS secret key
   - `AWS_REGION` - AWS region (e.g., us-east-1)
   - `DATABASE_URL` - PostgreSQL connection string (same as marvin)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (production)
   - `STRIPE_SECRET_KEY` - Stripe secret key (production)
   - `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret

2. **Kubernetes Cluster** - Ensure your kops cluster is running:
   - Cluster Name: `develop.platform.aten.rocks`
   - State Store: `s3://platform.aten.rocks`

## Database Configuration

The app uses the same PostgreSQL server as marvin. The `DATABASE_URL` secret should point to:
```
postgresql://username:password@hostname:5432/tinkertank_market
```

Make sure the database `tinkertank_market` exists on the same PostgreSQL instance.

## Stripe Configuration

### Production Stripe Secrets

You need to add the following Stripe secrets to your GitHub repository:

1. **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**
   - Get from: https://dashboard.stripe.com/apikeys
   - Starts with `pk_live_...`
   - This is safe to expose on the frontend

2. **STRIPE_SECRET_KEY**
   - Get from: https://dashboard.stripe.com/apikeys
   - Starts with `sk_live_...`
   - ⚠️ Keep this secret! Never commit to code

3. **STRIPE_WEBHOOK_SECRET**
   - Get from: https://dashboard.stripe.com/webhooks
   - Create a webhook endpoint: `https://market.tinkertank.academy/api/webhooks/stripe`
   - Select events: `checkout.session.completed`, `payment_intent.succeeded`
   - Starts with `whsec_...`

### Adding Secrets to GitHub

```bash
# Navigate to your GitHub repository
# Go to Settings > Secrets and variables > Actions > New repository secret

# Add each secret:
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Deployment Process

### 1. Deploy via GitHub Actions

Go to your repository on GitHub:
1. Click "Actions" tab
2. Select "Deploy TinkerTank Market" workflow
3. Click "Run workflow"
4. Select environment (production/staging)
5. Click "Run workflow"

### 2. What the Workflow Does

1. **Build Phase**
   - Checks out code
   - Installs dependencies
   - Runs linting
   - Generates Prisma client
   - Builds Next.js app with standalone output

2. **Docker Phase**
   - Builds Docker image for ARM64
   - Pushes to AWS ECR

3. **Deploy Phase**
   - Applies Kubernetes manifests
   - Creates/updates deployment, service, and ingress
   - Runs database migrations

### 3. Post-Deployment

After deployment:
```bash
# Check pod status
kubectl get pods -n default | grep tinkertank-market

# View logs
kubectl logs -f deployment/tinkertank-market-production -n default

# Check service
kubectl get svc tinkertank-market-production -n default

# Check ingress
kubectl get ingress tinkertank-market-production -n default
```

## Domain Configuration

The app will be available at: **https://market.tinkertank.academy**

DNS is automatically configured via external-dns annotation in the ingress.

## Environment Variables

The following environment variables are configured in production:

- `NODE_ENV=production`
- `PORT=3000`
- `DATABASE_URL` - PostgreSQL connection (from secrets)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `NEXT_PUBLIC_APP_URL=https://market.tinkertank.academy`

## Troubleshooting

### Pod not starting
```bash
kubectl describe pod <pod-name> -n default
kubectl logs <pod-name> -n default
```

### Database connection issues
Verify `DATABASE_URL` secret is correct and database exists

### Stripe webhook failures
1. Check webhook URL is correct in Stripe dashboard
2. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe
3. Check logs for webhook errors

### Build failures
Check GitHub Actions logs for specific error messages

## Rollback

To rollback to previous version:
```bash
# List previous deployments
kubectl rollout history deployment/tinkertank-market-production -n default

# Rollback to previous version
kubectl rollout undo deployment/tinkertank-market-production -n default

# Rollback to specific revision
kubectl rollout undo deployment/tinkertank-market-production -n default --to-revision=<revision>
```

## Manual Database Migrations

If you need to run migrations manually:
```bash
# SSH into pod
kubectl exec -it deployment/tinkertank-market-production -n default -- sh

# Run migrations
npx prisma migrate deploy

# Exit
exit
```

## Monitoring

- **Logs**: `kubectl logs -f deployment/tinkertank-market-production -n default`
- **Pod Status**: `kubectl get pods -l name=tinkertank-market-production -n default`
- **Resource Usage**: `kubectl top pods -l name=tinkertank-market-production -n default`

## Resource Limits

Current configuration:
- **Requests**: 512Mi memory, 250m CPU
- **Limits**: 1Gi memory, 500m CPU

Adjust in [tinkertank-market-template.yml](.github/workflows/tinkertank-market-template.yml) if needed.
