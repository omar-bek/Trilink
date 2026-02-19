import React from 'react';
import { Card, CardContent, Box, Typography, Skeleton, useTheme } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

export interface KPICardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  loading?: boolean;
  onClick?: () => void;
  subtitle?: string;
  variant?: 'default' | 'compact' | 'large';
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon,
  color = 'primary',
  trend,
  loading = false,
  onClick,
  subtitle,
  variant = 'default',
}) => {
  const theme = useTheme();

  const getColorValue = () => {
    switch (color) {
      case 'primary':
        return theme.palette.primary.main;
      case 'secondary':
        return theme.palette.secondary.main;
      case 'success':
        return theme.palette.success.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'error':
        return theme.palette.error.main;
      case 'info':
        return theme.palette.info.main;
      default:
        return theme.palette.primary.main;
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'compact':
        return {
          padding: theme.spacing(2),
          iconSize: '2rem',
          valueSize: '1.75rem',
        };
      case 'large':
        return {
          padding: theme.spacing(4),
          iconSize: '4rem',
          valueSize: '3rem',
        };
      default:
        return {
          padding: theme.spacing(3),
          iconSize: '3rem',
          valueSize: '2.5rem',
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <Card
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
        border: `1px solid ${theme.palette.divider}`,
        '&:hover': onClick
          ? {
              transform: 'translateY(-2px)',
              boxShadow: theme.shadows[8],
              borderColor: getColorValue(),
            }
          : {},
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: variantStyles.padding }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="overline"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.secondary,
                mb: 1,
                display: 'block',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontSize: '0.75rem',
              }}
            >
              {loading ? <Skeleton width={120} /> : title}
            </Typography>

            <Typography
              variant="h4"
              component="div"
              sx={{
                fontWeight: 700,
                mb: trend || subtitle ? 1.5 : 0,
                color: theme.palette.text.primary,
                fontSize: variantStyles.valueSize,
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
              }}
            >
              {loading ? <Skeleton width={80} /> : value}
            </Typography>

            {subtitle && !loading && (
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  mb: trend ? 1 : 0,
                }}
              >
                {subtitle}
              </Typography>
            )}

            {trend && !loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {trend.isPositive !== undefined ? (
                  trend.isPositive ? (
                    <TrendingUp sx={{ fontSize: 16, color: theme.palette.success.main }} />
                  ) : (
                    <TrendingDown sx={{ fontSize: 16, color: theme.palette.error.main }} />
                  )
                ) : (
                  trend.value >= 0 ? (
                    <TrendingUp sx={{ fontSize: 16, color: theme.palette.success.main }} />
                  ) : (
                    <TrendingDown sx={{ fontSize: 16, color: theme.palette.error.main }} />
                  )
                )}
                <Typography
                  variant="caption"
                  sx={{
                    color:
                      trend.isPositive !== undefined
                        ? trend.isPositive
                          ? theme.palette.success.main
                          : theme.palette.error.main
                        : trend.value >= 0
                        ? theme.palette.success.main
                        : theme.palette.error.main,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                >
                  {Math.abs(trend.value)}% {trend.label}
                </Typography>
              </Box>
            )}
          </Box>

          {icon && (
            <Box
              sx={{
                color: getColorValue(),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: variantStyles.iconSize,
                opacity: 0.8,
                ml: 2,
              }}
            >
              {loading ? (
                <Skeleton variant="circular" width={48} height={48} />
              ) : (
                icon
              )}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
