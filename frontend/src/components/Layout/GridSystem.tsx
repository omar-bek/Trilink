/**
 * TriLink Grid System
 * 
 * Enterprise-grade modular grid layout system
 * Based on 12-column grid with consistent spacing
 */

import { Box, BoxProps } from '@mui/material';
import { designTokens } from '@/theme/designTokens';

const { layout, spacing } = designTokens;

// ============================================================================
// GRID CONTAINER
// ============================================================================

interface GridContainerProps extends BoxProps {
  maxWidth?: 'default' | 'wide' | 'narrow';
  fluid?: boolean;
}

/**
 * Grid Container - Wraps grid content with max-width constraints
 */
export const GridContainer = ({
  maxWidth = 'default',
  fluid = false,
  children,
  sx,
  ...props
}: GridContainerProps) => {
  const maxWidthValue = fluid
    ? '100%'
    : maxWidth === 'wide'
    ? layout.containerWide
    : maxWidth === 'narrow'
    ? layout.containerNarrow
    : layout.containerMaxWidth;

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: maxWidthValue,
        margin: '0 auto',
        paddingLeft: spacing.pagePadding,
        paddingRight: spacing.pagePadding,
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

// ============================================================================
// GRID ROW
// ============================================================================

interface GridRowProps extends BoxProps {
  gutter?: 'default' | 'small' | 'none';
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
  justifyContent?: 'start' | 'center' | 'end' | 'space-between' | 'space-around';
}

/**
 * Grid Row - Horizontal container for grid columns
 */
export const GridRow = ({
  gutter = 'default',
  alignItems = 'stretch',
  justifyContent = 'start',
  children,
  sx,
  ...props
}: GridRowProps) => {
  const gutterValue =
    gutter === 'none' ? '0' : gutter === 'small' ? layout.gridGutterSmall : layout.gridGutter;

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        marginLeft: `-${gutterValue}`,
        marginRight: `-${gutterValue}`,
        alignItems,
        justifyContent,
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

// ============================================================================
// GRID COLUMN
// ============================================================================

interface GridColumnProps extends BoxProps {
  xs?: number | 'auto' | 'fill';
  sm?: number | 'auto' | 'fill';
  md?: number | 'auto' | 'fill';
  lg?: number | 'auto' | 'fill';
  xl?: number | 'auto' | 'fill';
  gutter?: 'default' | 'small' | 'none';
  order?: number;
}

/**
 * Grid Column - Responsive column within grid row
 * 
 * @param xs - Extra small screens (0px+)
 * @param sm - Small screens (600px+)
 * @param md - Medium screens (900px+)
 * @param lg - Large screens (1200px+)
 * @param xl - Extra large screens (1536px+)
 */
export const GridColumn = ({
  xs,
  sm,
  md,
  lg,
  xl,
  gutter = 'default',
  order,
  children,
  sx,
  ...props
}: GridColumnProps) => {
  const gutterValue =
    gutter === 'none' ? '0' : gutter === 'small' ? layout.gridGutterSmall : layout.gridGutter;

  const getColumnWidth = (size: number | 'auto' | 'fill' | undefined) => {
    if (!size) return undefined;
    if (size === 'auto') return 'auto';
    if (size === 'fill') return '1 1 0%';
    return `${(size / layout.gridColumns) * 100}%`;
  };

  const getFlexBasis = (size: number | 'auto' | 'fill' | undefined) => {
    if (!size) return undefined;
    if (size === 'auto') return 'auto';
    if (size === 'fill') return '0%';
    return `${(size / layout.gridColumns) * 100}%`;
  };

  return (
    <Box
      sx={{
        flexGrow: xs === 'fill' || sm === 'fill' || md === 'fill' || lg === 'fill' || xl === 'fill' ? 1 : 0,
        flexBasis: getFlexBasis(xs),
        width: getColumnWidth(xs),
        paddingLeft: gutterValue,
        paddingRight: gutterValue,
        order,
        ...(sm && {
          [`@media (min-width: ${layout.breakpoints.sm}px)`]: {
            flexBasis: getFlexBasis(sm),
            width: getColumnWidth(sm),
          },
        }),
        ...(md && {
          [`@media (min-width: ${layout.breakpoints.md}px)`]: {
            flexBasis: getFlexBasis(md),
            width: getColumnWidth(md),
          },
        }),
        ...(lg && {
          [`@media (min-width: ${layout.breakpoints.lg}px)`]: {
            flexBasis: getFlexBasis(lg),
            width: getColumnWidth(lg),
          },
        }),
        ...(xl && {
          [`@media (min-width: ${layout.breakpoints.xl}px)`]: {
            flexBasis: getFlexBasis(xl),
            width: getColumnWidth(xl),
          },
        }),
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

/**
 * Spacer - Flexible space between elements
 */
export const Spacer = ({ size = 1 }: { size?: number }) => (
  <Box sx={{ flex: `0 0 ${size * spacing.lg}` }} />
);

/**
 * Section - Standard page section with consistent padding
 */
export const Section = ({ children, sx, ...props }: BoxProps) => (
  <Box
    sx={{
      paddingTop: spacing.sectionPadding,
      paddingBottom: spacing.sectionPadding,
      ...sx,
    }}
    {...props}
  >
    {children}
  </Box>
);

/**
 * Page Container - Standard page wrapper
 */
export const PageContainer = ({ children, sx, ...props }: BoxProps) => (
  <Box
    sx={{
      width: '100%',
      minHeight: '100%',
      padding: spacing.pagePadding,
      ...sx,
    }}
    {...props}
  >
    {children}
  </Box>
);