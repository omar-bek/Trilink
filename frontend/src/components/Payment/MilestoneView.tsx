import {
  Card,
  CardContent,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  Divider,
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  Cancel,
  AccessTime,
} from '@mui/icons-material';
import { Payment, PaymentStatus } from '@/types/payment';
import { formatCurrency, formatDate } from '@/utils';

interface MilestoneViewProps {
  payments: Payment[];
  contractId?: string;
}

export const MilestoneView = ({ payments, contractId }: MilestoneViewProps) => {
  // Group payments by milestone
  const paymentsByMilestone = payments.reduce((acc, payment) => {
    if (!acc[payment.milestone]) {
      acc[payment.milestone] = [];
    }
    acc[payment.milestone].push(payment);
    return acc;
  }, {} as Record<string, Payment[]>);

  const milestones = Object.keys(paymentsByMilestone).sort();

  const getMilestoneStatus = (milestonePayments: Payment[]): PaymentStatus => {
    // If all payments are completed, milestone is completed
    if (milestonePayments.every((p) => p.status === PaymentStatus.COMPLETED)) {
      return PaymentStatus.COMPLETED;
    }
    // If any payment is processing, milestone is processing
    if (milestonePayments.some((p) => p.status === PaymentStatus.PROCESSING)) {
      return PaymentStatus.PROCESSING;
    }
    // If any payment is approved, milestone is approved
    if (milestonePayments.some((p) => p.status === PaymentStatus.APPROVED)) {
      return PaymentStatus.APPROVED;
    }
    // If any payment is pending approval, milestone is pending
    if (milestonePayments.some((p) => p.status === PaymentStatus.PENDING_APPROVAL)) {
      return PaymentStatus.PENDING_APPROVAL;
    }
    // If any payment is rejected, milestone has rejection
    if (milestonePayments.some((p) => p.status === PaymentStatus.REJECTED)) {
      return PaymentStatus.REJECTED;
    }
    return PaymentStatus.PENDING_APPROVAL;
  };

  const getTotalAmount = (milestonePayments: Payment[]): number => {
    return milestonePayments.reduce((sum, p) => sum + p.amount, 0);
  };

  const getCurrency = (milestonePayments: Payment[]): string => {
    return milestonePayments[0]?.currency || 'AED';
  };

  if (milestones.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            No payment milestones found.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Payment Milestones
        </Typography>
        <Stepper orientation="vertical">
          {milestones.map((milestone, index) => {
            const milestonePayments = paymentsByMilestone[milestone];
            const milestoneStatus = getMilestoneStatus(milestonePayments);
            const totalAmount = getTotalAmount(milestonePayments);
            const currency = getCurrency(milestonePayments);
            const isCompleted = milestoneStatus === PaymentStatus.COMPLETED;
            const isRejected = milestoneStatus === PaymentStatus.REJECTED;

            return (
              <Step key={milestone} completed={isCompleted} active={!isCompleted && !isRejected}>
                <StepLabel
                  StepIconComponent={() => {
                    if (isRejected) {
                      return <Cancel color="error" />;
                    }
                    if (isCompleted) {
                      return <CheckCircle color="success" />;
                    }
                    return <RadioButtonUnchecked />;
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {milestone}
                    </Typography>
                    <Chip
                      label={formatCurrency(totalAmount, currency)}
                      size="small"
                      color={isCompleted ? 'success' : 'default'}
                      variant={isCompleted ? 'filled' : 'outlined'}
                    />
                  </Box>
                </StepLabel>
                <StepContent>
                  <Box sx={{ mt: 1 }}>
                    {milestonePayments.map((payment, pIndex) => (
                      <Box key={payment._id}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 1,
                          }}
                        >
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              Payment #{payment._id.slice(-6)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Due: {formatDate(payment.dueDate)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {formatCurrency(payment.amount, payment.currency)}
                            </Typography>
                            <Chip
                              label={payment.status.replace('_', ' ')}
                              size="small"
                              color={
                                payment.status === PaymentStatus.COMPLETED
                                  ? 'success'
                                  : payment.status === PaymentStatus.REJECTED
                                  ? 'error'
                                  : payment.status === PaymentStatus.PENDING_APPROVAL
                                  ? 'warning'
                                  : 'default'
                              }
                            />
                          </Box>
                        </Box>
                        {pIndex < milestonePayments.length - 1 && <Divider sx={{ my: 1 }} />}
                      </Box>
                    ))}
                  </Box>
                </StepContent>
              </Step>
            );
          })}
        </Stepper>
      </CardContent>
    </Card>
  );
};
