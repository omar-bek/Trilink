import React from 'react';
import {
  Box,
  Pagination as MuiPagination,
  PaginationItem,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Stack,
} from '@mui/material';
import { ArrowBack, ArrowForward } from '@mui/icons-material';

export interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  limitOptions?: number[];
  showLimitSelector?: boolean;
  showTotal?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onLimitChange,
  limitOptions = [10, 20, 50, 100],
  showLimitSelector = true,
  showTotal = true,
}) => {
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2,
        py: 2,
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        {showTotal && (
          <Typography variant="body2" color="text.secondary">
            Showing {startItem}-{endItem} of {total}
          </Typography>
        )}
        {showLimitSelector && onLimitChange && (
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="pagination-limit-label">Items per page</InputLabel>
            <Select
              value={limit}
              label="Items per page"
              labelId="pagination-limit-label"
              onChange={(e) => onLimitChange(Number(e.target.value))}
              aria-label="Select number of items per page"
            >
              {limitOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Stack>

      <MuiPagination
        count={totalPages}
        page={page}
        onChange={(_, value) => onPageChange(value)}
        color="primary"
        shape="rounded"
        aria-label="Pagination navigation"
        getItemAriaLabel={(type, page, selected) => {
          if (type === 'page') {
            return `${selected ? '' : 'Go to '}page ${page}`;
          }
          if (type === 'first') {
            return 'Go to first page';
          }
          if (type === 'last') {
            return 'Go to last page';
          }
          if (type === 'next') {
            return 'Go to next page';
          }
          if (type === 'previous') {
            return 'Go to previous page';
          }
          return '';
        }}
        renderItem={(item) => (
          <PaginationItem
            components={{
              previous: ArrowBack,
              next: ArrowForward,
            }}
            {...item}
          />
        )}
      />
    </Box>
  );
};
