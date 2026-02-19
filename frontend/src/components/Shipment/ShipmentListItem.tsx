import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  MoreVert,
  Visibility,
  LocationOn,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shipment, CustomsClearanceStatus } from '@/types/shipment';
import { ShipmentStatusBadge } from './ShipmentStatusBadge';
import { formatDate } from '@/utils';
import { Assignment } from '@mui/icons-material';

interface ShipmentListItemProps {
  shipment: Shipment;
}

export const ShipmentListItem = ({ shipment }: ShipmentListItemProps) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const shipmentId = shipment._id || shipment.id;

  const handleView = () => {
    if (shipmentId) {
      navigate(`/shipments/${shipmentId}`);
    }
    handleMenuClose();
  };

  return (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'box-shadow 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 2px 8px rgba(0, 15, 38, 0.12)',
        },
      }}
      onClick={() => {
        const shipmentId = shipment._id || shipment.id;
        if (shipmentId) {
          navigate(`/shipments/${shipmentId}`);
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Shipment #{shipmentId ? (typeof shipmentId === 'string' ? shipmentId.slice(-6) : shipmentId) : 'N/A'}
              </Typography>
              <ShipmentStatusBadge status={shipment.status} />
              {shipment.status === 'in_clearance' && shipment.customsClearanceStatus && (
                <Chip
                  label={`Customs: ${shipment.customsClearanceStatus.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}`}
                  size="small"
                  icon={<Assignment />}
                  color={
                    shipment.customsClearanceStatus === CustomsClearanceStatus.APPROVED
                      ? 'success'
                      : shipment.customsClearanceStatus === CustomsClearanceStatus.REJECTED
                        ? 'error'
                        : shipment.customsClearanceStatus === CustomsClearanceStatus.UNDER_REVIEW ||
                            shipment.customsClearanceStatus === CustomsClearanceStatus.DOCUMENTS_SUBMITTED
                          ? 'warning'
                          : 'default'
                  }
                />
              )}
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocationOn fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {shipment.origin?.city || 'N/A'} → {shipment.destination?.city || 'N/A'}
                </Typography>
              </Box>
              <Chip
                label={`${shipment.trackingEvents?.length || 0} events`}
                size="small"
                variant="outlined"
              />
              {shipment.estimatedDeliveryDate && (
                <Chip
                  label={`Est. Delivery: ${formatDate(shipment.estimatedDeliveryDate)}`}
                  size="small"
                  variant="outlined"
                />
              )}
              {shipment.currentLocation && (
                <Chip
                  label="Live Tracking"
                  size="small"
                  color="success"
                  variant="outlined"
                />
              )}
            </Box>
            {shipment.currentLocation && (
              <Typography variant="body2" color="text.secondary">
                Current: {shipment.currentLocation.address || 'N/A'}
              </Typography>
            )}
          </Box>
          <IconButton
            onClick={handleMenuOpen}
            size="small"
            sx={{ ml: 1 }}
          >
            <MoreVert />
          </IconButton>
        </Box>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          onClick={(e) => e.stopPropagation()}
        >
          <MenuItem onClick={handleView}>
            <ListItemIcon>
              <Visibility fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
};
