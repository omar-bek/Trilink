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
  Business,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RFQ, RFQStatus } from '@/types/rfq';
import { RFQStatusBadge } from './RFQStatusBadge';
import { DeadlineCountdown } from './DeadlineCountdown';
import { AnonymousBadge } from './AnonymousBadge';
import { formatCurrency, formatDate } from '@/utils';
import { useAuthStore } from '@/store/auth.store';

interface RFQListItemProps {
  rfq: RFQ;
}

export const RFQListItem = ({ rfq }: RFQListItemProps) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Check if this RFQ belongs to the current user's company
  const isOwnCompanyRFQ = user?.companyId && rfq.companyId && user.companyId === rfq.companyId;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const rfqId = rfq._id || rfq.id;

  const handleView = () => {
    if (rfqId) {
      navigate(`/rfqs/${rfqId}`);
    }
    handleMenuClose();
  };

  return (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'box-shadow 0.2s ease-in-out',
        borderLeft: isOwnCompanyRFQ ? '4px solid' : 'none',
        borderColor: isOwnCompanyRFQ ? 'primary.main' : 'transparent',
        backgroundColor: isOwnCompanyRFQ ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
        '&:hover': {
          boxShadow: '0 2px 8px rgba(0, 15, 38, 0.12)',
          backgroundColor: isOwnCompanyRFQ ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
        },
      }}
      onClick={() => {
        const rfqId = rfq._id || rfq.id;
        if (rfqId) {
          navigate(`/rfqs/${rfqId}`);
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {rfq.title}
              </Typography>
              <RFQStatusBadge status={rfq.status} />
              {isOwnCompanyRFQ && (
                <Chip
                  icon={<Business />}
                  label="My Company"
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              )}
              <AnonymousBadge anonymous={rfq.anonymousBuyer} />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {rfq.description}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              <Chip
                label={`${rfq.items.length} item${rfq.items.length !== 1 ? 's' : ''}`}
                size="small"
                variant="outlined"
              />
              <Chip
                label={formatCurrency(rfq.budget, rfq.currency)}
                size="small"
                variant="outlined"
                color="primary"
              />
              <Chip
                label={`Delivery: ${formatDate(rfq.requiredDeliveryDate)}`}
                size="small"
                variant="outlined"
              />
              <Chip
                label={`Type: ${rfq.type}`}
                size="small"
                variant="outlined"
              />
              {rfq.status === RFQStatus.OPEN && (
                <DeadlineCountdown deadline={rfq.deadline} />
              )}
            </Box>
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
