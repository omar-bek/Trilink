import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';
import { dashboardService } from '@/services/dashboard.service';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook to fetch dashboard data based on user role
 */
export const useDashboard = () => {
  const { user } = useAuthStore();
  const role = user?.role as Role;

  const dashboardQuery = useQuery({
    queryKey: queryKeys.dashboard.data(role),
    queryFn: async () => {
      if (role === Role.GOVERNMENT || role === Role.ADMIN) {
        return dashboardService.getGovernmentDashboard();
      }
      return dashboardService.getDashboardData();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!user,
  });

  const recentActivityQuery = useQuery({
    queryKey: queryKeys.dashboard.recentActivity(),
    queryFn: () => dashboardService.getRecentActivity(10),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!user,
  });

  return {
    dashboardData: dashboardQuery.data?.data,
    recentActivity: recentActivityQuery.data?.data || [],
    isLoading: dashboardQuery.isLoading || recentActivityQuery.isLoading,
    isError: dashboardQuery.isError || recentActivityQuery.isError,
    error: dashboardQuery.error || recentActivityQuery.error,
    refetch: () => {
      dashboardQuery.refetch();
      recentActivityQuery.refetch();
    },
  };
};
