import { useState } from 'react';
import {
  Container,
  Paper,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { UAEGovernmentFlag, UAEGovernmentBadge } from '@/components/GovernmentBranding';
import { usePublicSettings } from '@/hooks/useSettings';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const { data: settingsData } = usePublicSettings();
  const settings = settingsData?.data;
  
  const siteName = settings?.siteName || 'TriLink';
  const siteDescription = settings?.siteDescription || 'Digital Trade & Procurement Platform';

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (value && !validateEmail(value)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.data?.message ||
                          'Login failed. Please check your credentials.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        padding: 3,
      }}
    >
      <Container component="main" maxWidth="xs">
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            width: '100%',
            backgroundColor: '#1E293B',
            border: '1px solid rgba(135, 206, 235, 0.3)',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 2 }}>
              <UAEGovernmentFlag size="large" variant="minimal" />
              <Typography component="h1" variant="h4" sx={{ fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.5px' }}>
                {siteName}
              </Typography>
            </Box>
            {siteDescription && (
              <Typography variant="body2" sx={{ color: '#CBD5E1', mb: 1.5 }}>
                {siteDescription}
              </Typography>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <UAEGovernmentBadge variant="official" size="small" label={siteDescription} />
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate aria-label="Login form">
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={handleEmailChange}
              error={!!emailError}
              helperText={emailError}
              disabled={loading}
              aria-describedby={emailError ? 'email-error' : undefined}
              aria-invalid={!!emailError}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" aria-hidden="true">
                    <Email />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              aria-describedby="password-helper"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" aria-hidden="true">
                    <Lock />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={loading}
                      type="button"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || !email || !password}
              aria-label={loading ? 'Signing in, please wait' : 'Sign in to your account'}
              aria-busy={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" aria-hidden="true" /> : null}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <Box sx={{ textAlign: 'center', mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link 
                component={RouterLink}
                to="/forgot-password" 
                variant="body2"
                aria-label="Forgot password? Reset your password"
              >
                Forgot password?
              </Link>
              <Link 
                component={RouterLink}
                to="/register" 
                variant="body2"
                aria-label="Don't have an account? Sign up"
              >
                Don't have an account? Sign up
              </Link>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};
