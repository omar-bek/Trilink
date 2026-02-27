/**
 * Enhanced Card Component
 * 
 * A modern, polished card component with:
 * - Smooth hover effects
 * - Gradient backgrounds
 * - Better spacing and typography
 * - Responsive design
 */

import { Card, CardContent, CardProps, Box, Typography, SxProps, Theme } from '@mui/material';
import { ReactNode } from 'react';

export interface EnhancedCardProps extends Omit<CardProps, 'children' | 'variant'> {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  gradient?: boolean;
  hover?: boolean;
  children: ReactNode;
  headerAction?: ReactNode;
  footer?: ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'gradient';
}

export const EnhancedCard = ({
  title,
  subtitle,
  icon,
  gradient = false,
  hover = true,
  children,
  headerAction,
  footer,
  variant = 'default',
  sx,
  ...props
}: EnhancedCardProps) => {
  const getVariantStyles = (): SxProps<Theme> => {
    switch (variant) {
      case 'elevated':
        return {
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
          border: 'none',
        };
      case 'outlined':
        return {
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none',
        };
      case 'gradient':
        return {
          background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(25, 118, 210, 0.05) 100%)',
          border: '1px solid',
          borderColor: 'divider',
        };
      default:
        return {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '1px solid',
          borderColor: 'divider',
        };
    }
  };

  return (
    <Card
      {...props}
      sx={{
        ...getVariantStyles(),
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        borderRadius: 2,
        overflow: 'hidden',
        position: 'relative',
        ...(hover && {
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.16)',
          },
        }),
        ...(gradient && {
          background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(25, 118, 210, 0.05) 100%)',
        }),
        ...sx,
      } as any}
    >
      {(title || subtitle || icon || headerAction) && (
        <Box
          sx={{
            p: 3,
            pb: 2,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 2,
            borderBottom: title || subtitle ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flex: 1 }}>
            {icon && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {icon}
              </Box>
            )}
            <Box sx={{ flex: 1 }}>
              {title && (
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {title}
                </Typography>
              )}
              {subtitle && (
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>
          {headerAction && <Box>{headerAction}</Box>}
        </Box>
      )}
      <CardContent
        sx={{
          p: title || subtitle ? 3 : 0,
          '&:last-child': {
            pb: footer ? 2 : 3,
          },
        }}
      >
        {children}
      </CardContent>
      {footer && (
        <Box
          sx={{
            p: 3,
            pt: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'action.hover',
          }}
        >
          {footer}
        </Box>
      )}
    </Card>
  );
};
