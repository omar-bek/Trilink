import {
  Box,
  Typography,
  Grid,
  Alert,
  Button,
} from '@mui/material';
import { useEscalatedDisputes } from '@/hooks/useDisputes';
import { DisputeListItem } from '@/components/Dispute/DisputeListItem';
import { PageSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';

export const EscalatedDisputes = () => {
  const { data, isLoading, error } = useEscalatedDisputes();
  const disputes = data?.data || [];

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error) {
    const errorMessage = (error as any)?.response?.data?.message || 
                         (error as any)?.message || 
                         'Failed to load escalated disputes. Please try again.';
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
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Escalated Disputes
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Disputes escalated to government for resolution
        </Typography>
      </Box>

      {/* Disputes List */}
      {disputes.length === 0 ? (
        <Alert severity="info">
          No escalated disputes found.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {disputes.map((dispute) => (
            <Grid item xs={12} key={dispute._id}>
              <DisputeListItem dispute={dispute} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};
