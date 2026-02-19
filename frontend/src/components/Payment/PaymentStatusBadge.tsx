import { Chip } from '@mui/material';
import { PaymentStatus } from '@/types/payment';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
}

export const PaymentStatusBadge = ({ status }: PaymentStatusBadgeProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case PaymentStatus.PENDING_APPROVAL:
        return {
          label: 'Pending Approval',
          color: 'warning' as const,
        };
      case PaymentStatus.APPROVED:
        return {
          label: 'Approved',
          color: 'info' as const,
        };
      case PaymentStatus.REJECTED:
        return {
          label: 'Rejected',
          color: 'error' as const,
        };
      case PaymentStatus.PROCESSING:
        return {
          label: 'Processing',
          color: 'primary' as const,
        };
      case PaymentStatus.COMPLETED:
        return {
          label: 'Completed',
          color: 'success' as const,
        };
      case PaymentStatus.FAILED:
        return {
          label: 'Failed',
          color: 'error' as const,
        };
      case PaymentStatus.CANCELLED:
        return {
          label: 'Cancelled',
          color: 'default' as const,
        };
      case PaymentStatus.REFUNDED:
        return {
          label: 'Refunded',
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
