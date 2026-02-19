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
  Button,
  InputAdornment,
  IconButton,
  Chip,
} from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon, Download as DownloadIcon, Gavel as GavelIcon } from '@mui/icons-material';
import { useBids } from '@/hooks/useBids';
import { BidStatus, BidFilters, Bid } from '@/types/bid';
import { BidListItem } from '@/components/Bid/BidListItem';
import { PageSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';
import { ResponsiveTable, ResponsiveTableColumn } from '@/components/common';
import { BidStatusBadge } from '@/components/Bid/BidStatusBadge';
import { AIScoreIndicator } from '@/components/Bid/AIScoreIndicator';
import { formatCurrency, formatDate } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { CategoryFilter } from '@/components/Category/CategoryFilter';
import { useDebounce } from '@/hooks/useDebounce';
import { Pagination } from '@/components/common/Pagination';
import { exportToCSV } from '@/utils/export';

export const BidList = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role = user?.role as Role;
  const [statusFilter, setStatusFilter] = useState<BidStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [subCategoryFilter, setSubCategoryFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 300);

  const filters: BidFilters = {};
  if (statusFilter !== 'all') filters.status = statusFilter;
  if (categoryFilter) filters.categoryId = categoryFilter;
  if (subCategoryFilter) filters.subCategoryId = subCategoryFilter;
  const { data, isLoading, error } = useBids(filters);
  
  // Handle both array and paginated response
  const bids = useMemo(() => {
    if (!data?.data) return [];
    if ('data' in data.data && Array.isArray(data.data.data)) {
      return data.data.data;
    }
    return Array.isArray(data.data) ? data.data : [];
  }, [data]);

  // Filter by search query
  const filteredBids = useMemo(() => {
    if (!debouncedSearch.trim()) return bids;
    const query = debouncedSearch.toLowerCase();
    return bids.filter((bid: any) =>
      bid.paymentTerms?.toLowerCase().includes(query)
    );
  }, [bids, debouncedSearch]);

  // Pagination
  const paginatedBids = useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredBids.slice(startIndex, endIndex);
  }, [filteredBids, page, rowsPerPage]);

  const totalPages = Math.ceil(filteredBids.length / rowsPerPage);

  // Reset to first page when filters or search change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, categoryFilter, subCategoryFilter, debouncedSearch]);

  // Export to CSV
  const handleExport = () => {
    const exportData = filteredBids.map((bid: any) => ({
      'Bid ID': typeof (bid._id || bid.id) === 'string' ? (bid._id || bid.id)?.slice(-6) : 'N/A',
      Status: bid.status || 'N/A',
      Price: bid.price ? formatCurrency(bid.price, bid.currency) : 'N/A',
      'Payment Terms': bid.paymentTerms || 'N/A',
      'Delivery Date': bid.deliveryDate ? formatDate(bid.deliveryDate) : 'N/A',
      'Delivery Time': bid.deliveryTime ? `${bid.deliveryTime} days` : 'N/A',
      'Valid Until': bid.validity ? formatDate(bid.validity) : 'N/A',
      'AI Score': bid.aiScore !== undefined ? bid.aiScore : 'N/A',
    }));

    exportToCSV(exportData, 'bids');
  };

  const isBuyer = role === Role.BUYER || role === Role.ADMIN || role === Role.GOVERNMENT || role === Role.COMPANY_MANAGER;

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error) {
    const errorMessage = (error as any)?.response?.data?.message || 
                         (error as any)?.message || 
                         'Failed to load bids. Please try again.';
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            {isBuyer ? 'Bid Management' : 'My Bids'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isBuyer
              ? 'Review and manage bids for your RFQs'
              : 'View and manage your submitted bids'}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          disabled={filteredBids.length === 0}
        >
          Export CSV
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search"
              placeholder="Search by payment terms..."
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
                onChange={(e) => setStatusFilter(e.target.value as BidStatus | 'all')}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value={BidStatus.DRAFT}>Draft</MenuItem>
                <MenuItem value={BidStatus.SUBMITTED}>Submitted</MenuItem>
                <MenuItem value={BidStatus.UNDER_REVIEW}>Under Review</MenuItem>
                <MenuItem value={BidStatus.ACCEPTED}>Accepted</MenuItem>
                <MenuItem value={BidStatus.REJECTED}>Rejected</MenuItem>
                <MenuItem value={BidStatus.WITHDRAWN}>Withdrawn</MenuItem>
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

      {/* Bids List */}
      {filteredBids.length === 0 && !isLoading ? (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <GavelIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {debouncedSearch || statusFilter !== 'all' || categoryFilter
              ? 'No bids found'
              : isBuyer
              ? 'No bids received yet'
              : 'You haven\'t submitted any bids'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
            {debouncedSearch || statusFilter !== 'all' || categoryFilter
              ? 'Try adjusting your search or filters to find what you\'re looking for.'
              : isBuyer
              ? 'Bids from suppliers will appear here once they submit responses to your RFQs.'
              : 'Start by finding RFQs that match your capabilities and submit your bids.'}
          </Typography>
        </Paper>
      ) : (
        <>
          <ResponsiveTable
            columns={[
            {
              id: 'id',
              label: 'Bid ID',
              priority: 'high',
              render: (bid) => (
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  #{typeof (bid._id || bid.id) === 'string' ? (bid._id || bid.id)?.slice(-6) : 'N/A'}
                </Typography>
              ),
              mobileLabel: 'Bid',
            },
            {
              id: 'status',
              label: 'Status',
              priority: 'high',
              render: (bid) => <BidStatusBadge status={bid.status} />,
            },
            {
              id: 'price',
              label: 'Price',
              priority: 'high',
              render: (bid) => (
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {formatCurrency(bid.price, bid.currency)}
                </Typography>
              ),
              align: 'right',
              width: 120,
            },
            {
              id: 'aiScore',
              label: 'AI Score',
              priority: 'medium',
              render: (bid) =>
                bid.aiScore !== undefined || bid.aiScoreMetadata ? (
                  <AIScoreIndicator
                    score={bid.aiScore}
                    showLabel={false}
                    size="small"
                    aiMetadata={bid.aiScoreMetadata
                      ? {
                          totalScore: bid.aiScoreMetadata.totalScore,
                          breakdown: bid.aiScoreMetadata.breakdown,
                          overallConfidence: bid.aiScoreMetadata.overallConfidence as 'high' | 'medium' | 'low',
                          overallRisk: bid.aiScoreMetadata.overallRisk as 'low' | 'medium' | 'high',
                          recommendation: bid.aiScoreMetadata.recommendation,
                          timestamp: bid.aiScoreMetadata.timestamp
                            ? new Date(bid.aiScoreMetadata.timestamp)
                            : undefined,
                          modelVersion: bid.aiScoreMetadata.modelVersion,
                        }
                      : undefined}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    N/A
                  </Typography>
                ),
              align: 'center',
              width: 120,
            },
            {
              id: 'paymentTerms',
              label: 'Payment Terms',
              priority: 'medium',
              render: (bid) => (
                <Typography
                  variant="body2"
                  sx={{
                    maxWidth: { xs: '100%', md: 200 },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {bid.paymentTerms}
                </Typography>
              ),
              mobileLabel: 'Payment Terms',
            },
            {
              id: 'deliveryDate',
              label: 'Delivery Date',
              priority: 'medium',
              render: (bid) => <Typography variant="body2">{formatDate(bid.deliveryDate)}</Typography>,
              mobileLabel: 'Delivery Date',
            },
            {
              id: 'deliveryTime',
              label: 'Delivery Time',
              priority: 'low',
              render: (bid) => <Typography variant="body2">{bid.deliveryTime} days</Typography>,
              mobileLabel: 'Delivery Time',
            },
            {
              id: 'validity',
              label: 'Valid Until',
              priority: 'low',
              render: (bid) => <Typography variant="body2">{formatDate(bid.validity)}</Typography>,
              mobileLabel: 'Valid Until',
            },
            ]}
            data={paginatedBids}
            keyExtractor={(bid) => bid._id || bid.id || ''}
            emptyMessage={
              debouncedSearch || statusFilter !== 'all' || categoryFilter
                ? 'Try adjusting your filters'
                : isBuyer
                ? 'No bids received yet'
                : 'You haven\'t submitted any bids'
            }
            onRowClick={(bid) => navigate(`/bids/${bid._id || bid.id}`)}
            mobileCardRenderer={(bid) => <BidListItem bid={bid} />}
            tableProps={{ stickyHeader: true }}
          />
          {filteredBids.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Pagination
                page={page}
                limit={rowsPerPage}
                total={filteredBids.length}
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
