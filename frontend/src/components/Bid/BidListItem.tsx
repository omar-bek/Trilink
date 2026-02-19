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
  Cancel,
  Business,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bid, BidStatus } from '@/types/bid';
import { BidStatusBadge } from './BidStatusBadge';
import { AIScoreIndicator } from './AIScoreIndicator';
import { formatCurrency, formatDate } from '@/utils';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';

interface BidListItemProps {
  bid: Bid;
  onWithdraw?: (id: string) => void;
}

export const BidListItem = ({ bid, onWithdraw }: BidListItemProps) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role = user?.role as Role;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Check if this bid belongs to the current user's company
  const isOwnCompanyBid = user?.companyId && bid.companyId && user.companyId === bid.companyId;

  const isBuyer = role === Role.BUYER || role === Role.ADMIN || role === Role.GOVERNMENT;
  const canWithdraw = bid.status === BidStatus.SUBMITTED && !isBuyer;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const bidId = bid._id || bid.id;

  const handleView = () => {
    if (bidId) {
      navigate(`/bids/${bidId}`);
    }
    handleMenuClose();
  };

  const handleWithdraw = () => {
    if (!bidId) return;
    if (onWithdraw) {
      onWithdraw(bidId);
    }
    handleMenuClose();
  };

  return (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'box-shadow 0.2s ease-in-out',
        borderLeft: isOwnCompanyBid ? '4px solid' : 'none',
        borderColor: isOwnCompanyBid ? 'primary.main' : 'transparent',
        backgroundColor: isOwnCompanyBid ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
        '&:hover': {
          boxShadow: '0 2px 8px rgba(0, 15, 38, 0.12)',
          backgroundColor: isOwnCompanyBid ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
        },
      }}
      onClick={() => {
        const bidId = bid._id || bid.id;
        if (bidId) {
          navigate(`/bids/${bidId}`);
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Bid #{bidId ? (typeof bidId === 'string' ? bidId.slice(-6) : bidId) : 'N/A'}
              </Typography>
              <BidStatusBadge status={bid.status} />
              {isOwnCompanyBid && (
                <Chip
                  icon={<Business />}
                  label="My Company"
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              )}
              {(bid.aiScore !== undefined || bid.aiScoreMetadata) && (
                <AIScoreIndicator
                  score={bid.aiScore}
                  showLabel={false}
                  aiMetadata={bid.aiScoreMetadata
                    ? {
                        totalScore: bid.aiScoreMetadata.totalScore,
                        breakdown: bid.aiScoreMetadata.breakdown,
                        overallConfidence: bid.aiScoreMetadata.overallConfidence as 'high' | 'medium' | 'low',
                        overallRisk: bid.aiScoreMetadata.overallRisk as 'low' | 'medium' | 'high',
                        recommendation: bid.aiScoreMetadata.recommendation,
                        timestamp: bid.aiScoreMetadata.timestamp
                          ? new Date(bid.aiScoreMetadata.timestamp)
                          : undefined,
                        modelVersion: bid.aiScoreMetadata.modelVersion,
                      }
                    : undefined}
                />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {bid.paymentTerms}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              <Chip
                label={formatCurrency(bid.price, bid.currency)}
                size="small"
                variant="outlined"
                color="primary"
              />
              <Chip
                label={`Delivery: ${formatDate(bid.deliveryDate)}`}
                size="small"
                variant="outlined"
              />
              <Chip
                label={`${bid.deliveryTime} days`}
                size="small"
                variant="outlined"
              />
              <Chip
                label={`Valid until: ${formatDate(bid.validity)}`}
                size="small"
                variant="outlined"
              />
              {bid.anonymousBidder && (
                <Chip
                  label="Anonymous"
                  size="small"
                  color="info"
                  variant="outlined"
                />
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
          {canWithdraw && (
            <MenuItem onClick={handleWithdraw} sx={{ color: 'error.main' }}>
              <ListItemIcon>
                <Cancel fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Withdraw Bid</ListItemText>
            </MenuItem>
          )}
        </Menu>
      </CardContent>
    </Card>
  );
};
