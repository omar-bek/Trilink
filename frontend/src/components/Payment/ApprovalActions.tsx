import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { Payment, PaymentStatus } from '@/types/payment';
import { useApprovePayment, useRejectPayment } from '@/hooks/usePayments';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';

interface ApprovalActionsProps {
  payment: Payment;
}

export const ApprovalActions = ({ payment }: ApprovalActionsProps) => {
  const { user } = useAuthStore();
  const role = user?.role as Role;
  const approveMutation = useApprovePayment();
  const rejectMutation = useRejectPayment();
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const isBuyer = role === Role.BUYER || role === Role.ADMIN || role === Role.GOVERNMENT;
  const canApprove = isBuyer && payment.status === PaymentStatus.PENDING_APPROVAL;
  const canReject = isBuyer && payment.status === PaymentStatus.PENDING_APPROVAL;

  const handleApprove = () => {
    approveMutation.mutate(
      {
        id: payment._id,
        data: { notes: approvalNotes || undefined },
      },
      {
        onSuccess: () => {
          setApproveDialogOpen(false);
          setApprovalNotes('');
        },
      }
    );
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      return;
    }
    rejectMutation.mutate(
      {
        id: payment._id,
        data: { rejectionReason },
      },
      {
        onSuccess: () => {
          setRejectDialogOpen(false);
          setRejectionReason('');
        },
      }
    );
  };

  if (!canApprove && !canReject) {
    return null;
  }

  return (
    <>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Payment Approval
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Review the payment details and approve or reject this payment request.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={() => setApproveDialogOpen(true)}
              fullWidth
            >
              Approve Payment
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Cancel />}
              onClick={() => setRejectDialogOpen(true)}
              fullWidth
            >
              Reject Payment
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Payment</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Are you sure you want to approve this payment? Once approved, the payment will be processed.
          </DialogContentText>
          <TextField
            fullWidth
            label="Notes (Optional)"
            multiline
            rows={3}
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            placeholder="Add any notes about this approval..."
            sx={{ mt: 1 }}
          />
          {approveMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {approveMutation.error?.response?.data?.message || 'Failed to approve payment'}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleApprove}
            variant="contained"
            color="success"
            disabled={approveMutation.isPending}
          >
            {approveMutation.isPending ? 'Approving...' : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Payment</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Please provide a reason for rejecting this payment. This will be shared with the recipient.
          </DialogContentText>
          <TextField
            fullWidth
            label="Rejection Reason"
            multiline
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Explain why this payment is being rejected..."
            required
            error={!rejectionReason.trim() && rejectMutation.isError}
            helperText={!rejectionReason.trim() ? 'Rejection reason is required' : ''}
          />
          {rejectMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {rejectMutation.error?.response?.data?.message || 'Failed to reject payment'}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleReject}
            variant="contained"
            color="error"
            disabled={!rejectionReason.trim() || rejectMutation.isPending}
          >
            {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
