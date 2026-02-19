import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Divider,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { isValidId } from '@/utils/routeValidation';
import {
  ArrowBack,
  LocationOn,
  AccessTime,
  Edit,
  Delete,
  CheckCircle,
  GpsFixed,
  Assignment,
  CheckCircleOutline,
  CancelOutlined,
} from '@mui/icons-material';
import {
  useShipment,
  useUpdateShipmentStatus,
  useUpdateGPSLocation,
  useInspectShipment,
  useDeleteShipment,
} from '@/hooks/useShipments';
import { useShipmentSocket } from '@/hooks/useShipmentSocket';
import { ShipmentStatusBadge } from '@/components/Shipment/ShipmentStatusBadge';
import { EnhancedStatusBadge } from '@/components/Workflow/EnhancedStatusBadge';
import { WhatsNext } from '@/components/Workflow/WhatsNext';
import { ShipmentTimeline } from '@/components/Shipment/ShipmentTimeline';
import { GPSMapPlaceholder } from '@/components/Shipment/GPSMapPlaceholder';
import { CustomsClearance } from '@/components/Shipment/CustomsClearance';
import { ActivityHistory } from '@/components/Audit/ActivityHistory';
import { formatDate, formatDateTime } from '@/utils';
import { PageSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';
import { ShipmentStatus, UpdateShipmentStatusDto, UpdateGPSLocationDto, InspectShipmentDto } from '@/types/shipment';
import { Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { Tabs, Tab } from '@mui/material';

export const ShipmentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role = user?.role as Role;
  const [activeTab, setActiveTab] = useState(0);

  // Validate ID - reject invalid values like "create", "new", etc.
  const validId = isValidId(id) ? id : undefined;

  // Redirect if ID is missing or invalid
  useEffect(() => {
    if (!isValidId(id)) {
      navigate('/shipments', { replace: true });
    }
  }, [id, navigate]);

  if (!isValidId(id)) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Invalid shipment ID. Redirecting...
      </Alert>
    );
  }

  const { data, isLoading, error, refetch } = useShipment(validId);
  const shipment = data?.data;
  const updateStatusMutation = useUpdateShipmentStatus();
  const updateLocationMutation = useUpdateGPSLocation();
  const inspectMutation = useInspectShipment();
  const deleteMutation = useDeleteShipment();

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [inspectDialogOpen, setInspectDialogOpen] = useState(false);

  // Subscribe to real-time updates via WebSocket
  useShipmentSocket(validId);

  const { control: statusControl, handleSubmit: handleStatusSubmit, reset: resetStatus } = useForm<UpdateShipmentStatusDto>({
    defaultValues: {
      status: shipment?.status || ShipmentStatus.IN_PRODUCTION,
      description: '',
    },
  });

  const { control: locationControl, handleSubmit: handleLocationSubmit, reset: resetLocation } = useForm<UpdateGPSLocationDto>({
    defaultValues: {
      coordinates: { lat: 0, lng: 0 },
      address: '',
    },
  });

  const { control: inspectControl, handleSubmit: handleInspectSubmit, reset: resetInspect } = useForm<InspectShipmentDto>({
    defaultValues: {
      status: 'pending',
      rejectionReason: '',
    },
  });

  const handleStatusUpdate = (data: UpdateShipmentStatusDto) => {
    if (id) {
      updateStatusMutation.mutate({ id, data }, {
        onSuccess: () => {
          setStatusDialogOpen(false);
          resetStatus();
        },
      });
    }
  };

  const handleLocationUpdate = (data: UpdateGPSLocationDto) => {
    if (id) {
      updateLocationMutation.mutate({ id, data }, {
        onSuccess: () => {
          setLocationDialogOpen(false);
          resetLocation();
        },
      });
    }
  };

  const handleInspect = (data: InspectShipmentDto) => {
    if (id) {
      inspectMutation.mutate({ id, data }, {
        onSuccess: () => {
          setInspectDialogOpen(false);
          resetInspect();
        },
      });
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this shipment? This action cannot be undone.')) {
      if (id) {
        deleteMutation.mutate(id, {
          onSuccess: () => {
            navigate('/shipments');
          },
        });
      }
    }
  };

  const handleWorkflowAction = (action: string) => {
    if (action === 'update_status' && id) {
      setStatusDialogOpen(true);
    } else if (action === 'process_clearance' && id) {
      setInspectDialogOpen(true);
    }
  };

  const isLogistics = role === Role.LOGISTICS;
  const isBuyer = role === Role.BUYER || role === Role.ADMIN || role === Role.GOVERNMENT;

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error || !shipment) {
    return (
      <Alert severity="error">
        Failed to load shipment. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/shipments')}>
          Back
        </Button>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Shipment #{shipment._id ? shipment._id.slice(-6) : shipment.id ? shipment.id.slice(-6) : 'N/A'}
            </Typography>
            <EnhancedStatusBadge entityType="shipment" status={shipment.status} showContext />
            {shipment.currentLocation && (
              <Chip
                label="Live Tracking Active"
                color="success"
                size="small"
                icon={<LocationOn />}
              />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary">
            Created {formatDateTime(shipment.createdAt)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => setStatusDialogOpen(true)}
          >
            Update Status
          </Button>
          {isLogistics && (
            <Button
              variant="outlined"
              startIcon={<GpsFixed />}
              onClick={() => setLocationDialogOpen(true)}
            >
              Update GPS
            </Button>
          )}
          {isBuyer && shipment.status === ShipmentStatus.DELIVERED && (
            <Button
              variant="outlined"
              startIcon={<CheckCircle />}
              onClick={() => setInspectDialogOpen(true)}
            >
              Inspect
            </Button>
          )}
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            Delete
          </Button>
        </Box>
      </Box>

      {/* What's Next Component */}
      <WhatsNext
        entityType="shipment"
        status={shipment.status}
        entityId={validId}
        onAction={handleWorkflowAction}
      />

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* GPS Map */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Shipment Route
              </Typography>
              <GPSMapPlaceholder shipment={shipment} />
            </CardContent>
          </Card>

          {/* Customs Clearance */}
          {(shipment.status === ShipmentStatus.IN_CLEARANCE || 
            shipment.customsClearanceStatus ||
            shipment.trackingEvents?.some((e: any) => e.status === ShipmentStatus.IN_CLEARANCE)) && (
            <Box id="customs-clearance-section">
              <CustomsClearance shipment={shipment} onUpdate={() => refetch()} />
            </Box>
          )}

          {/* Timeline */}
          <Card>
            <CardContent>
              <ShipmentTimeline shipment={shipment} />
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Origin & Destination */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Route Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {shipment.origin && (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <LocationOn color="success" fontSize="small" />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Origin
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {shipment.origin.address || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {shipment.origin.city || ''}, {shipment.origin.country || ''}
                    </Typography>
                  </Box>
                )}
                {shipment.origin && shipment.destination && <Divider />}
                {shipment.destination && (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <LocationOn color="warning" fontSize="small" />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Destination
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {shipment.destination.address || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {shipment.destination.city || ''}, {shipment.destination.country || ''}
                    </Typography>
                  </Box>
                )}
                {shipment.currentLocation && (
                  <>
                    <Divider />
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <LocationOn color="primary" fontSize="small" />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          Current Location
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {shipment.currentLocation.address}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Last updated: {formatDateTime(shipment.currentLocation.lastUpdated)}
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Shipment Details */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Shipment Details
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Status
                  </Typography>
                  <EnhancedStatusBadge entityType="shipment" status={shipment.status} showContext />
                </Box>
                <Divider />
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <AccessTime fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Estimated Delivery
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formatDate(shipment.estimatedDeliveryDate)}
                  </Typography>
                </Box>
                {shipment.actualDeliveryDate && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Actual Delivery
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {formatDate(shipment.actualDeliveryDate)}
                      </Typography>
                    </Box>
                  </>
                )}
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Tracking Events
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {shipment.trackingEvents?.length || 0} event{(shipment.trackingEvents?.length || 0) !== 1 ? 's' : ''}
                  </Typography>
                </Box>
                {shipment.contractId && <Divider />}
                {shipment.contractId && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Contract ID
                    </Typography>
                    <Link
                      to={`/contracts/${shipment.contractId}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          color: 'primary.main',
                          '&:hover': { textDecoration: 'underline' },
                        }}
                      >
                        {shipment.contractId.slice(-8)}
                      </Typography>
                    </Link>
                  </Box>
                )}
                {shipment.status === ShipmentStatus.IN_CLEARANCE && (
                  <>
                    <Divider />
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Assignment fontSize="small" color="warning" />
                        <Typography variant="body2" color="text.secondary">
                          Customs Status
                        </Typography>
                      </Box>
                      <Chip
                        label="In Clearance"
                        size="small"
                        color="warning"
                        icon={<AccessTime />}
                      />
                    </Box>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleStatusSubmit(handleStatusUpdate)}>
          <DialogTitle>Update Shipment Status</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Controller
                name="status"
                control={statusControl}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select {...field} label="Status">
                      {Object.values(ShipmentStatus).map((status) => (
                        <MenuItem key={status} value={status}>
                          {status.replace('_', ' ').toUpperCase()}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
              <Controller
                name="description"
                control={statusControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    required
                  />
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={updateStatusMutation.isPending}>
              {updateStatusMutation.isPending ? 'Updating...' : 'Update'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* GPS Location Update Dialog */}
      <Dialog open={locationDialogOpen} onClose={() => setLocationDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleLocationSubmit(handleLocationUpdate)}>
          <DialogTitle>Update GPS Location</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Controller
                name="address"
                control={locationControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Address"
                    required
                  />
                )}
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Controller
                    name="coordinates.lat"
                    control={locationControl}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        type="number"
                        label="Latitude"
                        required
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Controller
                    name="coordinates.lng"
                    control={locationControl}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        type="number"
                        label="Longitude"
                        required
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLocationDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={updateLocationMutation.isPending}>
              {updateLocationMutation.isPending ? 'Updating...' : 'Update'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Inspection Dialog */}
      <Dialog open={inspectDialogOpen} onClose={() => setInspectDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleInspectSubmit(handleInspect)}>
          <DialogTitle>Inspect Shipment</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Controller
                name="status"
                control={inspectControl}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Inspection Status</InputLabel>
                    <Select {...field} label="Inspection Status">
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="approved">Approved</MenuItem>
                      <MenuItem value="rejected">Rejected</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
              <Controller
                name="rejectionReason"
                control={inspectControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    multiline
                    rows={3}
                    label="Rejection Reason (if rejected)"
                  />
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setInspectDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={inspectMutation.isPending}>
              {inspectMutation.isPending ? 'Submitting...' : 'Submit'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Activity History Tab */}
      <Box sx={{ mt: 4 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Details" />
          <Tab label="Activity History" />
        </Tabs>
        <Box sx={{ mt: 3 }}>
          {activeTab === 0 && (
            <Box>
              {/* Details content is already shown above */}
            </Box>
          )}
          {activeTab === 1 && id && (
            <ActivityHistory
              resource="shipment"
              resourceId={validId}
              title="Shipment Activity History"
              showExport={true}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};
