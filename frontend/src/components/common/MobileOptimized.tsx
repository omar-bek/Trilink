/**
 * Mobile-First Optimizations
 * 
 * Adaptive components and utilities for mobile performance
 * - Reduced animations on low-end devices
 * - Touch-optimized interactions
 * - Simplified layouts for small screens
 * - Reduced data density
 */

import { useMediaQuery, useTheme, Box } from '@mui/material';
import { ReactNode } from 'react';
import { isLowEndDevice, getAdaptivePerformanceSettings } from '@/utils/performance';

interface MobileOptimizedProps {
  children: ReactNode;
  mobileView?: ReactNode;
  desktopView?: ReactNode;
  enableAdaptive?: boolean;
}

/**
 * Component that adapts based on screen size and device capabilities
 */
export const MobileOptimized = ({
  children,
  mobileView,
  desktopView,
  enableAdaptive = true,
}: MobileOptimizedProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isLowEnd = enableAdaptive ? isLowEndDevice() : false;
  const settings = getAdaptivePerformanceSettings();

  if (mobileView && isMobile) {
    return <>{mobileView}</>;
  }

  if (desktopView && !isMobile) {
    return <>{desktopView}</>;
  }

  // Apply adaptive settings
  const style = isLowEnd
    ? {
        // Reduce animations
        animation: 'none',
        transition: 'none',
        // Simplify layout
        transform: 'none',
      }
    : {};

  return (
    <Box sx={style}>
      {children}
    </Box>
  );
};

/**
 * Hook for mobile detection and adaptive settings
 */
export const useMobileOptimization = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isLowEnd = isLowEndDevice();
  const settings = getAdaptivePerformanceSettings();

  return {
    isMobile,
    isTablet,
    isLowEnd,
    settings,
    // Mobile-specific optimizations
    itemsPerPage: isMobile ? 10 : isTablet ? 20 : 25,
    enableVirtualization: !isMobile && !isLowEnd,
    enableAnimations: !isLowEnd,
    chartHeight: isMobile ? 200 : 300,
  };
};

/**
 * Responsive grid that adapts to screen size
 */
export const ResponsiveGrid = ({
  children,
  mobileColumns = 1,
  tabletColumns = 2,
  desktopColumns = 4,
}: {
  children: ReactNode;
  mobileColumns?: number;
  tabletColumns?: number;
  desktopColumns?: number;
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const columns = isMobile ? mobileColumns : isTablet ? tabletColumns : desktopColumns;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: `repeat(${mobileColumns}, 1fr)`,
          sm: `repeat(${tabletColumns}, 1fr)`,
          md: `repeat(${desktopColumns}, 1fr)`,
        },
        gap: { xs: 2, sm: 2, md: 3 },
      }}
    >
      {children}
    </Box>
  );
};

/**
 * Touch-optimized button wrapper
 */
export const TouchOptimized = ({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) => {
  return (
    <Box
      onClick={disabled ? undefined : onClick}
      sx={{
        touchAction: 'manipulation', // Prevent double-tap zoom
        WebkitTapHighlightColor: 'transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none',
        // Larger touch target on mobile
        minHeight: { xs: 44, md: 'auto' },
        minWidth: { xs: 44, md: 'auto' },
      }}
    >
      {children}
    </Box>
  );
};
