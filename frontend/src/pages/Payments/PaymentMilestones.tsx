import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Alert,
  Button,
} from '@mui/material';
import { usePayments } from '@/hooks/usePayments';
import { MilestoneView } from '@/components/Payment/MilestoneView';
import { PageSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';

export const PaymentMilestones = () => {
  const { contractId } = useParams<{ contractId: string }>();

  const { data, isLoading, error } = usePayments();
  const payments = data?.data || [];

  // Filter payments by contract if contractId provided
  const contractPayments = contractId
    ? payments.filter((p) => p.contractId === contractId)
    : payments;

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error) {
    const errorMessage = (error as any)?.response?.data?.message || 
                         (error as any)?.message || 
                         'Failed to load payments. Please try again.';
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
        >
          Refresh Page
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
        Payment Milestones
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        {contractId
          ? 'View payment milestones for this contract'
          : 'View all payment milestones'}
      </Typography>
      <MilestoneView payments={contractPayments} contractId={contractId} />
    </Box>
  );
};
