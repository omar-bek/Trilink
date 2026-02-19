import React from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Typography,
  useTheme,
  Paper,
} from '@mui/material';
import { CheckCircle, RadioButtonUnchecked, Schedule } from '@mui/icons-material';

export interface TimelineStep {
  id: string;
  label: string;
  description?: string;
  date?: string;
  status: 'completed' | 'active' | 'pending' | 'error';
  content?: React.ReactNode;
}

export interface TimelineProps {
  steps: TimelineStep[];
  orientation?: 'vertical' | 'horizontal';
  alternativeLabel?: boolean;
  showDates?: boolean;
  showDescriptions?: boolean;
}

const getStepIcon = (status: TimelineStep['status'], active: boolean) => {
  switch (status) {
    case 'completed':
      return <CheckCircle />;
    case 'active':
      return <RadioButtonUnchecked />;
    case 'error':
      return <CheckCircle />;
    default:
      return <Schedule />;
  }
};

export const Timeline: React.FC<TimelineProps> = ({
  steps,
  orientation = 'vertical',
  alternativeLabel = false,
  showDates = true,
  showDescriptions = true,
}) => {
  const theme = useTheme();
  const activeStep = steps.findIndex((step) => step.status === 'active');

  if (orientation === 'horizontal') {
    return (
      <Box sx={{ width: '100%' }}>
        <Stepper activeStep={activeStep} alternativeLabel={alternativeLabel}>
          {steps.map((step, index) => (
            <Step key={step.id} completed={step.status === 'completed'}>
              <StepLabel
                error={step.status === 'error'}
                icon={getStepIcon(step.status, index === activeStep)}
                StepIconProps={{
                  sx: {
                    '&.Mui-completed': {
                      color: theme.palette.success.main,
                    },
                    '&.Mui-active': {
                      color: theme.palette.primary.main,
                    },
                    '&.Mui-error': {
                      color: theme.palette.error.main,
                    },
                  },
                }}
              >
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {step.label}
                  </Typography>
                  {showDates && step.date && (
                    <Typography variant="caption" color="text.secondary">
                      {step.date}
                    </Typography>
                  )}
                </Box>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.id} completed={step.status === 'completed'}>
            <StepLabel
              error={step.status === 'error'}
              icon={getStepIcon(step.status, index === activeStep)}
              StepIconProps={{
                sx: {
                  '&.Mui-completed': {
                    color: theme.palette.success.main,
                  },
                  '&.Mui-active': {
                    color: theme.palette.primary.main,
                  },
                  '&.Mui-error': {
                    color: theme.palette.error.main,
                  },
                },
              }}
            >
              <Box>
                <Typography variant="body1" fontWeight={600}>
                  {step.label}
                </Typography>
                {showDates && step.date && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    {step.date}
                  </Typography>
                )}
              </Box>
            </StepLabel>
            {(showDescriptions || step.content) && (
              <StepContent>
                <Paper
                  sx={{
                    p: 2,
                    mt: 1,
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  {step.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: step.content ? 1 : 0 }}>
                      {step.description}
                    </Typography>
                  )}
                  {step.content}
                </Paper>
              </StepContent>
            )}
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};
