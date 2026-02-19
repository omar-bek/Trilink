import { Suspense, ReactNode } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { PageSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';

interface RouteSuspenseProps {
  children: ReactNode;
  fallback?: ReactNode;
  showPageSkeleton?: boolean;
}

/**
 * RouteSuspense Component
 * 
 * Provides Suspense boundary for lazy-loaded routes with proper loading states.
 * Ensures no flash of unauthorized content by showing loading state during code splitting.
 * 
 * Usage:
 * ```tsx
 * <RouteSuspense>
 *   <LazyComponent />
 * </RouteSuspense>
 * ```
 */
export const RouteSuspense = ({ 
  children, 
  fallback,
  showPageSkeleton = true 
}: RouteSuspenseProps) => {
  const defaultFallback = showPageSkeleton ? (
    <PageSkeleton />
  ) : (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
      }}
    >
      <CircularProgress />
    </Box>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
};
