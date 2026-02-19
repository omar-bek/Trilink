import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Network Recovery Component
 * 
 * Handles network status changes:
 * - Cancels all pending queries when going offline
 * - Refetches stale queries when coming online
 * - Prevents queries from hanging when network is unavailable
 */
export const NetworkRecovery = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleOnline = () => {
      // Refetch all stale queries when coming online
      queryClient.refetchQueries({ stale: true });
      
      if (import.meta.env.DEV) {
        console.log('Network online: Refetching stale queries');
      }
    };

    const handleOffline = () => {
      // Cancel all pending queries when going offline
      queryClient.cancelQueries();
      
      if (import.meta.env.DEV) {
        console.log('Network offline: Cancelling pending queries');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [queryClient]);

  return null;
};
