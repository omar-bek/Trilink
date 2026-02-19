import { Box, Alert, AlertTitle, IconButton, Typography, Chip } from '@mui/material';
import { Close, ErrorOutline, Warning } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export enum AlertPriority {
    CRITICAL = 'critical', // P0 - Red, cannot dismiss
    HIGH = 'high', // P1 - Orange, can dismiss
}

export interface CriticalAlert {
    id: string;
    priority: AlertPriority;
    title: string;
    message: string;
    count?: number;
    amount?: number;
    currency?: string;
    actionUrl: string;
    actionLabel?: string;
}

interface CriticalAlertsBannerProps {
    alerts: CriticalAlert[];
    loading?: boolean;
}

export const CriticalAlertsBanner = ({ alerts, loading = false }: CriticalAlertsBannerProps) => {
    const navigate = useNavigate();
    const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

    if (loading || alerts.length === 0) {
        return null;
    }

    // Filter out dismissed alerts (only for HIGH priority)
    const visibleAlerts = alerts.filter(
        (alert) => !dismissedAlerts.has(alert.id) || alert.priority === AlertPriority.CRITICAL
    );

    if (visibleAlerts.length === 0) {
        return null;
    }

    // Separate critical and high priority alerts
    const criticalAlerts = visibleAlerts.filter((a) => a.priority === AlertPriority.CRITICAL);
    const highAlerts = visibleAlerts.filter((a) => a.priority === AlertPriority.HIGH);

    const handleDismiss = (alertId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        setDismissedAlerts((prev) => new Set(prev).add(alertId));
    };

    const handleAlertClick = (alert: CriticalAlert) => {
        navigate(alert.actionUrl);
    };

    const formatAlertMessage = (alert: CriticalAlert): string => {
        let message = alert.message;
        if (alert.count !== undefined && alert.count > 0) {
            // Only add count if it's not already in the message
            if (!message.includes(String(alert.count))) {
                message = `${alert.count} ${message}`;
            }
        }
        if (alert.amount !== undefined) {
            const formattedAmount = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: alert.currency || 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(alert.amount);
            message = `${message} (${formattedAmount})`;
        }
        return message;
    };

    return (
        <Box sx={{ mb: 3 }}>
            {/* Critical Alerts (P0) - Cannot dismiss */}
            {criticalAlerts.map((alert) => (
                <Alert
                    key={alert.id}
                    severity="error"
                    icon={<ErrorOutline />}
                    sx={{
                        mb: 1,
                        cursor: 'pointer',
                        background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
                        color: '#ffffff',
                        borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        '& .MuiAlert-icon': {
                            color: '#ffffff',
                            fontSize: '1.5rem',
                        },
                        '&:hover': {
                            background: 'linear-gradient(135deg, #b71c1c 0%, #8b0000 100%)',
                            boxShadow: '0 6px 16px rgba(211, 47, 47, 0.4)',
                            transform: 'translateY(-2px)',
                        },
                        animation: 'pulse 2s ease-in-out infinite',
                        '@keyframes pulse': {
                            '0%, 100%': {
                                opacity: 1,
                            },
                            '50%': {
                                opacity: 0.95,
                            },
                        },
                        transition: 'all 0.3s ease-in-out',
                    }}
                    onClick={() => handleAlertClick(alert)}
                >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%', gap: 2 }}>
                        <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                <AlertTitle sx={{ color: '#ffffff', fontWeight: 700, mb: 0, fontSize: '1.1rem' }}>
                                    {alert.title}
                                </AlertTitle>
                                {alert.count !== undefined && alert.count > 0 && (
                                    <Box
                                        sx={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.25)',
                                            borderRadius: '12px',
                                            px: 1.5,
                                            py: 0.5,
                                            minWidth: '40px',
                                            textAlign: 'center',
                                        }}
                                    >
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                color: '#ffffff',
                                                fontWeight: 700,
                                                fontSize: '1.1rem',
                                                lineHeight: 1,
                                            }}
                                        >
                                            {alert.count}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: 'rgba(255, 255, 255, 0.95)',
                                    fontSize: '0.95rem',
                                    mb: alert.actionLabel ? 1.5 : 0,
                                }}
                            >
                                {formatAlertMessage(alert)}
                            </Typography>
                            {alert.actionLabel && (
                                <Chip
                                    label={alert.actionLabel}
                                    size="medium"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAlertClick(alert);
                                    }}
                                    sx={{
                                        mt: 0.5,
                                        backgroundColor: 'rgba(255, 255, 255, 0.25)',
                                        color: '#ffffff',
                                        fontWeight: 600,
                                        fontSize: '0.875rem',
                                        height: '32px',
                                        cursor: 'pointer',
                                        '&:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.35)',
                                        },
                                        transition: 'all 0.2s ease-in-out',
                                    }}
                                />
                            )}
                        </Box>
                    </Box>
                </Alert>
            ))}

            {/* High Priority Alerts (P1) - Can dismiss */}
            {highAlerts.map((alert) => (
                <Alert
                    key={alert.id}
                    severity="warning"
                    icon={<Warning />}
                    action={
                        <IconButton
                            aria-label="dismiss"
                            color="inherit"
                            size="small"
                            onClick={(e) => handleDismiss(alert.id, e)}
                            sx={{ color: '#ffffff' }}
                        >
                            <Close fontSize="inherit" />
                        </IconButton>
                    }
                    sx={{
                        mb: 1,
                        cursor: 'pointer',
                        background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                        color: '#ffffff',
                        borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(255, 152, 0, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        '& .MuiAlert-icon': {
                            color: '#ffffff',
                            fontSize: '1.5rem',
                        },
                        '&:hover': {
                            background: 'linear-gradient(135deg, #f57c00 0%, #e65100 100%)',
                            boxShadow: '0 6px 16px rgba(255, 152, 0, 0.4)',
                            transform: 'translateY(-2px)',
                        },
                        transition: 'all 0.3s ease-in-out',
                    }}
                    onClick={() => handleAlertClick(alert)}
                >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%', gap: 2 }}>
                        <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                <AlertTitle sx={{ color: '#ffffff', fontWeight: 700, mb: 0, fontSize: '1.1rem' }}>
                                    {alert.title}
                                </AlertTitle>
                                {alert.count !== undefined && alert.count > 0 && (
                                    <Box
                                        sx={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.25)',
                                            borderRadius: '12px',
                                            px: 1.5,
                                            py: 0.5,
                                            minWidth: '40px',
                                            textAlign: 'center',
                                        }}
                                    >
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                color: '#ffffff',
                                                fontWeight: 700,
                                                fontSize: '1.1rem',
                                                lineHeight: 1,
                                            }}
                                        >
                                            {alert.count}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: 'rgba(255, 255, 255, 0.95)',
                                    fontSize: '0.95rem',
                                    mb: alert.actionLabel ? 1.5 : 0,
                                }}
                            >
                                {formatAlertMessage(alert)}
                            </Typography>
                            {alert.actionLabel && (
                                <Chip
                                    label={alert.actionLabel}
                                    size="medium"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAlertClick(alert);
                                    }}
                                    sx={{
                                        mt: 0.5,
                                        backgroundColor: 'rgba(255, 255, 255, 0.25)',
                                        color: '#ffffff',
                                        fontWeight: 600,
                                        fontSize: '0.875rem',
                                        height: '32px',
                                        cursor: 'pointer',
                                        '&:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.35)',
                                        },
                                        transition: 'all 0.2s ease-in-out',
                                    }}
                                />
                            )}
                        </Box>
                    </Box>
                </Alert>
            ))}
        </Box>
    );
};
