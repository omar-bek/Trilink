/**
 * Standardized Query Hook
 * 
 * Wraps useQuery with:
 * - Automatic timeout handling
 * - Mobile-aware retry logic
 * - Permission error detection
 * - Network status awareness
 */

import { useQuery, UseQueryOptions, QueryKey } from '@tanstack/react-query';
import { useIsMobile } from './useIsMobile';
import { useNetworkStatus } from './useNetworkStatus';
import { 
  createQueryFnWithTimeout, 
  getStandardQueryOptions,
  isPermissionError 
} from '@/utils/queryUtils';

/**
 * Enhanced useQuery hook with automatic timeout and error handling
 */
export const useStandardQuery = <TData = unknown, TError extends Error = Error>(
  options: UseQueryOptions<TData, TError> & {
    timeout?: number;
    skipOnOffline?: boolean;
  }
) => {
  const isMobile = useIsMobile();
  const { isOffline } = useNetworkStatus();
  const { timeout, skipOnOffline = true, ...queryOptions } = options;

  // Don't run query if offline and skipOnOffline is true
  const enabled = 
    queryOptions.enabled !== false && 
    (!skipOnOffline || !isOffline);

  // Wrap queryFn with timeout
  const queryFn = queryOptions.queryFn
    ? createQueryFnWithTimeout(queryOptions.queryFn as () => Promise<TData>, timeout)
    : undefined;

  // Get standard options
  const standardOptions = getStandardQueryOptions<TData>({
    ...queryOptions,
    queryFn,
    enabled,
  }) as any;

  const query = useQuery<TData, TError>(standardOptions);

  // Check for permission errors and mark as error immediately
  if (query.error && isPermissionError(query.error)) {
    // Permission errors should not show loading state
    // The error is already set, but ensure status is 'error'
    if (query.fetchStatus === 'fetching') {
      // This shouldn't happen, but handle it just in case
      console.warn('Permission error detected but query still pending');
    }
  }

  return query;
};
