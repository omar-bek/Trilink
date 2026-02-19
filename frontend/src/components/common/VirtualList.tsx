import React, { useEffect } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import { useInView } from 'react-intersection-observer';

export interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  loading?: boolean;
  hasNextPage?: boolean;
  onLoadMore?: () => void;
  emptyMessage?: string;
  itemHeight?: number;
  containerHeight?: string | number;
  gap?: number;
}

/**
 * VirtualList component with infinite scroll
 * Uses intersection observer to detect when user scrolls near bottom
 */
export function VirtualList<T>({
  items,
  renderItem,
  loading = false,
  hasNextPage = false,
  onLoadMore,
  emptyMessage = 'No items found',
  containerHeight = '100%',
  gap = 8,
}: VirtualListProps<T>) {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  useEffect(() => {
    if (inView && hasNextPage && !loading && onLoadMore) {
      onLoadMore();
    }
  }, [inView, hasNextPage, loading, onLoadMore]);

  if (items.length === 0 && !loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 200,
          p: 3,
        }}
      >
        <Alert severity="info">{emptyMessage}</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: containerHeight,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: gap,
          pb: 2,
        }}
      >
        {items.map((item, index) => (
          <Box key={index}>{renderItem(item, index)}</Box>
        ))}
        
        {/* Infinite scroll trigger */}
        {hasNextPage && (
          <Box
            ref={ref}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 100,
              py: 2,
            }}
          >
            {loading && <CircularProgress size={40} />}
          </Box>
        )}
        
        {/* Final loading state */}
        {loading && items.length > 0 && !hasNextPage && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              py: 2,
            }}
          >
            <CircularProgress size={40} />
          </Box>
        )}
      </Box>
    </Box>
  );
}
