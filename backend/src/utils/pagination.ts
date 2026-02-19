/**
 * Pagination utilities
 */

export interface PaginationQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
  skip: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Parse pagination query parameters
 */
export function parsePaginationQuery(query: PaginationQuery): PaginationOptions {
  const page = query.page ? Math.max(1, parseInt(query.page, 10)) : 1;
  const limit = query.limit
    ? Math.min(100, Math.max(1, parseInt(query.limit, 10)))
    : 20;
  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    sortBy,
    sortOrder,
    skip,
  };
}

/**
 * Create pagination result
 */
export function createPaginationResult<T>(
  data: T[],
  total: number,
  options: PaginationOptions
): PaginationResult<T> {
  const totalPages = Math.ceil(total / options.limit);

  return {
    data,
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages,
      hasNextPage: options.page < totalPages,
      hasPreviousPage: options.page > 1,
    },
  };
}

/**
 * Build MongoDB sort object
 */
export function buildSortObject(sortBy: string, sortOrder: 'asc' | 'desc'): Record<string, 1 | -1> {
  const sort: Record<string, 1 | -1> = {};
  
  // Map common sort fields
  let field = sortBy;
  if (field === 'date' || field === 'created') {
    field = 'createdAt';
  } else if (field === 'updated') {
    field = 'updatedAt';
  } else if (field === 'name' || field === 'title') {
    field = sortBy; // Keep as is
  }

  sort[field] = sortOrder === 'asc' ? 1 : -1;
  return sort;
}
