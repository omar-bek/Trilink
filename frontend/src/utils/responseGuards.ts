/**
 * Type guards for API responses
 * Helps handle both paginated and non-paginated responses
 */

import { PaginatedResponse } from '@/types';

/**
 * Type guard to check if a response is paginated
 */
export function isPaginatedResponse<T>(
  response: T[] | PaginatedResponse<T>
): response is PaginatedResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'data' in response &&
    'pagination' in response &&
    Array.isArray((response as PaginatedResponse<T>).data) &&
    typeof (response as PaginatedResponse<T>).pagination === 'object'
  );
}

/**
 * Extract data array from either paginated or non-paginated response
 */
export function extractDataArray<T>(
  response: T[] | PaginatedResponse<T>
): T[] {
  if (isPaginatedResponse(response)) {
    return response.data;
  }
  return response;
}

/**
 * Extract pagination info if available
 */
export function extractPagination<T>(
  response: T[] | PaginatedResponse<T>
): PaginatedResponse<T>['pagination'] | null {
  if (isPaginatedResponse(response)) {
    return response.pagination;
  }
  return null;
}
