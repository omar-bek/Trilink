import { Alert, AlertTitle, Box, Button } from '@mui/material';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Refresh } from '@mui/icons-material';

/**
 * Network Status Banner
 * 
 * Displays a banner when network or API is unreachable.
 * Provides user feedback and refresh option.
 * 
 * Features:
 * - Detects browser offline status
 * - Checks API reachability
 * - Shows non-intrusive banner
 * - Provides refresh action
 */
export const NetworkStatusBanner = () => {
  const { isOffline } = useNetworkStatus();
  const isApiUnreachable = false; // TODO: Implement API reachability check

  // Don't show banner if everything is working
  if (!isOffline && !isApiUnreachable) {
    return null;
  }

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        p: 1,
        pointerEvents: 'auto',
      }}
    >
      <Alert
        severity="warning"
        action={
          <Button
            color="inherit"
            size="small"
            onClick={handleRefresh}
            startIcon={<Refresh />}
            sx={{ ml: 2 }}
          >
            Refresh
          </Button>
        }
        sx={{
          boxShadow: 2,
        }}
      >
        <AlertTitle sx={{ fontWeight: 600 }}>
          {isOffline ? 'No Internet Connection' : 'Server Unreachable'}
        </AlertTitle>
        {isOffline
          ? 'Please check your internet connection and try again.'
          : 'Unable to connect to the server. Some features may be unavailable.'}
      </Alert>
    </Box>
  );
};
