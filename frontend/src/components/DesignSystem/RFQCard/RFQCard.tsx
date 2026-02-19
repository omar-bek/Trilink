import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Button,
  useTheme,
  Divider,
} from '@mui/material';
import {
  Assignment,
  AccessTime,
  AttachMoney,
  LocationOn,
  Business,
} from '@mui/icons-material';
import { StatusBadge, StatusType } from '../StatusBadge';
import { DeadlineCountdown } from '@/components/RFQ/DeadlineCountdown';

export interface RFQCardProps {
  id: string;
  title: string;
  description?: string;
  status: StatusType | string;
  deadline: Date | string;
  budget?: number;
  currency?: string;
  location?: string;
  category?: string;
  buyer?: {
    name: string;
    isAnonymous?: boolean;
  };
  bidCount?: number;
  onView?: () => void;
  onBid?: () => void;
  variant?: 'default' | 'compact' | 'detailed';
}

export const RFQCard: React.FC<RFQCardProps> = ({
  id,
  title,
  description,
  status,
  deadline,
  budget,
  currency = 'USD',
  location,
  category,
  buyer,
  bidCount,
  onView,
  onBid,
  variant = 'default',
}) => {
  const theme = useTheme();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isCompact = variant === 'compact';
  const isDetailed = variant === 'detailed';

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease-in-out',
        border: `1px solid ${theme.palette.divider}`,
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
          borderColor: theme.palette.primary.main,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: isCompact ? 2 : 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Assignment sx={{ fontSize: 20, color: theme.palette.primary.main }} />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {title}
              </Typography>
            </Box>
            {category && (
              <Chip
                label={category}
                size="small"
                sx={{
                  mb: 1,
                  fontSize: '0.7rem',
                  height: 20,
                }}
              />
            )}
          </Box>
          <StatusBadge status={status} size="small" />
        </Box>

        {/* Description */}
        {description && !isCompact && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: isDetailed ? 4 : 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {description}
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Details Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: isCompact ? '1fr' : 'repeat(2, 1fr)',
            gap: 1.5,
            mb: 2,
          }}
        >
          {/* Deadline */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTime sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Deadline
              </Typography>
              <DeadlineCountdown deadline={deadline} showIcon={false} />
            </Box>
          </Box>

          {/* Budget */}
          {budget && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AttachMoney sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Budget
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {formatCurrency(budget)}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Location */}
          {location && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOn sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Location
                </Typography>
                <Typography variant="body2">{location}</Typography>
              </Box>
            </Box>
          )}

          {/* Buyer */}
          {buyer && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Business sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Buyer
                </Typography>
                <Typography variant="body2">
                  {buyer.isAnonymous ? 'Anonymous' : buyer.name}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Bid Count */}
          {bidCount !== undefined && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Bids
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {bidCount}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>

      {/* Actions */}
      <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
        <Button size="small" onClick={onView} variant="text">
          View Details
        </Button>
        {onBid && (
          <Button size="small" onClick={onBid} variant="contained">
            Submit Bid
          </Button>
        )}
      </CardActions>
    </Card>
  );
};
