import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService, SystemSettings, UpdateSettingsDto } from '@/services/settings.service';
import { notificationService } from '@/utils/notification';

export const useSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.getSettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const usePublicSettings = () => {
  return useQuery({
    queryKey: ['settings', 'public'],
    queryFn: () => settingsService.getPublicSettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateSettingsDto) => settingsService.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      notificationService.showSuccess('Settings updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.response?.data?.message || 'Failed to update settings';
      notificationService.showError(message);
    },
  });
};
