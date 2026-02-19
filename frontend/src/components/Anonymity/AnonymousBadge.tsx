import React from 'react';
import { Chip, Tooltip, Box } from '@mui/material';
import { Security, VisibilityOff } from '@mui/icons-material';

interface AnonymousBadgeProps {
  isAnonymous: boolean;
  variant?: 'default' | 'outlined' | 'filled';
  size?: 'small' | 'medium';
  showIcon?: boolean;
}

/**
 * AnonymousBadge Component
 * 
 * Displays an anonymous status badge for RFQs and Bids.
 * Used in lists and detail pages to indicate anonymity status.
 */
export const AnonymousBadge: React.FC<AnonymousBadgeProps> = ({
  isAnonymous,
  variant = 'outlined',
  size = 'small',
  showIcon = true,
}) => {
  if (!isAnonymous) {
    return null;
  }

  return (
    <Tooltip
      title="This listing is posted anonymously. Identity will be revealed upon contract award."
      arrow
    >
      <Chip
        icon={showIcon ? <VisibilityOff fontSize="small" /> : undefined}
        label="Anonymous"
        color="warning"
        variant={variant}
        size={size}
        sx={{
          fontWeight: 600,
          '& .MuiChip-icon': {
            color: 'inherit',
          },
        }}
      />
    </Tooltip>
  );
};
