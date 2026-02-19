import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ErrorType, getErrorType } from '@/components/Error/ErrorStates';
import { cacheService } from '@/services/cache.service';
import { ApiError } from '@/types';

export interface ErrorHandlerOptions {
  context?: string;
  enableCache?: boolean;
  cacheKey?: string;
  onRetry?: () => void;
  onEscalation?: () => void;
  showNotification?: boolean;
}

export interface ErrorInfo {
  type: ErrorType;
  message: string;
  statusCode?: number;
  errorCode?: string;
  timestamp: Date;
  context?: string;
  canRetry: boolean;
  canEscalate: boolean;
  cachedData?: any;
}

/**
 * Comprehensive error handler hook
 * 
 * Provides consistent error handling across the application with:
 * - Error type detection
 * - Cache fallback support
 * - Retry logic
 * - Escalation paths
 */
export const useErrorHandler = () => {
  const queryClient = useQueryClient();

  const handleError = useCallback(
    (error: unknown, options: ErrorHandlerOptions = {}): ErrorInfo => {
      const {
        context,
        enableCache = true,
        cacheKey,
      } = options;

      const timestamp = new Date();
      let axiosError: AxiosError<ApiError> | null = null;
      let errorMessage = 'An unexpected error occurred';
      let statusCode: number | undefined;
      let errorCode: string | undefined;

      // Extract error information
      if (error instanceof AxiosError) {
        axiosError = error;
        statusCode = error.response?.status;
        errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          'An error occurred';
        errorCode = error.response?.data?.requestId || error.code;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // Determine error type
      const errorType = getErrorType(axiosError || error);

      // Try to get cached data if available
      let cachedData: any = null;
      if (enableCache && cacheKey) {
        cachedData = cacheService.get(cacheKey);
      }

      // Determine if retry is possible
      const canRetry =
        errorType !== ErrorType.PERMISSION_ERROR &&
        errorType !== ErrorType.UNKNOWN &&
        !statusCode ||
        (statusCode !== undefined && statusCode >= 500) ||
        statusCode === 0;

      // Determine if escalation is available
      const canEscalate =
        errorType === ErrorType.API_DOWNTIME ||
        errorType === ErrorType.PAYMENT_FAILURE ||
        errorType === ErrorType.PERMISSION_ERROR ||
        statusCode === 500 ||
        statusCode === 503;

      return {
        type: errorType,
        message: errorMessage,
        statusCode,
        errorCode,
        timestamp,
        context,
        canRetry,
        canEscalate,
        cachedData,
      };
    },
    []
  );

  const retryQuery = useCallback(
    (queryKey: any[]) => {
      queryClient.invalidateQueries({ queryKey });
    },
    [queryClient]
  );

  const cacheData = useCallback(
    <T,>(key: string, data: T, ttl?: number) => {
      cacheService.set(key, data, ttl);
    },
    []
  );

  const getCachedData = useCallback(<T,>(key: string): T | null => {
    return cacheService.get<T>(key);
  }, []);

  return {
    handleError,
    retryQuery,
    cacheData,
    getCachedData,
  };
};
