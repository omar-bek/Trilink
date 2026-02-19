import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

/**
 * Loading screen component for auth initialization and route protection
 * Provides consistent loading UI across the application
 */
export const LoadingScreen = ({ 
  message = 'Loading...', 
  fullScreen = true 
}: LoadingScreenProps) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2,
        ...(fullScreen && {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          minHeight: '100vh',
          backgroundColor: '#ffffff',
        }),
        ...(!fullScreen && {
          minHeight: '50vh',
        }),
      }}
    >
      <CircularProgress size={48} />
      {message && (
        <Typography variant="body1" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );
};
