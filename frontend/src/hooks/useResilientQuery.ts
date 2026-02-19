import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useErrorHandler } from './useErrorHandler';
import { cacheService } from '@/services/cache.service';
import { useEffect, useState } from 'react';

interface ResilientQueryOptions<TData, TError> extends Omit<UseQueryOptions<TData, TError>, 'queryFn'> {
  queryFn: () => Promise<TData>;
  cacheKey?: string;
  cacheTTL?: number;
  enableCache?: boolean;
  onError?: (error: TError) => void;
}

/**
 * Resilient Query Hook
 * 
 * Wraps React Query with:
 * - Automatic caching on success
 * - Cache fallback on error
 * - Error handling integration
 * - Degraded mode support
 */
export const useResilientQuery = <TData = unknown, TError = unknown>(
  options: ResilientQueryOptions<TData, TError>
): UseQueryResult<TData, TError> & {
  isUsingCache: boolean;
  cachedData: TData | null;
} => {
  const {
    queryFn,
    cacheKey,
    cacheTTL,
    enableCache = true,
    onError,
    ...queryOptions
  } = options;

  const { handleError, cacheData } = useErrorHandler();
  const [isUsingCache, setIsUsingCache] = useState(false);
  const [cachedData, setCachedData] = useState<TData | null>(null);

  // Enhanced query function with caching
  const enhancedQueryFn = async (): Promise<TData> => {
    try {
      const data = await queryFn();
      
      // Cache on success
      if (enableCache && cacheKey) {
        cacheData(cacheKey, data, cacheTTL);
        setIsUsingCache(false);
        setCachedData(null);
      }
      
      return data;
    } catch (error) {
      // Try to get cached data on error
      if (enableCache && cacheKey) {
        const cached = cacheService.get<TData>(cacheKey);
        if (cached) {
          setIsUsingCache(true);
          setCachedData(cached);
          // Don't throw - return cached data for degraded mode
          return cached;
        }
      }
      
      // Handle error
      const errorInfo = handleError(error, {
        context: options.queryKey?.toString(),
        enableCache,
        cacheKey,
      });
      
      if (onError) {
        onError(error as TError);
      }
      
      throw error;
    }
  };

  const queryResult = useQuery<TData, TError>({
    ...queryOptions,
    queryFn: enhancedQueryFn,
  });

  // Check for cached data on mount
  useEffect(() => {
    if (enableCache && cacheKey && queryResult.isError) {
      const cached = cacheService.get<TData>(cacheKey);
      if (cached) {
        setIsUsingCache(true);
        setCachedData(cached);
      }
    }
  }, [enableCache, cacheKey, queryResult.isError]);

  return {
    ...queryResult,
    isUsingCache,
    cachedData,
  };
};
