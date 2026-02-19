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
  Gavel,
  AttachFile,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dispute } from '@/types/dispute';
import { DisputeStatusBadge } from './DisputeStatusBadge';
import { formatDateTime } from '@/utils';

interface DisputeListItemProps {
  dispute: Dispute;
}

export const DisputeListItem = ({ dispute }: DisputeListItemProps) => {
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

  const disputeId = dispute._id || dispute.id;

  const handleView = () => {
    if (disputeId) {
      navigate(`/disputes/${disputeId}`);
    }
    handleMenuClose();
  };

  return (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'box-shadow 0.2s ease-in-out',
        borderLeft: dispute.escalatedToGovernment ? '4px solid' : 'none',
        borderColor: dispute.escalatedToGovernment ? '#ef4444' : 'transparent',
        '&:hover': {
          boxShadow: '0 2px 8px rgba(0, 15, 38, 0.12)',
        },
      }}
      onClick={() => {
        const disputeId = dispute._id || dispute.id;
        if (disputeId) {
          navigate(`/disputes/${disputeId}`);
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {dispute.type} Dispute
              </Typography>
              <DisputeStatusBadge status={dispute.status} />
              {dispute.escalatedToGovernment && (
                <Chip
                  icon={<Gavel />}
                  label="Escalated"
                  size="small"
                  color="error"
                  variant="outlined"
                />
              )}
            </Box>
            {dispute.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {dispute.description.length > 150 ? `${dispute.description.substring(0, 150)}...` : dispute.description}
              </Typography>
            )}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              {dispute.contractId && (
                <Chip
                  label={`Contract: ${typeof dispute.contractId === 'string' ? dispute.contractId.slice(-6) : dispute.contractId}`}
                  size="small"
                  variant="outlined"
                />
              )}
              {dispute.attachments.length > 0 && (
                <Chip
                  icon={<AttachFile />}
                  label={`${dispute.attachments.length} attachment${dispute.attachments.length !== 1 ? 's' : ''}`}
                  size="small"
                  variant="outlined"
                />
              )}
              <Typography variant="caption" color="text.secondary">
                Created {formatDateTime(dispute.createdAt)}
              </Typography>
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
