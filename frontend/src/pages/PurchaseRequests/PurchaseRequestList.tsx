import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Alert,
  InputAdornment,
  IconButton,
  Chip,
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon, Clear as ClearIcon, Download as DownloadIcon, ShoppingCart as ShoppingCartIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { usePurchaseRequests } from '@/hooks/usePurchaseRequests';
import { PurchaseRequestStatus, PurchaseRequestFilters } from '@/types/purchase-request';
import { PRListItem } from '@/components/PurchaseRequest/PRListItem';
import { useSubmitPurchaseRequest, useDeletePurchaseRequest } from '@/hooks/usePurchaseRequests';
import { PageSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';
import { CategoryFilter } from '@/components/Category/CategoryFilter';
import { useDebounce } from '@/hooks/useDebounce';
import { Pagination } from '@/components/common/Pagination';
import { exportToCSV } from '@/utils/export';

export const PurchaseRequestList = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<PurchaseRequestStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [subCategoryFilter, setSubCategoryFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 300);

  const filters: PurchaseRequestFilters = {};
  if (statusFilter !== 'all') filters.status = statusFilter;
  if (categoryFilter) filters.categoryId = categoryFilter;
  if (subCategoryFilter) filters.subCategoryId = subCategoryFilter;
  const { data, isLoading, error } = usePurchaseRequests(Object.keys(filters).length > 0 ? filters : undefined);
  const submitMutation = useSubmitPurchaseRequest();
  const deleteMutation = useDeletePurchaseRequest();

  // Handle both array and paginated response
  const purchaseRequests = useMemo(() => {
    if (!data?.data) return [];
    // Check if it's a paginated response
    if ('data' in data.data && Array.isArray(data.data.data)) {
      return data.data.data;
    }
    // Otherwise it's an array
    return Array.isArray(data.data) ? data.data : [];
  }, [data]);

  // Filter by search query
  const filteredPRs = useMemo(() => {
    if (!debouncedSearch.trim()) return purchaseRequests;
    const query = debouncedSearch.toLowerCase();
    return purchaseRequests.filter((pr: any) =>
      pr.title?.toLowerCase().includes(query) ||
      pr.description?.toLowerCase().includes(query)
    );
  }, [purchaseRequests, debouncedSearch]);

  // Pagination
  const paginatedPRs = useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredPRs.slice(startIndex, endIndex);
  }, [filteredPRs, page, rowsPerPage]);

  const totalPages = Math.ceil(filteredPRs.length / rowsPerPage);

  // Reset to first page when filters or search change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, categoryFilter, subCategoryFilter, debouncedSearch]);

  // Export to CSV
  const handleExport = () => {
    const exportData = filteredPRs.map((pr: any) => ({
      Title: pr.title || 'N/A',
      Description: pr.description || 'N/A',
      Status: pr.status || 'N/A',
      Budget: pr.budget ? `${pr.budget.amount} ${pr.budget.currency}` : 'N/A',
      'Delivery Date': pr.deliveryDate || 'N/A',
      'Created At': pr.createdAt || 'N/A',
    }));

    exportToCSV(exportData, 'purchase-requests');
  };

  const handleSubmit = (id: string) => {
    submitMutation.mutate(id);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this purchase request?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error) {
    const errorMessage = (error as any)?.response?.data?.message ||
      (error as any)?.message ||
      'Failed to load purchase requests. Please try again.';
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Purchase Requests
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={filteredPRs.length === 0}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/purchase-requests/new')}
          >
            Create Purchase Request
          </Button>
        </Box>
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
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search"
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value as PurchaseRequestStatus | 'all')}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value={PurchaseRequestStatus.DRAFT}>Draft</MenuItem>
                <MenuItem value={PurchaseRequestStatus.SUBMITTED}>Submitted</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
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
        </Grid>

        {/* Active Filters Chips */}
        {(debouncedSearch || statusFilter !== 'all' || categoryFilter || subCategoryFilter) && (
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {debouncedSearch && (
              <Chip
                label={`Search: "${debouncedSearch}"`}
                onDelete={() => setSearchQuery('')}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {statusFilter !== 'all' && (
              <Chip
                label={`Status: ${statusFilter}`}
                onDelete={() => setStatusFilter('all')}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {categoryFilter && (
              <Chip
                label={`Category: ${categoryFilter}`}
                onDelete={() => {
                  setCategoryFilter('');
                  setSubCategoryFilter('');
                }}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {subCategoryFilter && (
              <Chip
                label={`Sub-Category: ${subCategoryFilter}`}
                onDelete={() => setSubCategoryFilter('')}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
        )}
      </Paper>

      {/* Purchase Requests List */}
      {filteredPRs.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <ShoppingCartIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {debouncedSearch || statusFilter !== 'all' || categoryFilter
              ? 'No purchase requests found'
              : 'No purchase requests yet'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
            {debouncedSearch || statusFilter !== 'all' || categoryFilter
              ? 'Try adjusting your search or filters to find what you\'re looking for.'
              : 'Create your first purchase request to get started. Purchase requests help you organize your procurement needs.'}
          </Typography>
          {!debouncedSearch && statusFilter === 'all' && !categoryFilter && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/purchase-requests/new')}
            >
              Create Purchase Request
            </Button>
          )}
        </Paper>
      ) : (
        <>
          <Grid container spacing={3}>
            {paginatedPRs.map((pr: any, index: number) => (
              <Grid item xs={12} key={pr._id || pr.id || `pr-${index}`}>
                <PRListItem
                  purchaseRequest={pr}
                  onSubmit={handleSubmit}
                  onDelete={handleDelete}
                />
              </Grid>
            ))}
          </Grid>
          {filteredPRs.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Pagination
                page={page}
                limit={rowsPerPage}
                total={filteredPRs.length}
                totalPages={totalPages}
                onPageChange={setPage}
                onLimitChange={(newLimit) => {
                  setRowsPerPage(newLimit);
                  setPage(1);
                }}
                limitOptions={[5, 10, 25, 50]}
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};
