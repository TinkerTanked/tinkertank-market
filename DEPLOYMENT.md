# TinkerTank Market - Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Setup
- [ ] Production database configured
- [ ] Stripe live keys obtained
- [ ] Environment variables set
- [ ] SSL certificate installed
- [ ] Domain DNS configured

### 2. Code Quality
- [ ] All tests passing (`npm run test`)
- [ ] Type checking clean (`npm run type-check`)
- [ ] Linting clean (`npm run lint`)
- [ ] Build successful (`npm run build`)

### 3. Database
- [ ] Production database created
- [ ] Migrations applied (`npx prisma migrate deploy`)
- [ ] Seed data populated if needed
- [ ] Connection pooling configured

### 4. Security
- [ ] Environment secrets secured
- [ ] CORS configured properly
- [ ] Rate limiting implemented
- [ ] Input validation in place

## Deployment Steps

### 1. Build Application

```bash
# Install dependencies
npm ci --production=false

# Generate Prisma client
npx prisma generate

# Build application
npm run build

# Type check
npm run type-check

# Run tests
npm run test
```

### 2. Database Migration

```bash
# Apply migrations to production
npx prisma migrate deploy

# Verify database schema
npx prisma db pull
```

### 3. Environment Configuration

Create production `.env`:

```env
# Database
DATABASE_URL="postgresql://username:password@host:5432/tinkertank_market"

# Stripe (LIVE KEYS)
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Security
NEXTAUTH_SECRET="strong-random-secret"
NEXTAUTH_URL="https://yourdomain.com"

# Optional
NODE_ENV="production"
```

### 4. Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
# Configure Stripe webhook endpoint: https://yourdomain.com/api/stripe/webhook
```

### 5. Alternative: Docker Deployment

```dockerfile
# Create Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production=false

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t tinkertank-market .
docker run -p 3000:3000 --env-file .env tinkertank-market
```

## Post-Deployment

### 1. Health Checks

Verify application health:

```bash
curl https://yourdomain.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "services": {
    "database": "connected",
    "stripe": "configured"
  }
}
```

### 2. Stripe Webhook Configuration

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed`

### 3. Monitoring Setup

- Set up error tracking (Sentry, LogRocket, etc.)
- Configure uptime monitoring
- Set up performance monitoring
- Database query monitoring

### 4. Backup Strategy

- Database backups (daily)
- Environment variable backup
- Code repository backup
- Stripe webhook logs

## Performance Optimization

### 1. Next.js Optimizations

```typescript
// next.config.ts
const nextConfig = {
  images: {
    domains: ['your-image-domain.com'],
    formats: ['image/webp', 'image/avif'],
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  compress: true,
  poweredByHeader: false,
}
```

### 2. Database Optimizations

- Connection pooling enabled
- Proper indexing on frequently queried columns
- Query optimization
- Regular VACUUM and ANALYZE

### 3. CDN Configuration

- Static assets served via CDN
- Image optimization enabled
- Gzip compression
- Browser caching headers

## Security Considerations

### 1. API Security

- Input validation with Zod
- Rate limiting
- CORS properly configured
- HTTPS only in production

### 2. Data Protection

- Sensitive data encrypted
- PII handling compliance
- Secure session management
- Payment data never stored

### 3. Monitoring

- Failed login attempts
- Unusual payment patterns
- API endpoint monitoring
- Database access logs

## Troubleshooting

### Common Issues

1. **Database Connection Fails**
   - Check DATABASE_URL format
   - Verify database is running
   - Check network connectivity
   - Verify user permissions

2. **Stripe Payments Fail**
   - Verify live API keys
   - Check webhook endpoint
   - Validate webhook secret
   - Review Stripe dashboard logs

3. **Build Fails**
   - Clear `.next` directory
   - Reinstall dependencies
   - Check TypeScript errors
   - Verify environment variables

### Debug Commands

```bash
# Check database connection
npx prisma db pull

# Test Stripe connection
npm run dev
# Navigate to /api/health

# Verify build
npm run build
npm run start
```

## Rollback Plan

### 1. Application Rollback

```bash
# Revert to previous deployment
vercel rollback

# Or redeploy previous version
git checkout previous-tag
vercel --prod
```

### 2. Database Rollback

```bash
# Rollback migration
npx prisma migrate reset --force
npx prisma db push --force-reset
```

### 3. Stripe Configuration

- Revert webhook endpoints
- Switch back to test keys if needed
- Update environment variables

## Support Contacts

- **Development Team**: dev-team@tinkertank.com
- **Database Admin**: dba@tinkertank.com
- **Infrastructure**: infra@tinkertank.com
