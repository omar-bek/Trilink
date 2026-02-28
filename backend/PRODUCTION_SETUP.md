# Production Environment Setup

## Quick Start

1. **Copy the example file:**
   ```bash
   cp env.production.example .env.production
   ```

2. **Edit `.env.production` and fill in your production values:**
   ```bash
   nano .env.production
   # or
   vim .env.production
   ```

3. **Generate strong JWT secrets:**
   ```bash
   openssl rand -base64 64
   ```
   Copy the output and use it for `JWT_SECRET` and `JWT_REFRESH_SECRET`

4. **Build and start:**
   ```bash
   npm run build
   NODE_ENV=production npm start
   ```

## Important Production Settings

### Required Changes:

1. **JWT Secrets** - MUST be changed from defaults
   ```bash
   openssl rand -base64 64
   ```

2. **CORS_ORIGIN** - Set to your production domain
   ```
   CORS_ORIGIN=https://trilink.me
   ```

3. **FRONTEND_URL** - Set to your production frontend URL
   ```
   FRONTEND_URL=https://trilink.me
   ```

4. **MongoDB URI** - Use production database
   ```
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
   ```

5. **Redis** - Required for production (caching & Socket.io)
   ```
   REDIS_URL=redis://localhost:6379
   ```

6. **AWS S3** - Required for file uploads
   ```
   AWS_ACCESS_KEY_ID=your-key
   AWS_SECRET_ACCESS_KEY=your-secret
   AWS_S3_BUCKET=your-bucket
   ```

7. **Email** - SendGrid or SMTP
   ```
   SENDGRID_API_KEY=your-key
   EMAIL_FROM=noreply@trilink.me
   ```

8. **Payment Gateways** - Use production keys
   ```
   STRIPE_SECRET_KEY=sk_live_...
   PAYPAL_ENVIRONMENT=production
   ```

### Optional Settings:

- **FRONTEND_DIST_PATH** - Only if frontend is in non-standard location
- **ENABLE_SWAGGER** - Set to `false` for security (default: disabled in production)

## Security Checklist

- [ ] Changed JWT secrets (use `openssl rand -base64 64`)
- [ ] Updated CORS_ORIGIN to production domain
- [ ] Using production MongoDB database
- [ ] Redis configured and running
- [ ] AWS S3 configured for file uploads
- [ ] Email service configured (SendGrid or SMTP)
- [ ] Payment gateways using production keys
- [ ] Swagger disabled (ENABLE_SWAGGER=false)
- [ ] Frontend built and deployed
- [ ] SSL/HTTPS configured
- [ ] Firewall rules configured
- [ ] Environment variables secured (not in git)

## Deployment Commands

```bash
# Build
npm run build

# Start with PM2 (recommended)
pm2 start dist/server.js --name trilink-backend --env production

# Or with npm
NODE_ENV=production npm start
```

## Troubleshooting

### Frontend not loading?
- Check `FRONTEND_DIST_PATH` if frontend is in non-standard location
- Verify frontend/dist exists and contains index.html
- Check file permissions

### Redis connection errors?
- Ensure Redis is running: `redis-cli ping`
- Check REDIS_URL format
- Verify firewall allows Redis connections

### MongoDB connection errors?
- Verify MONGODB_URI is correct
- Check network access to MongoDB Atlas
- Verify database user permissions
