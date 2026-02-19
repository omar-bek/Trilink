import { useState, useCallback, useMemo } from 'react';

export interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
  total?: number;
}

export interface UsePaginationReturn {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setTotal: (total: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  paginationParams: {
    page: number;
    limit: number;
  };
}

export const usePagination = (
  options: UsePaginationOptions = {}
): UsePaginationReturn => {
  const { initialPage = 1, initialLimit = 20, total: initialTotal = 0 } = options;

  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(initialTotal);

  const totalPages = useMemo(() => Math.ceil(total / limit), [total, limit]);
  const hasNextPage = useMemo(() => page < totalPages, [page, totalPages]);
  const hasPreviousPage = useMemo(() => page > 1, [page]);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setPage((prev) => prev + 1);
    }
  }, [hasNextPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setPage((prev) => prev - 1);
    }
  }, [hasPreviousPage]);

  const goToFirstPage = useCallback(() => {
    setPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setPage(totalPages);
  }, [totalPages]);

  const handleSetLimit = useCallback(
    (newLimit: number) => {
      setLimit(newLimit);
      // Reset to first page when limit changes
      setPage(1);
    },
    []
  );

  const paginationParams = useMemo(
    () => ({
      page,
      limit,
    }),
    [page, limit]
  );

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    setPage,
    setLimit: handleSetLimit,
    setTotal,
    nextPage,
    previousPage,
    goToFirstPage,
    goToLastPage,
    paginationParams,
  };
};
