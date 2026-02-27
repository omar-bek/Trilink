/**
 * Virtualized Table Component
 * 
 * High-performance table for millions of records using windowing
 * Only renders visible rows + buffer for smooth scrolling
 * 
 * Performance targets:
 * - Initial render: < 100ms for 1M+ records
 * - Scroll FPS: 60fps
 * - Memory: < 50MB for 1M records
 */

import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react';
// @ts-ignore - react-window types may be outdated
import { FixedSizeList as List } from 'react-window';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  Checkbox,
  TableSortLabel,
  TablePagination,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { designTokens } from '@/theme/designTokens';

const { colors, dataTable, typography, spacing, borders, shadows } = designTokens;
const dataSurfaces = colors.data;

export interface VirtualizedColumn<T = any> {
  id: keyof T | string;
  label: string;
  minWidth?: number;
  width?: number; // Fixed width for virtualization
  align?: 'left' | 'right' | 'center';
  format?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  sticky?: boolean; // Sticky column (e.g., first column)
}

export interface VirtualizedTableProps<T extends Record<string, any>> {
  columns: VirtualizedColumn<T>[];
  rows: T[];
  keyField?: keyof T | string;
  selectable?: boolean;
  selectedRows?: Set<string | number>;
  onSelectionChange?: (selected: Set<string | number>) => void;
  sortable?: boolean;
  defaultSort?: { field: keyof T | string; direction: 'asc' | 'desc' };
  onSortChange?: (field: keyof T | string, direction: 'asc' | 'desc') => void;
  pagination?: boolean;
  page?: number;
  rowsPerPage?: number;
  totalRows?: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  loading?: boolean;
  emptyMessage?: string;
  dense?: boolean;
  stickyHeader?: boolean;
  height?: number; // Fixed height for virtualization
  rowHeight?: number; // Height per row
  overscanCount?: number; // Rows to render outside visible area
  enableVirtualization?: boolean; // Toggle virtualization (auto-disabled for < 100 rows)
}

const DEFAULT_ROW_HEIGHT = 52;
const DEFAULT_HEADER_HEIGHT = 56;
const MIN_ROWS_FOR_VIRTUALIZATION = 100;

export function VirtualizedTable<T extends Record<string, any>>({
  columns,
  rows,
  keyField = 'id',
  selectable = false,
  selectedRows: controlledSelectedRows,
  onSelectionChange,
  sortable = true,
  defaultSort,
  onSortChange,
  pagination = true,
  page: controlledPage,
  rowsPerPage: controlledRowsPerPage = 25,
  totalRows,
  onPageChange,
  onRowsPerPageChange,
  loading = false,
  emptyMessage = 'No data available',
  dense = false,
  stickyHeader = false,
  height = 600,
  rowHeight = DEFAULT_ROW_HEIGHT,
  overscanCount = 5,
  enableVirtualization = true,
}: VirtualizedTableProps<T>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const listRef = useRef<List>(null);
  
  // Auto-disable virtualization on mobile or small datasets
  const shouldVirtualize = useMemo(() => {
    if (!enableVirtualization) return false;
    if (isMobile) return false; // Disable on mobile for better touch experience
    return rows.length >= MIN_ROWS_FOR_VIRTUALIZATION;
  }, [enableVirtualization, rows.length, isMobile]);

  // Internal state
  const [internalSelectedRows, setInternalSelectedRows] = useState<Set<string | number>>(new Set());
  const [internalSort, setInternalSort] = useState<{
    field: string;
    direction: 'asc' | 'desc';
  }>(
    defaultSort
      ? { field: defaultSort.field as string, direction: defaultSort.direction }
      : { field: '', direction: 'asc' }
  );
  const [internalPage, setInternalPage] = useState(0);
  const [internalRowsPerPage, setInternalRowsPerPage] = useState(controlledRowsPerPage);

  const selectedRows = controlledSelectedRows ?? internalSelectedRows;
  const page = controlledPage ?? internalPage;
  const rowsPerPage = controlledRowsPerPage ?? internalRowsPerPage;
  const sort = internalSort;

  // Calculate column widths
  const columnWidths = useMemo(() => {
    const totalFixedWidth = columns.reduce((sum, col) => sum + (col.width || 0), 0);
    const flexibleColumns = columns.filter(col => !col.width);
    const availableWidth = 1200 - totalFixedWidth; // Default container width
    const flexibleWidth = flexibleColumns.length > 0 ? availableWidth / flexibleColumns.length : 0;

    return columns.map(col => col.width || col.minWidth || flexibleWidth || 150);
  }, [columns]);

  const totalWidth = useMemo(() => {
    return columnWidths.reduce((sum, width) => sum + width, 0) + (selectable ? 48 : 0);
  }, [columnWidths, selectable]);

  // Selection handlers
  const handleSelectAll = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const displayRows = shouldVirtualize ? rows : rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    if (event.target.checked) {
      const allSelected = new Set(displayRows.map((row) => row[keyField]));
      if (onSelectionChange) {
        onSelectionChange(allSelected);
      } else {
        setInternalSelectedRows(allSelected);
      }
    } else {
      if (onSelectionChange) {
        onSelectionChange(new Set());
      } else {
        setInternalSelectedRows(new Set());
      }
    }
  }, [rows, keyField, selectable, onSelectionChange, shouldVirtualize, page, rowsPerPage]);

  const handleSelectRow = useCallback((rowId: string | number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowId)) {
      newSelected.delete(rowId);
    } else {
      newSelected.add(rowId);
    }
    if (onSelectionChange) {
      onSelectionChange(newSelected);
    } else {
      setInternalSelectedRows(newSelected);
    }
  }, [selectedRows, onSelectionChange]);

  const isAllSelected = rows.length > 0 && rows.every((row) => selectedRows.has(row[keyField]));
  const isIndeterminate = !isAllSelected && rows.some((row) => selectedRows.has(row[keyField]));

  // Sort handlers
  const handleSort = useCallback((field: string) => {
    const newDirection =
      sort.field === field && sort.direction === 'asc' ? 'desc' : 'asc';
    const newSort = { field, direction: newDirection as 'asc' | 'desc' };
    setInternalSort(newSort);
    if (onSortChange) {
      onSortChange(field, newDirection);
    }
  }, [sort, onSortChange]);

  // Pagination handlers
  const handleChangePage = useCallback((_event: unknown, newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage);
    } else {
      setInternalPage(newPage);
    }
    // Scroll to top when page changes
    if (listRef.current) {
      listRef.current.scrollToItem(0);
    }
  }, [onPageChange]);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    if (onRowsPerPageChange) {
      onRowsPerPageChange(newRowsPerPage);
    } else {
      setInternalRowsPerPage(newRowsPerPage);
      setInternalPage(0);
    }
  }, [onRowsPerPageChange]);

  // Get display rows
  const displayRows = useMemo(() => {
    if (shouldVirtualize) {
      return rows; // Virtualization handles pagination
    }
    return totalRows !== undefined ? rows : rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [rows, shouldVirtualize, totalRows, page, rowsPerPage]);

  const totalRowsCount = totalRows ?? rows.length;

  // Row renderer for virtualization
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const row = displayRows[index];
    if (!row) return null;

    const rowId = row[keyField];
    const isSelected = selectedRows.has(rowId);

    return (
      <TableRow
        style={style}
        hover
        selected={isSelected}
        onClick={() => selectable && handleSelectRow(rowId)}
        sx={{
          cursor: selectable ? 'pointer' : 'default',
          display: 'flex',
          width: '100%',
          backgroundColor: isSelected ? dataTable.rowBgSelected : dataTable.rowBg,
          transition: 'background-color 150ms ease',
          '&:hover': {
            backgroundColor: dataTable.rowBgHover,
          },
          '&:nth-of-type(even)': {
            backgroundColor: isSelected ? dataTable.rowBgSelected : dataTable.rowBgAlt,
            '&:hover': {
              backgroundColor: dataTable.rowBgHover,
            },
          },
        }}
      >
        {selectable && (
          <TableCell
            padding="checkbox"
            sx={{
              width: 48,
              flexShrink: 0,
              borderBottom: `1px solid ${dataTable.borderColor}`,
            }}
          >
            <Checkbox
              checked={isSelected}
              onClick={(e) => {
                e.stopPropagation();
                handleSelectRow(rowId);
              }}
              sx={{
                color: colors.intelligence.cerulean,
                '&.Mui-checked': {
                  color: colors.intelligence.cerulean,
                },
              }}
            />
          </TableCell>
        )}
        {columns.map((column, colIndex) => {
          const value = row[column.id];
          const cellContent = column.render
            ? column.render(value, row)
            : column.format
            ? column.format(value, row)
            : value;

          return (
            <TableCell
              key={column.id as string}
              align={column.align || 'left'}
              sx={{
                width: columnWidths[colIndex],
                flexShrink: column.width ? 0 : 1,
                borderBottom: `1px solid ${dataTable.borderColor}`,
                padding: dense ? '8px 12px' : dataTable.cellPadding,
                color: colors.data.dataText,
                fontSize: typography.fontSize.data,
              }}
            >
              {cellContent}
            </TableCell>
          );
        })}
      </TableRow>
    );
  }, [displayRows, keyField, selectedRows, selectable, handleSelectRow, columns, columnWidths, dense]);

  return (
    <Box
      sx={{
        width: '100%',
        backgroundColor: dataSurfaces.white,
        borderRadius: borders.radius.lg,
        overflow: 'hidden',
        boxShadow: shadows.data,
      }}
    >
      {shouldVirtualize ? (
        // Virtualized rendering
        <TableContainer
          sx={{
            height: height,
            backgroundColor: dataSurfaces.white,
            overflow: 'hidden',
          }}
        >
          <Table
            stickyHeader={stickyHeader}
            size={dense ? 'small' : 'medium'}
            sx={{
              '& .MuiTableCell-head': {
                backgroundColor: dataTable.headerBg,
                color: dataTable.headerText,
                fontWeight: typography.fontWeight.semibold,
                fontSize: typography.fontSize.data,
                borderBottom: `2px solid ${dataTable.headerBorder}`,
                padding: dense ? '8px 12px' : dataTable.cellPadding,
              },
            }}
          >
            <TableHead>
              <TableRow sx={{ display: 'flex', width: '100%' }}>
                {selectable && (
                  <TableCell padding="checkbox" sx={{ width: 48, flexShrink: 0 }}>
                    <Checkbox
                      indeterminate={isIndeterminate}
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      sx={{
                        color: colors.intelligence.cerulean,
                        '&.Mui-checked': {
                          color: colors.intelligence.cerulean,
                        },
                      }}
                    />
                  </TableCell>
                )}
                {columns.map((column, index) => (
                  <TableCell
                    key={column.id as string}
                    align={column.align || 'left'}
                    style={{ width: columnWidths[index] }}
                    sx={{
                      flexShrink: column.width ? 0 : 1,
                      fontWeight: typography.fontWeight.semibold,
                    }}
                  >
                    {sortable && column.sortable !== false ? (
                      <TableSortLabel
                        active={sort.field === column.id}
                        direction={sort.field === column.id ? sort.direction : 'asc'}
                        onClick={() => handleSort(column.id as string)}
                        sx={{
                          '& .MuiTableSortLabel-icon': {
                            color: `${colors.intelligence.cerulean} !important`,
                          },
                          '&.Mui-active': {
                            color: colors.intelligence.cerulean,
                          },
                        }}
                      >
                        {column.label}
                      </TableSortLabel>
                    ) : (
                      column.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
          </Table>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: height - DEFAULT_HEADER_HEIGHT, p: 4 }}>
              <Typography variant="body2" color={colors.data.dataTextSecondary}>
                Loading...
              </Typography>
            </Box>
          ) : displayRows.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: height - DEFAULT_HEADER_HEIGHT, p: 4 }}>
              <Typography variant="body2" color={colors.data.dataTextTertiary}>
                {emptyMessage}
              </Typography>
            </Box>
          ) : (
            <List
              ref={listRef}
              height={height - DEFAULT_HEADER_HEIGHT}
              itemCount={displayRows.length}
              itemSize={rowHeight}
              overscanCount={overscanCount}
              width="100%"
            >
              {Row}
            </List>
          )}
        </TableContainer>
      ) : (
        // Standard rendering for small datasets
        <TableContainer
          sx={{
            maxHeight: height,
            backgroundColor: dataSurfaces.white,
          }}
        >
          <Table
            stickyHeader={stickyHeader}
            size={dense ? 'small' : 'medium'}
            sx={{
              '& .MuiTableCell-head': {
                backgroundColor: dataTable.headerBg,
                color: dataTable.headerText,
                fontWeight: typography.fontWeight.semibold,
                fontSize: typography.fontSize.data,
                borderBottom: `2px solid ${dataTable.headerBorder}`,
                padding: dense ? '8px 12px' : dataTable.cellPadding,
              },
              '& .MuiTableCell-body': {
                color: colors.data.dataText,
                fontSize: typography.fontSize.data,
                borderBottom: `1px solid ${dataTable.borderColor}`,
                padding: dense ? '8px 12px' : dataTable.cellPadding,
              },
              '& .MuiTableRow-root': {
                backgroundColor: dataTable.rowBg,
                transition: 'background-color 150ms ease',
                '&:hover': {
                  backgroundColor: dataTable.rowBgHover,
                },
                '&:nth-of-type(even)': {
                  backgroundColor: dataTable.rowBgAlt,
                  '&:hover': {
                    backgroundColor: dataTable.rowBgHover,
                  },
                },
                '&.Mui-selected': {
                  backgroundColor: dataTable.rowBgSelected,
                  '&:hover': {
                    backgroundColor: dataTable.rowBgSelected,
                  },
                },
              },
            }}
          >
            <TableHead>
              <TableRow>
                {selectable && (
                  <TableCell padding="checkbox" sx={{ width: '48px' }}>
                    <Checkbox
                      indeterminate={isIndeterminate}
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      sx={{
                        color: colors.intelligence.cerulean,
                        '&.Mui-checked': {
                          color: colors.intelligence.cerulean,
                        },
                      }}
                    />
                  </TableCell>
                )}
                {columns.map((column) => (
                  <TableCell
                    key={column.id as string}
                    align={column.align || 'left'}
                    style={{ minWidth: column.minWidth }}
                    sx={{
                      fontWeight: typography.fontWeight.semibold,
                    }}
                  >
                    {sortable && column.sortable !== false ? (
                      <TableSortLabel
                        active={sort.field === column.id}
                        direction={sort.field === column.id ? sort.direction : 'asc'}
                        onClick={() => handleSort(column.id as string)}
                        sx={{
                          '& .MuiTableSortLabel-icon': {
                            color: `${colors.intelligence.cerulean} !important`,
                          },
                          '&.Mui-active': {
                            color: colors.intelligence.cerulean,
                          },
                        }}
                      >
                        {column.label}
                      </TableSortLabel>
                    ) : (
                      column.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    align="center"
                    sx={{ padding: spacing.xxxl }}
                  >
                    <Typography variant="body2" color={colors.data.dataTextSecondary}>
                      Loading...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : displayRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    align="center"
                    sx={{ padding: spacing.xxxl }}
                  >
                    <Typography variant="body2" color={colors.data.dataTextTertiary}>
                      {emptyMessage}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                displayRows.map((row) => {
                  const rowId = row[keyField];
                  const isSelected = selectedRows.has(rowId);

                  return (
                    <TableRow
                      key={rowId}
                      hover
                      selected={isSelected}
                      onClick={() => selectable && handleSelectRow(rowId)}
                      sx={{
                        cursor: selectable ? 'pointer' : 'default',
                      }}
                    >
                      {selectable && (
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isSelected}
                            sx={{
                              color: colors.intelligence.cerulean,
                              '&.Mui-checked': {
                                color: colors.intelligence.cerulean,
                              },
                            }}
                          />
                        </TableCell>
                      )}
                      {columns.map((column) => {
                        const value = row[column.id];
                        const cellContent = column.render
                          ? column.render(value, row)
                          : column.format
                          ? column.format(value, row)
                          : value;

                        return (
                          <TableCell key={column.id as string} align={column.align || 'left'}>
                            {cellContent}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {pagination && totalRowsCount > 0 && !shouldVirtualize && (
        <TablePagination
          component="div"
          count={totalRowsCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
          sx={{
            backgroundColor: dataSurfaces.white,
            borderTop: `1px solid ${dataTable.borderColor}`,
            '& .MuiTablePagination-toolbar': {
              paddingLeft: spacing.lg,
              paddingRight: spacing.lg,
            },
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              color: colors.data.dataText,
              fontSize: typography.fontSize.dataSmall,
            },
            '& .MuiIconButton-root': {
              color: colors.intelligence.cerulean,
              '&:hover': {
                backgroundColor: dataTable.rowBgHover,
              },
            },
          }}
        />
      )}
    </Box>
  );
}
