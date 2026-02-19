/**
 * Enterprise Data Table Component
 * 
 * Government-grade data table with clean white surfaces
 * High data density, ultra-clear presentation
 * Designed for decision-makers
 */

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
} from '@mui/material';
import { useState, ReactNode } from 'react';
import { designTokens } from '@/theme/designTokens';

const { colors, dataTable, typography, spacing, borders, shadows } = designTokens;
const dataSurfaces = colors.data;

// ============================================================================
// TYPES
// ============================================================================

export interface Column<T = any> {
  id: keyof T | string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  format?: (value: any, row: T) => ReactNode;
  sortable?: boolean;
  render?: (value: any, row: T) => ReactNode;
}

export interface EnterpriseDataTableProps<T = any> {
  columns: Column<T>[];
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
  maxHeight?: number | string;
}

// ============================================================================
// ENTERPRISE DATA TABLE
// ============================================================================

export function EnterpriseDataTable<T extends Record<string, any>>({
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
  maxHeight,
}: EnterpriseDataTableProps<T>) {
  const theme = useTheme();
  
  // Internal state for uncontrolled mode
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

  // Use controlled or internal state
  const selectedRows = controlledSelectedRows ?? internalSelectedRows;
  const page = controlledPage ?? internalPage;
  const rowsPerPage = controlledRowsPerPage ?? internalRowsPerPage;
  const sort = internalSort;

  // Selection handlers
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const allSelected = new Set(rows.map((row) => row[keyField]));
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
  };

  const handleSelectRow = (rowId: string | number) => {
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
  };

  const isAllSelected = rows.length > 0 && rows.every((row) => selectedRows.has(row[keyField]));
  const isIndeterminate = !isAllSelected && rows.some((row) => selectedRows.has(row[keyField]));

  // Sort handlers
  const handleSort = (field: string) => {
    const newDirection =
      sort.field === field && sort.direction === 'asc' ? 'desc' : 'asc';
    const newSort = { field, direction: newDirection };
    setInternalSort(newSort);
    if (onSortChange) {
      onSortChange(field, newDirection);
    }
  };

  // Pagination handlers
  const handleChangePage = (_event: unknown, newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage);
    } else {
      setInternalPage(newPage);
    }
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    if (onRowsPerPageChange) {
      onRowsPerPageChange(newRowsPerPage);
    } else {
      setInternalRowsPerPage(newRowsPerPage);
      setInternalPage(0);
    }
  };

  // Get display rows (for client-side pagination if totalRows not provided)
  const displayRows = totalRows !== undefined ? rows : rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const totalRowsCount = totalRows ?? rows.length;

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
      <TableContainer
        sx={{
          maxHeight: maxHeight,
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

      {pagination && totalRowsCount > 0 && (
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