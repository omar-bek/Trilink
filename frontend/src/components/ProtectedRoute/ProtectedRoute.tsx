import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { ReactNode, useEffect, useState } from 'react';
import { Role } from '@/types';
import { LoadingScreen } from '@/components/Loading/LoadingScreen';
import { Box, CircularProgress } from '@mui/material';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: Role | Role[];
  allowedRoles?: Role[];
}

/**
 * ProtectedRoute Component
 * 
 * Secure route protection with proper initialization handling:
 * - Waits for auth initialization to complete (no artificial delays)
 * - Prevents race conditions with promise-based initialization
 * - Provides proper loading state during initialization
 * - Enforces authentication and role-based access control
 */
export const ProtectedRoute = ({ 
  children, 
  requiredRole,
  allowedRoles 
}: ProtectedRouteProps) => {
  const { 
    isAuthenticated, 
    user, 
    isInitialized, 
    waitForInitialization 
  } = useAuthStore();
  const location = useLocation();
  const [isInitializing, setIsInitializing] = useState(!isInitialized);

  useEffect(() => {
    // Wait for auth initialization to complete
    const initialize = async () => {
      if (!isInitialized) {
        try {
          await waitForInitialization();
        } catch (error) {
          // Initialization failed - will be handled by auth state
        } finally {
          setIsInitializing(false);
        }
      } else {
        setIsInitializing(false);
      }
    };

    initialize();
  }, [isInitialized, waitForInitialization]);

  // Show loading screen while initializing
  if (isInitializing || !isInitialized) {
    return <LoadingScreen message="Initializing authentication..." />;
  }

  // Check authentication - user must be authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Admin can access everything
  if (user.role === Role.ADMIN) {
    return <>{children}</>;
  }

  // Check required role - user must have one of the specified roles
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(user.role as Role)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Check allowed roles - user must have one of the allowed roles
  if (allowedRoles && !allowedRoles.includes(user.role as Role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // All checks passed - render protected content
  return <>{children}</>;
};

/**
 * PublicRoute Component
 * 
 * Route accessible to unauthenticated users only.
 * Redirects authenticated users to dashboard.
 * Also waits for auth initialization to prevent race conditions.
 */
export const PublicRoute = ({ children }: { children: ReactNode }) => {
  const { 
    isAuthenticated, 
    isInitialized, 
    waitForInitialization 
  } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(!isInitialized);

  useEffect(() => {
    // Wait for auth initialization to complete
    const initialize = async () => {
      if (!isInitialized) {
        try {
          await waitForInitialization();
        } catch (error) {
          // Initialization failed - will be handled by auth state
        } finally {
          setIsInitializing(false);
        }
      } else {
        setIsInitializing(false);
      }
    };

    initialize();
  }, [isInitialized, waitForInitialization]);

  // Show loading screen while initializing
  if (isInitializing || !isInitialized) {
    return <LoadingScreen message="Initializing..." />;
  }

  // Redirect authenticated users to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Render public content
  return <>{children}</>;
};

export const LoadingRoute = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
      }}
    >
      <CircularProgress />
    </Box>
  );
};
