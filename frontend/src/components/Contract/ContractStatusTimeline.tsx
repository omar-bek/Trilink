import { Box, Stepper, Step, StepLabel, StepContent, Typography } from '@mui/material';
import { CheckCircle, RadioButtonUnchecked, Cancel } from '@mui/icons-material';
import { ContractStatus } from '@/types/contract';

interface ContractStatusTimelineProps {
  status: ContractStatus;
  createdAt: string;
  updatedAt: string;
  signaturesCount: number;
  totalParties: number;
}

const statusSteps = [
  {
    status: ContractStatus.DRAFT,
    label: 'Draft',
    description: 'Contract is being prepared',
  },
  {
    status: ContractStatus.PENDING_SIGNATURES,
    label: 'Pending Signatures',
    description: 'Waiting for all parties to sign',
  },
  {
    status: ContractStatus.SIGNED,
    label: 'Signed',
    description: 'All parties have signed',
  },
  {
    status: ContractStatus.ACTIVE,
    label: 'Active',
    description: 'Contract is active and in effect',
  },
  {
    status: ContractStatus.COMPLETED,
    label: 'Completed',
    description: 'Contract has been completed',
  },
  {
    status: ContractStatus.TERMINATED,
    label: 'Terminated',
    description: 'Contract has been terminated',
  },
  {
    status: ContractStatus.CANCELLED,
    label: 'Cancelled',
    description: 'Contract has been cancelled',
  },
];

export const ContractStatusTimeline = ({
  status,
  signaturesCount,
  totalParties,
}: ContractStatusTimelineProps) => {
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
        Contract Status Timeline
      </Typography>
      <Stepper orientation="vertical" activeStep={currentStepIndex}>
        {statusSteps.map((step, index) => {
          const stepStatus = getStepStatus(index);
          const isCompleted = stepStatus === 'completed';
          const isActive = stepStatus === 'active';
          const isTerminalStep =
            (step.status === ContractStatus.TERMINATED && status === ContractStatus.TERMINATED) ||
            (step.status === ContractStatus.CANCELLED && status === ContractStatus.CANCELLED);

          // Skip terminal steps if not applicable
          if (
            (step.status === ContractStatus.TERMINATED && status !== ContractStatus.TERMINATED) ||
            (step.status === ContractStatus.CANCELLED && status !== ContractStatus.CANCELLED)
          ) {
            return null;
          }

          return (
            <Step key={step.status} completed={isCompleted} active={isActive}>
              <StepLabel
                StepIconComponent={() => {
                  if (isTerminalStep) {
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
                {step.status === ContractStatus.PENDING_SIGNATURES && (
                  <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'block' }}>
                    Signatures: {signaturesCount}/{totalParties}
                  </Typography>
                )}
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
