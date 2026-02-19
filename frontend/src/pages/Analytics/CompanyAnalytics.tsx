import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
} from '@mui/material';
import {
  ShoppingCart,
  Assignment,
  AccountBalance,
  Payment,
  Gavel,
  TrendingUp,
  TrendingDown,
  FilterList,
  FileDownload,
} from '@mui/icons-material';
import { useCompanyAnalytics, useStreamPurchaseRequests } from '@/hooks/useAnalytics';
import { KPICard } from '@/components/Dashboard/KPICard';
import { AnalyticsChart } from '@/components/Analytics/AnalyticsChart';
import { PageSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';
import { AnalyticsFilters } from '@/services/analytics.service';
import { formatCurrency } from '@/utils';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';
import { Alert } from '@mui/material';

export const CompanyAnalytics = () => {
  const { user } = useAuthStore();
  const role = user?.role as Role;
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, error } = useCompanyAnalytics(filters);
  const streamMutation = useStreamPurchaseRequests();

  const analytics = data?.data;

  // Check if user has access (Buyer, Admin, or other roles with VIEW_ANALYTICS permission)
  if (role !== Role.BUYER && role !== Role.ADMIN && role !== Role.GOVERNMENT) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="error">
          Access Denied. This page is only accessible to users with analytics permissions.
        </Alert>
      </Box>
    );
  }

  const handleExport = async (format: 'json' | 'csv') => {
    if (format === 'json') {
      streamMutation.mutate(filters);
    } else {
      // CSV export to be implemented
      alert('CSV export coming soon');
    }
  };

  const handleFilterChange = (key: keyof AnalyticsFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error) {
    const errorMessage = (error as any)?.response?.data?.message || 
                         (error as any)?.message || 
                         'Failed to load analytics data. Please try again.';
    return (
      <Box sx={{ p: 4 }}>
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

  const kpis = analytics?.kpis || {};
  const charts = analytics?.charts || {};
  const trends = analytics?.trends || {};

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Company Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track your business performance and key metrics
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Filters'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={() => handleExport('json')}
            disabled={streamMutation.isPending}
          >
            Export Data
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      {showFilters && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status || ''}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Button variant="outlined" onClick={clearFilters} size="small">
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {kpis.totalPurchaseRequests !== undefined && (
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Purchase Requests"
              value={kpis.totalPurchaseRequests}
              icon={<ShoppingCart />}
              color="primary"
            />
          </Grid>
        )}
        {kpis.totalContracts !== undefined && (
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Contracts"
              value={kpis.totalContracts}
              icon={<AccountBalance />}
              color="success"
              subtitle={kpis.totalContractValue ? formatCurrency(kpis.totalContractValue) : undefined}
            />
          </Grid>
        )}
        {kpis.totalBids !== undefined && (
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Bids"
              value={kpis.totalBids}
              icon={<Gavel />}
              color="info"
              subtitle={
                trends.bidAcceptanceRate !== undefined
                  ? `${trends.bidAcceptanceRate.toFixed(1)}% acceptance rate`
                  : undefined
              }
            />
          </Grid>
        )}
        {kpis.totalPayments !== undefined && (
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Payments"
              value={kpis.totalPayments}
              icon={<Payment />}
              color="warning"
              subtitle={kpis.totalPaymentAmount ? formatCurrency(kpis.totalPaymentAmount) : undefined}
            />
          </Grid>
        )}
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {charts.purchaseRequestsByMonth && charts.purchaseRequestsByMonth.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Purchase Requests Trend
                </Typography>
                <AnalyticsChart
                  type="line"
                  data={charts.purchaseRequestsByMonth.map((item) => ({
                    label: item.month,
                    value: item.count,
                  }))}
                />
              </CardContent>
            </Card>
          </Grid>
        )}

        {charts.contractsByStatus && Object.keys(charts.contractsByStatus).length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Contracts by Status
                </Typography>
                <AnalyticsChart
                  type="pie"
                  data={Object.entries(charts.contractsByStatus).map(([key, value]) => ({
                    label: key,
                    value: value as number,
                  }))}
                />
              </CardContent>
            </Card>
          </Grid>
        )}

        {charts.paymentsByStatus && Object.keys(charts.paymentsByStatus).length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Payments by Status
                </Typography>
                <AnalyticsChart
                  type="bar"
                  data={Object.entries(charts.paymentsByStatus).map(([key, value]) => ({
                    label: key,
                    value: value as number,
                  }))}
                />
              </CardContent>
            </Card>
          </Grid>
        )}

        {charts.contractsByMonth && charts.contractsByMonth.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Contract Value Trend
                </Typography>
                <AnalyticsChart
                  type="line"
                  data={charts.contractsByMonth.map((item) => ({
                    label: item.month,
                    value: item.value,
                  }))}
                />
                {trends.contractValueTrend !== undefined && (
                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    {trends.contractValueTrend >= 0 ? (
                      <TrendingUp color="success" />
                    ) : (
                      <TrendingDown color="error" />
                    )}
                    <Typography
                      variant="body2"
                      color={trends.contractValueTrend >= 0 ? 'success.main' : 'error.main'}
                    >
                      {trends.contractValueTrend >= 0 ? '+' : ''}
                      {trends.contractValueTrend.toFixed(1)}% vs previous period
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};
