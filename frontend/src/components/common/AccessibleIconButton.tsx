import { IconButton, IconButtonProps } from '@mui/material';
import { forwardRef } from 'react';

/**
 * AccessibleIconButton Component
 * 
 * Enhanced IconButton with built-in accessibility:
 * - Required aria-label
 * - Keyboard navigation
 * - Focus-visible styles
 * - Screen reader support
 */
export interface AccessibleIconButtonProps extends IconButtonProps {
  /**
   * ARIA label - REQUIRED for icon buttons
   * Icon buttons must have descriptive labels for screen readers
   */
  ariaLabel: string;
  
  /**
   * Screen reader announcement on click
   */
  announceOnClick?: string;
}

export const AccessibleIconButton = forwardRef<HTMLButtonElement, AccessibleIconButtonProps>(
  ({ ariaLabel, announceOnClick, onClick, ...props }, ref) => {
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (announceOnClick) {
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

    return (
      <IconButton
        ref={ref}
        {...props}
        aria-label={ariaLabel}
        onClick={handleClick}
        sx={{
          ...props.sx,
          '&:focus-visible': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: '2px',
            borderRadius: '4px',
          },
        }}
      />
    );
  }
);

AccessibleIconButton.displayName = 'AccessibleIconButton';
