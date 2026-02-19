import { useEffect } from 'react';
import { useQueryClient, QueryKey } from '@tanstack/react-query';
import { getQueryTimeout, isQueryTimedOut, isQueryStuck } from '@/utils/queryUtils';

/**
 * Global Query Timeout Monitor
 * 
 * Monitors all queries and cancels/times out queries that:
 * - Have been pending > 30s (desktop) or 60s (mobile)
 * - Are stuck in disabled state but component is waiting
 * 
 * This prevents infinite loading states.
 */
export const QueryTimeoutMonitor = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const interval = setInterval(() => {
      const queries = queryClient.getQueryCache().getAll();
      const timeout = getQueryTimeout();

      queries.forEach((query) => {
        const state = query.state;
        const options = query.options;

        // Check for stuck queries (disabled but pending)
        if (
          isQueryStuck(
            state.status,
            state.fetchStatus,
            state.dataUpdatedAt,
            options.enabled !== false
          )
        ) {
          // Cancel and mark as error
          queryClient.cancelQueries({ queryKey: query.queryKey });
          query.setState({
            status: 'error',
            error: new Error('Query disabled but component is waiting for data'),
            fetchStatus: 'idle',
          });
          
          if (import.meta.env.DEV) {
            console.warn('Stuck query detected and cancelled:', query.queryKey);
          }
        }

        // Check for timed out queries
        if (state.status === 'pending' && state.dataUpdatedAt) {
          if (isQueryTimedOut(state.dataUpdatedAt, timeout)) {
            // Cancel and mark as error
            queryClient.cancelQueries({ queryKey: query.queryKey });
            query.setState({
              status: 'error',
              error: new Error(`Query timeout after ${timeout}ms`),
              fetchStatus: 'idle',
            });
            
            if (import.meta.env.DEV) {
              console.warn('Query timeout detected and cancelled:', query.queryKey);
            }
          }
        }

        // Check for queries pending too long without data
        // Only check if query is actively fetching (not just disabled)
        if (state.status === 'pending' && !state.dataUpdatedAt && state.fetchStatus === 'fetching') {
          // For queries that are actively fetching but haven't received data,
          // estimate start time based on fetch failures or use conservative window
          const estimatedStartTime = query.state.fetchFailureCount > 0
            ? Date.now() - (query.state.fetchFailureCount * 2000) // 2s per retry attempt
            : Date.now() - (timeout / 2); // Conservative: half timeout window
          const elapsed = Date.now() - estimatedStartTime;
          
          // Only timeout if elapsed time exceeds threshold and query has observers
          const queryObservers = query.getObserversCount();
          if (elapsed > timeout && queryObservers > 0) {
            // Cancel and mark as error
            queryClient.cancelQueries({ queryKey: query.queryKey });
            query.setState({
              status: 'error',
              error: new Error(`Query pending timeout after ${timeout}ms`),
              fetchStatus: 'idle',
            });
            
            if (import.meta.env.DEV) {
              console.warn('Query pending timeout detected and cancelled:', query.queryKey);
            }
          }
        }
      });
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [queryClient]);

  return null;
};
