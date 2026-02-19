import { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
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
} from '@mui/material';
import {
    History,
    Download,
    FilterList,
    Close,
    Visibility,
    CheckCircle,
    Cancel,
    PictureAsPdf,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { auditService, AuditLog, AuditLogFilters } from '@/services/audit.service';
import { formatDateTime } from '@/utils';
import { ResponsiveTable } from '@/components/common';
import { Menu, ListItemIcon, ListItemText } from '@mui/material';

interface ActivityHistoryProps {
    resource: string;
    resourceId: string;
    title?: string;
    showExport?: boolean;
}

export const ActivityHistory = ({
    resource,
    resourceId,
    title = 'Activity History',
    showExport = true,
}: ActivityHistoryProps) => {
    const [filterDialogOpen, setFilterDialogOpen] = useState(false);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
    const [filters, setFilters] = useState<AuditLogFilters>({
        resource,
        resourceId,
    });
    const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
        start: null,
        end: null,
    });

    const { data, isLoading, error } = useQuery({
        queryKey: ['audit-logs', resource, resourceId, filters],
        queryFn: () => auditService.getAuditLogsByResource(resource, resourceId, filters),
        enabled: !!resourceId,
    });

    // Backend returns data with logs array
    const logs = data?.data?.logs || [];

    const handleFilter = () => {
        const newFilters: AuditLogFilters = {
            resource,
            resourceId,
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
        setFilters({ resource, resourceId });
        setDateRange({ start: null, end: null });
    };

    const handleExport = async (format: 'pdf' | 'csv' | 'xlsx') => {
        try {
            const blob = await auditService.exportAuditLogs(filters, format);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const extension = format === 'xlsx' ? 'xlsx' : format;
            a.download = `audit-trail-${resource}-${resourceId}-${new Date().toISOString()}.${extension}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            setExportMenuAnchor(null);
        } catch (error) {
            console.error('Export failed:', error);
            setExportMenuAnchor(null);
        }
    };

    const handleExportMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setExportMenuAnchor(event.currentTarget);
    };

    const handleExportMenuClose = () => {
        setExportMenuAnchor(null);
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
            case 'VIEW':
                return 'default';
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

    const formatDateTimeWithTimezone = (date: string | Date): string => {
        try {
            const d = new Date(date);
            const localTime = d.toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZoneName: 'short',
            });
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            return `${localTime} (${timezone})`;
        } catch {
            return String(date);
        }
    };

    if (error) {
        return (
            <Alert severity="error" sx={{ mt: 2 }}>
                Failed to load activity history. Please try again.
            </Alert>
        );
    }

    return (
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <History />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {title}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Filter">
                            <IconButton size="small" onClick={() => setFilterDialogOpen(true)}>
                                <FilterList />
                            </IconButton>
                        </Tooltip>
                        {showExport && (
                            <>
                                <Tooltip title="Export Audit Trail">
                                    <IconButton size="small" onClick={handleExportMenuOpen}>
                                        <Download />
                                    </IconButton>
                                </Tooltip>
                                <Menu
                                    anchorEl={exportMenuAnchor}
                                    open={Boolean(exportMenuAnchor)}
                                    onClose={handleExportMenuClose}
                                >
                                    <MenuItem onClick={() => handleExport('csv')}>
                                        <ListItemIcon>
                                            <Download fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText>Export as CSV</ListItemText>
                                    </MenuItem>
                                    <MenuItem onClick={() => handleExport('pdf')}>
                                        <ListItemIcon>
                                            <PictureAsPdf fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText>Export as PDF</ListItemText>
                                    </MenuItem>
                                    <MenuItem onClick={() => handleExport('xlsx')}>
                                        <ListItemIcon>
                                            <Download fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText>Export as Excel</ListItemText>
                                    </MenuItem>
                                </Menu>
                            </>
                        )}
                    </Box>
                </Box>

                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : logs.length === 0 ? (
                    <Alert severity="info">No activity history found for this resource.</Alert>
                ) : (
                    <ResponsiveTable
                        columns={[
                            {
                                id: 'timestamp',
                                label: 'Timestamp (Local Timezone)',
                                priority: 'high',
                                render: (log) => (
                                    <Box>
                                        <Typography variant="body2">{formatDateTime(log.timestamp)}</Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                            {formatDateTimeWithTimezone(log.timestamp)}
                                        </Typography>
                                    </Box>
                                ),
                                mobileLabel: 'Timestamp',
                            },
                            {
                                id: 'user',
                                label: 'User',
                                priority: 'high',
                                render: (log) => (
                                    <Box>
                                        <Typography variant="body2">{log.userId?.email || 'Unknown'}</Typography>
                                        {log.companyId && (
                                            <Typography variant="caption" color="text.secondary">
                                                {log.companyId.name}
                                            </Typography>
                                        )}
                                    </Box>
                                ),
                                mobileLabel: 'User',
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
                                        variant="outlined"
                                    />
                                ),
                            },
                            {
                                id: 'status',
                                label: 'Status',
                                priority: 'medium',
                                render: (log) => (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        {getStatusIcon(log.status)}
                                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                            {log.status}
                                        </Typography>
                                    </Box>
                                ),
                            },
                            {
                                id: 'ipAddress',
                                label: 'IP Address',
                                priority: 'low',
                                render: (log) => (
                                    <Typography variant="body2" color="text.secondary">
                                        {log.ipAddress || 'N/A'}
                                    </Typography>
                                ),
                                mobileLabel: 'IP Address',
                            },
                            {
                                id: 'details',
                                label: 'Details',
                                priority: 'high',
                                render: (log) => (
                                    <Tooltip title="View Details">
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewDetails(log);
                                            }}
                                        >
                                            <Visibility fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                ),
                                align: 'center',
                                width: 80,
                            },
                        ]}
                        data={logs}
                        keyExtractor={(log) => log._id || log.id || ''}
                        emptyMessage="No activity history found for this resource."
                        onRowClick={(log) => handleViewDetails(log)}
                        tableProps={{ size: 'small', stickyHeader: true }}
                    />
                )}

                {/* Filter Dialog */}
                <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Filter Activity History</DialogTitle>
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
                                        <MenuItem value="VIEW">View</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        value={filters.status || ''}
                                        label="Status"
                                        onChange={(e) => setFilters({ ...filters, status: (e.target.value as any) || undefined })}
                                    >
                                        <MenuItem value="">All Statuses</MenuItem>
                                        <MenuItem value="success">Success</MenuItem>
                                        <MenuItem value="failure">Failure</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Start Date"
                                    type="date"
                                    fullWidth
                                    value={dateRange.start ? dateRange.start.toISOString().split('T')[0] : ''}
                                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value ? new Date(e.target.value) : null })}
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
                                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value ? new Date(e.target.value) : null })}
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
                                    <Typography variant="body1" sx={{ mb: 0.5 }}>
                                        {formatDateTime(selectedLog.timestamp)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                        {formatDateTimeWithTimezone(selectedLog.timestamp)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                                        ISO 8601: {new Date(selectedLog.timestamp).toISOString()}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        User
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
            </CardContent>
        </Card>
    );
};
