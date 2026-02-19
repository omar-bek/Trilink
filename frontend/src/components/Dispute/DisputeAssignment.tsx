import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import { Person, Assignment, AccessTime, Warning } from '@mui/icons-material';
import { useState } from 'react';
import { formatDateTime } from '@/utils';
import { Dispute, AssignDisputeDto } from '@/types/dispute';
import { useAssignDispute } from '@/hooks/useDisputes';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/user.service';
import { Role } from '@/types';
import { useAuthStore } from '@/store/auth.store';
import { CircularProgress } from '@mui/material';

interface DisputeAssignmentProps {
  dispute: Dispute;
  onAssignmentChange?: () => void;
}

export const DisputeAssignment = ({ dispute, onAssignmentChange }: DisputeAssignmentProps) => {
  const { user } = useAuthStore();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(dispute.assignedTo || '');
  const [dueDate, setDueDate] = useState(
    dispute.dueDate ? dispute.dueDate.split('T')[0] : ''
  );
  const assignMutation = useAssignDispute();

  // Get government users for assignment dropdown
  // Note: This assumes government users are in the same company as the current user
  // In production, you might need a dedicated endpoint to get all government users
  const { data: companyUsers, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users', 'company', user?.companyId, 'government'],
    queryFn: async () => {
      if (!user?.companyId) return { data: [] };
      const response = await userService.getUsersByCompany(user.companyId);
      // Filter for government users
      return {
        data: response.data?.filter((u) => u.role === Role.GOVERNMENT || u.role === Role.ADMIN) || [],
      };
    },
    enabled: !!user?.companyId && assignDialogOpen,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const isGovernment = user?.role === Role.GOVERNMENT || user?.role === Role.ADMIN;
  const canAssign = isGovernment && dispute.escalatedToGovernment && dispute.status !== 'resolved';

  // Calculate SLA status
  const getSLAStatus = () => {
    if (!dispute.dueDate) return null;
    const due = new Date(dispute.dueDate);
    const now = new Date();
    const daysRemaining = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining < 0) {
      return { status: 'overdue', days: Math.abs(daysRemaining), color: 'error' as const };
    } else if (daysRemaining <= 2) {
      return { status: 'urgent', days: daysRemaining, color: 'warning' as const };
    } else {
      return { status: 'on-track', days: daysRemaining, color: 'success' as const };
    }
  };

  const slaStatus = getSLAStatus();

  const handleAssign = () => {
    if (!selectedUserId) {
      return;
    }

    const assignData: AssignDisputeDto = {
      assignedToUserId: selectedUserId,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
    };

    assignMutation.mutate(
      { id: dispute.id || dispute._id, data: assignData },
      {
        onSuccess: () => {
          setAssignDialogOpen(false);
          onAssignmentChange?.();
        },
      }
    );
  };

  // Calculate default due date (7 days from now)
  const getDefaultDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  };

  return (
    <>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Assignment color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Assignment & SLA
            </Typography>
          </Box>

          {dispute.escalatedToGovernment ? (
            <>
              {dispute.assignedTo ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Assigned To
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person fontSize="small" color="action" />
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {dispute.assignedTo.slice(-8)} {/* Show last 8 chars of ID */}
                      </Typography>
                    </Box>
                  </Box>

                  {dispute.assignedAt && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Assigned At
                      </Typography>
                      <Typography variant="body2">
                        {formatDateTime(dispute.assignedAt)}
                      </Typography>
                    </Box>
                  )}

                  {dispute.dueDate && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Due Date
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body2">
                          {formatDateTime(dispute.dueDate)}
                        </Typography>
                        {slaStatus && (
                          <Chip
                            icon={slaStatus.status === 'overdue' ? <Warning /> : <AccessTime />}
                            label={
                              slaStatus.status === 'overdue'
                                ? `${slaStatus.days} days overdue`
                                : slaStatus.status === 'urgent'
                                ? `${slaStatus.days} days remaining`
                                : `${slaStatus.days} days remaining`
                            }
                            color={slaStatus.color}
                            size="small"
                          />
                        )}
                      </Box>
                    </Box>
                  )}

                  {dispute.responseTime !== undefined && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Response Time
                      </Typography>
                      <Typography variant="body2">
                        {dispute.responseTime} hours
                      </Typography>
                    </Box>
                  )}

                  {canAssign && (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setSelectedUserId(dispute.assignedTo || '');
                          setDueDate(dispute.dueDate ? dispute.dueDate.split('T')[0] : getDefaultDueDate());
                          setAssignDialogOpen(true);
                        }}
                      >
                        Reassign
                      </Button>
                    </>
                  )}
                </Box>
              ) : (
                <Box>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    This dispute is escalated but not yet assigned. Please assign it to a government user.
                  </Alert>
                  {canAssign && (
                    <Button
                      variant="contained"
                      onClick={() => {
                        setSelectedUserId('');
                        setDueDate(getDefaultDueDate());
                        setAssignDialogOpen(true);
                      }}
                    >
                      Assign Dispute
                    </Button>
                  )}
                </Box>
              )}
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Dispute must be escalated to government before assignment.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Assignment Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Dispute</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Assign To</InputLabel>
              <Select
                value={selectedUserId}
                label="Assign To"
                onChange={(e) => setSelectedUserId(e.target.value)}
                disabled={isLoadingUsers}
              >
                {isLoadingUsers ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} />
                  </MenuItem>
                ) : (
                  companyUsers?.data?.map((govUser) => (
                    <MenuItem key={govUser._id} value={govUser._id}>
                      {govUser.firstName} {govUser.lastName} ({govUser.email})
                    </MenuItem>
                  ))
                )}
                {companyUsers?.data?.length === 0 && (
                  <MenuItem disabled>No government users found</MenuItem>
                )}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Due Date (Optional)"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="Leave empty to use default SLA (7 days)"
            />

            {assignMutation.isError && (
              <Alert severity="error">
                {assignMutation.error?.response?.data?.message || 'Failed to assign dispute'}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAssign}
            variant="contained"
            disabled={!selectedUserId || assignMutation.isPending}
          >
            {assignMutation.isPending ? <CircularProgress size={20} /> : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
