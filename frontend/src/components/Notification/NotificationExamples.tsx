/**
 * Notification System Usage Examples
 * 
 * This file demonstrates how to use the global notification system
 * throughout the application.
 */

import { notificationService } from '@/utils/notification';
import { Button, Box } from '@mui/material';

/**
 * Example: Using notifications in React components
 */
export const NotificationExamples = () => {
  const handleSuccess = () => {
    notificationService.showSuccess('Operation completed successfully!');
  };

  const handleError = () => {
    notificationService.showError('Failed to process request. Please try again.');
  };

  const handleWarning = () => {
    notificationService.showWarning('Please review your input before submitting.');
  };

  const handleInfo = () => {
    notificationService.showInfo('New features are available. Check them out!');
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, p: 2 }}>
      <Button variant="contained" color="success" onClick={handleSuccess}>
        Show Success
      </Button>
      <Button variant="contained" color="error" onClick={handleError}>
        Show Error
      </Button>
      <Button variant="contained" color="warning" onClick={handleWarning}>
        Show Warning
      </Button>
      <Button variant="contained" color="info" onClick={handleInfo}>
        Show Info
      </Button>
    </Box>
  );
};

/**
 * Example: Using notifications in hooks (mutation callbacks)
 * 
 * ```tsx
 * export const useCreateItem = () => {
 *   const queryClient = useQueryClient();
 * 
 *   return useMutation({
 *     mutationFn: (data: CreateItemDto) => itemService.create(data),
 *     onSuccess: () => {
 *       queryClient.invalidateQueries({ queryKey: ['items'] });
 *       notificationService.showSuccess('Item created successfully');
 *     },
 *     onError: (error: any) => {
 *       const message = error.response?.data?.message || 'Failed to create item';
 *       notificationService.showError(message);
 *     },
 *   });
 * };
 * ```
 */

/**
 * Example: Using notifications in services (API interceptors)
 * 
 * ```tsx
 * // In axios interceptor
 * api.interceptors.response.use(
 *   (response) => response,
 *   (error) => {
 *     if (error.response?.status === 401) {
 *       notificationService.showError('Session expired. Please login again.');
 *     } else if (error.response?.status >= 500) {
 *       notificationService.showError('Server error. Please try again later.');
 *     }
 *     return Promise.reject(error);
 *   }
 * );
 * ```
 */

/**
 * Example: Using notifications with custom duration
 * 
 * ```tsx
 * // Show error for longer duration (default is 8000ms for errors)
 * notificationService.showError('Critical error occurred', { duration: 10000 });
 * 
 * // Show success for shorter duration
 * notificationService.showSuccess('Saved', { duration: 3000 });
 * ```
 */
