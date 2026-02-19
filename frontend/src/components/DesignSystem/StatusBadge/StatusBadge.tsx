import React from 'react';
import { Chip, Box, useTheme } from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Pending,
  Warning,
  Info,
  Schedule,
  Error,
} from '@mui/icons-material';

export type StatusType =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'pending'
  | 'active'
  | 'inactive'
  | 'draft'
  | 'completed'
  | 'cancelled'
  | 'in-progress'
  | 'on-hold';

export interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'filled' | 'outlined' | 'soft';
  showIcon?: boolean;
  customColor?: string;
}

const statusConfig: Record<
  string,
  {
    color: 'success' | 'error' | 'warning' | 'info' | 'default';
    icon?: React.ReactNode;
    defaultLabel: string;
  }
> = {
  success: {
    color: 'success',
    icon: <CheckCircle />,
    defaultLabel: 'Success',
  },
  completed: {
    color: 'success',
    icon: <CheckCircle />,
    defaultLabel: 'Completed',
  },
  active: {
    color: 'success',
    icon: <CheckCircle />,
    defaultLabel: 'Active',
  },
  error: {
    color: 'error',
    icon: <Error />,
    defaultLabel: 'Error',
  },
  cancelled: {
    color: 'error',
    icon: <Cancel />,
    defaultLabel: 'Cancelled',
  },
  warning: {
    color: 'warning',
    icon: <Warning />,
    defaultLabel: 'Warning',
  },
  'on-hold': {
    color: 'warning',
    icon: <Schedule />,
    defaultLabel: 'On Hold',
  },
  info: {
    color: 'info',
    icon: <Info />,
    defaultLabel: 'Info',
  },
  pending: {
    color: 'warning',
    icon: <Pending />,
    defaultLabel: 'Pending',
  },
  draft: {
    color: 'default',
    icon: <Info />,
    defaultLabel: 'Draft',
  },
  'in-progress': {
    color: 'info',
    icon: <Schedule />,
    defaultLabel: 'In Progress',
  },
  inactive: {
    color: 'default',
    icon: <Cancel />,
    defaultLabel: 'Inactive',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'medium',
  variant = 'filled',
  showIcon = true,
  customColor,
}) => {
  const theme = useTheme();
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '-');
  const config = statusConfig[normalizedStatus] || {
    color: 'default' as const,
    icon: <Info />,
    defaultLabel: status,
  };

  const displayLabel = label || config.defaultLabel;

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          height: 20,
          fontSize: '0.65rem',
          iconSize: 14,
          padding: '0 8px',
        };
      case 'large':
        return {
          height: 32,
          fontSize: '0.875rem',
          iconSize: 20,
          padding: '0 12px',
        };
      default:
        return {
          height: 24,
          fontSize: '0.75rem',
          iconSize: 16,
          padding: '0 10px',
        };
    }
  };

  const sizeStyles = getSizeStyles();

  if (variant === 'soft') {
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1.5,
          py: 0.5,
          borderRadius: theme.shape.borderRadius,
          backgroundColor:
            customColor || theme.palette[config.color]?.main
              ? `${customColor || theme.palette[config.color]?.main}20`
              : theme.palette.grey[800],
          color: customColor || theme.palette[config.color]?.main || theme.palette.text.primary,
          fontSize: sizeStyles.fontSize,
          fontWeight: 500,
        }}
      >
        {showIcon && config.icon && (
          <Box sx={{ display: 'flex', fontSize: sizeStyles.iconSize }}>
            {config.icon}
          </Box>
        )}
        {displayLabel}
      </Box>
    );
  }

  return (
    <Chip
      label={displayLabel}
      color={customColor ? undefined : config.color}
      size={size === 'large' ? 'medium' : size}
      variant={variant}
      icon={
        showIcon && config.icon ? (
          <Box sx={{ display: 'flex', fontSize: sizeStyles.iconSize }}>
            {config.icon}
          </Box>
        ) : undefined
      }
      sx={{
        height: sizeStyles.height,
        fontSize: sizeStyles.fontSize,
        fontWeight: 600,
        ...(customColor && {
          backgroundColor: variant === 'filled' ? customColor : 'transparent',
          color: variant === 'filled' ? '#FFFFFF' : customColor,
          borderColor: customColor,
        }),
      }}
    />
  );
};
