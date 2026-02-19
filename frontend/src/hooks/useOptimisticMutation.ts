/**
 * Optimistic UI Hook
 * 
 * Provides instant feedback for mutations by optimistically updating the UI
 * before server confirmation. Automatically rolls back on error.
 * 
 * Performance benefit: Perceived latency reduction from 500ms+ to 0ms
 */

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { useCallback } from 'react';

interface OptimisticUpdate<TData, TVariables> {
  queryKey: any[];
  updater: (oldData: TData | undefined, variables: TVariables) => TData;
}

export function useOptimisticMutation<TData = any, TError = Error, TVariables = void, TContext = unknown>(
  options: UseMutationOptions<TData, TError, TVariables, TContext> & {
    optimisticUpdates?: OptimisticUpdate<TData, TVariables>[];
    onOptimisticError?: (error: Error, variables: TVariables, context: TContext | undefined) => void;
  }
) {
  const queryClient = useQueryClient();
  const { optimisticUpdates = [], onOptimisticError, ...mutationOptions } = options;

  const mutation = useMutation<TData, TError, TVariables, TContext>({
    ...mutationOptions,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      const previousData: Array<{ queryKey: any[]; data: any }> = [];

      // Snapshot previous values for rollback
      optimisticUpdates.forEach(({ queryKey }) => {
        const previous = queryClient.getQueryData(queryKey);
        previousData.push({ queryKey, data: previous });

        // Cancel any outgoing queries
        queryClient.cancelQueries({ queryKey });
      });

      // Optimistically update all specified queries
      optimisticUpdates.forEach(({ queryKey, updater }) => {
        queryClient.setQueryData(queryKey, (old: TData | undefined) => updater(old, variables));
      });

      // Return context for rollback
      return { previousData } as TContext;
    },
    onError: (error, variables, context) => {
      // Rollback optimistic updates on error
      if (context && typeof context === 'object' && 'previousData' in context) {
        const { previousData } = context as { previousData: Array<{ queryKey: any[]; data: any }> };
        previousData.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Call original error handler
      if (onOptimisticError) {
        onOptimisticError(error as Error, variables, context);
      }

      if (mutationOptions.onError) {
        mutationOptions.onError(error, variables, context);
      }
    },
    onSettled: (data, error, variables, context) => {
      // Refetch to ensure consistency
      optimisticUpdates.forEach(({ queryKey }) => {
        queryClient.invalidateQueries({ queryKey });
      });

      if (mutationOptions.onSettled) {
        mutationOptions.onSettled(data, error, variables, context);
      }
    },
  });

  return mutation;
}

/**
 * Helper for common optimistic update patterns
 */
export const optimisticUpdateHelpers = {
  // Add item to list
  addToList: <T extends { _id?: string; id?: string }>(
    oldData: T[] | undefined,
    newItem: T
  ): T[] => {
    return oldData ? [...oldData, newItem] : [newItem];
  },

  // Remove item from list
  removeFromList: <T extends { _id?: string; id?: string }>(
    oldData: T[] | undefined,
    itemId: string
  ): T[] => {
    return oldData ? oldData.filter((item) => (item._id || item.id) !== itemId) : [];
  },

  // Update item in list
  updateInList: <T extends { _id?: string; id?: string }>(
    oldData: T[] | undefined,
    updatedItem: T
  ): T[] => {
    if (!oldData) return [updatedItem];
    const id = updatedItem._id || updatedItem.id;
    return oldData.map((item) => ((item._id || item.id) === id ? updatedItem : item));
  },

  // Replace entire data
  replace: <T>(_oldData: T | undefined, newData: T): T => newData,
};
