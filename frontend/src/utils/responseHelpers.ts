/**
 * Response Helper Utilities
 * 
 * Utilities for normalizing API responses, especially PaginatedResponse vs arrays
 */

import type { PaginatedResponse } from '@/types';

/**
 * Normalizes a response that could be either a PaginatedResponse or an array
 * Returns the array of items
 */
export function normalizeResponse<T>(
  response: PaginatedResponse<T> | T[] | undefined
): T[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  return response.data || [];
}

/**
 * Checks if a response is a PaginatedResponse
 */
export function isPaginatedResponse<T>(
  response: PaginatedResponse<T> | T[]
): response is PaginatedResponse<T> {
  return !Array.isArray(response) && 'data' in response && 'pagination' in response;
}
