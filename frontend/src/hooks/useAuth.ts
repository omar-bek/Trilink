import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';

/**
 * Custom hook for authentication-related functionality
 */
export const useAuth = () => {
  const { user, isAuthenticated, logout } = useAuthStore();

  const hasRole = (role: Role | Role[]): boolean => {
    if (!user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role as Role);
  };

  const isAdmin = (): boolean => {
    return user?.role === Role.ADMIN;
  };

  const isBuyer = (): boolean => {
    return user?.role === Role.BUYER;
  };

  const isSupplier = (): boolean => {
    return user?.role === Role.SUPPLIER;
  };

  const isGovernment = (): boolean => {
    return user?.role === Role.GOVERNMENT;
  };

  const canAccess = (allowedRoles: Role[]): boolean => {
    if (!user) return false;
    if (isAdmin()) return true; // Admin can access everything
    return allowedRoles.includes(user.role as Role);
  };

  return {
    user,
    isAuthenticated,
    logout,
    hasRole,
    isAdmin,
    isBuyer,
    isSupplier,
    isGovernment,
    canAccess,
  };
};
