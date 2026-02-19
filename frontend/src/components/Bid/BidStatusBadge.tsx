import { Chip } from '@mui/material';
import { BidStatus } from '@/types/bid';

interface BidStatusBadgeProps {
  status: BidStatus;
}

export const BidStatusBadge = ({ status }: BidStatusBadgeProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case BidStatus.DRAFT:
        return {
          label: 'Draft',
          color: 'default' as const,
        };
      case BidStatus.SUBMITTED:
        return {
          label: 'Submitted',
          color: 'info' as const,
        };
      case BidStatus.UNDER_REVIEW:
        return {
          label: 'Under Review',
          color: 'warning' as const,
        };
      case BidStatus.ACCEPTED:
        return {
          label: 'Accepted',
          color: 'success' as const,
        };
      case BidStatus.REJECTED:
        return {
          label: 'Rejected',
          color: 'error' as const,
        };
      case BidStatus.WITHDRAWN:
        return {
          label: 'Withdrawn',
          color: 'default' as const,
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
