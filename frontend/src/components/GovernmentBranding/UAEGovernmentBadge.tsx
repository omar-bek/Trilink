import { Chip, Box } from '@mui/material';
import { Verified } from '@mui/icons-material';

/**
 * UAE Government Badge Component
 * 
 * Professional badge indicating official government platform status.
 * Used in headers, footers, and key authentication points.
 */
interface UAEGovernmentBadgeProps {
  variant?: 'official' | 'verified' | 'compliance';
  size?: 'small' | 'medium';
  showIcon?: boolean;
  label?: string; // Optional custom label from settings
}

const badgeConfig = {
  official: {
    defaultLabel: 'Official Government Platform',
    color: '#00843D',
    bgColor: 'rgba(0, 132, 61, 0.1)',
    borderColor: 'rgba(0, 132, 61, 0.2)',
  },
  verified: {
    defaultLabel: 'UAE Government Verified',
    color: '#00843D',
    bgColor: 'rgba(0, 132, 61, 0.08)',
    borderColor: 'rgba(0, 132, 61, 0.15)',
  },
  compliance: {
    defaultLabel: 'Government Compliant',
    color: '#1E40AF',
    bgColor: 'rgba(30, 64, 175, 0.08)',
    borderColor: 'rgba(30, 64, 175, 0.15)',
  },
};

export const UAEGovernmentBadge = ({ 
  variant = 'official',
  size = 'small',
  showIcon = true,
  label
}: UAEGovernmentBadgeProps) => {
  const config = badgeConfig[variant];
  const displayLabel = label || config.defaultLabel;

  return (
    <Chip
      icon={showIcon ? <Verified sx={{ fontSize: 14, color: config.color }} /> : undefined}
      label={displayLabel}
      size={size}
      sx={{
        bgcolor: config.bgColor,
        color: config.color,
        fontWeight: 500,
        fontSize: size === 'small' ? '0.7rem' : '0.75rem',
        height: size === 'small' ? 24 : 28,
        border: `1px solid ${config.borderColor}`,
        '& .MuiChip-label': {
          px: 1,
        },
        '& .MuiChip-icon': {
          marginLeft: '8px',
        },
      }}
      title={`${displayLabel}`}
    />
  );
};
