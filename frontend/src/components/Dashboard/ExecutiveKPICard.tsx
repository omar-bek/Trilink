import { Card, CardContent, Box, Typography, Skeleton } from '@mui/material';
import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

export interface ExecutiveKPICardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  trend?: {
    value: number;
    label: string;
  };
  subtitle?: string; // For additional context (e.g., "7 payments" + "$125,000 total")
  loading?: boolean;
  onClick?: () => void;
}

export const ExecutiveKPICard = ({
  title,
  value,
  unit,
  icon,
  color = 'primary',
  trend,
  subtitle,
  loading = false,
  onClick,
}: ExecutiveKPICardProps) => {
  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      // Format large numbers with commas
      if (val >= 1000000) {
        return (val / 1000000).toFixed(1) + 'M';
      }
      if (val >= 1000) {
        return (val / 1000).toFixed(1) + 'K';
      }
      return val.toLocaleString();
    }
    return val;
  };

  const getTrendColor = (trendValue: number): string => {
    if (trendValue >= 0) {
      return '#4caf50'; // Success green
    }
    return '#f44336'; // Error red
  };

  return (
    <Card
      sx={{
        height: '160px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 3,
        backdropFilter: 'blur(10px)',
        '&:hover': onClick
          ? {
              boxShadow: '0 8px 24px rgba(70, 130, 180, 0.2)',
              transform: 'translateY(-4px)',
              borderColor: 'rgba(70, 130, 180, 0.3)',
            }
          : {},
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header: Icon and Title */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              color: '#CBD5E1',
              fontSize: '14px',
              lineHeight: 1.4,
              flex: 1,
            }}
          >
            {loading ? <Skeleton width={120} height={20} /> : title}
          </Typography>
          <Box
            sx={{
              color: `${color}.main`,
              display: 'flex',
              alignItems: 'center',
              fontSize: '2rem',
              opacity: 0.8,
              ml: 1,
            }}
          >
            {loading ? <Skeleton variant="circular" width={32} height={32} /> : icon}
          </Box>
        </Box>

        {/* Value and Unit */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 0.5 }}>
            <Typography
              variant="h4"
              component="div"
              sx={{
                fontWeight: 700,
                color: '#FFFFFF',
                fontSize: '32px',
                lineHeight: 1.2,
              }}
            >
              {loading ? <Skeleton width={100} height={40} /> : formatValue(value)}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: '#94A3B8',
                fontSize: '12px',
                fontWeight: 500,
                ml: 0.5,
              }}
            >
              {loading ? null : unit}
            </Typography>
          </Box>

          {/* Subtitle (e.g., total amount for count KPIs) */}
          {subtitle && !loading && (
            <Typography
              variant="caption"
              sx={{
                color: '#94A3B8',
                fontSize: '11px',
                mt: 0.5,
              }}
            >
              {subtitle}
            </Typography>
          )}

          {/* Trend Indicator */}
          {trend && !loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
              {trend.value >= 0 ? (
                <TrendingUp sx={{ fontSize: '16px', color: getTrendColor(trend.value) }} />
              ) : (
                <TrendingDown sx={{ fontSize: '16px', color: getTrendColor(trend.value) }} />
              )}
              <Typography
                variant="caption"
                sx={{
                  color: getTrendColor(trend.value),
                  fontWeight: 600,
                  fontSize: '12px',
                }}
              >
                {Math.abs(trend.value)}% {trend.label}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
