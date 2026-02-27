import { Box, Typography, LinearProgress, Chip, ChipProps } from '@mui/material';
import { CheckCircle, Warning, Error } from '@mui/icons-material';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

interface ConfidenceIndicatorProps {
  level: ConfidenceLevel;
  size?: 'small' | 'medium';
  showProgress?: boolean;
}

export const ConfidenceIndicator = ({
  level,
  size = 'medium',
  showProgress = false,
}: ConfidenceIndicatorProps) => {
  const config: Record<
    ConfidenceLevel,
    {
      label: string;
      color: ChipProps['color'];
      icon: React.ReactElement;
      percentage: number;
      description: string;
    }
  > = {
    high: {
      label: 'High Confidence',
      color: 'success',
      icon: <CheckCircle fontSize={size === 'small' ? 'small' : 'medium'} />,
      percentage: 85,
      description: 'High confidence in this assessment',
    },
    medium: {
      label: 'Medium Confidence',
      color: 'warning',
      icon: <Warning fontSize={size === 'small' ? 'small' : 'medium'} />,
      percentage: 65,
      description: 'Moderate confidence in this assessment',
    },
    low: {
      label: 'Low Confidence',
      color: 'error',
      icon: <Error fontSize={size === 'small' ? 'small' : 'medium'} />,
      percentage: 45,
      description: 'Lower confidence - limited data available',
    },
  };

  const { label, color, icon, percentage, description } = config[level];

  if (size === 'small') {
    return (
      <Chip
        icon={icon}
        label={label}
        color={color}
        size="small"
        sx={{
          fontWeight: 600,
          '& .MuiChip-icon': {
            color: 'inherit',
          },
        }}
      />
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: showProgress ? 1 : 0 }}>
        <Chip
          icon={icon}
          label={label}
          color={color}
          size="medium"
          sx={{
            fontWeight: 600,
            '& .MuiChip-icon': {
              color: 'inherit',
            },
          }}
        />
        {showProgress && (
          <Box sx={{ flex: 1 }}>
            <LinearProgress
              variant="determinate"
              value={percentage}
              color={color === 'default' ? 'primary' : color}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}
      </Box>
      {showProgress && (
        <Typography variant="caption" color="text.secondary">
          {description}
        </Typography>
      )}
    </Box>
  );
};
