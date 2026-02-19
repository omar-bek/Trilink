import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Grid,
  Card,
  CardContent,
  Stack,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { auditService, AuditLog, AuditLogFilters } from '@/services/audit.service';
import { formatDate } from '@/utils';
import { ResponsiveTable, ResponsiveTableColumn } from '@/components/common/ResponsiveTable';
import { PageSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';

const getActionColor = (action: string) => {
  switch (action?.toUpperCase()) {
    case 'CREATE':
      return 'success';
    case 'UPDATE':
      return 'info';
    case 'DELETE':
      return 'error';
    case 'VIEW':
      return 'default';
    default:
      return 'default';
  }
};

const getResourceColor = (resource: string) => {
  const colors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
    user: 'primary',
    company: 'info',
    purchase_request: 'success',
    rfq: 'warning',
    bid: 'secondary',
    contract: 'error',
    shipment: 'info',
    payment: 'success',
    dispute: 'error',
  };
  return colors[resource?.toLowerCase()] || 'default';
};

export const AuditLogs = () => {
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['auditLogs', filters, page, limit],
    queryFn: () => auditService.getAuditLogs(filters, { page, limit, sortBy: 'timestamp', sortOrder: 'desc' }),
  });

  const logs = data?.data?.logs || [];
  const pagination = data?.data?.pagination || { total: 0, page: 1, limit: 50, totalPages: 1 };

  // Filter logs by search query (client-side)
  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs;

    const query = searchQuery.toLowerCase();
    return logs.filter((log) => {
      const userEmail = log.userId?.email?.toLowerCase() || '';
      const companyName = log.companyId?.name?.toLowerCase() || '';
      const action = log.action?.toLowerCase() || '';
      const resource = log.resource?.toLowerCase() || '';
      const path = log.details?.path?.toLowerCase() || '';

      return (
        userEmail.includes(query) ||
        companyName.includes(query) ||
        action.includes(query) ||
        resource.includes(query) ||
        path.includes(query)
      );
    });
  }, [logs, searchQuery]);

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailsDialogOpen(true);
  };

  const handleExport = async (format: 'csv' | 'pdf' | 'xlsx') => {
    try {
      const blob = await auditService.exportAuditLogs(filters, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString()}.${format === 'xlsx' ? 'xlsx' : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setPage(1);
  };

  const columns: ResponsiveTableColumn<AuditLog>[] = [
    {
      id: 'timestamp',
      label: 'Timestamp',
      priority: 'high',
      render: (log) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
          {formatDate(log.timestamp)}
        </Typography>
      ),
    },
    {
      id: 'user',
      label: 'User',
      priority: 'high',
      render: (log) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {log.userId?.email || 'N/A'}
          </Typography>
          {log.userId?.role && (
            <Chip label={log.userId.role} size="small" sx={{ mt: 0.5, height: 20, fontSize: '0.65rem' }} />
          )}
        </Box>
      ),
    },
    {
      id: 'company',
      label: 'Company',
      priority: 'medium',
      render: (log) => (
        <Typography variant="body2">
          {log.companyId?.name || 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'action',
      label: 'Action',
      priority: 'high',
      render: (log) => (
        <Chip
          label={log.action}
          size="small"
          color={getActionColor(log.action) as any}
          sx={{ fontWeight: 500 }}
        />
      ),
    },
    {
      id: 'resource',
      label: 'Resource',
      priority: 'high',
      render: (log) => (
        <Chip
          label={log.resource?.replace(/_/g, ' ')}
          size="small"
          color={getResourceColor(log.resource) as any}
          variant="outlined"
        />
      ),
    },
    {
      id: 'status',
      label: 'Status',
      priority: 'high',
      render: (log) => (
        <Chip
          label={log.status}
          size="small"
          color={log.status === 'success' ? 'success' : 'error'}
        />
      ),
    },
    {
      id: 'path',
      label: 'Path',
      priority: 'low',
      render: (log) => (
        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
          {log.details?.path || 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      priority: 'low',
      align: 'right',
      render: (log) => (
        <Tooltip title="View Details">
          <IconButton
            size="small"
            onClick={() => handleViewDetails(log)}
            color="primary"
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error">Failed to load audit logs. Please try again.</Alert>
        <Button startIcon={<RefreshIcon />} onClick={() => refetch()} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            Audit Logs
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor and track all system activities
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => handleExport('csv')}
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => handleExport('xlsx')}
          >
            Export Excel
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Total Logs
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {pagination.total || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Success
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                {logs.filter((l) => l.status === 'success').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Failures
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
                {logs.filter((l) => l.status === 'failure').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Current Page
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {pagination.page || 1} / {pagination.totalPages || 1}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search by user, company, action, resource..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              size="medium"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="medium">
              <InputLabel>Action</InputLabel>
              <Select
                value={filters.action || ''}
                label="Action"
                onChange={(e) => setFilters({ ...filters, action: e.target.value || undefined })}
              >
                <MenuItem value="">All Actions</MenuItem>
                <MenuItem value="CREATE">Create</MenuItem>
                <MenuItem value="UPDATE">Update</MenuItem>
                <MenuItem value="DELETE">Delete</MenuItem>
                <MenuItem value="VIEW">View</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="medium">
              <InputLabel>Resource</InputLabel>
              <Select
                value={filters.resource || ''}
                label="Resource"
                onChange={(e) => setFilters({ ...filters, resource: e.target.value || undefined })}
              >
                <MenuItem value="">All Resources</MenuItem>
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="company">Company</MenuItem>
                <MenuItem value="purchase_request">Purchase Request</MenuItem>
                <MenuItem value="rfq">RFQ</MenuItem>
                <MenuItem value="bid">Bid</MenuItem>
                <MenuItem value="contract">Contract</MenuItem>
                <MenuItem value="shipment">Shipment</MenuItem>
                <MenuItem value="payment">Payment</MenuItem>
                <MenuItem value="dispute">Dispute</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="medium">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status || ''}
                label="Status"
                onChange={(e) => setFilters({ ...filters, status: e.target.value as 'success' | 'failure' || undefined })}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="success">Success</MenuItem>
                <MenuItem value="failure">Failure</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleClearFilters}
              size="medium"
              startIcon={<FilterListIcon />}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Audit Logs Table */}
      <ResponsiveTable
        columns={columns}
        data={filteredLogs}
        keyExtractor={(log) => log._id || log.id || Math.random().toString()}
        emptyMessage={
          searchQuery || Object.keys(filters).length > 0
            ? 'No audit logs match the selected filters'
            : 'No audit logs found'
        }
        tableProps={{
          stickyHeader: true,
          size: 'medium',
        }}
      />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 3 }}>
          <Button
            variant="outlined"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Typography variant="body2">
            Page {page} of {pagination.totalPages}
          </Typography>
          <Button
            variant="outlined"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
          >
            Next
          </Button>
        </Box>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Audit Log Details</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Timestamp</Typography>
                  <Typography variant="body1">{formatDate(selectedLog.timestamp)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Chip
                    label={selectedLog.status}
                    color={selectedLog.status === 'success' ? 'success' : 'error'}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">User</Typography>
                  <Typography variant="body1">{selectedLog.userId?.email || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Company</Typography>
                  <Typography variant="body1">{selectedLog.companyId?.name || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Action</Typography>
                  <Chip label={selectedLog.action} size="small" color={getActionColor(selectedLog.action) as any} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Resource</Typography>
                  <Chip
                    label={selectedLog.resource?.replace(/_/g, ' ')}
                    size="small"
                    color={getResourceColor(selectedLog.resource) as any}
                  />
                </Grid>
                {selectedLog.resourceId && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Resource ID</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {selectedLog.resourceId}
                    </Typography>
                  </Grid>
                )}
                {selectedLog.details?.path && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Path</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {selectedLog.details.path}
                    </Typography>
                  </Grid>
                )}
                {selectedLog.details?.method && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Method</Typography>
                    <Typography variant="body1">{selectedLog.details.method}</Typography>
                  </Grid>
                )}
                {selectedLog.details?.statusCode && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Status Code</Typography>
                    <Typography variant="body1">{selectedLog.details.statusCode}</Typography>
                  </Grid>
                )}
                {selectedLog.details?.duration && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Duration</Typography>
                    <Typography variant="body1">{selectedLog.details.duration}ms</Typography>
                  </Grid>
                )}
                {selectedLog.ipAddress && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">IP Address</Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                      {selectedLog.ipAddress}
                    </Typography>
                  </Grid>
                )}
                {selectedLog.userAgent && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">User Agent</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {selectedLog.userAgent}
                    </Typography>
                  </Grid>
                )}
                {selectedLog.errorMessage && (
                  <Grid item xs={12}>
                    <Alert severity="error">
                      <Typography variant="caption" color="text.secondary">Error Message</Typography>
                      <Typography variant="body2">{selectedLog.errorMessage}</Typography>
                    </Alert>
                  </Grid>
                )}
                {(selectedLog.details?.before || selectedLog.details?.after) && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Changes
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      {selectedLog.details.before && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="text.secondary">Before</Typography>
                          <pre style={{ fontSize: '0.75rem', margin: 0, overflow: 'auto' }}>
                            {JSON.stringify(selectedLog.details.before, null, 2)}
                          </pre>
                        </Box>
                      )}
                      {selectedLog.details.after && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">After</Typography>
                          <pre style={{ fontSize: '0.75rem', margin: 0, overflow: 'auto' }}>
                            {JSON.stringify(selectedLog.details.after, null, 2)}
                          </pre>
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
