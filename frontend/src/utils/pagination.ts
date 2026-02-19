/**
 * Shared pagination utilities for frontend
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function createPaginationParams(
  page: number,
  limit: number,
  sortBy?: string,
  sortOrder?: 'asc' | 'desc'
): PaginationParams {
  return {
    page,
    limit,
    sortBy,
    sortOrder,
  };
}
