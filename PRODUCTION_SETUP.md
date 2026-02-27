# Production Setup Checklist

## 🔐 Environment Variables Setup

Create `.env.production` file in the root directory with the following variables:

```bash
# Server Configuration
NODE_ENV=production
PORT=3000

# Database
MONGODB_URI=mongodb://mongodb:27017/trilink
REDIS_URL=redis://:your-redis-password@redis:6379
REDIS_PASSWORD=your-secure-redis-password

# Security (Generate with: openssl rand -base64 32)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
BCRYPT_ROUNDS=12

# CORS
CORS_ORIGIN=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Email
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=TriLink Platform

# Payment Gateways
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_ENVIRONMENT=production

# AWS S3
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name

# Frontend Build
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_APP_NAME=TriLink
VITE_APP_VERSION=1.0.0
VITE_SENTRY_DSN=your-sentry-dsn

# Other
AI_ENABLED=true
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🚀 Quick Start

```bash
# 1. Copy environment file
cp .env.production.example .env.production

# 2. Edit environment variables
nano .env.production

# 3. Build and start
docker-compose build
docker-compose up -d

# 4. Check status
docker-compose ps
docker-compose logs -f
```

## 📝 Pre-Deployment Checklist

- [ ] All environment variables set
- [ ] Strong JWT secrets generated
- [ ] Database credentials configured
- [ ] SSL certificates ready
- [ ] CORS origin set correctly
- [ ] Payment gateway keys configured
- [ ] Email service configured
- [ ] AWS S3 configured (if using)
- [ ] Health checks passing
- [ ] Logs monitoring set up
