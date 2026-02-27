import { ReactNode } from 'react';
import { Box, Container } from '@mui/material';
import { EnhancedErrorRecovery } from './EnhancedErrorRecovery';
import { ErrorType } from './ErrorStates';

interface ErrorHandlerProps {
  error: Error | unknown;
  title?: string;
  message?: string;
  onRetry?: () => Promise<void> | void;
  context?: string;
  cacheKey?: string;
  enableCache?: boolean;
  showCachedData?: boolean;
  autoRetry?: boolean;
  fallback?: ReactNode;
  fullPage?: boolean;
}

/**
 * Comprehensive Error Handler Component
 * 
 * Handles all error types with:
 * - Appropriate error state display
 * - Retry logic with exponential backoff
 * - Escalation paths
 * - Cached data fallback
 * - Degraded mode support
 */
export const ErrorHandler = ({
  error,
  title,
  message,
  onRetry,
  context,
  cacheKey,
  enableCache = true,
  showCachedData = true,
  autoRetry = false,
  fallback,
  fullPage = false,
}: ErrorHandlerProps) => {
  if (fallback) {
    return <>{fallback}</>;
  }

  const content = (
    <EnhancedErrorRecovery
      error={error}
      title={title}
      message={message}
      onRetry={onRetry}
      context={context}
      cacheKey={cacheKey}
      enableCache={enableCache}
      showCachedData={showCachedData}
      autoRetry={autoRetry}
    />
  );

  if (fullPage) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        {content}
      </Container>
    );
  }

  return <Box sx={{ p: 3 }}>{content}</Box>;
};

export default ErrorHandler;
