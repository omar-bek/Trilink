/**
 * Enhanced Skeleton Components
 * 
 * Performance-optimized skeleton loaders with shimmer effects
 * Optimistic UI patterns for instant feedback
 */

import { Skeleton, Box, Card, CardContent, keyframes } from '@mui/material';
import { designTokens } from '@/theme/designTokens';

const { colors } = designTokens;

// Shimmer animation
const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

const shimmerStyle = {
  background: `linear-gradient(
    90deg,
    ${colors.base.neutral800} 0px,
    ${colors.base.neutral700} 40px,
    ${colors.base.neutral800} 80px
  )`,
  backgroundSize: '1000px 100%',
  animation: `${shimmer} 2s infinite linear`,
};

interface EnhancedSkeletonProps {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: number | string;
  height?: number | string;
  count?: number;
  shimmer?: boolean;
}

export const EnhancedSkeleton = ({
  variant = 'rectangular',
  width,
  height,
  count = 1,
  shimmer: enableShimmer = true,
}: EnhancedSkeletonProps) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          variant={variant}
          width={width}
          height={height}
          animation={enableShimmer ? false : 'wave'}
          sx={enableShimmer ? shimmerStyle : {}}
        />
      ))}
    </>
  );
};

export const CardSkeletonEnhanced = ({ count = 3, shimmer = true }: { count?: number; shimmer?: boolean }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} sx={{ mb: 2 }}>
          <CardContent>
            <EnhancedSkeleton variant="text" width="60%" height={32} count={1} shimmer={shimmer} />
            <Box sx={{ mt: 2, mb: 2 }}>
              <EnhancedSkeleton variant="rectangular" height={100} count={1} shimmer={shimmer} />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <EnhancedSkeleton variant="rectangular" width="30%" height={40} count={1} shimmer={shimmer} />
              <EnhancedSkeleton variant="rectangular" width="30%" height={40} count={1} shimmer={shimmer} />
            </Box>
          </CardContent>
        </Card>
      ))}
    </>
  );
};

export const TableSkeletonEnhanced = ({ 
  rows = 5, 
  columns = 4,
  shimmer = true 
}: { 
  rows?: number; 
  columns?: number;
  shimmer?: boolean;
}) => {
  return (
    <Box>
      <EnhancedSkeleton variant="rectangular" height={56} count={1} shimmer={shimmer} />
      <Box sx={{ mt: 1 }}>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <Box key={rowIndex} sx={{ display: 'flex', gap: 1, mb: 1 }}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <EnhancedSkeleton
                key={colIndex}
                variant="rectangular"
                height={52}
                count={1}
                shimmer={shimmer}
                width={`calc(${100 / columns}% - ${(columns - 1) * 8 / columns}px)`}
              />
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export const KPICardSkeleton = ({ count = 4, shimmer = true }: { count?: number; shimmer?: boolean }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box sx={{ flex: 1 }}>
                <EnhancedSkeleton variant="text" width="60%" height={20} count={1} shimmer={shimmer} />
                <Box sx={{ mt: 1 }}>
                  <EnhancedSkeleton variant="text" width="40%" height={32} count={1} shimmer={shimmer} />
                </Box>
              </Box>
              <EnhancedSkeleton variant="circular" width={48} height={48} count={1} shimmer={shimmer} />
            </Box>
            <EnhancedSkeleton variant="text" width="30%" height={16} count={1} shimmer={shimmer} />
          </CardContent>
        </Card>
      ))}
    </>
  );
};

export const ChartSkeleton = ({ height = 300, shimmer = true }: { height?: number; shimmer?: boolean }) => {
  return (
    <Card>
      <CardContent>
        <EnhancedSkeleton variant="text" width="40%" height={24} count={1} shimmer={shimmer} />
        <Box sx={{ mt: 2 }}>
          <EnhancedSkeleton variant="rectangular" height={height} count={1} shimmer={shimmer} />
        </Box>
      </CardContent>
    </Card>
  );
};

export const PageSkeletonEnhanced = ({ shimmer = true }: { shimmer?: boolean }) => {
  return (
    <Box sx={{ p: 3 }}>
      <EnhancedSkeleton variant="text" width="40%" height={48} count={1} shimmer={shimmer} />
      <Box sx={{ mt: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3 }}>
        <KPICardSkeleton count={4} shimmer={shimmer} />
      </Box>
      <Box sx={{ mt: 4 }}>
        <CardSkeletonEnhanced count={3} shimmer={shimmer} />
      </Box>
    </Box>
  );
};

// Dashboard-specific skeleton with progressive loading
export const DashboardSkeleton = ({ shimmer = true }: { shimmer?: boolean }) => {
  return (
    <Box sx={{ p: 3 }}>
      {/* Critical Alerts Skeleton */}
      <Box sx={{ mb: 3 }}>
        <EnhancedSkeleton variant="rectangular" height={60} count={1} shimmer={shimmer} />
      </Box>

      {/* KPI Cards - Above Fold */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { 
          xs: '1fr', 
          sm: 'repeat(2, 1fr)', 
          md: 'repeat(4, 1fr)' 
        }, 
        gap: 3,
        mb: 4 
      }}>
        <KPICardSkeleton count={4} shimmer={shimmer} />
      </Box>

      {/* Primary Action Skeleton */}
      <Box sx={{ mb: 4 }}>
        <EnhancedSkeleton variant="rectangular" width={200} height={48} count={1} shimmer={shimmer} />
      </Box>

      {/* Below Fold Content - Lazy Load */}
      <Box sx={{ mt: 'auto', pt: 4 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 3 }}>
          <Card>
            <CardContent>
              <EnhancedSkeleton variant="text" width="50%" height={24} count={1} shimmer={shimmer} />
              <Box sx={{ mt: 2 }}>
                <CardSkeletonEnhanced count={5} shimmer={shimmer} />
              </Box>
            </CardContent>
          </Card>
          <Box>
            <ChartSkeleton height={300} shimmer={shimmer} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
