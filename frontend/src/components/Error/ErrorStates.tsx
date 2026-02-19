import { Box, Typography, Alert, AlertTitle, Paper, Stack } from '@mui/material';
import {
    CloudOff as CloudOffIcon,
    WifiOff as WifiOffIcon,
    Lock as LockIcon,
    Payment as PaymentIcon,
    Storage as StorageIcon,
    ErrorOutline as ErrorIcon,
} from '@mui/icons-material';
import { ReactNode } from 'react';

export enum ErrorType {
    API_DOWNTIME = 'API_DOWNTIME',
    NETWORK_LOSS = 'NETWORK_LOSS',
    PERMISSION_ERROR = 'PERMISSION_ERROR',
    PAYMENT_FAILURE = 'PAYMENT_FAILURE',
    PARTIAL_DATA = 'PARTIAL_DATA',
    UNKNOWN = 'UNKNOWN',
}

interface ErrorStateConfig {
    icon: ReactNode;
    title: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
    actionable: boolean;
    showRetry: boolean;
    showEscalation: boolean;
}

const errorConfigs: Record<ErrorType, ErrorStateConfig> = {
    [ErrorType.API_DOWNTIME]: {
        icon: <CloudOffIcon sx={{ fontSize: 48 }} />,
        title: 'Service Temporarily Unavailable',
        message: 'Our servers are currently experiencing issues. Our team has been notified and is working to resolve this.',
        severity: 'error',
        actionable: true,
        showRetry: true,
        showEscalation: true,
    },
    [ErrorType.NETWORK_LOSS]: {
        icon: <WifiOffIcon sx={{ fontSize: 48 }} />,
        title: 'Connection Lost',
        message: 'Unable to connect to our servers. Please check your internet connection and try again.',
        severity: 'warning',
        actionable: true,
        showRetry: true,
        showEscalation: false,
    },
    [ErrorType.PERMISSION_ERROR]: {
        icon: <LockIcon sx={{ fontSize: 48 }} />,
        title: 'Access Denied',
        message: 'You do not have permission to access this resource. Please contact your administrator if you believe this is an error.',
        severity: 'error',
        actionable: false,
        showRetry: false,
        showEscalation: true,
    },
    [ErrorType.PAYMENT_FAILURE]: {
        icon: <PaymentIcon sx={{ fontSize: 48 }} />,
        title: 'Payment Processing Failed',
        message: 'We were unable to process your payment. Please verify your payment details and try again. If the problem persists, contact our finance team.',
        severity: 'error',
        actionable: true,
        showRetry: true,
        showEscalation: true,
    },
    [ErrorType.PARTIAL_DATA]: {
        icon: <StorageIcon sx={{ fontSize: 48 }} />,
        title: 'Incomplete Data Loaded',
        message: 'Some data could not be loaded. You can continue working with the available information, but some features may be limited.',
        severity: 'warning',
        actionable: true,
        showRetry: true,
        showEscalation: false,
    },
    [ErrorType.UNKNOWN]: {
        icon: <ErrorIcon sx={{ fontSize: 48 }} />,
        title: 'An Error Occurred',
        message: 'Something unexpected happened. Our team has been notified and will investigate.',
        severity: 'error',
        actionable: true,
        showRetry: true,
        showEscalation: true,
    },
};

interface ErrorStateProps {
    type: ErrorType;
    details?: string;
    errorCode?: string | number;
    timestamp?: Date;
    showDetails?: boolean;
}

export const ErrorState = ({
    type,
    details,
    errorCode,
    timestamp,
    showDetails = false,
}: ErrorStateProps) => {
    const config = errorConfigs[type] || errorConfigs[ErrorType.UNKNOWN];

    return (
        <Paper
            elevation={0}
            sx={{
                p: 4,
                textAlign: 'center',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
            }}
        >
            <Box sx={{ color: `${config.severity}.main`, mb: 2 }}>
                {config.icon}
            </Box>

            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                {config.title}
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
                {config.message}
            </Typography>

            {details && (
                <Alert severity={config.severity} sx={{ mb: 2, textAlign: 'left' }}>
                    <AlertTitle>Details</AlertTitle>
                    {details}
                </Alert>
            )}

            {showDetails && (errorCode || timestamp) && (
                <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
                    {errorCode && (
                        <Typography variant="caption" color="text.secondary">
                            Error Code: {errorCode}
                        </Typography>
                    )}
                    {timestamp && (
                        <Typography variant="caption" color="text.secondary">
                            Time: {timestamp.toLocaleString()}
                        </Typography>
                    )}
                </Stack>
            )}
        </Paper>
    );
};

export const getErrorType = (error: any): ErrorType => {
    if (!error) return ErrorType.UNKNOWN;

    // Network errors
    if (
        error.code === 'ERR_NETWORK' ||
        error.code === 'ECONNABORTED' ||
        error.message?.includes('Network Error') ||
        error.message?.includes('timeout') ||
        error.message?.includes('Failed to fetch')
    ) {
        // Check if it's a network connectivity issue vs API downtime
        if (navigator.onLine === false) {
            return ErrorType.NETWORK_LOSS;
        }
        return ErrorType.API_DOWNTIME;
    }

    // HTTP status codes
    if (error.response) {
        const status = error.response.status;

        if (status === 0) {
            return ErrorType.API_DOWNTIME;
        }

        if (status === 403 || status === 401) {
            return ErrorType.PERMISSION_ERROR;
        }

        if (status === 402 || status === 422) {
            // Payment-related errors
            if (error.response.data?.message?.toLowerCase().includes('payment') ||
                error.response.data?.error?.toLowerCase().includes('payment')) {
                return ErrorType.PAYMENT_FAILURE;
            }
        }

        if (status >= 500) {
            return ErrorType.API_DOWNTIME;
        }
    }

    // Payment-specific error messages
    if (
        error.message?.toLowerCase().includes('payment') ||
        error.message?.toLowerCase().includes('card') ||
        error.message?.toLowerCase().includes('transaction')
    ) {
        return ErrorType.PAYMENT_FAILURE;
    }

    // Partial data (206 or specific indicators)
    if (error.response?.status === 206 || error.partial === true) {
        return ErrorType.PARTIAL_DATA;
    }

    return ErrorType.UNKNOWN;
};
