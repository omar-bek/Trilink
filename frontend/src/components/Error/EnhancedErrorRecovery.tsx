import { Box, Stack, Alert, Typography, Paper, Button } from '@mui/material';
import { CloudDone as CloudDoneIcon, Info as InfoIcon } from '@mui/icons-material';
import { ErrorState, ErrorType, getErrorType } from './ErrorStates';
import { RetryLogic } from './RetryLogic';
import { EscalationPaths } from './EscalationPaths';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useState, useEffect } from 'react';

interface EnhancedErrorRecoveryProps {
  error: Error | unknown;
  title?: string;
  message?: string;
  onRetry?: () => Promise<void> | void;
  context?: string;
  cacheKey?: string;
  enableCache?: boolean;
  showCachedData?: boolean;
  autoRetry?: boolean;
}

export const EnhancedErrorRecovery = ({
  error,
  title,
  message,
  onRetry,
  context,
  cacheKey,
  enableCache = true,
  showCachedData = true,
  autoRetry = false,
}: EnhancedErrorRecoveryProps) => {
  const { handleError, getCachedData } = useErrorHandler();
  const [usingCachedData, setUsingCachedData] = useState(false);
  const [cachedData, setCachedData] = useState<any>(null);

  const errorInfo = handleError(error, {
    context,
    enableCache,
    cacheKey,
  });

  const errorType = errorInfo.type || getErrorType(error);

  // Check for cached data
  useEffect(() => {
    if (enableCache && cacheKey) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        setCachedData(cached);
        setUsingCachedData(true);
      }
    }
  }, [enableCache, cacheKey, getCachedData]);

  const handleRetry = async () => {
    setUsingCachedData(false);
    if (onRetry) {
      await onRetry();
    }
  };

  const handleRetryExhausted = () => {
    // Could trigger escalation or notification here
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Stack spacing={3}>
        {/* Cached Data Notice */}
        {usingCachedData && cachedData && showCachedData && (
          <Alert
            severity="info"
            icon={<CloudDoneIcon />}
            action={
              <Button color="inherit" size="small" onClick={handleRetry}>
                Refresh
              </Button>
            }
          >
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              Showing Cached Data
            </Typography>
            <Typography variant="caption">
              You're viewing previously loaded data. Some information may be outdated.
            </Typography>
          </Alert>
        )}

        {/* Error State Display */}
        <ErrorState
          type={errorType}
          title={title}
          details={message || errorInfo.message}
          errorCode={errorInfo.errorCode || errorInfo.statusCode?.toString()}
          timestamp={errorInfo.timestamp}
          showDetails={true}
        />

        {/* Retry Logic */}
        {errorInfo.canRetry && onRetry && (
          <RetryLogic
            onRetry={handleRetry}
            errorType={errorType}
            autoRetry={autoRetry}
            onRetryExhausted={handleRetryExhausted}
          />
        )}

        {/* Escalation Paths */}
        {errorInfo.canEscalate && (
          <EscalationPaths
            errorType={errorType}
            context={context}
            errorDetails={errorInfo.message}
            showFullDetails={true}
          />
        )}

        {/* Partial Data Mode */}
        {errorType === ErrorType.PARTIAL_DATA && cachedData && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: 'warning.main',
              borderRadius: 2,
              bgcolor: 'warning.light',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <InfoIcon color="warning" />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Degraded Mode Active
              </Typography>
            </Stack>
            <Typography variant="body2">
              You can continue working with the available data. Some features may be limited until
              the connection is restored.
            </Typography>
          </Paper>
        )}
      </Stack>
    </Box>
  );
};
