/**
 * Government Audit Portal
 * Comprehensive audit trail interface for government compliance officers
 * Provides full visibility into all platform activities with export capabilities
 */

import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Stack,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import {
  History,
  Download,
  FilterList,
  Close,
  Visibility,
  CheckCircle,
  Cancel,
  VerifiedUser,
  Security,
  Assessment,
  FileDownload,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { auditService, AuditLog, AuditLogFilters } from '@/services/audit.service';
import { formatDateTime } from '@/utils';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`audit-tabpanel-${index}`}
      aria-labelledby={`audit-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const GovernmentAuditPortal = () => {
  const [tabValue, setTabValue] = useState(0);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['government-audit-logs', filters],
    queryFn: () => auditService.getAuditLogs(filters, { page: 1, limit: 1000 }),
    enabled: true,
  });

  const logs = data?.data?.logs || [];

  const handleFilter = () => {
    const newFilters: AuditLogFilters = {
      ...filters,
    };

    if (dateRange.start) {
      newFilters.startDate = dateRange.start.toISOString();
    }
    if (dateRange.end) {
      newFilters.endDate = dateRange.end.toISOString();
    }

    setFilters(newFilters);
    setFilterDialogOpen(false);
  };

  const handleClearFilters = () => {
    setFilters({});
    setDateRange({ start: null, end: null });
  };

  const handleExport = async (format: 'pdf' | 'csv' | 'excel') => {
    try {
      const exportFormat = format === 'excel' ? 'xlsx' : format;
      const blob = await auditService.exportAuditLogs(filters, exportFormat as 'pdf' | 'csv');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `government-audit-trail-${new Date().toISOString()}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailDialogOpen(true);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'success';
      case 'UPDATE':
        return 'info';
      case 'DELETE':
        return 'error';
      case 'SIGN':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    return status === 'success' ? (
      <CheckCircle fontSize="small" color="success" />
    ) : (
      <Cancel fontSize="small" color="error" />
    );
  };

  // Statistics
  const totalLogs = logs.length;
  const successLogs = logs.filter((log) => log.status === 'success').length;
  const failureLogs = logs.filter((log) => log.status === 'failure').length;
  const uniqueUsers = new Set(logs.map((log) => log.userId?._id)).size;
  const uniqueCompanies = new Set(logs.map((log) => log.companyId?._id).filter(Boolean)).size;

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Failed to load audit trail. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Security fontSize="large" color="primary" />
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Government Audit Portal
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Filter">
                <IconButton size="small" onClick={() => setFilterDialogOpen(true)}>
                  <FilterList />
                </IconButton>
              </Tooltip>
              <Button
                variant="outlined"
                startIcon={<FileDownload />}
                onClick={() => handleExport('pdf')}
                size="small"
              >
                Export PDF
              </Button>
              <Button
                variant="outlined"
                startIcon={<FileDownload />}
                onClick={() => handleExport('excel')}
                size="small"
              >
                Export Excel
              </Button>
            </Box>
          </Box>

          {/* Statistics */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {totalLogs}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Audit Logs
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {successLogs}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Successful Actions
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="error.main">
                  {failureLogs}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Failed Actions
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {uniqueUsers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Unique Users
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="All Activities" icon={<History />} iconPosition="start" />
            <Tab label="Signatures" icon={<VerifiedUser />} iconPosition="start" />
            <Tab label="Compliance" icon={<Assessment />} iconPosition="start" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : logs.length === 0 ? (
            <Alert severity="info">No audit logs found for the selected filters.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Resource</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>IP Address</TableCell>
                    <TableCell>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log._id || log.id} hover>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDateTime(log.timestamp)}
                        </Typography>
                        {log.timestampHash && (
                          <Tooltip title="Cryptographically timestamped">
                            <Chip
                              label="Verified"
                              size="small"
                              color="success"
                              icon={<CheckCircle />}
                              sx={{ mt: 0.5 }}
                            />
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {log.userId?.email || 'Unknown'}
                        </Typography>
                        {log.userId?.role && (
                          <Typography variant="caption" color="text.secondary">
                            {log.userId.role}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {log.companyId?.name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.action}
                          size="small"
                          color={getActionColor(log.action) as any}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{log.resource}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {getStatusIcon(log.status)}
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {log.status}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {log.ipAddress || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => handleViewDetails(log)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Alert severity="info">
            Signature verification view - showing all contract signatures with PKI verification status.
          </Alert>
          {/* TODO: Implement signature-specific view */}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Alert severity="info">
            Compliance dashboard - showing compliance metrics and violations.
          </Alert>
          {/* TODO: Implement compliance metrics view */}
        </TabPanel>
      </Card>

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Filter Audit Trail</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
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
                  <MenuItem value="SIGN">Sign</MenuItem>
                  <MenuItem value="APPROVE">Approve</MenuItem>
                  <MenuItem value="REJECT">Reject</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Resource</InputLabel>
                <Select
                  value={filters.resource || ''}
                  label="Resource"
                  onChange={(e) => setFilters({ ...filters, resource: e.target.value || undefined })}
                >
                  <MenuItem value="">All Resources</MenuItem>
                  <MenuItem value="contract">Contract</MenuItem>
                  <MenuItem value="payment">Payment</MenuItem>
                  <MenuItem value="shipment">Shipment</MenuItem>
                  <MenuItem value="bid">Bid</MenuItem>
                  <MenuItem value="rfq">RFQ</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Start Date"
                type="date"
                fullWidth
                value={dateRange.start ? dateRange.start.toISOString().split('T')[0] : ''}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value ? new Date(e.target.value) : null })
                }
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="End Date"
                type="date"
                fullWidth
                value={dateRange.end ? dateRange.end.toISOString().split('T')[0] : ''}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value ? new Date(e.target.value) : null })
                }
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClearFilters}>Clear Filters</Button>
          <Button onClick={() => setFilterDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleFilter}>
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Audit Log Details</Typography>
            <IconButton size="small" onClick={() => setDetailDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Timestamp
                </Typography>
                <Typography variant="body1">
                  {formatDateTime(selectedLog.timestamp)} (ISO 8601: {new Date(selectedLog.timestamp).toISOString()})
                </Typography>
                {selectedLog.timestampHash && (
                  <Alert severity="success" sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      <strong>Cryptographically Timestamped:</strong> This log entry has been cryptographically
                      timestamped and is immutable. Hash: {selectedLog.timestampHash.substring(0, 32)}...
                    </Typography>
                  </Alert>
                )}
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  User & Company
                </Typography>
                <Typography variant="body1">
                  {selectedLog.userId?.email || 'Unknown'} ({selectedLog.userId?.role || 'Unknown Role'})
                </Typography>
                {selectedLog.companyId && (
                  <Typography variant="body2" color="text.secondary">
                    Company: {selectedLog.companyId.name}
                  </Typography>
                )}
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Action & Resource
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Chip label={selectedLog.action} size="small" color={getActionColor(selectedLog.action) as any} />
                  <Chip label={selectedLog.resource} size="small" variant="outlined" />
                </Box>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  {getStatusIcon(selectedLog.status)}
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {selectedLog.status}
                  </Typography>
                </Box>
                {selectedLog.errorMessage && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {selectedLog.errorMessage}
                  </Alert>
                )}
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  IP Address & User Agent
                </Typography>
                <Typography variant="body2">{selectedLog.ipAddress || 'N/A'}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedLog.userAgent || 'N/A'}
                </Typography>
              </Box>
              {(selectedLog.details?.before || selectedLog.details?.after || selectedLog.details?.changes) && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Changes
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                    <pre style={{ margin: 0, fontSize: '0.875rem', overflow: 'auto' }}>
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </Paper>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
