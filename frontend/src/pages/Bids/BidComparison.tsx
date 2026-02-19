import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Alert,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useBidsByRFQ } from '@/hooks/useBids';
import { useRFQ } from '@/hooks/useRFQs';
import { BidStatusBadge } from '@/components/Bid/BidStatusBadge';
import { AIScoreIndicator } from '@/components/Bid/AIScoreIndicator';
import { AIExplanationSummary } from '@/components/Bid/AIExplanationSummary';
import { formatCurrency, formatDate } from '@/utils';
import { PageSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';
import { ResponsiveTable, ResponsiveTableColumn } from '@/components/common';
import { Bid } from '@/types/bid';

export const BidComparison = () => {
  const { rfqId } = useParams<{ rfqId: string }>();
  const navigate = useNavigate();

  const { data: rfqData } = useRFQ(rfqId);
  const { data: bidsData, isLoading } = useBidsByRFQ(rfqId, { status: 'submitted' });
  const bids = bidsData?.data || [];
  const rfq = rfqData?.data;

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (!rfqId) {
    return (
      <Alert severity="error">
        RFQ ID is required
      </Alert>
    );
  }

  // Filter out bids without valid IDs first
  const validBids = bids.filter((bid) => {
    const bidId = bid._id || bid.id;
    if (!bidId) {
      console.warn('Bid missing ID, filtering out:', bid);
      return false;
    }
    return true;
  });

  // Sort bids by AI score (highest first), then by price (lowest first)
  const sortedBids = [...validBids].sort((a, b) => {
    if (a.aiScore !== undefined && b.aiScore !== undefined) {
      return b.aiScore - a.aiScore;
    }
    if (a.aiScore !== undefined) return -1;
    if (b.aiScore !== undefined) return 1;
    return a.price - b.price;
  });

  // Define columns with priority
  const columns: ResponsiveTableColumn<Bid>[] = [
    {
      id: 'rank',
      label: 'Rank',
      priority: 'high',
      render: (_, index) => (
        <Chip
          label={`#${index + 1}`}
          color={index === 0 ? 'success' : 'default'}
          size="small"
          sx={{ fontWeight: 600 }}
        />
      ),
      align: 'center',
      width: 80,
    },
    {
      id: 'bidder',
      label: 'Bidder',
      priority: 'high',
      render: (bid) =>
        bid.anonymousBidder ? (
          <Chip label="Anonymous" size="small" color="info" variant="outlined" />
        ) : (
          <Typography variant="body2">Company ID: {bid.companyId?.slice(-6) || 'N/A'}</Typography>
        ),
      mobileLabel: 'Bidder',
    },
    {
      id: 'price',
      label: 'Price',
      priority: 'high',
      render: (bid) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {formatCurrency(bid.price, bid.currency)}
        </Typography>
      ),
      align: 'right',
      width: 120,
    },
    {
      id: 'aiScore',
      label: 'AI Score',
      priority: 'high',
      render: (bid) =>
        bid.aiScore !== undefined || bid.aiScoreMetadata ? (
          <AIScoreIndicator
            score={bid.aiScore}
            showLabel={false}
            size="small"
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
        ) : (
          <Typography variant="body2" color="text.secondary">
            N/A
          </Typography>
        ),
      align: 'center',
      width: 100,
    },
    {
      id: 'deliveryTime',
      label: 'Delivery Time',
      priority: 'medium',
      render: (bid) => <Typography variant="body2">{bid.deliveryTime} days</Typography>,
      mobileLabel: 'Delivery Time',
    },
    {
      id: 'deliveryDate',
      label: 'Delivery Date',
      priority: 'medium',
      render: (bid) => <Typography variant="body2">{formatDate(bid.deliveryDate)}</Typography>,
      mobileLabel: 'Delivery Date',
    },
    {
      id: 'paymentTerms',
      label: 'Payment Terms',
      priority: 'low',
      render: (bid) => (
        <Typography
          variant="body2"
          sx={{
            maxWidth: { xs: '100%', md: 200 },
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {bid.paymentTerms}
        </Typography>
      ),
      mobileLabel: 'Payment Terms',
    },
    {
      id: 'status',
      label: 'Status',
      priority: 'medium',
      render: (bid) => <BidStatusBadge status={bid.status} />,
    },
    {
      id: 'actions',
      label: 'Actions',
      priority: 'high',
      render: (bid) => {
        const bidId = bid._id || bid.id;
        if (!bidId) return null;
        return (
          <Button
            size="small"
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/bids/${bidId}`);
            }}
          >
            View
          </Button>
        );
      },
      align: 'center',
      width: 100,
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
          Back
        </Button>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Bid Comparison
          </Typography>
          {rfq && (
            <Typography variant="body2" color="text.secondary">
              RFQ: {rfq.title}
            </Typography>
          )}
        </Box>
      </Box>

      {/* AI Explanation Notice */}
      {sortedBids.some((bid) => bid.aiScoreMetadata) && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>AI Scoring Transparency:</strong> All bids with AI scores include full explainability. 
            Click the <strong>"Why?"</strong> button or help icon next to any AI score to view detailed explanations, 
            confidence levels, risk assessments, and model version information. All AI decisions are audit-safe and legally explainable.
          </Typography>
        </Alert>
      )}

      <ResponsiveTable
        columns={columns}
        data={sortedBids}
        keyExtractor={(bid) => {
          const bidId = bid._id || bid.id;
          if (!bidId) {
            console.error('Bid missing ID in keyExtractor (should not happen after filtering):', bid);
            return '';
          }
          return String(bidId);
        }}
        emptyMessage="No submitted bids found for this RFQ."
        onRowClick={(bid) => {
          const bidId = bid._id || bid.id;
          if (!bidId) {
            console.warn('Cannot navigate: bid missing ID (should not happen after filtering)', bid);
            return;
          }
          navigate(`/bids/${bidId}`);
        }}
        tableProps={{ stickyHeader: true }}
      />

      {/* Detailed AI Explanations Section */}
      {sortedBids.filter((bid) => bid.aiScoreMetadata).length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            AI Score Explanations - Full Audit Trail
          </Typography>
          {sortedBids
            .filter((bid) => {
              const bidId = bid._id || bid.id;
              return bid.aiScoreMetadata && bidId;
            })
            .map((bid) => {
              const bidId = bid._id || bid.id;
              if (!bidId) return null;
              return (
                <Box key={bidId} sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Bid #{typeof bidId === 'string' ? bidId.slice(-6) : String(bidId).slice(-6)} - AI Explanation
                  </Typography>
                <AIExplanationSummary
                  totalScore={bid.aiScoreMetadata!.totalScore}
                  breakdown={bid.aiScoreMetadata!.breakdown}
                  overallConfidence={bid.aiScoreMetadata!.overallConfidence as 'high' | 'medium' | 'low'}
                  overallRisk={bid.aiScoreMetadata!.overallRisk as 'low' | 'medium' | 'high'}
                  recommendation={bid.aiScoreMetadata!.recommendation}
                  timestamp={bid.aiScoreMetadata!.timestamp ? new Date(bid.aiScoreMetadata!.timestamp) : undefined}
                  modelVersion={bid.aiScoreMetadata!.modelVersion}
                  variant="standard"
                  showDisclaimer={true}
                  showModelInfo={true}
                />
              </Box>
              );
            })}
        </Box>
      )}
    </Box>
  );
};
