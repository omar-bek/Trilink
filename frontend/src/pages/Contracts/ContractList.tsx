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
  Chip,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon, Download as DownloadIcon, Description as DescriptionIcon } from '@mui/icons-material';
import { useContracts } from '@/hooks/useContracts';
import { ContractStatus, ContractFilters, Contract } from '@/types/contract';
import { ContractListItem } from '@/components/Contract/ContractListItem';
import { PageSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';
import { ResponsiveTable } from '@/components/common';
import { ContractStatusBadge } from '@/components/Contract/ContractStatusBadge';
import { formatCurrency, formatDate } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { CategoryFilter } from '@/components/Category/CategoryFilter';
import { useDebounce } from '@/hooks/useDebounce';
import { Pagination } from '@/components/common/Pagination';
import { exportToCSV } from '@/utils/export';

export const ContractList = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [subCategoryFilter, setSubCategoryFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 300);

  const filters: ContractFilters = {};
  if (statusFilter !== 'all') filters.status = statusFilter;
  if (categoryFilter) filters.categoryId = categoryFilter;
  if (subCategoryFilter) filters.subCategoryId = subCategoryFilter;
  const { data, isLoading, error } = useContracts(filters);
  
  // Handle both array and paginated response
  const contracts = useMemo(() => {
    if (!data?.data) return [];
    if ('data' in data.data && Array.isArray(data.data.data)) {
      return data.data.data;
    }
    return Array.isArray(data.data) ? data.data : [];
  }, [data]);

  // Filter by search query
  const filteredContracts = useMemo(() => {
    if (!debouncedSearch.trim()) return contracts;
    const query = debouncedSearch.toLowerCase();
    return contracts.filter((contract: any) =>
      contract.terms?.toLowerCase().includes(query)
    );
  }, [contracts, debouncedSearch]);

  // Pagination
  const paginatedContracts = useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredContracts.slice(startIndex, endIndex);
  }, [filteredContracts, page, rowsPerPage]);

  const totalPages = Math.ceil(filteredContracts.length / rowsPerPage);

  // Reset to first page when filters or search change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, categoryFilter, subCategoryFilter, debouncedSearch]);

  // Export to CSV
  const handleExport = () => {
    const exportData = filteredContracts.map((contract: any) => ({
      'Contract ID': typeof (contract._id || contract.id) === 'string' ? (contract._id || contract.id)?.slice(-6) : 'N/A',
      Status: contract.status || 'N/A',
      Amount: contract.amounts ? formatCurrency(contract.amounts.total, contract.amounts.currency) : 'N/A',
      Parties: contract.parties?.length || 0,
      Signatures: `${contract.signatures?.length || 0}/${contract.parties?.length || 0}`,
      'Start Date': contract.startDate ? formatDate(contract.startDate) : 'N/A',
      'End Date': contract.endDate ? formatDate(contract.endDate) : 'N/A',
    }));

    exportToCSV(exportData, 'contracts');
  };

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error) {
    const errorMessage = (error as any)?.response?.data?.message || 
                         (error as any)?.message || 
                         'Failed to load contracts. Please try again.';
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
            Contracts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your contracts and track signatures
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          disabled={filteredContracts.length === 0}
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
              placeholder="Search by contract terms..."
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
                onChange={(e) => setStatusFilter(e.target.value as ContractStatus | 'all')}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value={ContractStatus.DRAFT}>Draft</MenuItem>
                <MenuItem value={ContractStatus.PENDING_SIGNATURES}>Pending Signatures</MenuItem>
                <MenuItem value={ContractStatus.SIGNED}>Signed</MenuItem>
                <MenuItem value={ContractStatus.ACTIVE}>Active</MenuItem>
                <MenuItem value={ContractStatus.COMPLETED}>Completed</MenuItem>
                <MenuItem value={ContractStatus.TERMINATED}>Terminated</MenuItem>
                <MenuItem value={ContractStatus.CANCELLED}>Cancelled</MenuItem>
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

      {/* Contracts List */}
      {filteredContracts.length === 0 && !isLoading ? (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <DescriptionIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {debouncedSearch || statusFilter !== 'all' || categoryFilter
              ? 'No contracts found'
              : 'No contracts yet'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
            {debouncedSearch || statusFilter !== 'all' || categoryFilter
              ? 'Try adjusting your search or filters to find what you\'re looking for.'
              : 'Contracts will appear here once they are created from accepted bids.'}
          </Typography>
        </Paper>
      ) : (
        <>
          <ResponsiveTable
            columns={[
            {
              id: 'id',
              label: 'Contract ID',
              priority: 'high',
              render: (contract) => (
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  #{typeof (contract._id || contract.id) === 'string'
                    ? (contract._id || contract.id)?.slice(-6)
                    : 'N/A'}
                </Typography>
              ),
              mobileLabel: 'Contract',
            },
            {
              id: 'status',
              label: 'Status',
              priority: 'high',
              render: (contract) => <ContractStatusBadge status={contract.status} />,
            },
            {
              id: 'amount',
              label: 'Amount',
              priority: 'high',
              render: (contract) =>
                contract.amounts ? (
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatCurrency(contract.amounts.total, contract.amounts.currency)}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    N/A
                  </Typography>
                ),
              align: 'right',
              width: 120,
            },
            {
              id: 'parties',
              label: 'Parties',
              priority: 'medium',
              render: (contract) => (
                <Typography variant="body2">
                  {contract.parties?.length || 0} partie{(contract.parties?.length || 0) !== 1 ? 's' : ''}
                </Typography>
              ),
              align: 'center',
              width: 80,
            },
            {
              id: 'signatures',
              label: 'Signatures',
              priority: 'medium',
              render: (contract) => {
                const signatures = contract.signatures || [];
                const parties = contract.parties || [];
                const allSigned = signatures.length === parties.length && parties.length > 0;
                return (
                  <Chip
                    label={`${signatures.length}/${parties.length}`}
                    size="small"
                    color={allSigned ? 'success' : 'warning'}
                    variant={allSigned ? 'filled' : 'outlined'}
                  />
                );
              },
              align: 'center',
              width: 100,
            },
            {
              id: 'terms',
              label: 'Terms',
              priority: 'low',
              render: (contract) => (
                <Typography
                  variant="body2"
                  sx={{
                    maxWidth: { xs: '100%', md: 200 },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {contract.terms?.substring(0, 50)}...
                </Typography>
              ),
              mobileLabel: 'Terms',
            },
            {
              id: 'startDate',
              label: 'Start Date',
              priority: 'low',
              render: (contract) =>
                contract.startDate ? (
                  <Typography variant="body2">{formatDate(contract.startDate)}</Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    N/A
                  </Typography>
                ),
              mobileLabel: 'Start Date',
            },
            {
              id: 'endDate',
              label: 'End Date',
              priority: 'low',
              render: (contract) =>
                contract.endDate ? (
                  <Typography variant="body2">{formatDate(contract.endDate)}</Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    N/A
                  </Typography>
                ),
              mobileLabel: 'End Date',
            },
            ]}
            data={paginatedContracts}
            keyExtractor={(contract) => contract._id || contract.id || ''}
            emptyMessage={
              debouncedSearch || statusFilter !== 'all' || categoryFilter
                ? 'Try adjusting your filters'
                : 'No contracts available'
            }
            onRowClick={(contract) => navigate(`/contracts/${contract._id || contract.id}`)}
            mobileCardRenderer={(contract) => <ContractListItem contract={contract} />}
            tableProps={{ stickyHeader: true }}
          />
          {filteredContracts.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Pagination
                page={page}
                limit={rowsPerPage}
                total={filteredContracts.length}
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
