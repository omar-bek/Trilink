import { vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';

/**
 * Create a test QueryClient with default options
 */
export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

/**
 * Mock React Query hooks
 */
export const mockUseQuery = (data: any, isLoading = false, error = null) => {
  return {
    data,
    isLoading,
    error,
    isError: !!error,
    isSuccess: !isLoading && !error,
    refetch: vi.fn(),
  };
};

export const mockUseMutation = (onSuccess?: () => void, onError?: () => void) => {
  return {
    mutate: vi.fn((variables, options) => {
      if (onSuccess) {
        onSuccess();
        options?.onSuccess?.();
      }
    }),
    mutateAsync: vi.fn().mockResolvedValue({ data: {} }),
    isLoading: false,
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
    data: null,
    reset: vi.fn(),
  };
};
