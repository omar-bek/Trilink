import { useState } from 'react';
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
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  GpsFixed,
  LocationOn,
  AccessTime,
} from '@mui/icons-material';
import { useShipments } from '@/hooks/useShipments';
import { ShipmentStatus, ShipmentFilters } from '@/types/shipment';
import { PageSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';
import { formatDate } from '@/utils';
import { normalizeResponse } from '@/utils/responseHelpers';

export const Tracking = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filters: ShipmentFilters = statusFilter !== 'all' ? { status: statusFilter } : {};
  const { data, isLoading, error } = useShipments(filters);
  const shipments = normalizeResponse(data?.data);

  // Filter shipments that have GPS tracking (currentLocation)
  const trackedShipments = shipments.filter(
    (shipment) =>
      shipment.currentLocation &&
      (shipment.origin?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       shipment.destination?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       shipment.origin?.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       shipment.destination?.address?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error) {
    const errorMessage = (error as any)?.response?.data?.message || 
                         (error as any)?.message || 
                         'Failed to load tracking data. Please try again.';
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          GPS Tracking
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track shipments with real-time GPS location updates
        </Typography>
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
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Tracked Shipments */}
      {trackedShipments.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <GpsFixed sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No tracked shipments found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {shipments.length === 0
              ? 'No shipments available'
              : 'No shipments with GPS tracking enabled'}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
                  {trackedShipments.map((shipment, index) => (
            <Grid item xs={12} md={6} key={shipment._id || `shipment-${index}`}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
                onClick={() => {
                  if (shipment._id) {
                    navigate(`/tracking/enhanced?shipment=${shipment._id}`);
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Shipment #{shipment._id ? shipment._id.slice(-8) : 'N/A'}
                    </Typography>
                    <Chip
                      label={shipment.status}
                      size="small"
                      color={
                        shipment.status === ShipmentStatus.DELIVERED
                          ? 'success'
                          : shipment.status === ShipmentStatus.IN_TRANSIT
                          ? 'primary'
                          : 'default'
                      }
                    />
                  </Box>

                  {shipment.currentLocation && (
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <GpsFixed color="primary" fontSize="small" />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Current Location
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ pl: 4 }}>
                        {shipment.currentLocation.address || 
                         `${shipment.currentLocation.coordinates?.lat}, ${shipment.currentLocation.coordinates?.lng}`}
                      </Typography>
                      {shipment.currentLocation.lastUpdated && (
                        <Typography variant="caption" color="text.secondary" sx={{ pl: 4, display: 'block', mt: 0.5 }}>
                          Updated: {formatDate(shipment.currentLocation.lastUpdated)}
                        </Typography>
                      )}
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn fontSize="small" color="action" />
                      <Typography variant="body2">
                        <strong>From:</strong> {shipment.origin?.city || shipment.origin?.address}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn fontSize="small" color="action" />
                      <Typography variant="body2">
                        <strong>To:</strong> {shipment.destination?.city || shipment.destination?.address}
                      </Typography>
                    </Box>
                    {shipment.estimatedDeliveryDate && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTime fontSize="small" color="action" />
                        <Typography variant="body2">
                          <strong>ETA:</strong> {formatDate(shipment.estimatedDeliveryDate)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};
