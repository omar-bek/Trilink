import { Button, ButtonProps } from '@mui/material';
import { forwardRef } from 'react';

/**
 * AccessibleButton Component
 * 
 * Enhanced Button component with built-in accessibility features:
 * - Proper ARIA labels
 * - Keyboard navigation support
 * - Focus-visible styles
 * - Screen reader announcements
 */
export interface AccessibleButtonProps extends ButtonProps {
  /**
   * ARIA label for screen readers
   * If not provided, uses button text or children
   */
  ariaLabel?: string;
  
  /**
   * Whether button performs a destructive action
   * Adds aria-label warning for screen readers
   */
  destructive?: boolean;
  
  /**
   * Screen reader announcement on click
   */
  announceOnClick?: string;
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ ariaLabel, destructive, announceOnClick, onClick, children, ...props }, ref) => {
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (announceOnClick) {
        // Announce to screen readers
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = announceOnClick;
        document.body.appendChild(announcement);
        setTimeout(() => document.body.removeChild(announcement), 1000);
      }
      
      onClick?.(event);
    };

    const label = ariaLabel || (typeof children === 'string' ? children : undefined);
    const finalAriaLabel = destructive && label 
      ? `${label}. This action cannot be undone.`
      : label;

    return (
      <Button
        ref={ref}
        {...props}
        aria-label={finalAriaLabel}
        onClick={handleClick}
        sx={{
          ...props.sx,
          '&:focus-visible': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: '2px',
          },
        }}
      >
        {children}
      </Button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';
