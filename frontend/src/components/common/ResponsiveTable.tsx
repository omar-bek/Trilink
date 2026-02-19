/**
 * ResponsiveTable Component
 * 
 * A mobile-safe data table that automatically switches between:
 * - Desktop (≥1024px): Table view
 * - Mobile (<1024px): Card/List view
 * 
 * Features:
 * - Column priority system (high, medium, low)
 * - No horizontal scroll
 * - Preserves all data fields
 * - Customizable mobile card renderer
 */

import { useMediaQuery, useTheme, Box } from '@mui/material';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Card,
  CardContent,
  Typography,
  Stack,
  Divider,
} from '@mui/material';
import { ReactNode } from 'react';

export type ColumnPriority = 'high' | 'medium' | 'low';

export interface ResponsiveTableColumn<T = any> {
  id: string;
  label: string;
  priority: ColumnPriority;
  render: (row: T, index: number) => ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
  mobileLabel?: string; // Custom label for mobile view
  mobileRender?: (row: T, index: number) => ReactNode; // Custom renderer for mobile
}

export interface ResponsiveTableProps<T = any> {
  columns: ResponsiveTableColumn<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  emptyMessage?: string;
  onRowClick?: (row: T, index: number) => void;
  mobileBreakpoint?: number; // Default: 1024px
  mobileCardRenderer?: (row: T, columns: ResponsiveTableColumn<T>[], index: number) => ReactNode;
  tableProps?: {
    stickyHeader?: boolean;
    size?: 'small' | 'medium';
  };
  cardProps?: {
    variant?: 'outlined' | 'elevation';
    elevation?: number;
  };
}

const DEFAULT_MOBILE_BREAKPOINT = 1024;

/**
 * Default mobile card renderer
 */
const DefaultMobileCard = <T,>({
  row,
  columns,
  index,
  onRowClick,
  cardProps,
}: {
  row: T;
  columns: ResponsiveTableColumn<T>[];
  index: number;
  onRowClick?: (row: T, index: number) => void;
  cardProps?: ResponsiveTableProps<T>['cardProps'];
}) => {
  // Sort columns by priority: high first, then medium, then low
  const sortedColumns = [...columns].sort((a, b) => {
    const priorityOrder: Record<ColumnPriority, number> = {
      high: 0,
      medium: 1,
      low: 2,
    };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // High priority columns shown at top
  const highPriorityColumns = sortedColumns.filter((col) => col.priority === 'high');
  // Medium and low priority columns shown below
  const otherColumns = sortedColumns.filter((col) => col.priority !== 'high');

  return (
    <Card
      variant={cardProps?.variant || 'outlined'}
      elevation={cardProps?.elevation}
      sx={{
        cursor: onRowClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out',
        '&:hover': onRowClick
          ? {
              boxShadow: 3,
              transform: 'translateY(-2px)',
            }
          : {},
        mb: 2,
      }}
      onClick={() => onRowClick?.(row, index)}
    >
      <CardContent>
        {/* High priority columns - shown prominently */}
        {highPriorityColumns.length > 0 && (
          <Stack spacing={1.5} sx={{ mb: otherColumns.length > 0 ? 2 : 0 }}>
            {highPriorityColumns.map((column) => (
              <Box key={column.id}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  {column.mobileLabel || column.label}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {column.mobileRender ? column.mobileRender(row, index) : column.render(row, index)}
                </Box>
              </Box>
            ))}
          </Stack>
        )}

        {/* Divider between high priority and other columns */}
        {highPriorityColumns.length > 0 && otherColumns.length > 0 && <Divider sx={{ my: 1.5 }} />}

        {/* Medium and low priority columns - shown in compact format */}
        {otherColumns.length > 0 && (
          <Stack spacing={1}>
            {otherColumns.map((column) => (
              <Box
                key={column.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 2,
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: '30%', flexShrink: 0 }}>
                  {column.mobileLabel || column.label}:
                </Typography>
                <Box sx={{ flex: 1, textAlign: 'right' }}>
                  {column.mobileRender ? column.mobileRender(row, index) : column.render(row, index)}
                </Box>
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

export const ResponsiveTable = <T,>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No data available',
  onRowClick,
  mobileBreakpoint = DEFAULT_MOBILE_BREAKPOINT,
  mobileCardRenderer,
  tableProps,
  cardProps,
}: ResponsiveTableProps<T>) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(`(min-width:${mobileBreakpoint}px)`);

  if (data.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Paper>
    );
  }

  // Desktop: Table view
  if (isDesktop) {
    return (
      <TableContainer component={Paper} variant={cardProps?.variant || 'outlined'}>
        <Table stickyHeader={tableProps?.stickyHeader} size={tableProps?.size || 'medium'}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  sx={{
                    fontWeight: 600,
                    width: column.width,
                    minWidth: column.width,
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, index) => (
              <TableRow
                key={keyExtractor(row, index)}
                onClick={() => onRowClick?.(row, index)}
                sx={{
                  cursor: onRowClick ? 'pointer' : 'default',
                  transition: 'background-color 0.2s ease-in-out',
                  '&:hover': onRowClick
                    ? {
                        backgroundColor: 'action.hover',
                      }
                    : {},
                  '&:nth-of-type(even)': {
                    backgroundColor: 'action.hover',
                    '&:hover': onRowClick
                      ? {
                          backgroundColor: 'action.selected',
                        }
                      : {},
                  },
                }}
              >
                {columns.map((column) => (
                  <TableCell key={column.id} align={column.align || 'left'}>
                    {column.render(row, index)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  // Mobile: Card view
  return (
    <Box>
      {data.map((row, index) => {
        if (mobileCardRenderer) {
          return <Box key={keyExtractor(row, index)}>{mobileCardRenderer(row, columns, index)}</Box>;
        }
        return (
          <DefaultMobileCard
            key={keyExtractor(row, index)}
            row={row}
            columns={columns}
            index={index}
            onRowClick={onRowClick}
            cardProps={cardProps}
          />
        );
      })}
    </Box>
  );
};
