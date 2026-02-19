import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from '@/theme/theme';
import { AppRouter } from '@/router/AppRouter';
import { useAuthStore } from '@/store/auth.store';
import { socketService } from '@/services/socket.service';
import { initSentry, setSentryUser, clearSentryUser } from '@/config/sentry';
import { NotificationProvider } from '@/components/Notification/NotificationProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary/ErrorBoundary';
import '@/styles/accessibility.css';
import '@/styles/ui-enhancements.css';

// Initialize Sentry BEFORE React app renders
initSentry();

/**
 * Secure App Initializer
 * 
 * Security improvements:
 * - No localStorage reading for tokens
 * - Attempts to refresh token using httpOnly cookie on app load
 * - Socket connection based on in-memory token only
 * - Proper initialization state tracking prevents race conditions
 * - Graceful error handling - app continues even if initialization fails
 */
const AppInitializer = () => {
  useEffect(() => {
    // Initialize auth state by attempting token refresh
    // Backend reads refreshToken from httpOnly cookie
    // This is called once on app mount and uses promise tracking to prevent race conditions
    const initializeAuth = async () => {
      const { initializeAuth: initAuth, accessToken } = useAuthStore.getState();
      
      try {
        // This will set isInitialized flag when complete
        await initAuth();
        
        // Connect socket if we have an access token after initialization
        // Connect to all namespaces by default
        const currentState = useAuthStore.getState();
        if (currentState.accessToken) {
          try {
            socketService.connect(currentState.accessToken);
          } catch (socketError) {
            // Socket connection failure should not crash the app
            if (import.meta.env.DEV) {
              console.warn('Socket connection failed:', socketError);
            }
          }
        }
      } catch (error) {
        // Refresh failed - user needs to login
        // This is expected if no valid httpOnly cookie exists
        // initializeAuth already handles clearing auth state and setting isInitialized
        // Do NOT throw - allow app to continue rendering
        try {
          socketService.disconnect();
        } catch (disconnectError) {
          // Ignore disconnect errors
        }
      }
    };

    // Start initialization immediately on mount
    // Wrap in try-catch to prevent unhandled promise rejection
    initializeAuth().catch((error) => {
      // Initialization error should not crash the app
      if (import.meta.env.DEV) {
        console.warn('App initialization error:', error);
      }
    });

    // Subscribe to auth changes for socket management and Sentry user context
    const unsubscribeAuth = useAuthStore.subscribe((state) => {
      const { accessToken, user, isAuthenticated } = state;
      
      // Socket management
      if (accessToken && isAuthenticated) {
        try {
          // Update socket token if already connected, otherwise connect
          if (socketService.isConnected()) {
            socketService.updateToken(accessToken);
          } else if (accessToken) {
            // Only connect if we have a valid token
            try {
              socketService.connect(accessToken);
            } catch (socketError) {
              // Socket connection failure should not crash the app
              if (import.meta.env.DEV) {
                console.warn('Socket connection failed after token update:', socketError);
              }
            }
          }
        } catch (socketError) {
          // Socket errors should not crash the app
          if (import.meta.env.DEV) {
            console.warn('Socket operation failed:', socketError);
          }
        }
      } else {
        // Disconnect socket if not authenticated
        try {
          socketService.disconnect();
        } catch (disconnectError) {
          // Ignore disconnect errors
        }
      }

      // Sentry user context
      try {
        if (user) {
          setSentryUser({
            id: user.id,
            email: user.email,
            role: user.role,
            companyId: user.companyId,
          });
        } else {
          clearSentryUser();
        }
      } catch (sentryError) {
        // Sentry errors should not crash the app
        if (import.meta.env.DEV) {
          console.warn('Sentry operation failed:', sentryError);
        }
      }
    });

    return () => {
      unsubscribeAuth();
      try {
        socketService.disconnect();
      } catch (error) {
        // Ignore cleanup errors
      }
    };
  }, []);

  return null;
};

// Root component with error boundary
const App = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <NotificationProvider>
          <AppInitializer />
          <AppRouter />
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

// Render with error boundary at root level
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
