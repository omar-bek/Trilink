import { useState, useCallback, useRef, useEffect } from 'react';
import { Snackbar, Alert, AlertColor, SnackbarOrigin } from '@mui/material';

export interface NotificationOptions {
    severity?: AlertColor;
    duration?: number;
    anchorOrigin?: SnackbarOrigin;
    action?: React.ReactNode;
}

export interface Notification {
    id: string;
    message: string;
    severity: AlertColor;
    duration: number;
    anchorOrigin?: SnackbarOrigin;
    action?: React.ReactNode;
}

/**
 * Custom hook for managing notifications
 * Supports queuing multiple notifications
 */
export const useNotification = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
    const [open, setOpen] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Process notification queue
    useEffect(() => {
        if (notifications.length > 0 && !currentNotification) {
            const [first, ...rest] = notifications;
            setCurrentNotification(first);
            setNotifications(rest);
            setOpen(true);
        }
    }, [notifications, currentNotification]);

    // Auto-close current notification
    useEffect(() => {
        if (open && currentNotification) {
            timeoutRef.current = setTimeout(() => {
                handleClose();
            }, currentNotification.duration);
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [open, currentNotification]);

    const showNotification = useCallback(
        (message: string, options: NotificationOptions = {}) => {
            const notification: Notification = {
                id: `${Date.now()}-${Math.random()}`,
                message,
                severity: options.severity || 'info',
                duration: options.duration || 6000,
                anchorOrigin: options.anchorOrigin,
                action: options.action,
            };

            setNotifications((prev) => [...prev, notification]);
        },
        []
    );

    const showSuccess = useCallback(
        (message: string, options?: Omit<NotificationOptions, 'severity'>) => {
            showNotification(message, { ...options, severity: 'success' });
        },
        [showNotification]
    );

    const showError = useCallback(
        (message: string, options?: Omit<NotificationOptions, 'severity'>) => {
            showNotification(message, { ...options, severity: 'error', duration: 8000 });
        },
        [showNotification]
    );

    const showWarning = useCallback(
        (message: string, options?: Omit<NotificationOptions, 'severity'>) => {
            showNotification(message, { ...options, severity: 'warning' });
        },
        [showNotification]
    );

    const showInfo = useCallback(
        (message: string, options?: Omit<NotificationOptions, 'severity'>) => {
            showNotification(message, { ...options, severity: 'info' });
        },
        [showNotification]
    );

    const handleClose = useCallback(
        (event?: React.SyntheticEvent | Event, reason?: string) => {
            if (reason === 'clickaway') {
                return;
            }

            setOpen(false);
            // Move to next notification after animation
            setTimeout(() => {
                setCurrentNotification(null);
            }, 300);
        },
        []
    );

    const NotificationComponent = () => {
        if (!currentNotification) return null;

        return (
            <Snackbar
                open={open}
                autoHideDuration={currentNotification.duration}
                onClose={handleClose}
                anchorOrigin={
                    currentNotification.anchorOrigin || { vertical: 'bottom', horizontal: 'right' }
                }
                sx={{
                    '& .MuiSnackbarContent-root': {
                        minWidth: '300px',
                    },
                }}
            >
                <Alert
                    onClose={handleClose}
                    severity={currentNotification.severity}
                    sx={{ width: '100%' }}
                    action={currentNotification.action}
                    variant="filled"
                >
                    {currentNotification.message}
                </Alert>
            </Snackbar>
        );
    };

    return {
        showNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        NotificationComponent,
    };
};

