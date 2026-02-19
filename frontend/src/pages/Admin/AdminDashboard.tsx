import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  Button,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  People as PeopleIcon,
  Business as BusinessIcon,
  ShoppingCart as ShoppingCartIcon,
  Assignment as AssignmentIcon,
  Gavel as GavelIcon,
  AccountBalance as AccountBalanceIcon,
  LocalShipping as LocalShippingIcon,
  Payment as PaymentIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '@/services/dashboard.service';
import { useAllUsers } from '@/hooks/useUsers';
import { useCompanies } from '@/hooks/useCompany';
import { PageSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';
import { formatCurrency } from '@/utils';

export const AdminDashboard = () => {
  const navigate = useNavigate();

  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => dashboardService.getGovernmentDashboard(),
  });

  const { data: usersData, isLoading: isLoadingUsers } = useAllUsers();
  const { data: companiesData, isLoading: isLoadingCompanies } = useCompanies();

  const kpis = dashboardData?.data?.kpis || dashboardData?.data?.data?.kpis || {};
  const users = usersData?.data || [];
  const companies = companiesData?.data || [];

  const isLoading = isLoadingDashboard || isLoadingUsers || isLoadingCompanies;

  if (isLoading) {
    return <PageSkeleton />;
  }

  const stats = [
    {
      title: 'Total Users',
      value: kpis.totalUsers || users.length,
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: 'primary',
      link: '/admin/users',
      trend: kpis.userGrowth,
    },
    {
      title: 'Active Companies',
      value: kpis.activeCompanies || companies.filter((c) => c.status === 'approved').length,
      icon: <BusinessIcon sx={{ fontSize: 40 }} />,
      color: 'info',
      link: '/admin/companies',
    },
    {
      title: 'Purchase Requests',
      value: kpis.totalPurchaseRequests || 0,
      icon: <ShoppingCartIcon sx={{ fontSize: 40 }} />,
      color: 'success',
      link: '/purchase-requests',
    },
    {
      title: 'RFQs',
      value: kpis.totalRFQs || 0,
      icon: <AssignmentIcon sx={{ fontSize: 40 }} />,
      color: 'warning',
      link: '/rfqs',
    },
    {
      title: 'Bids',
      value: kpis.totalBids || 0,
      icon: <GavelIcon sx={{ fontSize: 40 }} />,
      color: 'secondary',
      link: '/bids',
    },
    {
      title: 'Contracts',
      value: kpis.totalContracts || 0,
      icon: <AccountBalanceIcon sx={{ fontSize: 40 }} />,
      color: 'error',
      link: '/contracts',
    },
    {
      title: 'Shipments',
      value: kpis.activeShipments || 0,
      icon: <LocalShippingIcon sx={{ fontSize: 40 }} />,
      color: 'info',
      link: '/shipments',
    },
    {
      title: 'Payments',
      value: kpis.totalPayments || 0,
      icon: <PaymentIcon sx={{ fontSize: 40 }} />,
      color: 'success',
      link: '/payments',
      amount: kpis.totalPlatformValue,
    },
    {
      title: 'Disputes',
      value: kpis.totalDisputes || 0,
      icon: <AssessmentIcon sx={{ fontSize: 40 }} />,
      color: 'error',
      link: '/disputes',
      escalated: kpis.escalatedDisputes,
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            Admin Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Complete overview of the platform
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => navigate('/admin/audit-logs')}>
            View Audit Logs
          </Button>
        </Stack>
      </Box>

      {/* System Health Alert */}
      {kpis.systemHealth && kpis.systemHealth !== 'healthy' && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          System Health: {kpis.systemHealth}
        </Alert>
      )}

      {/* Main Statistics Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={stat.title}>
            <Card
              sx={{
                height: '100%',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
              onClick={() => navigate(stat.link)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {stat.value.toLocaleString()}
                    </Typography>
                    {stat.amount && (
                      <Typography variant="body2" color="text.secondary">
                        {formatCurrency(stat.amount)}
                      </Typography>
                    )}
                    {stat.escalated && (
                      <Chip
                        label={`${stat.escalated} escalated`}
                        size="small"
                        color="error"
                        sx={{ mt: 0.5 }}
                      />
                    )}
                  </Box>
                  <Box
                    sx={{
                      color: `${stat.color}.main`,
                      opacity: 0.8,
                    }}
                  >
                    {stat.icon}
                  </Box>
                </Box>
                {stat.trend !== undefined && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {stat.trend > 0 ? (
                      <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                    ) : (
                      <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
                    )}
                    <Typography
                      variant="caption"
                      color={stat.trend > 0 ? 'success.main' : 'error.main'}
                    >
                      {Math.abs(stat.trend)}%
                    </Typography>
                  </Box>
                )}
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  sx={{ mt: 1 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(stat.link);
                  }}
                >
                  View All
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Additional Metrics */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Platform Overview
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Platform Value
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {kpis.totalPlatformValue ? formatCurrency(kpis.totalPlatformValue) : 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Monthly Transactions
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {kpis.monthlyTransactions?.toLocaleString() || 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Pending Approvals
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {kpis.pendingApprovals || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Active Contracts
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {kpis.activeContracts || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Pending Payments
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {kpis.pendingPaymentsCount || 0}
                  </Typography>
                </Box>
                {kpis.pendingPaymentsAmount && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Pending Amount
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {formatCurrency(kpis.pendingPaymentsAmount)}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Quick Actions
              </Typography>
              <Stack spacing={1}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<PeopleIcon />}
                  onClick={() => navigate('/admin/users')}
                >
                  Manage Users
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<BusinessIcon />}
                  onClick={() => navigate('/admin/companies')}
                >
                  Manage Companies
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<AssessmentIcon />}
                  onClick={() => navigate('/admin/categories')}
                >
                  Manage Categories
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<AssessmentIcon />}
                  onClick={() => navigate('/admin/audit-logs')}
                >
                  View Audit Logs
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<ShoppingCartIcon />}
                  onClick={() => navigate('/purchase-requests')}
                >
                  View Purchase Requests
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<PaymentIcon />}
                  onClick={() => navigate('/payments')}
                >
                  View Payments
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<AssessmentIcon />}
                  onClick={() => navigate('/disputes')}
                >
                  View Disputes
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
