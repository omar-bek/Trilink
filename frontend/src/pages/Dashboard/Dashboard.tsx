import { Box, Button, Alert } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';
import { dashboardService } from '@/services/dashboard.service';
import { queryKeys } from '@/lib/queryKeys';
import { PageSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';
import { ErrorHandler } from '@/components/Error/ErrorHandler';
import { useQueryClient } from '@tanstack/react-query';
import { CloudDone as CloudDoneIcon } from '@mui/icons-material';
import { cacheService } from '@/services/cache.service';
import { useState, useEffect } from 'react';
import { ProgressiveDashboard } from '@/components/Dashboard/ProgressiveDashboard';
import { UAEGovernmentSeal } from '@/components/GovernmentBranding';

export const Dashboard = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const role = user?.role as Role;

  // Fetch dashboard data based on role with error handling and cache support
  const dashboardQueryKey = queryKeys.dashboard.data(role);
  const {
    data: dashboardData,
    isLoading,
    error: dashboardError,
    isError: isDashboardError
  } = useQuery({
    queryKey: dashboardQueryKey,
    queryFn: async () => {
      if (role === Role.GOVERNMENT || role === Role.ADMIN) {
        return dashboardService.getGovernmentDashboard();
      }
      return dashboardService.getDashboardData();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2, // Retry twice on failure
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Fetch recent activity with cache support
  const {
    data: recentActivityData,
    isLoading: isLoadingActivity,
    error: activityError
  } = useQuery({
    queryKey: queryKeys.dashboard.recentActivity(),
    queryFn: () => dashboardService.getRecentActivity(10),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch critical alerts
  const {
    data: alertsData,
    isLoading: isLoadingAlerts,
  } = useQuery({
    queryKey: queryKeys.dashboard.criticalAlerts(role),
    queryFn: () => dashboardService.getCriticalAlerts(role),
    staleTime: 1 * 60 * 1000, // 1 minute - alerts need to be fresh
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });

  // Check for cached data on error
  const [cachedDashboard, setCachedDashboard] = useState<any>(null);
  const [cachedActivity, setCachedActivity] = useState<any>(null);
  const [isUsingCache, setIsUsingCache] = useState(false);

  useEffect(() => {
    const dashboardCache = cacheService.get(`dashboard_${role}`);
    const activityCache = cacheService.get('dashboard_recent_activity');

    if (dashboardCache) {
      setCachedDashboard(dashboardCache);
    }
    if (activityCache) {
      setCachedActivity(activityCache);
    }

    setIsUsingCache((isDashboardError || !dashboardData) && !!dashboardCache);
  }, [role, isDashboardError, dashboardData]);

  // Cache successful responses
  useEffect(() => {
    if (dashboardData && !isDashboardError) {
      cacheService.set(`dashboard_${role}`, dashboardData, 5 * 60 * 1000);
    }
  }, [dashboardData, isDashboardError, role]);

  useEffect(() => {
    if (recentActivityData && !activityError) {
      cacheService.set('dashboard_recent_activity', recentActivityData, 2 * 60 * 1000);
    }
  }, [recentActivityData, activityError]);

  // Use cached data if available
  const effectiveDashboardData = dashboardData || cachedDashboard;
  const effectiveActivityData = recentActivityData?.data || cachedActivity?.data || [];

  // Handle both response structures: { data: { kpis: ... } } and { kpis: ... }
  const kpis = effectiveDashboardData?.data?.kpis || effectiveDashboardData?.data?.data?.kpis || effectiveDashboardData?.kpis;
  const recentActivity = effectiveActivityData || [];
  const criticalAlerts = alertsData?.data || [];


  if (isLoading && !cachedDashboard) {
    return <PageSkeleton />;
  }

  // Handle error state with comprehensive error handling
  if (isDashboardError && !cachedDashboard) {
    return (
      <Box sx={{ p: 4 }}>
        <ErrorHandler
          error={dashboardError}
          onRetry={async () => {
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: dashboardQueryKey }),
              queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.recentActivity() }),
              queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.criticalAlerts(role) }),
            ]);
          }}
          context="Dashboard"
          cacheKey={`dashboard_${role}`}
          enableCache={true}
          showCachedData={true}
          autoRetry={true}
          fullPage={false}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)', // Full viewport minus header
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Subtle Government Authority Indicator - Top Right */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 1,
          display: { xs: 'none', md: 'flex' },
        }}
      >
        <UAEGovernmentSeal size="small" variant="minimal" showTooltip={true} />
      </Box>

      {/* Cache Mode Indicator */}
      {isUsingCache && (
        <Alert
          severity="info"
          icon={<CloudDoneIcon />}
          sx={{ mb: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
                queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.recentActivity() });
              }}
            >
              Refresh
            </Button>
          }
        >
          Showing cached data. Some information may be outdated.
        </Alert>
      )}

      {/* Progressive Dashboard with Priority-Based Loading */}
      <ProgressiveDashboard
        dashboardData={effectiveDashboardData}
        recentActivity={recentActivity}
        criticalAlerts={criticalAlerts}
        isLoading={isLoading && !isUsingCache}
        isLoadingActivity={isLoadingActivity}
        isLoadingAlerts={isLoadingAlerts}
      />
    </Box>
  );
};
