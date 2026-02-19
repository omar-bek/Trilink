import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Alert,
  Stack,
  Divider,
} from '@mui/material';
import {
  ArrowForward,
  CheckCircle,
  HourglassEmpty,
  Block,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getWorkflowStep, EntityType } from '@/config/workflow';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';

interface WhatsNextProps {
  entityType: EntityType;
  status: string;
  entityId?: string;
  onAction?: (action: string) => void;
  customPath?: string;
}

export const WhatsNext = ({
  entityType,
  status,
  entityId,
  onAction,
  customPath,
}: WhatsNextProps) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role = user?.role as Role;

  const step = getWorkflowStep(entityType, status);

  if (!step) {
    return null;
  }

  // Terminal state - no next action
  if (step.isTerminal) {
    return (
      <Card sx={{ mb: 3, borderLeft: '4px solid', borderColor: 'success.main' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CheckCircle color="success" sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                Workflow Complete
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {step.nextAction.description}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Empty state - no actionable next step
  if (step.isEmpty || !step.nextAction.cta) {
    return (
      <Card sx={{ mb: 3, borderLeft: '4px solid', borderColor: 'info.main' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <HourglassEmpty color="info" sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {step.nextAction.label}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {step.nextAction.description}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const cta = step.nextAction.cta;

  // Check if user role has permission
  const hasPermission = !cta.roles || cta.roles.includes(role);

  if (!hasPermission) {
    return (
      <Card sx={{ mb: 3, borderLeft: '4px solid', borderColor: 'warning.main' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Block color="warning" sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Waiting for Action
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {step.nextAction.description}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const handleAction = () => {
    if (onAction && cta.action) {
      onAction(cta.action);
    } else if (cta.path) {
      const path = customPath || cta.path;
      if (entityId) {
        // Special handling for RFQ: navigate to bids comparison page
        if (entityType === 'rfq' && path === '/rfqs') {
          navigate(`/rfqs/${entityId}/bids/compare`);
        } else {
          navigate(`${path}/${entityId}`);
        }
      } else {
        navigate(path);
      }
    }
  };

  return (
    <Card sx={{ mb: 3, borderLeft: '4px solid', borderColor: 'primary.main' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <ArrowForward color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            What's Next?
          </Typography>
        </Box>

        <Stack spacing={2}>
          {/* Previous Step Context */}
          {step.previousStep && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Previous Step
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {step.previousStep.label} - {step.previousStep.description}
              </Typography>
            </Box>
          )}

          {step.previousStep && <Divider />}

          {/* Current Status */}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Current Status
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 500 }}>
              {step.label}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {step.description}
            </Typography>
          </Box>

          <Divider />

          {/* Next Action */}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Next Required Action
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, mb: 1.5, fontWeight: 500 }}>
              {step.nextAction.label}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {step.nextAction.description}
            </Typography>
            <Button
              variant={cta.variant || 'contained'}
              size="medium"
              endIcon={<ArrowForward />}
              onClick={handleAction}
              fullWidth
            >
              {cta.label}
            </Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};
