/**
 * Accessibility Utilities
 * 
 * Helper functions and constants for accessibility compliance
 */

/**
 * ARIA Labels for common actions
 */
export const ariaLabels = {
  // Navigation
  openDrawer: 'Open navigation menu',
  closeDrawer: 'Close navigation menu',
  userMenu: 'User account menu',
  notifications: 'Notifications',
  
  // Actions
  edit: 'Edit',
  delete: 'Delete',
  view: 'View details',
  download: 'Download',
  upload: 'Upload',
  save: 'Save',
  cancel: 'Cancel',
  submit: 'Submit',
  close: 'Close',
  expand: 'Expand',
  collapse: 'Collapse',
  
  // Pagination
  firstPage: 'Go to first page',
  lastPage: 'Go to last page',
  nextPage: 'Go to next page',
  previousPage: 'Go to previous page',
  pageNumber: (page: number) => `Go to page ${page}`,
  itemsPerPage: 'Items per page',
  
  // Forms
  search: 'Search',
  filter: 'Filter',
  sort: 'Sort',
  
  // Status
  loading: 'Loading',
  error: 'Error',
  success: 'Success',
} as const;

/**
 * Keyboard event handlers for accessibility
 */
export const keyboardHandlers = {
  /**
   * Handle Enter key press
   */
  onEnter: (handler: () => void) => (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handler();
    }
  },
  
  /**
   * Handle Escape key press
   */
  onEscape: (handler: () => void) => (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      handler();
    }
  },
  
  /**
   * Handle Arrow keys for navigation
   */
  onArrowKeys: (handlers: {
    up?: () => void;
    down?: () => void;
    left?: () => void;
    right?: () => void;
  }) => (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        handlers.up?.();
        break;
      case 'ArrowDown':
        event.preventDefault();
        handlers.down?.();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        handlers.left?.();
        break;
      case 'ArrowRight':
        event.preventDefault();
        handlers.right?.();
        break;
    }
  },
  
  /**
   * Handle Space key (for buttons/links)
   */
  onSpace: (handler: () => void) => (event: React.KeyboardEvent) => {
    if (event.key === ' ') {
      event.preventDefault();
      handler();
    }
  },
};

/**
 * Focus management utilities
 */
export const focusManagement = {
  /**
   * Trap focus within an element
   */
  trapFocus: (element: HTMLElement | null) => {
    if (!element) return;
    
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    
    element.addEventListener('keydown', handleTab);
    firstElement?.focus();
    
    return () => {
      element.removeEventListener('keydown', handleTab);
    };
  },
  
  /**
   * Return focus to previous element
   */
  returnFocus: (previousElement: HTMLElement | null) => {
    if (previousElement) {
      previousElement.focus();
    }
  },
};

/**
 * Screen reader announcements
 */
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Skip link component props
 */
export const skipLinkProps = {
  href: '#main-content',
  'aria-label': 'Skip to main content',
};
