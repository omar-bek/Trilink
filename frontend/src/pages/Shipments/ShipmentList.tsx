import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Add as AddIcon, Search as SearchIcon, Clear as ClearIcon, Download as DownloadIcon, LocalShipping as LocalShippingIcon } from '@mui/icons-material';
import { useShipments } from '@/hooks/useShipments';
import { ShipmentStatus, ShipmentFilters, Shipment } from '@/types/shipment';
import { ShipmentListItem } from '@/components/Shipment/ShipmentListItem';
import { ShipmentStatusBadge } from '@/components/Shipment/ShipmentStatusBadge';
import { PageSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';
import { ResponsiveTable, ResponsiveTableColumn } from '@/components/common';
import { formatDate } from '@/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { Pagination } from '@/components/common/Pagination';
import { exportToCSV } from '@/utils/export';

export const ShipmentList = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 300);

  const filters: ShipmentFilters = statusFilter !== 'all' ? { status: statusFilter } : {};
  const { data, isLoading, error } = useShipments(filters);
  
  // Handle both array and paginated response
  const shipments = useMemo(() => {
    if (!data?.data) return [];
    if ('data' in data.data && Array.isArray(data.data.data)) {
      return data.data.data;
    }
    return Array.isArray(data.data) ? data.data : [];
  }, [data]);

  // Filter by search query
  const filteredShipments = useMemo(() => {
    if (!debouncedSearch.trim()) return shipments;
    const query = debouncedSearch.toLowerCase();
    return shipments.filter((shipment: any) =>
      shipment.origin?.city?.toLowerCase().includes(query) ||
      shipment.destination?.city?.toLowerCase().includes(query) ||
      shipment.origin?.address?.toLowerCase().includes(query) ||
      shipment.destination?.address?.toLowerCase().includes(query)
    );
  }, [shipments, debouncedSearch]);

  // Pagination
  const paginatedShipments = useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredShipments.slice(startIndex, endIndex);
  }, [filteredShipments, page, rowsPerPage]);

  const totalPages = Math.ceil(filteredShipments.length / rowsPerPage);

  // Reset to first page when filters or search change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, debouncedSearch]);

  // Export to CSV
  const handleExport = () => {
    const exportData = filteredShipments.map((shipment: any) => ({
      'Shipment ID': typeof (shipment._id || shipment.id) === 'string' ? (shipment._id || shipment.id)?.slice(-6) : 'N/A',
      Status: shipment.status || 'N/A',
      Origin: shipment.origin?.city || 'N/A',
      Destination: shipment.destination?.city || 'N/A',
      'Est. Delivery': shipment.estimatedDeliveryDate ? formatDate(shipment.estimatedDeliveryDate) : 'N/A',
      'Actual Delivery': shipment.actualDeliveryDate ? formatDate(shipment.actualDeliveryDate) : 'N/A',
      'Customs Status': shipment.customsClearanceStatus || 'N/A',
      'Tracking Events': shipment.trackingEvents?.length || 0,
    }));

    exportToCSV(exportData, 'shipments');
  };

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error) {
    const errorMessage = (error as any)?.response?.data?.message || 
                         (error as any)?.message || 
                         'Failed to load shipments. Please try again.';
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
  const columns: ResponsiveTableColumn<Shipment>[] = [
    {
      id: 'id',
      label: 'Shipment ID',
      priority: 'high',
      render: (shipment) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          #{typeof (shipment._id || shipment.id) === 'string' 
            ? (shipment._id || shipment.id)?.slice(-6) 
            : 'N/A'}
        </Typography>
      ),
      mobileLabel: 'Shipment',
    },
    {
      id: 'status',
      label: 'Status',
      priority: 'high',
      render: (shipment) => <ShipmentStatusBadge status={shipment.status} />,
    },
    {
      id: 'route',
      label: 'Route',
      priority: 'high',
      render: (shipment) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {shipment.origin?.city || 'N/A'} → {shipment.destination?.city || 'N/A'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {shipment.origin?.country} → {shipment.destination?.country}
          </Typography>
        </Box>
      ),
      mobileLabel: 'Route',
    },
    {
      id: 'estimatedDelivery',
      label: 'Est. Delivery',
      priority: 'medium',
      render: (shipment) => (
        <Typography variant="body2">
          {formatDate(shipment.estimatedDeliveryDate)}
        </Typography>
      ),
      mobileLabel: 'Est. Delivery',
    },
    {
      id: 'actualDelivery',
      label: 'Actual Delivery',
      priority: 'medium',
      render: (shipment) =>
        shipment.actualDeliveryDate ? (
          <Typography variant="body2" color="success.main">
            {formatDate(shipment.actualDeliveryDate)}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Pending
          </Typography>
        ),
      mobileLabel: 'Actual Delivery',
    },
    {
      id: 'customsStatus',
      label: 'Customs',
      priority: 'low',
      render: (shipment) =>
        shipment.customsClearanceStatus ? (
          <Chip
            label={shipment.customsClearanceStatus.replace('_', ' ')}
            size="small"
            variant="outlined"
            color={
              shipment.customsClearanceStatus === 'approved'
                ? 'success'
                : shipment.customsClearanceStatus === 'rejected'
                ? 'error'
                : 'default'
            }
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
      id: 'trackingEvents',
      label: 'Events',
      priority: 'low',
      render: (shipment) => (
        <Typography variant="body2">
          {shipment.trackingEvents?.length || 0} event{(shipment.trackingEvents?.length || 0) !== 1 ? 's' : ''}
        </Typography>
      ),
      align: 'center',
      width: 80,
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Shipments
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track your shipments in real-time
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          disabled={filteredShipments.length === 0}
        >
          Export CSV
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search"
              placeholder="Search by origin, destination..."
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
                onChange={(e) => setStatusFilter(e.target.value as ShipmentStatus | 'all')}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value={ShipmentStatus.IN_PRODUCTION}>In Production</MenuItem>
                <MenuItem value={ShipmentStatus.READY_FOR_PICKUP}>Ready for Pickup</MenuItem>
                <MenuItem value={ShipmentStatus.IN_TRANSIT}>In Transit</MenuItem>
                <MenuItem value={ShipmentStatus.IN_CLEARANCE}>In Clearance</MenuItem>
                <MenuItem value={ShipmentStatus.DELIVERED}>Delivered</MenuItem>
                <MenuItem value={ShipmentStatus.CANCELLED}>Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Active Filters Chips */}
        {(debouncedSearch || statusFilter !== 'all') && (
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
          </Box>
        )}
      </Paper>

      {/* Shipments List */}
      {filteredShipments.length === 0 && !isLoading ? (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <LocalShippingIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {debouncedSearch || statusFilter !== 'all'
              ? 'No shipments found'
              : 'No shipments yet'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
            {debouncedSearch || statusFilter !== 'all'
              ? 'Try adjusting your search or filters to find what you\'re looking for.'
              : 'Shipments will appear here once they are created from contracts.'}
          </Typography>
        </Paper>
      ) : (
        <>
          <ResponsiveTable
            columns={columns}
            data={paginatedShipments}
            keyExtractor={(shipment) => shipment._id || shipment.id || ''}
            emptyMessage={
              debouncedSearch || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No shipments available'
            }
            onRowClick={(shipment) => navigate(`/shipments/${shipment._id || shipment.id}`)}
            mobileCardRenderer={(shipment) => <ShipmentListItem shipment={shipment} />}
            tableProps={{ stickyHeader: true }}
          />
          {filteredShipments.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Pagination
                page={page}
                limit={rowsPerPage}
                total={filteredShipments.length}
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
