import { Box, Button, Alert, Typography, Stack } from '@mui/material';
import { Refresh, HelpOutline, ContactSupport } from '@mui/icons-material';
import { useState } from 'react';

interface ErrorRecoveryProps {
  error: Error | unknown;
  onRetry?: () => void;
  showEscalation?: boolean;
  context?: string;
}

export const ErrorRecovery = ({ error, onRetry, showEscalation = true, context }: ErrorRecoveryProps) => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
  const isNetworkError = errorMessage.toLowerCase().includes('network') || 
                         errorMessage.toLowerCase().includes('fetch') ||
                         errorMessage.toLowerCase().includes('timeout');

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    // Exponential backoff: wait 2^retryCount seconds
    const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30 seconds
    await new Promise(resolve => setTimeout(resolve, delay));
    
    if (onRetry) {
      try {
        await onRetry();
      } catch (e) {
        // Error will be handled by parent
      }
    }
    
    setIsRetrying(false);
  };

  const getEscalationPath = () => {
    if (context?.toLowerCase().includes('payment')) {
      return { team: 'Finance Team', email: 'finance@trilink.ae', phone: '+971-XX-XXX-XXXX' };
    }
    if (context?.toLowerCase().includes('contract') || context?.toLowerCase().includes('legal')) {
      return { team: 'Legal Team', email: 'legal@trilink.ae', phone: '+971-XX-XXX-XXXX' };
    }
    if (context?.toLowerCase().includes('government')) {
      return { team: 'Government Portal', email: 'government@trilink.ae', phone: '+971-XX-XXX-XXXX' };
    }
    return { team: 'Support Team', email: 'support@trilink.ae', phone: '+971-XX-XXX-XXXX' };
  };

  const escalation = getEscalationPath();

  return (
    <Alert 
      severity="error" 
      sx={{ mb: 2 }}
      action={
        <Stack direction="row" spacing={1}>
          {onRetry && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRetry}
              disabled={isRetrying || retryCount >= 3}
            >
              {isRetrying ? 'Retrying...' : `Retry${retryCount > 0 ? ` (${retryCount})` : ''}`}
            </Button>
          )}
          {showEscalation && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<ContactSupport />}
              onClick={() => {
                window.open(`mailto:${escalation.email}?subject=Support Request: ${context || 'Error'}&body=Error: ${errorMessage}`, '_blank');
              }}
            >
              Get Help
            </Button>
          )}
        </Stack>
      }
    >
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
        {isNetworkError ? 'Network Error' : 'Error Occurred'}
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        {errorMessage}
      </Typography>
      {isNetworkError && (
        <Typography variant="caption" color="text.secondary">
          Please check your internet connection and try again.
        </Typography>
      )}
      {retryCount >= 3 && (
        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
          Maximum retry attempts reached. Please contact support if the problem persists.
        </Typography>
      )}
      {showEscalation && (
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            <strong>Escalation Path:</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {escalation.team}: {escalation.email} | {escalation.phone}
          </Typography>
        </Box>
      )}
    </Alert>
  );
};
