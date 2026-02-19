import { Container, Paper, Box, Typography, Button, Alert } from '@mui/material';
import { LockOutlined, ArrowBack } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { useEffect } from 'react';

interface LocationState {
  error?: string;
  statusCode?: number;
  from?: string;
}

export const Unauthorized = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  
  // Extract error information from location state or sessionStorage (fallback)
  useEffect(() => {
    // Check for pending navigation state from sessionStorage
    const pendingState = sessionStorage.getItem('navigation_state');
    if (pendingState && !location.state) {
      try {
        const parsed = JSON.parse(pendingState);
        if (parsed.path === '/unauthorized' && parsed.state) {
          // Update location state if available
          window.history.replaceState(parsed.state, '', '/unauthorized');
          sessionStorage.removeItem('navigation_state');
        }
      } catch (e) {
        // Ignore errors
      }
    }
  }, [location.state]);
  
  const state = (location.state as LocationState | null) || 
    (() => {
      // Try to get from sessionStorage as fallback
      try {
        const stored = sessionStorage.getItem('navigation_state');
        if (stored) {
          const parsed = JSON.parse(stored);
          return parsed.state;
        }
      } catch (e) {
        // Ignore
      }
      return null;
    })();
  
  const errorMessage = state?.error;
  const fromPath = state?.from;
  const statusCode = state?.statusCode;

  const handleGoBack = () => {
    if (fromPath && fromPath !== '/unauthorized') {
      navigate(fromPath);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
          <LockOutlined sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Access Denied
          </Typography>
          
          {/* Display error message from API if available */}
          {errorMessage && (
            <Alert severity="error" sx={{ mt: 2, mb: 2, textAlign: 'left' }}>
              <Typography variant="body2" component="div">
                <strong>Error Details:</strong>
                <br />
                {errorMessage}
                {statusCode && (
                  <>
                    <br />
                    <small>Status Code: {statusCode}</small>
                  </>
                )}
              </Typography>
            </Alert>
          )}
          
          {/* Default message if no specific error */}
          {!errorMessage && (
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              You don't have permission to access this resource.
              {user && (
                <>
                  <br />
                  <small>Your current role: <strong>{user.role}</strong></small>
                </>
              )}
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            {fromPath && fromPath !== '/unauthorized' && (
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={handleGoBack}
              >
                Go Back
              </Button>
            )}
            <Button variant="contained" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};
