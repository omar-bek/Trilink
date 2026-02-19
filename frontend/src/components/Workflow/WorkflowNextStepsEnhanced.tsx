import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Alert,
  Stack,
  Divider,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  ArrowForward,
  CheckCircle,
  HourglassEmpty,
  Block,
  Assignment,
  Payment,
  LocalShipping,
  Notifications,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { EntityType, getWorkflowStep } from '@/config/workflow';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';
import { formatDate } from '@/utils';

interface RelatedEntity {
  id: string;
  type: 'contract' | 'payment' | 'shipment';
  label: string;
  status: string;
  metadata?: Record<string, any>;
}

interface WorkflowNextStepsEnhancedProps {
  entityType: EntityType;
  status: string;
  entityId?: string;
  relatedEntities?: RelatedEntity[];
  onAction?: (action: string) => void;
  customPath?: string;
  showNotifications?: boolean;
  notifications?: Array<{
    type: 'success' | 'info' | 'warning' | 'error';
    message: string;
    timestamp?: string;
  }>;
}

export const WorkflowNextStepsEnhanced = ({
  entityType,
  status,
  entityId,
  relatedEntities = [],
  onAction,
  customPath,
  showNotifications = true,
  notifications = [],
}: WorkflowNextStepsEnhancedProps) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role = user?.role as Role;

  const step = getWorkflowStep(entityType, status);

  if (!step) {
    return null;
  }

  // Terminal state
  if (step.isTerminal) {
    return (
      <Card sx={{ mb: 3, borderLeft: '4px solid', borderColor: 'success.main' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CheckCircle color="success" sx={{ fontSize: 40 }} />
            <Box sx={{ flex: 1 }}>
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

  // Show notifications if available
  const hasNotifications = showNotifications && notifications.length > 0;

  // Show related entities (auto-created)
  const hasRelatedEntities = relatedEntities.length > 0;

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
          {/* Notifications */}
          {hasNotifications && (
            <>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, mb: 1, display: 'block' }}>
                  Recent Updates
                </Typography>
                {notifications.map((notification, index) => (
                  <Alert key={index} severity={notification.type} sx={{ mb: 1 }}>
                    <Typography variant="body2">{notification.message}</Typography>
                    {notification.timestamp && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        {formatDate(notification.timestamp)}
                      </Typography>
                    )}
                  </Alert>
                ))}
              </Box>
              <Divider />
            </>
          )}

          {/* Related Entities (Auto-created) */}
          {hasRelatedEntities && (
            <>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, mb: 1, display: 'block' }}>
                  Auto-Created Entities
                </Typography>
                <Stack spacing={1}>
                  {relatedEntities.map((entity) => (
                    <Box
                      key={entity.id}
                      sx={{
                        p: 1.5,
                        bgcolor: 'action.hover',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 1,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {entity.type === 'contract' && <Assignment fontSize="small" color="primary" />}
                        {entity.type === 'payment' && <Payment fontSize="small" color="success" />}
                        {entity.type === 'shipment' && <LocalShipping fontSize="small" color="info" />}
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {entity.label}
                        </Typography>
                        <Chip label={entity.status} size="small" />
                      </Box>
                      <Button
                        variant="text"
                        size="small"
                        endIcon={<ArrowForward />}
                        onClick={() => {
                          if (entity.id) {
                            navigate(`/${entity.type}s/${entity.id}`);
                          }
                        }}
                      >
                        View
                      </Button>
                    </Box>
                  ))}
                </Stack>
              </Box>
              <Divider />
            </>
          )}

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

            {step.nextAction.cta && (
              <>
                {!step.nextAction.cta.roles || step.nextAction.cta.roles.includes(role) ? (
                  <Button
                    variant={step.nextAction.cta.variant || 'contained'}
                    size="medium"
                    endIcon={<ArrowForward />}
                    onClick={() => {
                      const cta = step.nextAction.cta;
                      if (!cta) return;
                      
                      // Handle action-based buttons (publish, submit, sign, etc.)
                      if (cta.action) {
                        if (onAction) {
                          onAction(cta.action);
                        } else {
                          // If no onAction handler provided, log warning
                          console.warn(`Action "${cta.action}" requires an onAction handler in parent component`);
                        }
                        return; // Actions don't navigate, they trigger handlers
                      }
                      
                      // Handle path-based buttons (navigation)
                      if (cta.path) {
                        const path = customPath || cta.path;
                        
                        // Build navigation path based on entity type and context
                        if (entityId) {
                          // Special handling for different entity types and paths
                          if (entityType === 'rfq' && path === '/rfqs') {
                            // Navigate to bids comparison page for RFQ
                            navigate(`/rfqs/${entityId}/bids/compare`);
                          } else if (entityType === 'bid' && path === '/contracts') {
                            // For accepted bids, try to find related contract first
                            // If not found, navigate to contracts list filtered by bidId
                            navigate(`/contracts?bidId=${entityId}`);
                          } else if (entityType === 'contract' && path === '/shipments') {
                            // For contracts, navigate to related shipments
                            navigate(`/shipments?contractId=${entityId}`);
                          } else if (path.startsWith('/')) {
                            // Standard path format - append entityId
                            navigate(`${path}/${entityId}`);
                          } else {
                            // Relative path
                            navigate(`${path}/${entityId}`);
                          }
                        } else {
                          // No entityId, navigate to list page
                          navigate(path);
                        }
                      }
                    }}
                    fullWidth
                  >
                    {step.nextAction.cta.label}
                  </Button>
                ) : (
                  <Alert severity="info" icon={<Block />}>
                    <Typography variant="body2">
                      {step.nextAction.description}
                    </Typography>
                  </Alert>
                )}
              </>
            )}

            {!step.nextAction.cta && (
              <Alert severity="info" icon={<HourglassEmpty />}>
                <Typography variant="body2">
                  {step.nextAction.description}
                </Typography>
              </Alert>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};
