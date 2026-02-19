import {
  Box,
  Card,
  CardContent,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Divider,
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  ArrowForward,
  Assignment,
  Payment,
  LocalShipping,
  ErrorOutline,
  HourglassEmpty,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ContractStatus } from '@/types/contract';
import { BidStatus } from '@/types/bid';
import { PaymentStatus } from '@/types/payment';
import { ShipmentStatus } from '@/types/shipment';
import { formatDate, formatCurrency } from '@/utils';

export interface WorkflowStep {
  id: string;
  label: string;
  status: 'completed' | 'active' | 'pending' | 'failed' | 'not_started';
  description: string;
  entityId?: string;
  entityType?: 'contract' | 'payment' | 'shipment';
  timestamp?: string;
  metadata?: Record<string, any>;
}

interface WorkflowStatusIndicatorProps {
  title: string;
  steps: WorkflowStep[];
  onNavigate?: (entityType: string, entityId: string) => void;
  showActions?: boolean;
}

export const WorkflowStatusIndicator = ({
  title,
  steps,
  onNavigate,
  showActions = true,
}: WorkflowStatusIndicatorProps) => {
  const navigate = useNavigate();

  const getStepIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'active':
        return <CircularProgress size={20} />;
      case 'failed':
        return <ErrorOutline color="error" />;
      case 'pending':
        return <HourglassEmpty color="warning" />;
      default:
        return <RadioButtonUnchecked color="disabled" />;
    }
  };

  const getStepColor = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'active':
        return 'primary';
      case 'failed':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const handleNavigate = (step: WorkflowStep) => {
    if (step.entityId && step.entityType) {
      if (onNavigate) {
        onNavigate(step.entityType, step.entityId);
      } else {
        navigate(`/${step.entityType}s/${step.entityId}`);
      }
    }
  };

  const activeStepIndex = steps.findIndex((s) => s.status === 'active');
  const hasFailures = steps.some((s) => s.status === 'failed');

  return (
    <Card sx={{ mb: 3, borderLeft: '4px solid', borderColor: hasFailures ? 'error.main' : 'primary.main' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          {hasFailures && (
            <Chip label="Issues Detected" color="error" size="small" icon={<ErrorOutline />} />
          )}
        </Box>

        <Stepper activeStep={activeStepIndex >= 0 ? activeStepIndex : steps.length} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.id} completed={step.status === 'completed'}>
              <StepLabel
                StepIconComponent={() => (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {getStepIcon(step.status)}
                  </Box>
                )}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {step.label}
                  </Typography>
                  <Chip
                    label={step.status.replace('_', ' ')}
                    size="small"
                    color={getStepColor(step.status) as any}
                    variant={step.status === 'active' ? 'filled' : 'outlined'}
                  />
                </Box>
              </StepLabel>
              <StepContent>
                <Box sx={{ mt: 1, mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {step.description}
                  </Typography>

                  {step.timestamp && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      {formatDate(step.timestamp)}
                    </Typography>
                  )}

                  {step.metadata && Object.keys(step.metadata).length > 0 && (
                    <Box sx={{ mt: 1, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                      {step.metadata.amount && (
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          <strong>Amount:</strong> {formatCurrency(step.metadata.amount, step.metadata.currency || 'AED')}
                        </Typography>
                      )}
                      {step.metadata.count && (
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          <strong>Count:</strong> {step.metadata.count}
                        </Typography>
                      )}
                      {step.metadata.status && (
                        <Chip
                          label={step.metadata.status}
                          size="small"
                          sx={{ mt: 0.5 }}
                          color={
                            step.metadata.status === 'completed' || step.metadata.status === 'active'
                              ? 'success'
                              : step.metadata.status === 'pending'
                              ? 'warning'
                              : 'default'
                          }
                        />
                      )}
                    </Box>
                  )}

                  {step.status === 'failed' && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      <Typography variant="body2">
                        This step encountered an error. Please review and take corrective action.
                      </Typography>
                    </Alert>
                  )}

                  {showActions && step.entityId && step.entityType && step.status !== 'not_started' && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ArrowForward />}
                      onClick={() => handleNavigate(step)}
                      sx={{ mt: 1 }}
                    >
                      View {step.entityType.charAt(0).toUpperCase() + step.entityType.slice(1)}
                    </Button>
                  )}
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>

        {/* Summary */}
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {steps.filter((s) => s.status === 'completed').length} of {steps.length} steps completed
          </Typography>
          {activeStepIndex >= 0 && (
            <Chip
              label={`Current: ${steps[activeStepIndex].label}`}
              color="primary"
              size="small"
              icon={<HourglassEmpty />}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
