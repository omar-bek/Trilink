import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Public,
  LocalShipping,
  Assessment,
  ShowChart,
  Map,
  Timeline,
  Warning,
  CheckCircle,
  Refresh,
  Download,
  FilterList,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';
import { PageSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';
import { ImportExportFlows } from '@/components/GovernmentIntelligence/ImportExportFlows';
import { SectorProcurementBehavior } from '@/components/GovernmentIntelligence/SectorProcurementBehavior';
import { PriceFluctuations } from '@/components/GovernmentIntelligence/PriceFluctuations';
import { SupplierPerformanceScores } from '@/components/GovernmentIntelligence/SupplierPerformanceScores';
import { ClearanceTimeHeatmap } from '@/components/GovernmentIntelligence/ClearanceTimeHeatmap';
import { LogisticsEfficiencyMetrics } from '@/components/GovernmentIntelligence/LogisticsEfficiencyMetrics';
import { IndustrialOpportunitySignals } from '@/components/GovernmentIntelligence/IndustrialOpportunitySignals';
import { formatCurrency } from '@/utils';

export const GovernmentIntelligenceDashboard = () => {
  const { user } = useAuthStore();
  const role = user?.role as Role;
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('30d');
  const [sectorFilter, setSectorFilter] = useState('all');

  // Check access
  if (role !== Role.GOVERNMENT && role !== Role.ADMIN) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          Access Denied
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This intelligence dashboard is restricted to Government users only.
        </Typography>
      </Box>
    );
  }

  // Mock data queries - replace with actual API calls
  const { data: intelligenceData, isLoading } = useQuery({
    queryKey: ['government-intelligence', timeRange, sectorFilter],
    queryFn: async () => {
      // TODO: Replace with actual API call
      return {
        summary: {
          totalTradeValue: 1250000000,
          tradeGrowth: 12.5,
          activeSuppliers: 1247,
          clearanceEfficiency: 87.3,
          logisticsScore: 8.4,
          opportunityIndex: 72,
        },
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const summary = intelligenceData?.summary || {};

  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', p: 3 }}>
      {/* Header - Bloomberg Style */}
      <Paper
        sx={{
          p: 2,
          mb: 2,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 0,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                fontSize: '1.75rem',
                letterSpacing: '-0.02em',
                mb: 0.5,
              }}
            >
              TriLink Economic Intelligence Cockpit
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              National Economic Intelligence • Real-time Analytics • Policy-Grade Visualization
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh Data">
              <IconButton size="small">
                <Refresh fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export Report">
              <IconButton size="small">
                <Download fontSize="small" />
              </IconButton>
            </Tooltip>
            <Button
              size="small"
              variant="outlined"
              startIcon={<FilterList />}
              sx={{ textTransform: 'none' }}
            >
              Filters
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Summary Metrics Bar - Bloomberg Style */}
      <Grid container spacing={1} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Paper
            sx={{
              p: 1.5,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 0,
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              TOTAL TRADE VALUE
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', mt: 0.5 }}>
              {formatCurrency(summary.totalTradeValue || 0, 'AED')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <TrendingUp sx={{ fontSize: '0.875rem', color: 'success.main' }} />
              <Typography variant="caption" sx={{ color: 'success.main', fontSize: '0.7rem' }}>
                {summary.tradeGrowth || 0}%
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Paper
            sx={{
              p: 1.5,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 0,
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              ACTIVE SUPPLIERS
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', mt: 0.5 }}>
              {summary.activeSuppliers || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', mt: 0.5 }}>
              Registered
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Paper
            sx={{
              p: 1.5,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 0,
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              CLEARANCE EFFICIENCY
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', mt: 0.5 }}>
              {summary.clearanceEfficiency || 0}%
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <CheckCircle sx={{ fontSize: '0.875rem', color: 'success.main' }} />
              <Typography variant="caption" sx={{ color: 'success.main', fontSize: '0.7rem' }}>
                On Target
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Paper
            sx={{
              p: 1.5,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 0,
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              LOGISTICS SCORE
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', mt: 0.5 }}>
              {summary.logisticsScore || 0}/10
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', mt: 0.5 }}>
              Performance Index
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Paper
            sx={{
              p: 1.5,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 0,
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              OPPORTUNITY INDEX
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', mt: 0.5 }}>
              {summary.opportunityIndex || 0}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <Warning sx={{ fontSize: '0.875rem', color: 'warning.main' }} />
              <Typography variant="caption" sx={{ color: 'warning.main', fontSize: '0.7rem' }}>
                High Potential
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Paper
            sx={{
              p: 1.5,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 0,
            }}
          >
            <FormControl fullWidth size="small">
              <InputLabel>Time Range</InputLabel>
              <Select value={timeRange} label="Time Range" onChange={(e) => setTimeRange(e.target.value)}>
                <MenuItem value="7d">7 Days</MenuItem>
                <MenuItem value="30d">30 Days</MenuItem>
                <MenuItem value="90d">90 Days</MenuItem>
                <MenuItem value="1y">1 Year</MenuItem>
              </Select>
            </FormControl>
          </Paper>
        </Grid>
      </Grid>

      {/* Main Dashboard Tabs */}
      <Paper
        sx={{
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 0,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              minHeight: 48,
            },
          }}
        >
          <Tab label="Trade Flows" icon={<Public />} iconPosition="start" />
          <Tab label="Sector Analysis" icon={<Assessment />} iconPosition="start" />
          <Tab label="Price Intelligence" icon={<ShowChart />} iconPosition="start" />
          <Tab label="Supplier Performance" icon={<Timeline />} iconPosition="start" />
          <Tab label="Clearance Analytics" icon={<Map />} iconPosition="start" />
          <Tab label="Logistics Metrics" icon={<LocalShipping />} iconPosition="start" />
          <Tab label="Opportunity Signals" icon={<TrendingUp />} iconPosition="start" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {activeTab === 0 && <ImportExportFlows timeRange={timeRange} />}
          {activeTab === 1 && <SectorProcurementBehavior timeRange={timeRange} sectorFilter={sectorFilter} />}
          {activeTab === 2 && <PriceFluctuations timeRange={timeRange} />}
          {activeTab === 3 && <SupplierPerformanceScores timeRange={timeRange} />}
          {activeTab === 4 && <ClearanceTimeHeatmap timeRange={timeRange} />}
          {activeTab === 5 && <LogisticsEfficiencyMetrics timeRange={timeRange} />}
          {activeTab === 6 && <IndustrialOpportunitySignals timeRange={timeRange} />}
        </Box>
      </Paper>
    </Box>
  );
};
