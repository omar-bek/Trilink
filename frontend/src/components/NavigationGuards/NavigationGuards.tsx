import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';
import { findNavigationItemByPath } from '@/config/navigation';

interface NavigationGuardProps {
  children: React.ReactNode;
  requiredRole?: Role | Role[];
  allowedRoles?: Role[];
}

/**
 * Navigation guard component that checks route access based on user role
 * Should be used within ProtectedRoute for additional role checks
 */
export const NavigationGuard = ({
  children,
  requiredRole,
  allowedRoles,
}: NavigationGuardProps) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) return;

    const userRole = user.role as Role;

    // Admin can access everything
    if (userRole === Role.ADMIN) {
      return;
    }

    // Check required role
    if (requiredRole) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (!roles.includes(userRole)) {
        navigate('/unauthorized', { replace: true });
        return;
      }
    }

    // Check allowed roles
    if (allowedRoles && !allowedRoles.includes(userRole)) {
      navigate('/unauthorized', { replace: true });
      return;
    }

    // Check navigation config for route access
    const navItem = findNavigationItemByPath(location.pathname);
    if (navItem && navItem.roles) {
      // Admin can access everything
      if (userRole !== Role.ADMIN && !navItem.roles.includes(userRole)) {
        navigate('/unauthorized', { replace: true });
        return;
      }
    }
  }, [user, location.pathname, requiredRole, allowedRoles, navigate]);

  return <>{children}</>;
};

/**
 * Hook to check if user can access a route
 */
export const useCanAccessRoute = (path: string): boolean => {
  const { user } = useAuthStore();

  if (!user) return false;

  const userRole = user.role as Role;
  const navItem = findNavigationItemByPath(path);

  if (!navItem) return true; // Allow unknown routes (might be dynamic)

  // Admin can access everything
  if (userRole === Role.ADMIN) return true;

  // If no roles specified, all authenticated users can access
  if (!navItem.roles) return true;

  return navItem.roles.includes(userRole);
};
