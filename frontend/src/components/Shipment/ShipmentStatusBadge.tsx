import { Chip } from '@mui/material';
import { ShipmentStatus } from '@/types/shipment';

interface ShipmentStatusBadgeProps {
  status: ShipmentStatus;
}

export const ShipmentStatusBadge = ({ status }: ShipmentStatusBadgeProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case ShipmentStatus.IN_PRODUCTION:
        return {
          label: 'In Production',
          color: 'default' as const,
        };
      case ShipmentStatus.READY_FOR_PICKUP:
        return {
          label: 'Ready for Pickup',
          color: 'info' as const,
        };
      case ShipmentStatus.IN_TRANSIT:
        return {
          label: 'In Transit',
          color: 'primary' as const,
        };
      case ShipmentStatus.IN_CLEARANCE:
        return {
          label: 'In Clearance',
          color: 'warning' as const,
        };
      case ShipmentStatus.DELIVERED:
        return {
          label: 'Delivered',
          color: 'success' as const,
        };
      case ShipmentStatus.CANCELLED:
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
