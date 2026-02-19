import { Chip } from '@mui/material';
import { PurchaseRequestStatus } from '@/types/purchase-request';

interface StatusBadgeProps {
  status: PurchaseRequestStatus;
  rfqGenerated?: boolean;
}

export const StatusBadge = ({ status, rfqGenerated }: StatusBadgeProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case PurchaseRequestStatus.DRAFT:
        return {
          label: 'Draft',
          color: 'default' as const,
        };
      case PurchaseRequestStatus.SUBMITTED:
        return {
          label: rfqGenerated ? 'RFQ Generated' : 'Submitted',
          color: rfqGenerated ? 'success' as const : 'primary' as const,
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
