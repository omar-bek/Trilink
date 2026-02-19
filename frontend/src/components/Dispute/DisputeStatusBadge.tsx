import { Chip } from '@mui/material';
import { DisputeStatus } from '@/types/dispute';

interface DisputeStatusBadgeProps {
  status: DisputeStatus;
}

export const DisputeStatusBadge = ({ status }: DisputeStatusBadgeProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case DisputeStatus.OPEN:
        return {
          label: 'Open',
          color: 'warning' as const,
        };
      case DisputeStatus.UNDER_REVIEW:
        return {
          label: 'Under Review',
          color: 'info' as const,
        };
      case DisputeStatus.ESCALATED:
        return {
          label: 'Escalated',
          color: 'error' as const,
        };
      case DisputeStatus.RESOLVED:
        return {
          label: 'Resolved',
          color: 'success' as const,
        };
      default:
        return {
          label: status,
          color: 'default' as const,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      sx={{ fontWeight: 500 }}
    />
  );
};
