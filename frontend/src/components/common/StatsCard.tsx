/**
 * Stats Card Component
 * 
 * A beautiful statistics card with:
 * - Icon
 * - Value
 * - Label
 * - Trend indicator
 * - Color variants
 */

import { Card, CardContent, Box, Typography, Avatar } from '@mui/material';
import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color?: 'primary' | 'success' | 'error' | 'warning' | 'info';
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  subtitle?: string;
  onClick?: () => void;
}

export const StatsCard = ({
  title,
  value,
  icon,
  color = 'primary',
  trend,
  subtitle,
  onClick,
}: StatsCardProps) => {
  const colorMap = {
    primary: { main: 'primary.main', contrast: 'primary.contrastText' },
    success: { main: 'success.main', contrast: 'success.contrastText' },
    error: { main: 'error.main', contrast: 'error.contrastText' },
    warning: { main: 'warning.main', contrast: 'warning.contrastText' },
    info: { main: 'info.main', contrast: 'info.contrastText' },
  };

  const colors = colorMap[color];

  return (
    <Card
      onClick={onClick}
      sx={{
        bgcolor: colors.main,
        color: colors.contrast,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        borderRadius: 2,
        overflow: 'hidden',
        position: 'relative',
        '&:hover': onClick
          ? {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
            }
          : {},
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5, fontWeight: 500 }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: trend ? 1 : 0 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                {trend.positive !== false ? (
                  <TrendingUp sx={{ fontSize: 16 }} />
                ) : (
                  <TrendingDown sx={{ fontSize: 16 }} />
                )}
                <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 500 }}>
                  {Math.abs(trend.value)}% {trend.label}
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              width: 56,
              height: 56,
              color: 'inherit',
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};
