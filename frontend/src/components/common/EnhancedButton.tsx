/**
 * Enhanced Button Component
 * 
 * A polished button component with:
 * - Better hover effects
 * - Loading states
 * - Icon support
 * - Variants
 */

import { Button, ButtonProps, CircularProgress, Box } from '@mui/material';
import { ReactNode } from 'react';

export interface EnhancedButtonProps extends Omit<ButtonProps, 'variant'> {
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'start' | 'end';
  variant?: 'contained' | 'outlined' | 'text' | 'gradient';
}

export const EnhancedButton = ({
  loading = false,
  icon,
  iconPosition = 'start',
  children,
  disabled,
  variant = 'contained',
  sx,
  ...props
}: EnhancedButtonProps) => {
  const getGradientStyles = () => {
    if (variant === 'gradient') {
      return {
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        color: '#FFFFFF',
        '&:hover': {
          background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
          boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)',
        },
      };
    }
    return {};
  };

  const renderIcon = () => {
    if (loading) {
      return <CircularProgress size={16} sx={{ mr: iconPosition === 'start' ? 1 : 0, ml: iconPosition === 'end' ? 1 : 0 }} />;
    }
    if (icon) {
      return (
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            mr: iconPosition === 'start' ? 1 : 0,
            ml: iconPosition === 'end' ? 1 : 0,
          }}
        >
          {icon}
        </Box>
      );
    }
    return null;
  };

  return (
    <Button
      {...props}
      variant={variant === 'gradient' ? 'contained' : variant}
      disabled={disabled || loading}
      sx={{
        borderRadius: 2,
        textTransform: 'none',
        fontWeight: 600,
        px: 3,
        py: 1.5,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        ...getGradientStyles(),
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
        ...sx,
      }}
    >
      {iconPosition === 'start' && renderIcon()}
      {children}
      {iconPosition === 'end' && renderIcon()}
    </Button>
  );
};
