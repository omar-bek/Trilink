# Sentry Error Monitoring Setup

## Overview

Sentry has been integrated into the TriLink frontend for comprehensive error monitoring, performance tracking, and user context capture.

## Installation

Install required Sentry packages:

```bash
npm install @sentry/react
```

## Environment Variables

Add the following to your `.env` files:

### `.env.development` (Local Development)
```env
# Sentry Configuration
VITE_SENTRY_DSN=your-sentry-dsn-here
VITE_ENABLE_SENTRY=false  # Set to 'true' to enable in dev
```

### `.env.production` (Production)
```env
# Sentry Configuration
VITE_SENTRY_DSN=your-sentry-dsn-here
VITE_ENABLE_SENTRY=true
```

### `.env.staging` (Staging)
```env
# Sentry Configuration
VITE_SENTRY_DSN=your-sentry-dsn-here
VITE_ENABLE_SENTRY=true
```

## Getting Your Sentry DSN

1. Sign up at [sentry.io](https://sentry.io)
2. Create a new project (React)
3. Copy the DSN from project settings
4. Add it to your environment variables

## Features

### 1. React Error Boundary Integration

All React component errors are automatically captured:

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

**Features:**
- Automatic error capture
- User-friendly error UI
- Error reporting dialog
- Error ID for support tickets

### 2. API Error Capture

API errors are automatically captured with context:

- Request URL and method
- Status code
- Request data (sanitized)
- Response data

**Excluded Errors:**
- 401 errors (handled by token refresh)
- 403 errors (handled by RBAC)
- Network timeouts (handled by retry logic)

### 3. User Context Tracking

User information is automatically attached to errors:

- User ID
- Email
- Role
- Company ID

**Automatic Updates:**
- Set on login
- Cleared on logout
- Updated on user changes

### 4. Performance Monitoring

- Transaction tracing
- Performance metrics
- Slow operation detection

**Sampling:**
- Production: 10% of transactions
- Development: 100% of transactions

### 5. Session Replay

- Error replay: 100% of errors
- Session replay: 10% in production, 100% in dev

## Configuration

### Disable Sentry in Development

By default, Sentry is disabled in development unless explicitly enabled:

```env
VITE_ENABLE_SENTRY=false  # Disabled
VITE_ENABLE_SENTRY=true   # Enabled
```

### Custom Error Filtering

Edit `frontend/src/config/sentry.ts` to customize:

```typescript
beforeSend(event, hint) {
  // Filter out specific errors
  if (event.exception) {
    const error = hint.originalException;
    if (error instanceof Error && error.message.includes('Network Error')) {
      return null; // Don't send
    }
  }
  return event;
}
```

## Usage Examples

### Manual Error Capture

```typescript
import { captureMessage, captureApiError } from '@/config/sentry';

// Capture a message
captureMessage('Something important happened', 'info');

// Capture API error with context
captureApiError(error, {
  url: '/api/users',
  method: 'POST',
  statusCode: 500,
  requestData: { email: 'user@example.com' },
});
```

### Set User Context Manually

```typescript
import { setSentryUser } from '@/config/sentry';

setSentryUser({
  id: 'user-123',
  email: 'user@example.com',
  role: 'Buyer',
  companyId: 'company-456',
});
```

### Clear User Context

```typescript
import { clearSentryUser } from '@/config/sentry';

clearSentryUser();
```

## Error Boundary Features

The ErrorBoundary component includes:

1. **Error Display**
   - User-friendly error message
   - Error details (in development)
   - Error ID for support

2. **Actions**
   - Try Again (reset error boundary)
   - Go Home (navigate to dashboard)
   - Report Error (open Sentry feedback dialog)

3. **Development Mode**
   - Shows full error stack trace
   - Shows component stack
   - Detailed error information

## Source Maps

For production error tracking with readable stack traces:

1. **Build with source maps:**
```bash
npm run build  # Already configured in vite.config.ts
```

2. **Upload source maps to Sentry:**
```bash
# Install Sentry CLI
npm install --save-dev @sentry/cli

# Upload source maps
npx sentry-cli releases files <release> upload-sourcemaps dist
```

Or use the Sentry Vite plugin (recommended):

```bash
npm install --save-dev @sentry/vite-plugin
```

Update `vite.config.ts`:

```typescript
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: 'your-org',
      project: 'your-project',
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
  // ... rest of config
});
```

## Filtered Errors

The following errors are automatically filtered out:

- Browser extension errors
- Network errors (handled by retry)
- 401 errors (handled by auth refresh)
- Console.log messages in production
- Known browser extension errors

## Performance Impact

- **Bundle Size:** ~50KB gzipped
- **Runtime Overhead:** Minimal (< 1ms per error)
- **Network:** Errors sent asynchronously (non-blocking)

## Security Considerations

### Sensitive Data Filtering

Sentry automatically filters:
- Passwords
- Credit card numbers
- API keys (common patterns)

### Custom Data Scrubbing

Add custom scrubbing in `sentry.ts`:

```typescript
beforeSend(event) {
  // Remove sensitive data
  if (event.request?.data) {
    delete event.request.data.password;
    delete event.request.data.creditCard;
  }
  return event;
}
```

## Monitoring Dashboard

Access your Sentry dashboard at:
- **URL:** https://sentry.io/organizations/your-org/issues/
- **Features:**
  - Error trends
  - User impact
  - Performance metrics
  - Release tracking
  - User feedback

## Troubleshooting

### Sentry Not Capturing Errors

1. **Check DSN:**
   ```bash
   echo $VITE_SENTRY_DSN
   ```

2. **Check Enable Flag:**
   ```bash
   echo $VITE_ENABLE_SENTRY
   ```

3. **Check Browser Console:**
   - Look for Sentry initialization messages
   - Check for CORS errors

### Errors Not Showing User Context

- Ensure `setSentryUser()` is called after login
- Check that user data is available in auth store
- Verify Sentry initialization happens before user login

### Source Maps Not Working

- Ensure source maps are generated in build
- Upload source maps to Sentry
- Verify release version matches

## Best Practices

1. **Don't Over-Capture:**
   - Let Sentry handle automatic capture
   - Only manually capture important events

2. **Add Context:**
   - Use `captureApiError()` with context
   - Set user context on login
   - Add tags for filtering

3. **Monitor Performance:**
   - Review performance tab regularly
   - Identify slow operations
   - Optimize based on data

4. **Review Errors:**
   - Check Sentry dashboard daily
   - Triage errors by impact
   - Fix critical errors first

## Integration Checklist

- [x] Sentry SDK installed
- [x] Configuration file created
- [x] ErrorBoundary integrated
- [x] API error capture added
- [x] User context tracking
- [x] Environment-based config
- [ ] DSN added to environment variables
- [ ] Source maps configured
- [ ] Sentry dashboard access configured
- [ ] Team notifications set up

## Support

For Sentry-specific issues:
- [Sentry Documentation](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Sentry Support](https://sentry.io/support/)

---

**Last Updated:** 2024-12-19  
**Status:** Implementation Complete - Awaiting DSN Configuration
