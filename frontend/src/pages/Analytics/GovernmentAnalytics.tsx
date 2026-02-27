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
  Box as MuiBox,
  Chip,
  Alert,
} from '@mui/material';
import {
  Business,
  Assignment,
  AccountBalance,
  Payment,
  Gavel,
  TrendingUp,
  TrendingDown,
  FilterList,
  FileDownload,
} from '@mui/icons-material';
// import { DatePicker } from '@mui/x-date-pickers'; // Package not installed - using TextField type="date" instead
import { useGovernmentAnalytics } from '@/hooks/useAnalytics';
import { KPICard } from '@/components/Dashboard/KPICard';
import { AnalyticsChart } from '@/components/Analytics/AnalyticsChart';
import { ExportButton } from '@/components/Analytics/ExportButton';
import { PageSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';
import { AnalyticsFilters } from '@/services/analytics.service';
import { formatCurrency } from '@/utils';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';

export const GovernmentAnalytics = () => {
  const { user } = useAuthStore();
  const role = user?.role as Role;
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, error } = useGovernmentAnalytics(filters);
  const analytics = data?.data;

  // Check if user has access (Government or Admin)
  if (role !== Role.GOVERNMENT && role !== Role.ADMIN) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          Access Denied
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This page is only accessible to Government users.
        </Typography>
      </Box>
    );
  }

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    // Export functionality to be implemented
    // This will trigger download of analytics data in the specified format
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
  
  // Transform chart data to expected format
  const transformChartData = (data: any): Array<{ label: string; value: number; [key: string]: any }> | undefined => {
    if (!data) return undefined;
    if (Array.isArray(data)) {
      return data.map(item => {
        if (item.month && item.count !== undefined) {
          return { label: item.month, value: item.count, ...item };
        }
        if (item.month && item.value !== undefined) {
          return { label: item.month, value: item.value, ...item };
        }
        if (item.month && item.amount !== undefined) {
          return { label: item.month, value: item.amount, ...item };
        }
        return item;
      });
    }
    if (typeof data === 'object') {
      return Object.entries(data).map(([key, value]) => ({
        label: key,
        value: typeof value === 'number' ? value : 0,
        [key]: value,
      }));
    }
    return undefined;
  };
  const trends = analytics?.trends || {};

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Government Analytics Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comprehensive overview of platform activity and metrics
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
          <ExportButton format="pdf" onClick={() => handleExport('pdf')} />
          <ExportButton format="excel" onClick={() => handleExport('excel')} />
          <ExportButton format="csv" onClick={() => handleExport('csv')} />
        </Box>
      </Box>

      {/* Filters Panel */}
      {showFilters && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Filter Analytics
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Company Type</InputLabel>
                <Select
                  value={filters.companyType || ''}
                  label="Company Type"
                  onChange={(e) => handleFilterChange('companyType', e.target.value || undefined)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="buyer">Buyer</MenuItem>
                  <MenuItem value="supplier">Supplier</MenuItem>
                  <MenuItem value="logistics">Logistics</MenuItem>
                  <MenuItem value="clearance">Clearance</MenuItem>
                  <MenuItem value="service_provider">Service Provider</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" onClick={clearFilters} size="small">
                  Clear
                </Button>
                {Object.keys(filters).length > 0 && (
                  <Chip
                    label={`${Object.keys(filters).length} filter${Object.keys(filters).length !== 1 ? 's' : ''} active`}
                    size="small"
                    onDelete={clearFilters}
                  />
                )}
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Companies"
            value={(kpis as any).activeCompanies || 0}
            icon={<Business />}
            color="primary"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Contracts"
            value={(kpis as any).totalContracts || 0}
            icon={<AccountBalance />}
            color="success"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Contract Value"
            value={formatCurrency((kpis as any).totalContractValue || 0, 'AED')}
            icon={<TrendingUp />}
            color="info"
            loading={isLoading}
            trend={
              trends.contractValueTrend
                ? {
                    value: Math.abs(trends.contractValueTrend),
                    label: trends.contractValueTrend > 0 ? 'vs last period' : 'vs last period',
                  }
                : undefined
            }
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Payments"
            value={formatCurrency((kpis as any).totalPaymentAmount || 0, 'AED')}
            icon={<Payment />}
            color="warning"
            loading={isLoading}
            trend={
              trends.paymentAmountTrend
                ? {
                    value: Math.abs(trends.paymentAmountTrend),
                    label: trends.paymentAmountTrend > 0 ? 'vs last period' : 'vs last period',
                  }
                : undefined
            }
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Completed Payments"
            value={formatCurrency((kpis as any).totalCompletedPaymentAmount || 0, 'AED')}
            icon={<Payment />}
            color="success"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Pending Payments"
            value={formatCurrency((kpis as any).totalPendingPaymentAmount || 0, 'AED')}
            icon={<Payment />}
            color="warning"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total RFQs"
            value={(kpis as any).totalRFQs || 0}
            icon={<Assignment />}
            color="info"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Escalated Disputes"
            value={(kpis as any).escalatedDisputes || 0}
            icon={<Gavel />}
            color="error"
            loading={isLoading}
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Purchase Requests by Month */}
        {charts.purchaseRequestsByMonth && (
          <Grid item xs={12} md={6}>
            <AnalyticsChart
              title="Purchase Requests by Month"
              type="bar"
              data={transformChartData(charts.purchaseRequestsByMonth)}
              loading={isLoading}
            />
          </Grid>
        )}

        {/* Contracts by Status */}
        {charts.contractsByStatus && (
          <Grid item xs={12} md={6}>
            <AnalyticsChart
              title="Contracts by Status"
              type="pie"
              data={transformChartData(charts.contractsByStatus)}
              loading={isLoading}
            />
          </Grid>
        )}

        {/* Payments by Status */}
        {charts.paymentsByStatus && (
          <Grid item xs={12} md={6}>
            <AnalyticsChart
              title="Payments by Status"
              type="pie"
              data={transformChartData(charts.paymentsByStatus)}
              loading={isLoading}
            />
          </Grid>
        )}

        {/* Contracts by Month */}
        {charts.contractsByMonth && (
          <Grid item xs={12} md={6}>
            <AnalyticsChart
              title="Contracts by Month"
              type="line"
              data={transformChartData(charts.contractsByMonth)}
              loading={isLoading}
            />
          </Grid>
        )}

        {/* Payments by Month */}
        {charts.paymentsByMonth && (
          <Grid item xs={12} md={6}>
            <AnalyticsChart
              title="Payments by Month"
              type="line"
              data={transformChartData(charts.paymentsByMonth)}
              loading={isLoading}
            />
          </Grid>
        )}

        {/* Companies by Type */}
        {charts.companiesByType && (
          <Grid item xs={12} md={6}>
            <AnalyticsChart
              title="Companies by Type"
              type="pie"
              data={transformChartData(charts.companiesByType)}
              loading={isLoading}
            />
          </Grid>
        )}

        {/* Disputes by Type */}
        {charts.disputesByType && (
          <Grid item xs={12} md={6}>
            <AnalyticsChart
              title="Disputes by Type"
              type="bar"
              data={transformChartData(charts.disputesByType)}
              loading={isLoading}
            />
          </Grid>
        )}
      </Grid>

      {/* Summary Statistics */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Transaction Summary
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Purchase Requests
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {(kpis as any).totalPurchaseRequests || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Bids
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {(kpis as any).totalBids || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Active Shipments
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {(kpis as any).activeShipments || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Disputes
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {(kpis as any).totalDisputes || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Payment Summary
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Payment Amount
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatCurrency((kpis as any).totalPaymentAmount || 0, 'AED')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Completed Payments
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                    {formatCurrency((kpis as any).totalCompletedPaymentAmount || 0, 'AED')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Pending Payments
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.main' }}>
                    {formatCurrency((kpis as any).totalPendingPaymentAmount || 0, 'AED')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Completion Rate
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {(kpis as any).totalPaymentAmount
                      ? `${(((kpis as any).totalCompletedPaymentAmount || 0) / (kpis as any).totalPaymentAmount * 100).toFixed(1)}%`
                      : '0%'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Platform Health
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Active Companies
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {(kpis as any).activeCompanies || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Contract Value
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatCurrency((kpis as any).totalContractValue || 0, 'AED')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Dispute Resolution Rate
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {trends.disputeResolutionRate
                      ? `${trends.disputeResolutionRate.toFixed(1)}%`
                      : 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Escalated Disputes
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                    {(kpis as any).escalatedDisputes || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
