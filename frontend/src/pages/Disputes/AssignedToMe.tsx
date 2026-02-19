import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Alert,
  Button,
} from '@mui/material';
import { useDisputesAssignedToMe } from '@/hooks/useDisputes';
import { DisputeStatus } from '@/types/dispute';
import { DisputeListItem } from '@/components/Dispute/DisputeListItem';
import { PageSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';

export const AssignedToMe = () => {
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | 'all'>('all');

  const filters = statusFilter !== 'all' ? { status: statusFilter } : undefined;
  const { data, isLoading, error } = useDisputesAssignedToMe(filters);
  const disputes = data?.data || [];

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error) {
    const errorMessage = (error as any)?.response?.data?.message || 
                         (error as any)?.message || 
                         'Failed to load assigned disputes. Please try again.';
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
          Disputes Assigned to Me
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Disputes that have been assigned to you for review or resolution
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value as DisputeStatus | 'all')}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value={DisputeStatus.OPEN}>Open</MenuItem>
                <MenuItem value={DisputeStatus.UNDER_REVIEW}>Under Review</MenuItem>
                <MenuItem value={DisputeStatus.ESCALATED}>Escalated</MenuItem>
                <MenuItem value={DisputeStatus.RESOLVED}>Resolved</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={8}>
            <Typography variant="body2" color="text.secondary">
              {disputes.length} dispute{disputes.length !== 1 ? 's' : ''} assigned to you
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Disputes List */}
      {disputes.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No disputes assigned to you
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'You currently have no disputes assigned to you'}
          </Typography>
        </Paper>
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
