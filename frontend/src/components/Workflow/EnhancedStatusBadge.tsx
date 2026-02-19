import { Chip, Box, Tooltip, Typography } from '@mui/material';
import { Info } from '@mui/icons-material';
import { getWorkflowStep, EntityType } from '@/config/workflow';

interface EnhancedStatusBadgeProps {
  entityType: EntityType;
  status: string;
  showContext?: boolean;
  size?: 'small' | 'medium';
}

export const EnhancedStatusBadge = ({
  entityType,
  status,
  showContext = false,
  size = 'small',
}: EnhancedStatusBadgeProps) => {
  const step = getWorkflowStep(entityType, status);

  if (!step) {
    // Fallback to basic badge if workflow step not found
    return (
      <Chip
        label={status}
        size={size}
        sx={{ fontWeight: 500 }}
      />
    );
  }

  const getColor = (status: string): 'default' | 'primary' | 'success' | 'warning' | 'error' => {
    if (step.isTerminal) {
      if (status.includes('CANCELLED') || status.includes('REJECTED') || status.includes('TERMINATED')) {
        return 'error';
      }
      if (status.includes('COMPLETED') || status.includes('DELIVERED')) {
        return 'success';
      }
      return 'default';
    }

    if (status.includes('PENDING') || status.includes('UNDER_REVIEW') || status.includes('PROCESSING')) {
      return 'warning';
    }

    if (status.includes('ACTIVE') || status.includes('OPEN') || status.includes('ACCEPTED') || status.includes('APPROVED')) {
      return 'success';
    }

    if (status.includes('DRAFT')) {
      return 'default';
    }

    return 'primary';
  };

  const badge = (
    <Chip
      label={step.label}
      color={getColor(status)}
      size={size}
      sx={{ fontWeight: 500 }}
    />
  );

  if (!showContext) {
    return badge;
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {badge}
      {step.previousStep && (
        <Tooltip
          title={
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                Previous: {step.previousStep.label}
              </Typography>
              <Typography variant="caption">
                {step.previousStep.description}
              </Typography>
            </Box>
          }
        >
          <Info fontSize="small" sx={{ color: 'text.secondary', cursor: 'help' }} />
        </Tooltip>
      )}
    </Box>
  );
};
