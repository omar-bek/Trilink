import { Chip } from '@mui/material';
import { ContractStatus } from '@/types/contract';

interface ContractStatusBadgeProps {
  status: ContractStatus;
}

export const ContractStatusBadge = ({ status }: ContractStatusBadgeProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case ContractStatus.DRAFT:
        return {
          label: 'Draft',
          color: 'default' as const,
        };
      case ContractStatus.PENDING_SIGNATURES:
        return {
          label: 'Pending Signatures',
          color: 'warning' as const,
        };
      case ContractStatus.SIGNED:
        return {
          label: 'Signed',
          color: 'info' as const,
        };
      case ContractStatus.ACTIVE:
        return {
          label: 'Active',
          color: 'success' as const,
        };
      case ContractStatus.COMPLETED:
        return {
          label: 'Completed',
          color: 'success' as const,
        };
      case ContractStatus.TERMINATED:
        return {
          label: 'Terminated',
          color: 'error' as const,
        };
      case ContractStatus.CANCELLED:
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
