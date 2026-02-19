/**
 * Navigation utility for programmatic navigation outside React components
 * Used by Axios interceptors and other non-React contexts
 */

let navigateRef: ((to: string, options?: { replace?: boolean; state?: any }) => void) | null = null;

const NAVIGATION_STATE_KEY = 'navigation_state';

/**
 * Set the navigate function reference from React Router
 * Should be called during app initialization
 */
export const setNavigateRef = (navigate: typeof navigateRef) => {
  navigateRef = navigate;
  
  // If there's pending navigation state, apply it
  const pendingState = sessionStorage.getItem(NAVIGATION_STATE_KEY);
  if (pendingState) {
    try {
      const { path, state } = JSON.parse(pendingState);
      navigateRef(path, { replace: true, state });
      sessionStorage.removeItem(NAVIGATION_STATE_KEY);
    } catch (e) {
      // Failed to apply pending navigation state - clear and continue
      sessionStorage.removeItem(NAVIGATION_STATE_KEY);
    }
  }
};

/**
 * Navigate to a route programmatically
 * Falls back to window.location if navigate ref is not set
 */
export const navigateTo = (to: string, options?: { replace?: boolean; state?: any }) => {
  if (navigateRef) {
    navigateRef(to, options);
  } else {
    // Fallback: Store state in sessionStorage and use window.location
    // The RouterWrapper will pick up the state when it initializes
    if (options?.state) {
      sessionStorage.setItem(NAVIGATION_STATE_KEY, JSON.stringify({
        path: to,
        state: options.state,
      }));
    }
    
    // Use window.location as fallback
    if (options?.replace) {
      window.location.replace(to);
    } else {
      window.location.href = to;
    }
  }
};

/**
 * Get current pathname
 */
export const getCurrentPath = (): string => {
  return window.location.pathname;
};
