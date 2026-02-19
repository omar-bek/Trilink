import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Divider,
  Alert,
  Chip,
} from '@mui/material';
import { isValidId } from '@/utils/routeValidation';
import {
  ArrowBack,
  AttachMoney,
  AccessTime,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { usePayment } from '@/hooks/usePayments';
import { EnhancedStatusBadge } from '@/components/Workflow/EnhancedStatusBadge';
import { WorkflowNextStepsEnhanced } from '@/components/Workflow/WorkflowNextStepsEnhanced';
import { WorkflowStatusIndicator } from '@/components/Workflow/WorkflowStatusIndicator';
import { ApprovalActions } from '@/components/Payment/ApprovalActions';
import { PaymentRecoveryActions } from '@/components/Payment/PaymentRecoveryActions';
import { ActivityHistory } from '@/components/Audit/ActivityHistory';
import { formatCurrency, formatDate, formatDateTime } from '@/utils';
import { PageSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';
import { ErrorHandler } from '@/components/Error/ErrorHandler';
import { PaymentStatus } from '@/types/payment';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';
import { Tabs, Tab } from '@mui/material';
import { useState } from 'react';

export const PaymentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role = user?.role as Role;
  const [activeTab, setActiveTab] = useState(0);

  // Validate ID - reject invalid values like "create", "new", etc.
  const validId = isValidId(id) ? id : undefined;

  // Redirect if ID is missing or invalid
  useEffect(() => {
    if (!isValidId(id)) {
      navigate('/payments', { replace: true });
    }
  }, [id, navigate]);

  if (!isValidId(id)) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Invalid payment ID. Redirecting...
      </Alert>
    );
  }

  const { data, isLoading, error } = usePayment(validId);
  const payment = data?.data;

  const isBuyer = role === Role.BUYER; // Only Buyer can approve/reject payments

  const handleWorkflowAction = (action: string) => {
    if (action === 'approve' && payment && payment.status === PaymentStatus.PENDING_APPROVAL) {
      // ApprovalActions component handles this - the WhatsNext CTA will trigger the ApprovalActions component
      // The ApprovalActions component is already rendered above for PENDING_APPROVAL status
    } else if (action === 'retry' && id) {
      // Retry payment logic would go here - would need to implement retry endpoint
      console.log('Retry payment not yet implemented');
    }
  };

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error) {
    const errorMessage = (error as any)?.response?.data?.message || 
                        (error as any)?.response?.data?.error ||
                        (error as any)?.message ||
                        'Failed to load payment. Please try again.';
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/payments')}>
            Back
          </Button>
        </Box>
        <ErrorHandler
          error={error}
          title="Failed to Load Payment"
          message={errorMessage}
          onRetry={() => {
            // Retry by refetching
            window.location.reload();
          }}
        />
      </Box>
    );
  }

  if (!payment) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/payments')}>
            Back
          </Button>
        </Box>
        <Alert severity="error">
          Payment not found. Please check the payment ID and try again.
        </Alert>
      </Box>
    );
  }

  // Calculate overdue with proper timezone handling
  const isOverdue = (() => {
    if (payment.status === PaymentStatus.COMPLETED) return false;
    const dueDate = new Date(payment.dueDate);
    const now = new Date();
    // Compare dates at midnight UTC to avoid timezone issues
    const dueDateUTC = new Date(Date.UTC(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()));
    const nowUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    return dueDateUTC < nowUTC;
  })();

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/payments')}>
          Back
        </Button>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {payment.milestone}
            </Typography>
            <EnhancedStatusBadge entityType="payment" status={payment.status} showContext />
            {isOverdue && (
              <Chip label="Overdue" color="error" />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary">
            Payment #{(payment.id || payment._id || '').slice(-6)} • Created {formatDateTime(payment.createdAt)}
          </Typography>
        </Box>
      </Box>

      {/* What's Next Component - Enhanced */}
      <WorkflowNextStepsEnhanced
        entityType="payment"
        status={payment.status}
        entityId={validId}
        onAction={handleWorkflowAction}
        notifications={[
          ...(payment.status === PaymentStatus.APPROVED
            ? [
              {
                type: 'success' as const,
                message: 'Payment approved. Processing will begin automatically.',
                timestamp: payment.updatedAt,
              },
            ]
            : []),
          ...(payment.status === PaymentStatus.PROCESSING
            ? [
              {
                type: 'info' as const,
                message: 'Payment is being processed by the payment gateway.',
              },
            ]
            : []),
          ...(payment.status === PaymentStatus.COMPLETED
            ? [
              {
                type: 'success' as const,
                message: 'Payment completed successfully.',
                timestamp: payment.updatedAt,
              },
            ]
            : []),
          ...(payment.status === PaymentStatus.FAILED
            ? [
              {
                type: 'error' as const,
                message: 'Payment processing failed. Please review and retry.',
              },
            ]
            : []),
          ...(isOverdue
            ? [
              {
                type: 'warning' as const,
                message: `Payment is overdue. Due date was ${formatDate(payment.dueDate)}.`,
              },
            ]
            : []),
        ]}
      />

      {/* Workflow Status Indicator - Show payment processing workflow */}
      {payment.status !== PaymentStatus.PENDING_APPROVAL && (
        <WorkflowStatusIndicator
          title="Payment Processing Workflow"
          steps={[
            {
              id: 'payment-created',
              label: 'Payment Created',
              status: 'completed',
              description: `Payment created for milestone: ${payment.milestone}`,
              timestamp: payment.createdAt,
              metadata: {
                amount: payment.amount,
                currency: payment.currency,
              },
            },
            {
              id: 'payment-approved',
              label: 'Payment Approved',
              status:
                payment.status === PaymentStatus.APPROVED ||
                  payment.status === PaymentStatus.PROCESSING ||
                  payment.status === PaymentStatus.COMPLETED
                  ? 'completed'
                  : 'not_started',
              description: 'Payment has been approved by buyer',
              timestamp: payment.updatedAt,
            },
            {
              id: 'payment-processing',
              label: 'Payment Processing',
              status:
                payment.status === PaymentStatus.PROCESSING
                  ? 'active'
                  : payment.status === PaymentStatus.COMPLETED || payment.status === PaymentStatus.FAILED
                    ? 'completed'
                    : payment.status === PaymentStatus.APPROVED
                      ? 'pending'
                      : 'not_started',
              description:
                payment.status === PaymentStatus.PROCESSING
                  ? 'Payment gateway is processing the transaction'
                  : payment.status === PaymentStatus.APPROVED
                    ? 'Processing will begin automatically'
                    : payment.status === PaymentStatus.COMPLETED || payment.status === PaymentStatus.FAILED
                      ? 'Processing completed'
                      : 'Waiting for approval',
            },
            {
              id: 'payment-completed',
              label: 'Payment Completed',
              status:
                payment.status === PaymentStatus.COMPLETED
                  ? 'completed'
                  : payment.status === PaymentStatus.FAILED
                    ? 'failed'
                    : payment.status === PaymentStatus.PROCESSING
                      ? 'pending'
                      : 'not_started',
              description:
                payment.status === PaymentStatus.COMPLETED
                  ? 'Payment has been successfully processed'
                  : payment.status === PaymentStatus.FAILED
                    ? 'Payment processing failed'
                    : 'Waiting for processing to complete',
              timestamp:
                payment.status === PaymentStatus.COMPLETED || payment.status === PaymentStatus.FAILED
                  ? payment.updatedAt
                  : undefined,
            },
          ]}
        />
      )}


      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* Payment Recovery Actions (for failed payments) */}
          {payment.status === PaymentStatus.FAILED && (
            <Box sx={{ mb: 3 }}>
              <PaymentRecoveryActions payment={payment} />
            </Box>
          )}

          {/* Approval Actions (Buyer only) */}
          {isBuyer && payment.status === PaymentStatus.PENDING_APPROVAL && (
            <Box sx={{ mb: 3 }}>
              <ApprovalActions payment={payment} />
            </Box>
          )}

          {/* Payment Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Payment Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <AttachMoney color="primary" />
                    <Typography variant="body2" color="text.secondary">
                      Amount
                    </Typography>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    {formatCurrency(payment.amount, payment.currency)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <AccessTime color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Due Date
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 500, color: isOverdue ? 'error.main' : 'inherit' }}>
                    {formatDate(payment.dueDate)}
                  </Typography>
                </Grid>
                {payment.paidDate && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CheckCircle color="success" />
                      <Typography variant="body2" color="text.secondary">
                        Paid Date
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 500 }}>
                      {formatDate(payment.paidDate)}
                    </Typography>
                  </Grid>
                )}
                {payment.paymentMethod && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Payment Method
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {payment.paymentMethod}
                    </Typography>
                  </Grid>
                )}
                {payment.transactionId && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Transaction ID
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {payment.transactionId}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Notes */}
          {payment.notes && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Notes
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                  {payment.notes}
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Rejection Reason */}
          {payment.status === PaymentStatus.REJECTED && payment.rejectionReason && (
            <Card sx={{ mb: 3, borderLeft: '4px solid', borderColor: 'error.main' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Cancel color="error" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Rejection Reason
                  </Typography>
                </Box>
                <Typography variant="body1" color="text.secondary">
                  {payment.rejectionReason}
                </Typography>
                {payment.rejectedAt && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Rejected on {formatDateTime(payment.rejectedAt)}
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}

          {/* Failure Information (shown in recovery component, but also here for reference) */}
          {payment.status === PaymentStatus.FAILED && payment.failureReason && (
            <Card sx={{ mb: 3, borderLeft: '4px solid', borderColor: 'error.main', bgcolor: 'rgba(211, 47, 47, 0.08)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Cancel color="error" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Payment Failure Details
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Failure Reason:</strong> {payment.failureReason}
                </Typography>
                {payment.failedAt && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Failed on {formatDateTime(payment.failedAt)}
                  </Typography>
                )}
                {payment.retryCount !== undefined && payment.retryCount > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    Retry attempts: {payment.retryCount}
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Payment Details */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Payment Details
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Status
                  </Typography>
                  <EnhancedStatusBadge entityType="payment" status={payment.status} showContext />
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Milestone
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {payment.milestone}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Contract ID
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {payment.contractId?.slice(-8) || 'N/A'}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Recipient Company
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {payment.recipientCompanyId?.slice(-8) || 'N/A'}
                  </Typography>
                </Box>
                {payment.approvedAt && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Approved At
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatDateTime(payment.approvedAt)}
                      </Typography>
                    </Box>
                  </>
                )}
                {payment.approvedBy && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Approved By
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {payment.approvedBy?.slice(-8) || 'N/A'}
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Activity History Tab */}
      <Box sx={{ mt: 4 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Details" />
          <Tab label="Activity History" />
        </Tabs>
        <Box sx={{ mt: 3 }}>
          {activeTab === 0 && (
            <Box>
              {/* Details content is already shown above */}
            </Box>
          )}
          {activeTab === 1 && id && (
            <ActivityHistory
              resource="payment"
              resourceId={validId!}
              title="Payment Activity History"
              showExport={true}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};
