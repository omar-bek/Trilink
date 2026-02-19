import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { setNavigateRef } from '@/utils/navigation';

/**
 * Router wrapper component that sets up navigation reference
 * for use outside React components (e.g., Axios interceptors)
 */
export const RouterWrapper = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessedPendingNav = useRef(false);

  useEffect(() => {
    // Set navigate function reference for use in non-React contexts
    setNavigateRef(navigate);
  }, [navigate]);

  useEffect(() => {
    // Check for pending navigation state from sessionStorage
    // This handles cases where navigation happened before router initialized
    // Only process once on mount
    if (!hasProcessedPendingNav.current) {
      const pendingState = sessionStorage.getItem('navigation_state');
      if (pendingState) {
        try {
          const { path, state } = JSON.parse(pendingState);
          // Only apply if we're not already on that path
          if (location.pathname !== path) {
            navigate(path, { replace: true, state });
          }
          sessionStorage.removeItem('navigation_state');
        } catch (e) {
          // Failed to apply pending navigation state - clear and continue
          sessionStorage.removeItem('navigation_state');
        }
        hasProcessedPendingNav.current = true;
      }
    }
  }, [navigate, location.pathname]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      setNavigateRef(null);
    };
  }, []);

  return <>{children}</>;
};
