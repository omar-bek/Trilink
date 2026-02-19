/**
 * React Query Utilities
 * 
 * Provides standardized query configuration, timeout handling, and error recovery
 * to prevent infinite loading states.
 */

import { QueryKey, UseQueryOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';

/**
 * Check if device is mobile
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth < 768
  );
};

/**
 * Get appropriate timeout based on device type
 */
export const getQueryTimeout = (customTimeout?: number): number => {
  if (customTimeout) return customTimeout;
  return isMobileDevice() ? 60000 : 30000; // 60s mobile, 30s desktop
};

/**
 * Create a query function with timeout handling
 */
export const createQueryFnWithTimeout = <T>(
  queryFn: () => Promise<T>,
  timeout: number = getQueryTimeout()
): (() => Promise<T>) => {
  return async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const result = await queryFn();
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // If aborted, throw timeout error
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Query timeout after ${timeout}ms`);
      }
      
      throw error;
    }
  };
};

/**
 * Check if error is a client error (4xx) that shouldn't be retried
 */
export const isClientError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    return status !== undefined && status >= 400 && status < 500;
  }
  return false;
};

/**
 * Check if error is a permission error (403)
 */
export const isPermissionError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    return error.response?.status === 403;
  }
  return false;
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    return (
      !error.response ||
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED' ||
      error.message?.includes('Network Error') ||
      error.message?.includes('timeout')
    );
  }
  return false;
};

/**
 * Standard retry function for queries
 * - Don't retry 4xx errors (client errors)
 * - Retry network errors up to 2 times (3 on mobile)
 * - Use exponential backoff
 */
export const standardRetry = (
  failureCount: number,
  error: unknown
): boolean => {
  // Don't retry client errors (4xx)
  if (isClientError(error)) {
    return false;
  }

  // Retry network errors
  const maxRetries = isMobileDevice() ? 3 : 2;
  return failureCount < maxRetries;
};

/**
 * Standard retry delay with exponential backoff
 */
export const standardRetryDelay = (attemptIndex: number): number => {
  const baseDelay = 1000;
  const maxDelay = isMobileDevice() ? 60000 : 30000;
  return Math.min(baseDelay * 2 ** attemptIndex, maxDelay);
};

/**
 * Enhanced query options with timeout and error handling
 */
export const getStandardQueryOptions = <T>(
  options?: Partial<UseQueryOptions<T>>
): Partial<UseQueryOptions<T>> => {
  const timeout = getQueryTimeout(options?.meta?.timeout as number | undefined);

  return {
    ...options,
    retry: options?.retry ?? standardRetry,
    retryDelay: options?.retryDelay ?? standardRetryDelay,
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes
    gcTime: options?.gcTime ?? 10 * 60 * 1000, // 10 minutes
    throwOnError: false, // Critical: Don't throw errors, let components handle
    refetchOnWindowFocus: false, // Don't refetch on focus
    networkMode: 'online' as const,
    meta: {
      ...options?.meta,
      timeout,
    },
  };
};

/**
 * Check if query is stuck (pending but disabled)
 */
export const isQueryStuck = (
  status: 'pending' | 'error' | 'success',
  fetchStatus: 'fetching' | 'paused' | 'idle',
  dataUpdatedAt: number | undefined,
  enabled: boolean
): boolean => {
  // Query is stuck if:
  // 1. Status is pending
  // 2. Fetch status is idle (not fetching)
  // 3. No data has been loaded
  // 4. Query is disabled
  return (
    status === 'pending' &&
    fetchStatus === 'idle' &&
    !dataUpdatedAt &&
    !enabled
  );
};

/**
 * Check if query has timed out
 */
export const isQueryTimedOut = (
  dataUpdatedAt: number | undefined,
  timeout: number = getQueryTimeout()
): boolean => {
  if (!dataUpdatedAt) return false;
  const elapsed = Date.now() - dataUpdatedAt;
  return elapsed > timeout;
};
