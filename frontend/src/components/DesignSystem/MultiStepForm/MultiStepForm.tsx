import React, { useState } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Paper,
  Typography,
  useTheme,
} from '@mui/material';
import { ArrowBack, ArrowForward, Check } from '@mui/icons-material';

export interface FormStep {
  id: string;
  label: string;
  description?: string;
  component: React.ReactNode;
  validation?: () => boolean | Promise<boolean>;
}

export interface MultiStepFormProps {
  steps: FormStep[];
  onSubmit: (data: Record<string, any>) => void | Promise<void>;
  onCancel?: () => void;
  initialData?: Record<string, any>;
  showStepNumbers?: boolean;
}

export const MultiStepForm: React.FC<MultiStepFormProps> = ({
  steps,
  onSubmit,
  onCancel,
  initialData = {},
  showStepNumbers = true,
}) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [errors, setErrors] = useState<Record<number, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = async () => {
    const currentStep = steps[activeStep];
    
    // Validate current step if validation function exists
    if (currentStep.validation) {
      const isValid = await currentStep.validation();
      if (!isValid) {
        setErrors((prev) => ({ ...prev, [activeStep]: true }));
        return;
      }
    }

    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[activeStep];
      return newErrors;
    });

    if (activeStep === steps.length - 1) {
      // Last step - submit form
      setIsSubmitting(true);
      try {
        await onSubmit(formData);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setFormData(initialData);
    setErrors({});
  };

  const updateFormData = (stepId: string, data: any) => {
    setFormData((prev) => ({
      ...prev,
      [stepId]: data,
    }));
  };

  const currentStep = steps[activeStep];
  const isLastStep = activeStep === steps.length - 1;
  const hasError = errors[activeStep];

  return (
    <Box sx={{ width: '100%' }}>
      {/* Stepper */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((step, index) => (
            <Step key={step.id} completed={index < activeStep}>
              <StepLabel error={errors[index]}
                optional={
                  step.description && (
                    <Typography variant="caption" color="text.secondary">
                      {step.description}
                    </Typography>
                  )
                }
              >
                {showStepNumbers ? `${index + 1}. ${step.label}` : step.label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Form Content */}
      <Paper
        sx={{
          p: 4,
          mb: 3,
          minHeight: '400px',
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {currentStep.label}
          </Typography>
          {currentStep.description && (
            <Typography variant="body2" color="text.secondary">
              {currentStep.description}
            </Typography>
          )}
        </Box>

        {hasError && (
          <Box
            sx={{
              p: 2,
              mb: 3,
              borderRadius: theme.shape.borderRadius,
              backgroundColor: theme.palette.error.dark + '20',
              border: `1px solid ${theme.palette.error.main}`,
            }}
          >
            <Typography variant="body2" color="error">
              Please fix the errors before proceeding.
            </Typography>
          </Box>
        )}

        <Box>
          {React.isValidElement(currentStep.component)
            ? React.cloneElement(currentStep.component as React.ReactElement<any>, {
                data: formData[currentStep.id],
                updateData: (data: any) => updateFormData(currentStep.id, data),
                formData,
              })
            : currentStep.component}
        </Box>
      </Paper>

      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
          startIcon={<ArrowBack />}
          variant="outlined"
        >
          Back
        </Button>

        <Box sx={{ display: 'flex', gap: 2 }}>
          {onCancel && (
            <Button onClick={onCancel} variant="text" color="inherit">
              Cancel
            </Button>
          )}
          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={isLastStep ? <Check /> : <ArrowForward />}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : isLastStep ? 'Submit' : 'Next'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
