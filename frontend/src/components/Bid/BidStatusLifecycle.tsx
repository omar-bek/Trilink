import { Box, Stepper, Step, StepLabel, StepContent, Typography } from '@mui/material';
import { CheckCircle, RadioButtonUnchecked, Cancel } from '@mui/icons-material';
import { BidStatus } from '@/types/bid';

interface BidStatusLifecycleProps {
  status: BidStatus;
  createdAt: string;
  updatedAt: string;
}

const statusSteps = [
  { status: BidStatus.DRAFT, label: 'Draft', description: 'Bid is being prepared' },
  { status: BidStatus.SUBMITTED, label: 'Submitted', description: 'Bid has been submitted' },
  { status: BidStatus.UNDER_REVIEW, label: 'Under Review', description: 'Buyer is reviewing the bid' },
  { status: BidStatus.ACCEPTED, label: 'Accepted', description: 'Bid has been accepted' },
  { status: BidStatus.REJECTED, label: 'Rejected', description: 'Bid has been rejected' },
  { status: BidStatus.WITHDRAWN, label: 'Withdrawn', description: 'Bid has been withdrawn' },
];

export const BidStatusLifecycle = ({ status }: BidStatusLifecycleProps) => {
  const getCurrentStepIndex = (): number => {
    return statusSteps.findIndex((step) => step.status === status);
  };

  const getStepStatus = (stepIndex: number): 'completed' | 'active' | 'inactive' => {
    const currentIndex = getCurrentStepIndex();
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'inactive';
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
        Bid Status Lifecycle
      </Typography>
      <Stepper orientation="vertical" activeStep={currentStepIndex}>
        {statusSteps.map((step, index) => {
          const stepStatus = getStepStatus(index);
          const isCompleted = stepStatus === 'completed';
          const isActive = stepStatus === 'active';
          const isRejected = status === BidStatus.REJECTED && step.status === BidStatus.REJECTED;
          const isWithdrawn = status === BidStatus.WITHDRAWN && step.status === BidStatus.WITHDRAWN;

          return (
            <Step key={step.status} completed={isCompleted} active={isActive}>
              <StepLabel
                StepIconComponent={() => {
                  if (isRejected || isWithdrawn) {
                    return <Cancel color="error" />;
                  }
                  if (isCompleted) {
                    return <CheckCircle color="success" />;
                  }
                  return <RadioButtonUnchecked />;
                }}
              >
                {step.label}
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary">
                  {step.description}
                </Typography>
                {isActive && (
                  <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'block' }}>
                    Current Status
                  </Typography>
                )}
              </StepContent>
            </Step>
          );
        })}
      </Stepper>
    </Box>
  );
};
