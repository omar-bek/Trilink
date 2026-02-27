import * as Sentry from '@sentry/react';
import React from 'react';
import { env } from './env';

/**
 * Sentry Error Monitoring Configuration
 * 
 * Features:
 * - React error boundary integration
 * - API error capture
 * - User context tracking
 * - Environment-based configuration
 * - Performance monitoring
 * - Source maps support
 */

/**
 * Initialize Sentry
 * Should be called before React app renders
 */
export const initSentry = () => {
  // Skip initialization if DSN not provided or disabled in dev
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  const enableSentry = import.meta.env.VITE_ENABLE_SENTRY !== 'false';

  if (!sentryDsn || (!env.isProduction && !enableSentry)) {
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: env.isProduction ? 'production' : 'development',
    release: env.appVersion,
    integrations: [
      // React Router integration for better error context
      Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect: React.useEffect,
        useLocation: () => {
          // Will be provided by React Router context
          return { pathname: window.location.pathname, search: '', hash: '', state: null };
        },
        useNavigationType: () => 'POP' as any,
        createRoutesFromChildren: (children: any) => children,
        matchRoutes: () => [],
      } as any),
      // Capture unhandled promise rejections
      Sentry.captureConsoleIntegration({
        levels: ['error'],
      }),
      // Performance monitoring
      Sentry.browserTracingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: env.isProduction ? 0.1 : 1.0, // 10% in prod, 100% in dev
    // Session Replay (optional - can be expensive)
    replaysSessionSampleRate: env.isProduction ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0, // Always capture replays on errors

    // Filter out sensitive data
    beforeSend(event, hint) {
      // Don't send errors in development unless explicitly enabled
      if (env.isDevelopment && !enableSentry) {
        return null;
      }

      // Filter out known non-critical errors
      if (event.exception) {
        const error = hint.originalException;
        
        // Ignore network errors (handled by retry logic)
        if (error instanceof Error) {
          if (error.message.includes('Network Error') || 
              error.message.includes('timeout')) {
            return null;
          }
        }

        // Ignore 401 errors (handled by auth refresh)
        if (event.tags?.statusCode === 401) {
          return null;
        }
      }

      return event;
    },

    // Filter breadcrumbs
    beforeBreadcrumb(breadcrumb) {
      // Don't capture console.log in production
      if (breadcrumb.category === 'console' && env.isProduction) {
        return null;
      }
      return breadcrumb;
    },

    // Ignore specific errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      'atomicFindClose',
      'fb_xd_fragment',
      'bmi_SafeAddOnload',
      'EBCallBackMessageReceived',
      // Network errors that are handled
      'NetworkError',
      'Failed to fetch',
      'Network request failed',
      // Chrome extensions
      'chrome-extension://',
      'moz-extension://',
    ],
  });

  // Set initial tags
  Sentry.setTag('app', env.appName);
  Sentry.setTag('version', env.appVersion);
};

/**
 * Set user context for error tracking
 * Should be called after user login
 */
export const setSentryUser = (user: {
  id: string;
  email?: string;
  role?: string;
  companyId?: string;
} | null) => {
  if (!user) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.email, // Sentry uses username field
    // Custom context
    role: user.role,
    companyId: user.companyId,
  });

  // Set additional tags
  Sentry.setTag('user.role', user.role || 'unknown');
  if (user.companyId) {
    Sentry.setTag('user.companyId', user.companyId);
  }
};

/**
 * Clear user context
 * Should be called on logout
 */
export const clearSentryUser = () => {
  Sentry.setUser(null);
};

/**
 * Capture API error with context
 */
export const captureApiError = (
  error: any,
  context?: {
    url?: string;
    method?: string;
    statusCode?: number;
    requestData?: any;
  }
) => {
  Sentry.withScope((scope) => {
    // Add API context
    if (context?.url) {
      scope.setTag('api.url', context.url);
    }
    if (context?.method) {
      scope.setTag('api.method', context.method);
    }
    if (context?.statusCode) {
      scope.setTag('api.statusCode', context.statusCode.toString());
      scope.setLevel(
        context.statusCode >= 500 ? 'error' :
        context.statusCode >= 400 ? 'warning' : 'info'
      );
    }

    // Add request context
    if (context?.requestData) {
      scope.setContext('request', {
        data: context.requestData,
      });
    }

    // Capture error
    Sentry.captureException(error);
  });
};

/**
 * Capture message with level
 */
export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = 'info'
) => {
  Sentry.captureMessage(message, level);
};

// Export Sentry for direct use if needed
export { Sentry };
