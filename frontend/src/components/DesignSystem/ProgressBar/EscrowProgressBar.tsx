import React from 'react';
import {
  Box,
  LinearProgress,
  Typography,
  useTheme,
  Paper,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { CheckCircle, Schedule, Lock, Payment } from '@mui/icons-material';

export type EscrowStage = 'initiated' | 'funded' | 'in-progress' | 'completed' | 'released';

export interface EscrowProgressBarProps {
  currentStage: EscrowStage;
  amount?: number;
  currency?: string;
  milestones?: Array<{
    id: string;
    label: string;
    completed: boolean;
    amount?: number;
  }>;
  showDetails?: boolean;
}

const stageOrder: EscrowStage[] = ['initiated', 'funded', 'in-progress', 'completed', 'released'];

const stageLabels: Record<EscrowStage, string> = {
  initiated: 'Initiated',
  funded: 'Funded',
  'in-progress': 'In Progress',
  completed: 'Completed',
  released: 'Released',
};

const getStageIcon = (stage: EscrowStage, isActive: boolean, isCompleted: boolean) => {
  if (isCompleted) return <CheckCircle />;
  if (isActive) return <Schedule />;
  return <Lock />;
};

export const EscrowProgressBar: React.FC<EscrowProgressBarProps> = ({
  currentStage,
  amount,
  currency = 'USD',
  milestones,
  showDetails = true,
}) => {
  const theme = useTheme();
  const currentIndex = stageOrder.indexOf(currentStage);
  const progress = ((currentIndex + 1) / stageOrder.length) * 100;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Paper
      sx={{
        p: 3,
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" fontWeight={600}>
            Escrow Status
          </Typography>
          {amount && (
            <Typography variant="h6" fontWeight={600} color="primary">
              {formatCurrency(amount)}
            </Typography>
          )}
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 8,
            borderRadius: theme.shape.borderRadius,
            backgroundColor: theme.palette.background.default,
            '& .MuiLinearProgress-bar': {
              borderRadius: theme.shape.borderRadius,
              background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            },
          }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {Math.round(progress)}% Complete
        </Typography>
      </Box>

      {showDetails && (
        <Box>
          <Stepper activeStep={currentIndex} alternativeLabel>
            {stageOrder.map((stage, index) => {
              const isCompleted = index < currentIndex;
              const isActive = index === currentIndex;
              return (
                <Step key={stage} completed={isCompleted}>
                  <StepLabel
                    icon={getStageIcon(stage, isActive, isCompleted)}
                    StepIconProps={{
                      sx: {
                        '&.Mui-completed': {
                          color: theme.palette.success.main,
                        },
                        '&.Mui-active': {
                          color: theme.palette.primary.main,
                        },
                      },
                    }}
                  >
                    <Typography variant="caption" fontWeight={isActive ? 600 : 400}>
                      {stageLabels[stage]}
                    </Typography>
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>
        </Box>
      )}

      {milestones && milestones.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
            Milestones
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {milestones.map((milestone) => (
              <Box
                key={milestone.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 1.5,
                  borderRadius: theme.shape.borderRadius,
                  backgroundColor: milestone.completed
                    ? `${theme.palette.success.main}20`
                    : theme.palette.background.default,
                  border: `1px solid ${milestone.completed ? theme.palette.success.main : theme.palette.divider}`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {milestone.completed ? (
                    <CheckCircle sx={{ color: theme.palette.success.main, fontSize: 20 }} />
                  ) : (
                    <Schedule sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />
                  )}
                  <Typography variant="body2">{milestone.label}</Typography>
                </Box>
                {milestone.amount && (
                  <Typography variant="body2" fontWeight={600}>
                    {formatCurrency(milestone.amount)}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  );
};
