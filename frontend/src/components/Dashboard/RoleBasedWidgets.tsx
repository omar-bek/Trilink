import { Grid, Card, CardContent, CardHeader, Typography, Box } from '@mui/material';
import { Role } from '@/types';
import { useAuthStore } from '@/store/auth.store';
import { OptimizedChart } from './OptimizedChart';
import {
  ShoppingCart,
  Assignment,
  Gavel,
  AccountBalance,
  LocalShipping,
  Payment,
  People,
  Business,
} from '@mui/icons-material';

interface RoleBasedWidgetsProps {
  kpis?: any;
  loading?: boolean;
}

export const RoleBasedWidgets = ({ kpis, loading = false }: RoleBasedWidgetsProps) => {
  const { user } = useAuthStore();
  const role = user?.role as Role;

  // Buyer Widgets (also for Company Manager)
  if (role === Role.BUYER || role === Role.COMPANY_MANAGER) {
    return (
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <OptimizedChart
                title="Purchase Requests by Status"
                type="pie"
                height={380}
                loading={loading}
                data={kpis?.purchaseRequestsByStatus || kpis?.purchaseRequests?.byStatus}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <OptimizedChart
                title="RFQs Overview"
                type="bar"
                height={380}
                loading={loading}
                data={kpis?.rfqsByStatus || kpis?.rfqsOverview}
              />
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <OptimizedChart
                title="Contract Value Trend"
                type="line"
                height={400}
                loading={loading}
                data={kpis?.contractValueTrend}
              />
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  }

  // Supplier Widgets
  if (role === Role.SUPPLIER) {
    return (
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <OptimizedChart
                title="Bid Acceptance Rate"
                type="pie"
                height={380}
                loading={loading}
                data={kpis?.bidAcceptanceRate}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <OptimizedChart
                title="Active RFQs"
                type="bar"
                height={380}
                loading={loading}
                data={kpis?.activeRFQs}
              />
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <OptimizedChart
                title="Bid Performance"
                type="line"
                height={400}
                loading={loading}
                data={kpis?.bidPerformance}
              />
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  }

  // Logistics Widgets
  if (role === Role.LOGISTICS) {
    return (
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <OptimizedChart
                title="Shipments by Status"
                type="pie"
                height={380}
                loading={loading}
                data={kpis?.shipmentsByStatus}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <OptimizedChart
                title="GPS Tracking Overview"
                type="bar"
                height={380}
                loading={loading}
                data={kpis?.gpsTracking}
              />
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <OptimizedChart
                title="Delivery Performance"
                type="line"
                height={400}
                loading={loading}
                data={kpis?.deliveryPerformance}
              />
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  }

  // Government Widgets
  if (role === Role.GOVERNMENT) {
    return (
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <OptimizedChart
                title="Platform Overview"
                type="pie"
                height={380}
                loading={loading}
                data={kpis?.platformOverview}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <OptimizedChart
                title="Transaction Volume"
                type="bar"
                height={380}
                loading={loading}
                data={kpis?.transactionVolume}
              />
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <OptimizedChart
                title="Dispute Resolution Rate"
                type="line"
                height={400}
                loading={loading}
                data={kpis?.disputeResolution}
              />
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  }

  // Admin Widgets
  if (role === Role.ADMIN) {
    return (
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <OptimizedChart
                title="User Growth"
                type="line"
                height={360}
                loading={loading}
                data={kpis?.userGrowth}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <OptimizedChart
                title="Company Distribution"
                type="pie"
                height={360}
                loading={loading}
                data={kpis?.companyDistribution}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <OptimizedChart
                title="System Activity"
                type="bar"
                height={360}
                loading={loading}
                data={kpis?.systemActivity}
              />
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <OptimizedChart
                title="Platform Analytics"
                type="line"
                height={400}
                loading={loading}
                data={kpis?.platformAnalytics}
              />
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  }

  // Default/Other Roles
  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 3,
        p: 3,
        backdropFilter: 'blur(10px)',
      }}
    >
      <Card
        sx={{
          background: 'transparent',
          boxShadow: 'none',
        }}
      >
        <CardHeader
          title={
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
              Analytics
            </Typography>
          }
        />
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            Analytics widgets will be displayed here based on your role.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};
