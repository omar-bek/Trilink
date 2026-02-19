import { useQuery, useMutation } from '@tanstack/react-query';
import { analyticsService, AnalyticsFilters } from '@/services/analytics.service';
import { queryKeys } from '@/lib/queryKeys';

export const useGovernmentAnalytics = (filters?: AnalyticsFilters) => {
  return useQuery({
    queryKey: queryKeys.analytics.government(filters),
    queryFn: () => analyticsService.getGovernmentAnalytics(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });
};

export const useCompanyAnalytics = (filters?: AnalyticsFilters) => {
  return useQuery({
    queryKey: queryKeys.analytics.company(filters),
    queryFn: () => analyticsService.getCompanyAnalytics(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });
};

export const useStreamPurchaseRequests = () => {
  return useMutation({
    mutationFn: (filters?: AnalyticsFilters) => analyticsService.streamPurchaseRequests(filters),
    onSuccess: (blob) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `purchase-requests-${new Date().toISOString()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });
};
