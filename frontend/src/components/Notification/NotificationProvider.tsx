import { useEffect, useRef } from 'react';
import { useNotification } from '@/hooks/useNotification';
import { notificationService } from '@/utils/notification';

/**
 * Global Notification Provider
 * 
 * Provides a centralized notification system using Material-UI Snackbar.
 * Supports success, error, warning, and info notifications with queuing.
 * 
 * Usage:
 * ```tsx
 * import { notificationService } from '@/utils/notification';
 * 
 * // In any component or service
 * notificationService.showSuccess('Operation completed successfully');
 * notificationService.showError('Something went wrong');
 * notificationService.showWarning('Please review your input');
 * notificationService.showInfo('New update available');
 * ```
 */
export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { NotificationComponent, showNotification, showSuccess, showError, showWarning, showInfo } = useNotification();
  const callbacksRef = useRef({ showNotification, showSuccess, showError, showWarning, showInfo });

  // Keep callbacks ref updated
  useEffect(() => {
    callbacksRef.current = { showNotification, showSuccess, showError, showWarning, showInfo };
  }, [showNotification, showSuccess, showError, showWarning, showInfo]);

  useEffect(() => {
    // Subscribe to global notification service
    const unsubscribe = notificationService.subscribe((message, severity) => {
      const callbacks = callbacksRef.current;
      callbacks.showNotification(message, { severity });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <>
      {children}
      <NotificationComponent />
    </>
  );
};
