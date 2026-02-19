import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  Chip,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useRFQs } from '@/hooks/useRFQs';
import { RFQStatus, RFQType, RFQFilters, RFQ } from '@/types/rfq';
import { RFQListItem } from '@/components/RFQ/RFQListItem';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';
import { PageSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';
import { Pagination } from '@/components/common/Pagination';
import { VirtualList } from '@/components/common/VirtualList';
import { usePagination } from '@/hooks/usePagination';
import { PaginatedResponse } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';
import { ResponsiveTable } from '@/components/common';
import { RFQStatusBadge } from '@/components/RFQ/RFQStatusBadge';
import { DeadlineCountdown } from '@/components/RFQ/DeadlineCountdown';
import { AnonymousBadge } from '@/components/RFQ/AnonymousBadge';
import { formatCurrency, formatDate } from '@/utils';
import { CategoryFilter } from '@/components/Category/CategoryFilter';
import { useCategory } from '@/hooks/useCategories';

/**
 * Component to display category name from categoryId
 */
const CategoryCell = ({ categoryId, subCategoryId }: { categoryId?: string; subCategoryId?: string }) => {
  const { data: categoryData } = useCategory(categoryId);
  const { data: subCategoryData } = useCategory(subCategoryId);

  const categoryName = categoryData?.data?.name || 'N/A';
  const subCategoryName = subCategoryData?.data?.name;

  if (!categoryId) {
    return <Typography variant="body2" color="text.secondary">N/A</Typography>;
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {categoryName}
      </Typography>
      {subCategoryName && (
        <Typography variant="caption" color="text.secondary">
          {subCategoryName}
        </Typography>
      )}
    </Box>
  );
};

export const RFQList = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role = user?.role as Role;
  const [statusFilter, setStatusFilter] = useState<RFQStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<RFQType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'paginated' | 'infinite'>('paginated');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [subCategoryFilter, setSubCategoryFilter] = useState<string>('');

  // Debounce search query to avoid excessive API calls
  const debouncedSearch = useDebounce(searchQuery, 500);

  const pagination = usePagination({ initialLimit: 20 });
  const { page, setPage, setLimit, paginationParams } = pagination;

  // Build filters with server-side search
  const filters: RFQFilters = useMemo(() => {
    const f: RFQFilters = {};
    if (statusFilter !== 'all') f.status = statusFilter;
    if (typeFilter !== 'all') f.type = typeFilter;
    if (debouncedSearch.trim()) f.search = debouncedSearch.trim();
    if (categoryFilter) f.categoryId = categoryFilter;
    if (subCategoryFilter) f.subCategoryId = subCategoryFilter;
    // For providers, filter by their role
    if (role !== Role.BUYER && role !== Role.ADMIN && role !== Role.GOVERNMENT && role !== Role.COMPANY_MANAGER) {
      f.targetRole = role;
    }
    return f;
  }, [statusFilter, typeFilter, debouncedSearch, categoryFilter, subCategoryFilter, role]);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, typeFilter, debouncedSearch, categoryFilter, subCategoryFilter, setPage]);

  const { data, isLoading, error } = useRFQs(
    filters,
    viewMode === 'paginated' ? paginationParams : undefined
  );

  // Handle paginated response
  const responseData = (data as any)?.data;
  const isPaginated = responseData && typeof responseData === 'object' && responseData !== null && 'pagination' in responseData;
  const paginatedData = isPaginated ? (responseData as PaginatedResponse<RFQ>) : null;
  const rfqs: RFQ[] = paginatedData
    ? paginatedData.data
    : (Array.isArray(responseData) ? responseData : []) as RFQ[];

  const isBuyer = role === Role.BUYER || role === Role.ADMIN || role === Role.GOVERNMENT;

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error) {
    const errorMessage = (error as any)?.response?.data?.message ||
      (error as any)?.message ||
      'Failed to load RFQs. Please try again.';
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
        <Button
          variant="contained"
          onClick={() => window.location.reload()}
        >
          Refresh Page
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            {isBuyer ? 'My RFQs' : 'Available RFQs'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isBuyer
              ? 'Manage your request for quotations'
              : 'Browse available RFQs matching your role'}
          </Typography>
        </Box>
        {isBuyer && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/rfqs/new')}
          >
            Create RFQ
          </Button>
        )}
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search"
              placeholder="Search by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value as RFQStatus | 'all')}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value={RFQStatus.DRAFT}>Draft</MenuItem>
                <MenuItem value={RFQStatus.OPEN}>Open</MenuItem>
                <MenuItem value={RFQStatus.CLOSED}>Closed</MenuItem>
                <MenuItem value={RFQStatus.CANCELLED}>Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                label="Type"
                onChange={(e) => setTypeFilter(e.target.value as RFQType | 'all')}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value={RFQType.SUPPLIER}>Supplier</MenuItem>
                <MenuItem value={RFQType.LOGISTICS}>Logistics</MenuItem>
                <MenuItem value={RFQType.CLEARANCE}>Clearance</MenuItem>
                <MenuItem value={RFQType.SERVICE_PROVIDER}>Service Provider</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <CategoryFilter
              value={categoryFilter}
              onChange={setCategoryFilter}
              subCategoryId={subCategoryFilter}
              onSubCategoryChange={setSubCategoryFilter}
              label="Category"
              subCategoryLabel="Sub-Category"
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">
              {paginatedData
                ? `${paginatedData.pagination.total} RFQ${paginatedData.pagination.total !== 1 ? 's' : ''} found`
                : `${rfqs.length} RFQ${rfqs.length !== 1 ? 's' : ''} found`}
            </Typography>
          </Grid>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, value) => value && setViewMode(value)}
                size="small"
              >
                <ToggleButton value="paginated">Paginated</ToggleButton>
                <ToggleButton value="infinite">Infinite Scroll</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* RFQs List */}
      {rfqs.length === 0 && !isLoading ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No RFQs found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {debouncedSearch || statusFilter !== 'all' || typeFilter !== 'all' || categoryFilter
              ? 'Try adjusting your filters'
              : isBuyer
                ? 'No RFQs created yet'
                : 'No available RFQs matching your role'}
          </Typography>
        </Paper>
      ) : viewMode === 'infinite' ? (
        <VirtualList
          items={rfqs}
          renderItem={(rfq) => (
            <Box sx={{ mb: 2 }}>
              <RFQListItem rfq={rfq} />
            </Box>
          )}
          loading={isLoading}
          hasNextPage={paginatedData?.pagination.hasNextPage || false}
          onLoadMore={() => {
            if (paginatedData?.pagination.hasNextPage) {
              setPage(page + 1);
            }
          }}
          emptyMessage={
            debouncedSearch || statusFilter !== 'all' || typeFilter !== 'all' || categoryFilter
              ? 'Try adjusting your filters'
              : isBuyer
                ? 'No RFQs created yet'
                : 'No available RFQs matching your role'
          }
          containerHeight="calc(100vh - 400px)"
        />
      ) : (
        <>
          <ResponsiveTable
            columns={[
              {
                id: 'title',
                label: 'Title',
                priority: 'high',
                render: (rfq) => (
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {rfq.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {rfq.description?.substring(0, 60)}...
                    </Typography>
                  </Box>
                ),
                mobileLabel: 'RFQ',
              },
              {
                id: 'status',
                label: 'Status',
                priority: 'high',
                render: (rfq) => <RFQStatusBadge status={rfq.status} />,
              },
              {
                id: 'type',
                label: 'Type',
                priority: 'medium',
                render: (rfq) => (
                  <Chip label={rfq.type} size="small" variant="outlined" />
                ),
                mobileLabel: 'Type',
              },
              {
                id: 'category',
                label: 'Category',
                priority: 'medium',
                render: (rfq) => {
                  // Use CategoryCell component to display category
                  return <CategoryCell categoryId={rfq.categoryId} subCategoryId={rfq.subCategoryId} />;
                },
                mobileLabel: 'Category',
              },
              {
                id: 'budget',
                label: 'Budget',
                priority: 'high',
                render: (rfq) => (
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatCurrency(rfq.budget, rfq.currency)}
                  </Typography>
                ),
                align: 'right',
                width: 120,
              },
              {
                id: 'items',
                label: 'Items',
                priority: 'low',
                render: (rfq) => (
                  <Typography variant="body2">
                    {rfq.items.length} item{rfq.items.length !== 1 ? 's' : ''}
                  </Typography>
                ),
                align: 'center',
                width: 80,
              },
              {
                id: 'deadline',
                label: 'Deadline',
                priority: 'medium',
                render: (rfq) =>
                  rfq.status === RFQStatus.OPEN ? (
                    <DeadlineCountdown deadline={rfq.deadline} showIcon={false} />
                  ) : (
                    <Typography variant="body2">{formatDate(rfq.deadline)}</Typography>
                  ),
                mobileLabel: 'Deadline',
              },
              {
                id: 'delivery',
                label: 'Delivery Date',
                priority: 'low',
                render: (rfq) => (
                  <Typography variant="body2">{formatDate(rfq.requiredDeliveryDate)}</Typography>
                ),
                mobileLabel: 'Delivery Date',
              },
              {
                id: 'anonymous',
                label: 'Anonymous',
                priority: 'low',
                render: (rfq) => <AnonymousBadge anonymous={rfq.anonymousBuyer} />,
                align: 'center',
                width: 100,
              },
            ]}
            data={rfqs}
            keyExtractor={(rfq) => rfq._id || rfq.id || ''}
            emptyMessage={
              debouncedSearch || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your filters'
                : isBuyer
                  ? 'No RFQs created yet'
                  : 'No available RFQs matching your role'
            }
            onRowClick={(rfq) => navigate(`/rfqs/${rfq._id || rfq.id}`)}
            mobileCardRenderer={(rfq) => <RFQListItem rfq={rfq} />}
            tableProps={{ stickyHeader: true }}
          />
          {paginatedData && (
            <Box sx={{ mt: 3 }}>
              <Pagination
                page={paginatedData.pagination.page}
                limit={paginatedData.pagination.limit}
                total={paginatedData.pagination.total}
                totalPages={paginatedData.pagination.totalPages}
                onPageChange={setPage}
                onLimitChange={setLimit}
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};
