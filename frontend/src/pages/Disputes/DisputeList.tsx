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
  FormControlLabel,
  Switch,
  Chip,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Add, Search as SearchIcon, Clear as ClearIcon, Download as DownloadIcon, Gavel as GavelIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDisputes } from '@/hooks/useDisputes';
import { DisputeStatus, DisputeFilters, Dispute } from '@/types/dispute';
import { DisputeListItem } from '@/components/Dispute/DisputeListItem';
import { DisputeStatusBadge } from '@/components/Dispute/DisputeStatusBadge';
import { PageSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';
import { ResponsiveTable, ResponsiveTableColumn } from '@/components/common';
import { formatDate } from '@/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { Pagination } from '@/components/common/Pagination';
import { exportToCSV } from '@/utils/export';

export const DisputeList = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | 'all'>('all');
  const [escalatedFilter, setEscalatedFilter] = useState<boolean | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 300);

  const filters: DisputeFilters = {
    ...(statusFilter !== 'all' && { status: statusFilter }),
    ...(escalatedFilter !== undefined && { escalated: escalatedFilter }),
  };
  const { data, isLoading, error } = useDisputes(filters);
  
  // Handle both array and paginated response
  const disputes = useMemo(() => {
    if (!data?.data) return [];
    if ('data' in data.data && Array.isArray(data.data.data)) {
      return data.data.data;
    }
    return Array.isArray(data.data) ? data.data : [];
  }, [data]);

  // Filter by search query
  const filteredDisputes = useMemo(() => {
    if (!debouncedSearch.trim()) return disputes;
    const query = debouncedSearch.toLowerCase();
    return disputes.filter((dispute: any) =>
      dispute.type?.toLowerCase().includes(query) ||
      dispute.description?.toLowerCase().includes(query)
    );
  }, [disputes, debouncedSearch]);

  // Pagination
  const paginatedDisputes = useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredDisputes.slice(startIndex, endIndex);
  }, [filteredDisputes, page, rowsPerPage]);

  const totalPages = Math.ceil(filteredDisputes.length / rowsPerPage);

  // Reset to first page when filters or search change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, escalatedFilter, debouncedSearch]);

  // Export to CSV
  const handleExport = () => {
    const exportData = filteredDisputes.map((dispute: any) => ({
      'Dispute ID': typeof (dispute._id || dispute.id) === 'string' ? (dispute._id || dispute.id)?.slice(-6) : 'N/A',
      Status: dispute.status || 'N/A',
      Type: dispute.type || 'N/A',
      Escalated: dispute.escalatedToGovernment ? 'Yes' : 'No',
      Description: dispute.description || 'N/A',
      'Created At': dispute.createdAt ? formatDate(dispute.createdAt) : 'N/A',
      'Due Date': dispute.dueDate ? formatDate(dispute.dueDate) : 'N/A',
      Attachments: dispute.attachments?.length || 0,
    }));

    exportToCSV(exportData, 'disputes');
  };

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error) {
    const errorMessage = (error as any)?.response?.data?.message || 
                         (error as any)?.message || 
                         'Failed to load disputes. Please try again.';
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

  // Define columns with priority for mobile responsiveness
  const columns: ResponsiveTableColumn<Dispute>[] = [
    {
      id: 'id',
      label: 'Dispute ID',
      priority: 'high',
      render: (dispute) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          #{typeof (dispute._id || dispute.id) === 'string'
            ? (dispute._id || dispute.id)?.slice(-6)
            : 'N/A'}
        </Typography>
      ),
      mobileLabel: 'Dispute',
    },
    {
      id: 'status',
      label: 'Status',
      priority: 'high',
      render: (dispute) => <DisputeStatusBadge status={dispute.status} />,
    },
    {
      id: 'type',
      label: 'Type',
      priority: 'high',
      render: (dispute) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {dispute.type}
        </Typography>
      ),
    },
    {
      id: 'escalated',
      label: 'Escalated',
      priority: 'medium',
      render: (dispute) => (
        <Chip
          label={dispute.escalatedToGovernment ? 'Yes' : 'No'}
          size="small"
          color={dispute.escalatedToGovernment ? 'error' : 'default'}
          variant={dispute.escalatedToGovernment ? 'filled' : 'outlined'}
        />
      ),
      align: 'center',
      width: 100,
    },
    {
      id: 'description',
      label: 'Description',
      priority: 'medium',
      render: (dispute) => (
        <Typography
          variant="body2"
          sx={{
            maxWidth: { xs: '100%', md: 300 },
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {dispute.description}
        </Typography>
      ),
      mobileLabel: 'Description',
    },
    {
      id: 'createdAt',
      label: 'Created',
      priority: 'low',
      render: (dispute) => (
        <Typography variant="body2">
          {formatDate(dispute.createdAt)}
        </Typography>
      ),
      mobileLabel: 'Created',
    },
    {
      id: 'dueDate',
      label: 'Due Date',
      priority: 'low',
      render: (dispute) =>
        dispute.dueDate ? (
          <Typography
            variant="body2"
            color={new Date(dispute.dueDate) < new Date() ? 'error.main' : 'text.primary'}
          >
            {formatDate(dispute.dueDate)}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            N/A
          </Typography>
        ),
      mobileLabel: 'Due Date',
    },
    {
      id: 'attachments',
      label: 'Attachments',
      priority: 'low',
      render: (dispute) => (
        <Typography variant="body2">
          {dispute.attachments?.length || 0} file{(dispute.attachments?.length || 0) !== 1 ? 's' : ''}
        </Typography>
      ),
      align: 'center',
      width: 100,
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Disputes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and track contract disputes
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={filteredDisputes.length === 0}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/disputes/new')}
          >
            Create Dispute
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
              placeholder="Search by type, description..."
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
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value as DisputeStatus | 'all')}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value={DisputeStatus.OPEN}>Open</MenuItem>
                <MenuItem value={DisputeStatus.UNDER_REVIEW}>Under Review</MenuItem>
                <MenuItem value={DisputeStatus.ESCALATED}>Escalated</MenuItem>
                <MenuItem value={DisputeStatus.RESOLVED}>Resolved</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={escalatedFilter === true}
                  onChange={(e) =>
                    setEscalatedFilter(e.target.checked ? true : undefined)
                  }
                />
              }
              label="Escalated Only"
            />
          </Grid>
        </Grid>

        {/* Active Filters Chips */}
        {(debouncedSearch || statusFilter !== 'all' || escalatedFilter !== undefined) && (
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
            {escalatedFilter !== undefined && (
              <Chip
                label={`Escalated: ${escalatedFilter ? 'Yes' : 'No'}`}
                onDelete={() => setEscalatedFilter(undefined)}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
        )}
      </Paper>

      {/* Disputes List */}
      {filteredDisputes.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <GavelIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {debouncedSearch || statusFilter !== 'all' || escalatedFilter !== undefined
              ? 'No disputes found'
              : 'No disputes yet'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
            {debouncedSearch || statusFilter !== 'all' || escalatedFilter !== undefined
              ? 'Try adjusting your search or filters to find what you\'re looking for.'
              : 'Disputes will appear here once they are created. You can create a dispute if you have issues with a contract.'}
          </Typography>
          {!debouncedSearch && statusFilter === 'all' && escalatedFilter === undefined && (
            <Button variant="outlined" startIcon={<Add />} onClick={() => navigate('/disputes/new')}>
              Create Dispute
            </Button>
          )}
        </Paper>
      ) : (
        <>
          <ResponsiveTable
            columns={columns}
            data={paginatedDisputes}
            keyExtractor={(dispute) => dispute._id || dispute.id || ''}
            emptyMessage={
              debouncedSearch || statusFilter !== 'all' || escalatedFilter !== undefined
                ? 'Try adjusting your filters'
                : 'No disputes available'
            }
            onRowClick={(dispute) => navigate(`/disputes/${dispute._id || dispute.id}`)}
            mobileCardRenderer={(dispute) => <DisputeListItem dispute={dispute} />}
            tableProps={{ stickyHeader: true }}
          />
          {filteredDisputes.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Pagination
                page={page}
                limit={rowsPerPage}
                total={filteredDisputes.length}
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
