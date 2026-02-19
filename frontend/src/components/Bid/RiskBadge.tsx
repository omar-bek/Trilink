import { Chip, ChipProps } from '@mui/material';
import { Warning, CheckCircle, Error } from '@mui/icons-material';

export type RiskLevel = 'low' | 'medium' | 'high';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'small' | 'medium';
}

export const RiskBadge = ({ level, size = 'medium' }: RiskBadgeProps) => {
  const config: Record<
    RiskLevel,
    { label: string; color: ChipProps['color']; icon: React.ReactNode }
  > = {
    low: {
      label: 'Low Risk',
      color: 'success',
      icon: <CheckCircle fontSize={size === 'small' ? 'small' : 'medium'} />,
    },
    medium: {
      label: 'Medium Risk',
      color: 'warning',
      icon: <Warning fontSize={size === 'small' ? 'small' : 'medium'} />,
    },
    high: {
      label: 'High Risk',
      color: 'error',
      icon: <Error fontSize={size === 'small' ? 'small' : 'medium'} />,
    },
  };

  const { label, color, icon } = config[level];

  return (
    <Chip
      icon={icon}
      label={label}
      color={color}
      size={size}
      sx={{
        fontWeight: 600,
        '& .MuiChip-icon': {
          color: 'inherit',
        },
      }}
    />
  );
};
