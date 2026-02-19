import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import { ApiResponse, ApiError } from '@/types';
import { navigateTo, getCurrentPath } from '@/utils/navigation';
import { captureApiError } from '@/config/sentry';

/**
 * Secure API Client with httpOnly Cookie-based Authentication
 * 
 * Security improvements:
 * - Access token stored ONLY in memory (via authStoreRef)
 * - Refresh token stored in httpOnly cookie (handled by backend)
 * - NO localStorage usage for tokens
 * - Automatic token refresh on 401 errors
 * - Proper error handling and cleanup
 */

// Store reference to avoid circular dependency
// This will be set from the auth store module
let authStoreRef: {
  accessToken: string | null;
  setAccessToken: (accessToken: string) => void;
  setUser: (user: any) => void;
  clearAuth: () => void;
} | null = null;

// Function to set the auth store reference (called from auth store)
export const setAuthStoreRef = (store: typeof authStoreRef) => {
  authStoreRef = store;
};

// Create axios instance with credentials to allow httpOnly cookies
const api: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  // CRITICAL: Include credentials to send/receive httpOnly cookies
  withCredentials: true,
});

// Track if refresh is in progress to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor - Add auth token from memory only
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token ONLY from in-memory store reference
    // NO localStorage fallback - security requirement
    const token = authStoreRef?.accessToken;
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle network errors (no response) - API unreachable
    if (!error.response) {
      // Network error - API server is unreachable
      const isNetworkError = error.code === 'ERR_NETWORK' || 
                            error.code === 'ECONNABORTED' ||
                            error.message?.includes('Network Error') ||
                            error.message?.includes('timeout');
      
      if (isNetworkError) {
        // Don't crash - return a structured error response
        // Components should handle this gracefully
        const networkError: AxiosError<ApiError> = {
          ...error,
          response: {
            ...error.response,
            status: 0,
            statusText: 'Network Error',
            data: {
              success: false,
              error: 'Unable to connect to server. Please check your internet connection.',
              message: 'Network error - server may be unreachable',
            } as ApiError,
          } as any,
        };
        
        // Only log in development
        if (import.meta.env.DEV) {
          console.warn('Network error:', error.message);
        }
        
        return Promise.reject(networkError);
      }
      
      // Other request errors (timeout, etc.)
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized - Try to refresh token using httpOnly cookie
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        // If refresh is already in progress, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Backend reads refreshToken from httpOnly cookie automatically
        // No need to send refreshToken in request body
        // Use base axios instance to avoid interceptor loop
        const refreshAxios = axios.create({
          baseURL: env.apiBaseUrl,
          withCredentials: true, // Include httpOnly cookie
        });

        const response = await refreshAxios.post<ApiResponse<{ accessToken: string; user: any }>>(
          '/auth/refresh',
          {}, // Empty body - refreshToken comes from httpOnly cookie
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const { accessToken, user } = response.data.data;
        
        // Update in-memory access token and user
        if (authStoreRef?.setAccessToken) {
          authStoreRef.setAccessToken(accessToken);
        }
        
        // Update user in store if available (refresh returns user data for multi-tab sync)
        if (user && authStoreRef?.setUser) {
          authStoreRef.setUser(user);
        }

        // Update Socket.io token if connected
        try {
          const { socketService } = await import('./socket.service');
          if (socketService.isConnected()) {
            socketService.updateToken(accessToken);
          }
        } catch (socketError) {
          // Socket update failure should not block token refresh
          if (import.meta.env.DEV) {
            console.warn('Failed to update socket token:', socketError);
          }
        }

        // Process queued requests
        processQueue(null, accessToken);

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        isRefreshing = false;
        return api(originalRequest);
      } catch (refreshError: any) {
        // Refresh failed - clear auth and redirect to login
        isRefreshing = false;
        processQueue(refreshError, null);

        // Clear in-memory auth state
        if (authStoreRef?.clearAuth) {
          authStoreRef.clearAuth();
        }
        
        // Suppress expected 401 errors during initialization (no valid refresh token)
        // Only log unexpected errors
        const isExpectedError = refreshError?.response?.status === 401;
        if (!isExpectedError && import.meta.env.DEV) {
          console.warn('Token refresh failed:', refreshError?.message);
        }
        
        // Only redirect if not already on landing page and not during initialization
        // Check if we're on a public route to avoid redirect loops
        const currentPath = window.location.pathname;
        const isPublicRoute = currentPath === '/' || 
                             currentPath === '/login' || 
                             currentPath === '/register' || 
                             currentPath === '/forgot-password' || 
                             currentPath === '/reset-password';
        
        if (!isPublicRoute) {
          // Use replace to avoid adding to history
          try {
            window.location.replace('/');
          } catch (navError) {
            // Navigation error should not crash
            if (import.meta.env.DEV) {
              console.warn('Navigation error:', navError);
            }
          }
        }
        
        // Return a rejected promise but don't log expected errors
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Forbidden - User lacks permission
    // IMPORTANT: User is authenticated but lacks permission - DO NOT clear auth state
    if (error.response?.status === 403) {
      const currentPath = getCurrentPath();
      
      // Only redirect if not already on unauthorized page or login page
      // Also check if the request URL is for the unauthorized page itself
      const requestUrl = originalRequest?.url || '';
      const isUnauthorizedPage = currentPath === '/unauthorized' || 
                                 currentPath.startsWith('/unauthorized') ||
                                 requestUrl.includes('/unauthorized');
      const isLoginPage = currentPath === '/login' || currentPath.startsWith('/login');
      
      if (!isUnauthorizedPage && !isLoginPage) {
        // Extract error message from response
        const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           'You do not have permission to access this resource.';
        
        // Navigate to unauthorized page with error message in state
        navigateTo('/unauthorized', {
          replace: true,
          state: {
            error: errorMessage,
            statusCode: 403,
            from: currentPath,
          },
        });
      }
      
      // Reject the promise to prevent the request from continuing
      // But don't log errors when already on unauthorized page (expected behavior)
      return Promise.reject(error);
    }

    // Capture API errors in Sentry (except handled cases above)
    // Don't capture 401 (handled by refresh) or 403 (handled above)
    if (error.response && error.response.status !== 401 && error.response.status !== 403) {
      captureApiError(error, {
        url: originalRequest?.url,
        method: originalRequest?.method?.toUpperCase(),
        statusCode: error.response.status,
        requestData: originalRequest?.data,
      });
    } else if (!error.response) {
      // Network errors or other unhandled errors
      captureApiError(error, {
        url: originalRequest?.url,
        method: originalRequest?.method?.toUpperCase(),
      });
    }

    return Promise.reject(error);
  }
);

export default api;
