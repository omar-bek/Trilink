import { useState, useEffect } from 'react';
import { Box, Button, LinearProgress, Typography, Stack, Chip } from '@mui/material';
import { Refresh, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import { ErrorType } from './ErrorStates';

interface RetryLogicProps {
  onRetry: () => Promise<void> | void;
  maxRetries?: number;
  errorType?: ErrorType;
  autoRetry?: boolean;
  autoRetryDelay?: number;
  onRetryExhausted?: () => void;
}

export const RetryLogic = ({
  onRetry,
  maxRetries = 3,
  errorType,
  autoRetry = false,
  autoRetryDelay = 5000,
  onRetryExhausted,
}: RetryLogicProps) => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastRetryTime, setLastRetryTime] = useState<Date | null>(null);
  const [retryHistory, setRetryHistory] = useState<Array<{ attempt: number; success: boolean; timestamp: Date }>>([]);
  const [nextRetryIn, setNextRetryIn] = useState<number | null>(null);

  // Calculate exponential backoff delay
  const getRetryDelay = (attempt: number): number => {
    // Exponential backoff: 2^attempt seconds, max 30 seconds
    const baseDelay = 1000; // 1 second
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    return Math.min(exponentialDelay, 30000);
  };

  // Auto-retry logic
  useEffect(() => {
    if (autoRetry && retryCount < maxRetries && !isRetrying) {
      const timer = setTimeout(() => {
        handleRetry();
      }, autoRetryDelay);

      return () => clearTimeout(timer);
    }
  }, [autoRetry, retryCount, maxRetries, autoRetryDelay]);

  // Countdown timer for next retry
  useEffect(() => {
    if (nextRetryIn !== null && nextRetryIn > 0) {
      const timer = setInterval(() => {
        setNextRetryIn((prev) => (prev !== null ? Math.max(0, prev - 1000) : null));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [nextRetryIn]);

  const handleRetry = async () => {
    if (retryCount >= maxRetries || isRetrying) {
      return;
    }

    setIsRetrying(true);
    setLastRetryTime(new Date());

    try {
      await onRetry();
      
      // Success - record and reset
      setRetryHistory((prev) => [
        ...prev,
        { attempt: retryCount + 1, success: true, timestamp: new Date() },
      ]);
      
      // Reset on success
      setRetryCount(0);
      setIsRetrying(false);
      setNextRetryIn(null);
    } catch (error) {
      // Failure - record and increment
      const newRetryCount = retryCount + 1;
      setRetryHistory((prev) => [
        ...prev,
        { attempt: newRetryCount, success: false, timestamp: new Date() },
      ]);
      
      setRetryCount(newRetryCount);
      setIsRetrying(false);

      // Calculate next retry delay
      if (newRetryCount < maxRetries) {
        const delay = getRetryDelay(newRetryCount);
        setNextRetryIn(delay);
        
        // Auto-retry if enabled
        if (autoRetry) {
          setTimeout(() => {
            setNextRetryIn(null);
            handleRetry();
          }, delay);
        }
      } else {
        // Retries exhausted
        if (onRetryExhausted) {
          onRetryExhausted();
        }
      }
    }
  };

  const canRetry = retryCount < maxRetries && !isRetrying;
  const retriesExhausted = retryCount >= maxRetries;

  return (
    <Box sx={{ mt: 3 }}>
      <Stack spacing={2} alignItems="center">
        {isRetrying && (
          <Box sx={{ width: '100%', maxWidth: 400 }}>
            <LinearProgress />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
              Retrying... (Attempt {retryCount + 1} of {maxRetries})
            </Typography>
          </Box>
        )}

        {!isRetrying && canRetry && (
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={handleRetry}
            disabled={isRetrying}
            size="large"
          >
            Retry Now
            {retryCount > 0 && ` (${retryCount}/${maxRetries})`}
          </Button>
        )}

        {nextRetryIn !== null && nextRetryIn > 0 && !isRetrying && (
          <Typography variant="body2" color="text.secondary">
            Next retry in {Math.ceil(nextRetryIn / 1000)} seconds
          </Typography>
        )}

        {retriesExhausted && (
          <Box sx={{ textAlign: 'center' }}>
            <ErrorIcon color="error" sx={{ fontSize: 32, mb: 1 }} />
            <Typography variant="body2" color="error" sx={{ mb: 2 }}>
              Maximum retry attempts reached ({maxRetries})
            </Typography>
          </Box>
        )}

        {retryHistory.length > 0 && (
          <Box sx={{ width: '100%', mt: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Retry History:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
              {retryHistory.map((entry, idx) => (
                <Chip
                  key={idx}
                  icon={entry.success ? <CheckCircle /> : <ErrorIcon />}
                  label={`Attempt ${entry.attempt}`}
                  color={entry.success ? 'success' : 'error'}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Stack>
          </Box>
        )}

        {lastRetryTime && (
          <Typography variant="caption" color="text.secondary">
            Last retry: {lastRetryTime.toLocaleTimeString()}
          </Typography>
        )}
      </Stack>
    </Box>
  );
};
