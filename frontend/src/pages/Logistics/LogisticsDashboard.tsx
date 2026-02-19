import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Assignment,
  LocalShipping,
  Schedule,
  CheckCircle,
  Visibility,
  Add,
  GpsFixed,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { rfqService } from '@/services/rfq.service';
import { shipmentService } from '@/services/shipment.service';
import { bidService } from '@/services/bid.service';
import { RFQType, RFQStatus } from '@/types/rfq';
import { ShipmentStatus } from '@/types/shipment';
import { BidStatus } from '@/types/bid';
import { Role } from '@/types';
import { formatDate } from '@/utils';
import { PageSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';
import { KPICard } from '@/components/Dashboard/KPICard';

export const LogisticsDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Fetch pending transport RFQs
  const { data: pendingRFQsData, isLoading: loadingRFQs } = useQuery({
    queryKey: ['rfqs', 'logistics', 'pending'],
    queryFn: () =>
      rfqService.getRFQs({
        type: RFQType.LOGISTICS,
        status: RFQStatus.OPEN,
        targetRole: Role.LOGISTICS,
      }),
  });

  // Fetch awarded shipments (shipments where logistics company is assigned)
  const { data: awardedShipmentsData, isLoading: loadingShipments } = useQuery({
    queryKey: ['shipments', 'logistics', 'awarded'],
    queryFn: () =>
      shipmentService.getShipments({
        status: undefined, // Get all statuses
      }),
  });

  // Fetch accepted bids (awarded contracts)
  const { data: acceptedBidsData } = useQuery({
    queryKey: ['bids', 'logistics', 'accepted'],
    queryFn: () =>
      bidService.getBids({
        status: BidStatus.ACCEPTED,
      }),
  });

  const pendingRFQs = pendingRFQsData?.data || [];
  const allShipments = awardedShipmentsData?.data || [];
  const acceptedBids = acceptedBidsData?.data || [];

  // Filter shipments assigned to this logistics company
  const awardedShipments = Array.isArray(allShipments)
    ? allShipments.filter(
        (shipment) =>
          shipment.logisticsCompanyId === user?.companyId ||
          acceptedBids.some((bid) => bid.rfqId === shipment.contractId)
      )
    : [];

  // Get pickup schedules (shipments ready for pickup or in transit)
  const pickupSchedules = awardedShipments.filter(
    (shipment) =>
      shipment.status === ShipmentStatus.READY_FOR_PICKUP ||
      shipment.status === ShipmentStatus.IN_PRODUCTION
  );

  // Get shipment status summary
  const shipmentStatusCounts = {
    inProduction: awardedShipments.filter(
      (s) => s.status === ShipmentStatus.IN_PRODUCTION
    ).length,
    readyForPickup: awardedShipments.filter(
      (s) => s.status === ShipmentStatus.READY_FOR_PICKUP
    ).length,
    inTransit: awardedShipments.filter(
      (s) => s.status === ShipmentStatus.IN_TRANSIT
    ).length,
    inClearance: awardedShipments.filter(
      (s) => s.status === ShipmentStatus.IN_CLEARANCE
    ).length,
    delivered: awardedShipments.filter(
      (s) => s.status === ShipmentStatus.DELIVERED
    ).length,
  };

  if (loadingRFQs || loadingShipments) {
    return <PageSkeleton />;
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#FFFFFF' }}>
          Logistics Provider Dashboard
        </Typography>
        <Typography variant="body1" sx={{ color: '#CBD5E1' }}>
          Manage your transport RFQs, shipments, and tracking operations
        </Typography>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Pending RFQs"
            value={pendingRFQs.length}
            icon={<Assignment />}
            color="warning"
            onClick={() => navigate('/rfqs?type=Logistics&status=open')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Awarded Shipments"
            value={awardedShipments.length}
            icon={<CheckCircle />}
            color="success"
            onClick={() => navigate('/shipments')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Pickup Schedules"
            value={pickupSchedules.length}
            icon={<Schedule />}
            color="info"
            onClick={() => navigate('/shipments?status=ready_for_pickup')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="In Transit"
            value={shipmentStatusCounts.inTransit}
            icon={<LocalShipping />}
            color="primary"
            onClick={() => navigate('/tracking')}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Pending Transport RFQs */}
        <Grid item xs={12} md={6}>
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
                  Pending Transport RFQs
                </Typography>
                <Button
                  size="small"
                  startIcon={<Add />}
                  onClick={() => navigate('/rfqs?type=Logistics')}
                >
                  View All
                </Button>
              </Box>
              {pendingRFQs.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Assignment sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No pending RFQs
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: '#CBD5E1' }}>RFQ Title</TableCell>
                        <TableCell sx={{ color: '#CBD5E1' }}>Deadline</TableCell>
                        <TableCell sx={{ color: '#CBD5E1' }} align="right">
                          Action
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pendingRFQs.slice(0, 5).map((rfq) => (
                        <TableRow key={rfq._id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {rfq.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {rfq.deliveryLocation.city}, {rfq.deliveryLocation.country}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(rfq.deadline)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => navigate(`/rfqs/${rfq._id}`)}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Submit Bid">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() =>
                                  navigate(`/bids/submit?rfqId=${rfq._id}`)
                                }
                              >
                                <Add fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Awarded Shipments */}
        <Grid item xs={12} md={6}>
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
                  Awarded Shipments
                </Typography>
                <Button
                  size="small"
                  startIcon={<LocalShipping />}
                  onClick={() => navigate('/shipments')}
                >
                  View All
                </Button>
              </Box>
              {awardedShipments.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <LocalShipping
                    sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    No awarded shipments
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: '#CBD5E1' }}>Shipment</TableCell>
                        <TableCell sx={{ color: '#CBD5E1' }}>Status</TableCell>
                        <TableCell sx={{ color: '#CBD5E1' }} align="right">
                          Action
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {awardedShipments.slice(0, 5).map((shipment) => (
                        <TableRow key={shipment._id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              Shipment #{shipment._id.slice(-8)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {shipment.origin.city} → {shipment.destination.city}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={shipment.status.replace('_', ' ')}
                              size="small"
                              color={
                                shipment.status === ShipmentStatus.DELIVERED
                                  ? 'success'
                                  : shipment.status === ShipmentStatus.IN_TRANSIT
                                  ? 'primary'
                                  : shipment.status === ShipmentStatus.IN_CLEARANCE
                                  ? 'warning'
                                  : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Track">
                              <IconButton
                                size="small"
                                onClick={() => navigate(`/tracking/enhanced?shipment=${shipment._id}`)}
                              >
                                <GpsFixed fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => navigate(`/shipments/${shipment._id}`)}
                              >
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
            </CardContent>
          </Card>
        </Grid>

        {/* Pickup Schedules */}
        <Grid item xs={12} md={6}>
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
                  Pickup Schedules
                </Typography>
                <Button
                  size="small"
                  startIcon={<Schedule />}
                  onClick={() =>
                    navigate('/shipments?status=ready_for_pickup')
                  }
                >
                  View All
                </Button>
              </Box>
              {pickupSchedules.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Schedule sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No scheduled pickups
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {pickupSchedules.slice(0, 5).map((shipment) => (
                    <Paper
                      key={shipment._id}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 2,
                        },
                      }}
                      onClick={() => navigate(`/shipments/${shipment._id}`)}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'start',
                        }}
                      >
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                            Shipment #{shipment._id.slice(-8)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Pickup: {shipment.origin.address}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            ETA: {formatDate(shipment.estimatedDeliveryDate)}
                          </Typography>
                        </Box>
                        <Chip
                          label={shipment.status.replace('_', ' ')}
                          size="small"
                          color="info"
                        />
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Shipment Status Overview */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#FFFFFF' }}>
                Shipment Status Overview
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {shipmentStatusCounts.inProduction}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      In Production
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                      {shipmentStatusCounts.readyForPickup}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Ready for Pickup
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {shipmentStatusCounts.inTransit}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      In Transit
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                      {shipmentStatusCounts.inClearance}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      In Clearance
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    }}
                  >
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#FFFFFF' }}>
                      {shipmentStatusCounts.delivered}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#FFFFFF' }}>
                      Delivered
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
