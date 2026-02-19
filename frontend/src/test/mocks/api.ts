import { vi } from 'vitest';
import axios from 'axios';
import { ApiResponse, PaginatedResponse } from '@/types';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

/**
 * Create a mock API response
 */
export const createMockResponse = <T>(data: T, success = true): ApiResponse<T> => ({
  success,
  data,
  message: success ? 'Success' : 'Error',
});

/**
 * Create a mock paginated response
 */
export const createMockPaginatedResponse = <T>(
  items: T[],
  page = 1,
  limit = 20,
  total = items.length
): ApiResponse<PaginatedResponse<T>> => ({
  success: true,
  data: {
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  },
  message: 'Success',
});

/**
 * Mock API error response
 */
export const createMockError = (status: number, message: string) => {
  const error: any = new Error(message);
  error.response = {
    status,
    data: {
      success: false,
      message,
      error: message,
    },
  };
  return error;
};

/**
 * Setup API mock helpers
 */
export const setupApiMocks = () => {
  mockedAxios.create = vi.fn(() => mockedAxios);
  mockedAxios.get = vi.fn();
  mockedAxios.post = vi.fn();
  mockedAxios.put = vi.fn();
  mockedAxios.patch = vi.fn();
  mockedAxios.delete = vi.fn();
  mockedAxios.interceptors = {
    request: {
      use: vi.fn(),
    },
    response: {
      use: vi.fn(),
    },
  };
};

/**
 * Reset API mocks
 */
export const resetApiMocks = () => {
  vi.clearAllMocks();
  setupApiMocks();
};

export { mockedAxios };
