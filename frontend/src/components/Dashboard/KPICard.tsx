import { Card, CardContent, Box, Typography, Skeleton } from '@mui/material';
import { ReactNode } from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  trend?: {
    value: number;
    label: string;
  };
  loading?: boolean;
  onClick?: () => void;
}

export const KPICard = ({
  title,
  value,
  icon,
  color = 'primary',
  trend,
  loading = false,
  onClick,
}: KPICardProps) => {
  return (
    <Card
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s ease-in-out',
        '&:hover': onClick
          ? {
              boxShadow: '0 2px 8px rgba(0, 15, 38, 0.12)',
            }
          : {},
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" gutterBottom sx={{ fontWeight: 500, color: '#CBD5E1', mb: 1.5 }}>
              {loading ? <Skeleton width={120} /> : title}
            </Typography>
            <Typography
              variant="h4"
              component="div"
              sx={{ fontWeight: 700, mb: trend ? 1.5 : 0, color: '#FFFFFF' }}
            >
              {loading ? <Skeleton width={80} /> : value}
            </Typography>
            {trend && !loading && (
              <Typography
                variant="caption"
                sx={{
                  color: trend.value >= 0 ? 'success.main' : 'error.main',
                  fontWeight: 500,
                }}
              >
                {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              color: `${color}.main`,
              display: 'flex',
              alignItems: 'center',
              fontSize: '3rem',
              opacity: 0.8,
            }}
          >
            {loading ? <Skeleton variant="circular" width={48} height={48} /> : icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
