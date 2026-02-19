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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Refresh,
  CreditCard,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { Payment, PaymentStatus } from '@/types/payment';
import { useRetryPayment, useUpdatePaymentMethod } from '@/hooks/usePayments';
import { formatDate } from '@/utils';

interface PaymentRecoveryActionsProps {
  payment: Payment;
}

export const PaymentRecoveryActions = ({ payment }: PaymentRecoveryActionsProps) => {
  const retryMutation = useRetryPayment();
  const updateMethodMutation = useUpdatePaymentMethod();
  const [retryDialogOpen, setRetryDialogOpen] = useState(false);
  const [updateMethodDialogOpen, setUpdateMethodDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(payment.paymentMethod || '');
  const [gateway, setGateway] = useState<'stripe' | 'paypal'>(payment.gateway as 'stripe' | 'paypal' || 'stripe');
  const [notes, setNotes] = useState('');

  const canRetry = payment.status === PaymentStatus.FAILED;
  const canUpdateMethod = payment.status === PaymentStatus.FAILED || payment.status === PaymentStatus.APPROVED;

  const handleRetry = () => {
    retryMutation.mutate(
      {
        id: payment._id,
        data: {
          paymentMethod: paymentMethod || undefined,
          gateway: gateway || undefined,
          notes: notes || undefined,
        },
      },
      {
        onSuccess: () => {
          setRetryDialogOpen(false);
          setNotes('');
        },
      }
    );
  };

  const handleUpdateMethod = () => {
    if (!paymentMethod.trim()) {
      return;
    }
    updateMethodMutation.mutate(
      {
        id: payment._id,
        data: {
          paymentMethod: paymentMethod,
          gateway: gateway,
          notes: notes || undefined,
        },
      },
      {
        onSuccess: () => {
          setUpdateMethodDialogOpen(false);
          setNotes('');
        },
      }
    );
  };

  if (!canRetry && !canUpdateMethod) {
    return null;
  }

  return (
    <>
      <Card sx={{ mb: 3, borderLeft: '4px solid', borderColor: 'error.main' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <ErrorIcon color="error" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Payment Recovery
            </Typography>
          </Box>

          {payment.failureReason && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Failure Reason:
              </Typography>
              <Typography variant="body2">
                {payment.failureReason}
              </Typography>
              {payment.failedAt && (
                <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                  Failed on {formatDate(payment.failedAt)}
                </Typography>
              )}
            </Alert>
          )}

          {payment.retryCount !== undefined && payment.retryCount > 0 && (
            <Box sx={{ mb: 2 }}>
              <Chip
                label={`Retry Attempt: ${payment.retryCount}`}
                size="small"
                color="warning"
                sx={{ mr: 1 }}
              />
              {payment.lastRetryAt && (
                <Typography variant="caption" color="text.secondary">
                  Last retry: {formatDate(payment.lastRetryAt)}
                </Typography>
              )}
            </Box>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This payment has failed. You can retry the payment or update your payment method before retrying.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {canRetry && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<Refresh />}
                onClick={() => setRetryDialogOpen(true)}
              >
                Retry Payment
              </Button>
            )}
            {canUpdateMethod && (
              <Button
                variant="outlined"
                color="primary"
                startIcon={<CreditCard />}
                onClick={() => setUpdateMethodDialogOpen(true)}
              >
                Update Payment Method
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Retry Payment Dialog */}
      <Dialog open={retryDialogOpen} onClose={() => setRetryDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Retry Payment</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Retry this failed payment. You can optionally update the payment method or gateway.
          </DialogContentText>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Payment Gateway</InputLabel>
            <Select
              value={gateway}
              label="Payment Gateway"
              onChange={(e) => setGateway(e.target.value as 'stripe' | 'paypal')}
            >
              <MenuItem value="stripe">Stripe</MenuItem>
              <MenuItem value="paypal">PayPal</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Payment Method (Optional)"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            placeholder="e.g., Credit Card ending in 4242"
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Notes (Optional)"
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this retry attempt..."
          />

          {retryMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {retryMutation.error?.response?.data?.message || 'Failed to retry payment'}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRetryDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRetry}
            variant="contained"
            color="primary"
            disabled={retryMutation.isPending}
          >
            {retryMutation.isPending ? 'Retrying...' : 'Retry Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Payment Method Dialog */}
      <Dialog open={updateMethodDialogOpen} onClose={() => setUpdateMethodDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Payment Method</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Update the payment method for this payment. After updating, you can retry the payment.
          </DialogContentText>

          <FormControl fullWidth sx={{ mb: 2 }} required>
            <InputLabel>Payment Gateway</InputLabel>
            <Select
              value={gateway}
              label="Payment Gateway"
              onChange={(e) => setGateway(e.target.value as 'stripe' | 'paypal')}
              required
            >
              <MenuItem value="stripe">Stripe</MenuItem>
              <MenuItem value="paypal">PayPal</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Payment Method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            placeholder="e.g., Credit Card ending in 4242"
            required
            error={!paymentMethod.trim() && updateMethodMutation.isError}
            helperText={!paymentMethod.trim() ? 'Payment method is required' : ''}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Notes (Optional)"
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this payment method update..."
          />

          {updateMethodMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {updateMethodMutation.error?.response?.data?.message || 'Failed to update payment method'}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateMethodDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpdateMethod}
            variant="contained"
            color="primary"
            disabled={!paymentMethod.trim() || updateMethodMutation.isPending}
          >
            {updateMethodMutation.isPending ? 'Updating...' : 'Update Payment Method'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
