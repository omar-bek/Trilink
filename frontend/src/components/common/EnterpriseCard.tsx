/**
 * Enterprise Card Component
 * 
 * Institutional, authoritative card design
 * Minimal visual noise, maximum clarity
 */

import { Card, CardContent, CardHeader, CardProps, Box, Typography, useTheme } from '@mui/material';
import { ReactNode } from 'react';
import { designTokens } from '@/theme/designTokens';

const { colors, spacing, borders, shadows } = designTokens;

interface EnterpriseCardProps extends Omit<CardProps, 'title'> {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  dense?: boolean;
}

export const EnterpriseCard = ({
  title,
  subtitle,
  action,
  children,
  variant = 'default',
  dense = false,
  sx,
  ...props
}: EnterpriseCardProps) => {
  const theme = useTheme();

  const variantStyles = {
    default: {
      backgroundColor: colors.base.blackPearlLight,
      border: `1px solid ${borders.color.default}`,
      boxShadow: shadows.sm,
    },
    elevated: {
      backgroundColor: colors.base.blackPearlLight,
      border: 'none',
      boxShadow: shadows.md,
    },
    outlined: {
      backgroundColor: 'transparent',
      border: `2px solid ${borders.color.strong}`,
      boxShadow: 'none',
    },
  };

  return (
    <Card
      sx={{
        ...variantStyles[variant],
        borderRadius: borders.radius.lg,
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': variant === 'default' && {
          borderColor: borders.color.strong,
          boxShadow: shadows.md,
        },
        ...sx,
      }}
      {...props}
    >
      {(title || subtitle || action) && (
        <CardHeader
          title={
            title && (
              <Typography
                variant="h6"
                sx={{
                  fontWeight: designTokens.typography.fontWeight.semibold,
                  color: '#FFFFFF',
                }}
              >
                {title}
              </Typography>
            )
          }
          subheader={
            subtitle && (
              <Typography
                variant="body2"
                sx={{
                  color: colors.base.neutral300,
                  marginTop: spacing.xs,
                }}
              >
                {subtitle}
              </Typography>
            )
          }
          action={action}
          sx={{
            padding: dense ? spacing.lg : spacing.xl,
            paddingBottom: subtitle ? spacing.md : 0,
            '& .MuiCardHeader-action': {
              margin: 0,
            },
          }}
        />
      )}
      <CardContent
        sx={{
          padding: dense ? spacing.lg : spacing.xl,
          paddingTop: title || subtitle || action ? (dense ? spacing.md : spacing.lg) : undefined,
          '&:last-child': {
            paddingBottom: dense ? spacing.lg : spacing.xl,
          },
        }}
      >
        {children}
      </CardContent>
    </Card>
  );
};