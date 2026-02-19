import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  LocalShipping,
  GpsFixed,
  Upload,
  Description,
  CheckCircle,
  RadioButtonUnchecked,
  LocationOn,
  AccessTime,
  ArrowBack,
  CloudUpload,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shipmentService } from '@/services/shipment.service';
import { Shipment, ShipmentStatus, UpdateShipmentStatusDto } from '@/types/shipment';
import { formatDate } from '@/utils';
import { PageSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';
import { ShipmentMap } from '@/components/Map/ShipmentMap';

// Custom dark theme map style
const darkMapStyle = {
  filter: 'invert(1) hue-rotate(180deg) brightness(0.6) contrast(1.2)',
};

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
      id={`tracking-tabpanel-${index}`}
      aria-labelledby={`tracking-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// Milestone steps
const milestones = [
  { label: 'Pickup', status: ShipmentStatus.READY_FOR_PICKUP },
  { label: 'Transit', status: ShipmentStatus.IN_TRANSIT },
  { label: 'Customs', status: ShipmentStatus.IN_CLEARANCE },
  { label: 'Delivery', status: ShipmentStatus.DELIVERED },
];

export const EnhancedTracking = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shipmentId = searchParams.get('shipment');
  const [tabValue, setTabValue] = useState(0);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [documentType, setDocumentType] = useState<'BL' | 'AWB'>('BL');
  const queryClient = useQueryClient();

  const { data: shipmentData, isLoading } = useQuery({
    queryKey: ['shipment', shipmentId],
    queryFn: () => shipmentService.getShipmentById(shipmentId!),
    enabled: !!shipmentId,
  });

  const shipment = shipmentData?.data as Shipment | undefined;

  const updateStatusMutation = useMutation({
    mutationFn: (data: UpdateShipmentStatusDto) =>
      shipmentService.updateStatus(shipmentId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipment', shipmentId] });
    },
  });

  // Get active step based on shipment status
  const getActiveStep = () => {
    if (!shipment) return 0;
    const statusIndex = milestones.findIndex((m) => m.status === shipment.status);
    return statusIndex >= 0 ? statusIndex : 0;
  };


  if (isLoading) {
    return <PageSkeleton />;
  }

  if (!shipment) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Shipment not found</Alert>
      </Box>
    );
  }

  const activeStep = getActiveStep();

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#FFFFFF' }}>
            Shipment Tracking
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Shipment #{shipment._id.slice(-8)}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Map Section */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3, height: '600px', overflow: 'hidden', position: 'relative' }}>
            <ShipmentMap
              origin={shipment.origin}
              destination={shipment.destination}
              currentLocation={shipment.currentLocation}
              height="600px"
            />
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                zIndex: 1000,
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                p: 2,
              }}
            >
              <Chip
                label={shipment.status.replace('_', ' ').toUpperCase()}
                color={
                  shipment.status === ShipmentStatus.DELIVERED
                    ? 'success'
                    : shipment.status === ShipmentStatus.IN_TRANSIT
                    ? 'primary'
                    : shipment.status === ShipmentStatus.IN_CLEARANCE
                    ? 'warning'
                    : 'default'
                }
                sx={{ fontWeight: 600 }}
              />
            </Box>
          </Card>

          {/* Milestones Timeline */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#FFFFFF' }}>
                Shipment Milestones
              </Typography>
              <Stepper activeStep={activeStep} orientation="vertical">
                {milestones.map((milestone, index) => {
                  const isCompleted = index < activeStep;
                  const isActive = index === activeStep;
                  const event = shipment.trackingEvents?.find(
                    (e) => e.status === milestone.status
                  );

                  return (
                    <Step key={milestone.label} completed={isCompleted} active={isActive}>
                      <StepLabel
                        StepIconComponent={() =>
                          isCompleted ? (
                            <CheckCircle color="success" />
                          ) : isActive ? (
                            <GpsFixed color="primary" />
                          ) : (
                            <RadioButtonUnchecked />
                          )
                        }
                      >
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                          {milestone.label}
                        </Typography>
                      </StepLabel>
                      <StepContent>
                        {event ? (
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {event.description}
                            </Typography>
                            {event.location && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                <LocationOn fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                {event.location.address}
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              <AccessTime fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                              {formatDate(event.timestamp)}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Pending...
                          </Typography>
                        )}
                      </StepContent>
                    </Step>
                  );
                })}
              </Stepper>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#FFFFFF' }}>
                Shipment Details
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <LocationOn color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Origin"
                    secondary={shipment.origin.address}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <LocationOn color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Destination"
                    secondary={shipment.destination.address}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <AccessTime color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Estimated Delivery"
                    secondary={formatDate(shipment.estimatedDeliveryDate)}
                  />
                </ListItem>
                {shipment.actualDeliveryDate && (
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Actual Delivery"
                      secondary={formatDate(shipment.actualDeliveryDate)}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>

          {/* Documents Section */}
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                  Documents
                </Typography>
                <Button
                  size="small"
                  startIcon={<CloudUpload />}
                  onClick={() => setUploadDialogOpen(true)}
                >
                  Upload
                </Button>
              </Box>
              <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
                <Tab label="B/L" icon={<Description />} iconPosition="start" />
                <Tab label="AWB" icon={<Description />} iconPosition="start" />
              </Tabs>
              <TabPanel value={tabValue} index={0}>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Description sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No Bill of Lading uploaded
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<Upload />}
                    onClick={() => {
                      setDocumentType('BL');
                      setUploadDialogOpen(true);
                    }}
                    sx={{ mt: 2 }}
                  >
                    Upload B/L
                  </Button>
                </Box>
              </TabPanel>
              <TabPanel value={tabValue} index={1}>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Description sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No Air Waybill uploaded
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<Upload />}
                    onClick={() => {
                      setDocumentType('AWB');
                      setUploadDialogOpen(true);
                    }}
                    sx={{ mt: 2 }}
                  >
                    Upload AWB
                  </Button>
                </Box>
              </TabPanel>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Upload Document Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Upload {documentType === 'BL' ? 'Bill of Lading' : 'Air Waybill'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <input
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: 'none' }}
              id="document-upload"
              type="file"
            />
            <label htmlFor="document-upload">
              <Button
                variant="outlined"
                component="span"
                fullWidth
                startIcon={<CloudUpload />}
                sx={{ py: 2 }}
              >
                Choose File
              </Button>
            </label>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              Supported formats: PDF, JPG, PNG (Max 10MB)
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setUploadDialogOpen(false)}>
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
