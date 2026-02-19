import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { NegotiationRoom } from '@/components/Negotiation/NegotiationRoom';
import { useBid } from '@/hooks/useBids';
import { PageSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';
import { Alert } from '@mui/material';

export const BidNegotiationRoom = () => {
  const { bidId } = useParams<{ bidId: string }>();
  const navigate = useNavigate();
  const { data: bidData, isLoading } = useBid(bidId);

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (!bidId || !bidData?.data) {
    return (
      <Alert severity="error">
        Bid not found or negotiation room not available.
      </Alert>
    );
  }

  const bid = bidData.data;

  // Only allow negotiation for bids under review
  if (bid.status !== 'under_review' && bid.status !== 'submitted') {
    return (
      <Alert severity="warning">
        Negotiation room is only available for bids under review or submitted.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(`/bids/${bidId}`)}>
          Back to Bid
        </Button>
      </Box>
      <NegotiationRoom bidId={bidId!} onClose={() => navigate(`/bids/${bidId}`)} />
    </Box>
  );
};
