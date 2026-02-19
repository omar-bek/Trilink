import { Chip } from '@mui/material';
import { RFQStatus } from '@/types/rfq';

interface RFQStatusBadgeProps {
  status: RFQStatus;
}

export const RFQStatusBadge = ({ status }: RFQStatusBadgeProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case RFQStatus.DRAFT:
        return {
          label: 'Draft',
          color: 'default' as const,
        };
      case RFQStatus.OPEN:
        return {
          label: 'Open',
          color: 'success' as const,
        };
      case RFQStatus.CLOSED:
        return {
          label: 'Closed',
          color: 'default' as const,
        };
      case RFQStatus.CANCELLED:
        return {
          label: 'Cancelled',
          color: 'error' as const,
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
