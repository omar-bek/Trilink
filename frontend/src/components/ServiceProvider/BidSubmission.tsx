/**
 * Bid Submission Component
 * 
 * Service provider bid submission with service-specific fields
 */

import { useState, useEffect } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EnterpriseCard } from '@/components/common';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { TextField, FormControlLabel, Switch, CircularProgress } from '@mui/material';
import { useCreateBid } from '@/hooks/useBids';
import { useRFQ } from '@/hooks/useRFQs';
import { ServiceType, ServiceTypeConfig, BidField } from '@/config/serviceProvider';
import { designTokens } from '@/theme/designTokens';
import { CreateBidDto } from '@/types/bid';

const { spacing } = designTokens;

interface BidSubmissionProps {
  serviceType: ServiceType;
  serviceConfig: ServiceTypeConfig;
  rfqId?: string;
}

export const BidSubmission = ({ serviceType, serviceConfig, rfqId: propRfqId }: BidSubmissionProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rfqId = propRfqId || searchParams.get('rfqId');
  const createMutation = useCreateBid();

  const { data: rfqData } = useRFQ(rfqId || undefined);
  const rfq = rfqData?.data;

  // Build validation schema from service config
  const buildValidationSchema = () => {
    const schema: Record<string, any> = {
      rfqId: yup.string().required('RFQ ID is required'),
      price: yup.number().required('Price is required').min(0, 'Price must be positive'),
      currency: yup.string().required('Currency is required'),
      paymentTerms: yup.string().required('Payment terms are required'),
      deliveryTime: yup.number().required('Delivery time is required').min(1),
      deliveryDate: yup.string().required('Delivery date is required'),
      validity: yup.string().required('Validity date is required'),
    };

    // Add service-specific bid fields
    serviceConfig.bidFields.forEach((field: BidField) => {
      if (field.type === 'number') {
        schema[field.id] = yup
          .number()
          .required(field.required ? `${field.label} is required` : undefined)
          .min(field.validation?.min || 0, `Must be at least ${field.validation?.min || 0}`);
      } else if (field.type === 'boolean') {
        schema[field.id] = yup.boolean();
      } else {
        schema[field.id] = field.required
          ? yup.string().required(`${field.label} is required`)
          : yup.string();
      }
    });

    return yup.object(schema);
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CreateBidDto & Record<string, any>>({
    resolver: yupResolver(buildValidationSchema()),
    defaultValues: {
      rfqId: rfqId || '',
      price: 0,
      currency: 'AED',
      paymentTerms: '',
      deliveryTime: 30,
      deliveryDate: '',
      validity: '',
      ...Object.fromEntries(
        serviceConfig.bidFields.map((field) => [
          field.id,
          field.type === 'number' ? 0 : field.type === 'boolean' ? false : '',
        ])
      ),
    },
  });

  // Set RFQ ID when available
  useEffect(() => {
    if (rfqId) {
      setValue('rfqId', rfqId);
    }
  }, [rfqId, setValue]);

  const onSubmit = async (data: any) => {
    if (!rfqId) {
      return;
    }

    try {
      await createMutation.mutateAsync(data);
      navigate(`/bids?rfqId=${rfqId}`);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <EnterpriseCard
      title={`Submit Bid - ${serviceConfig.displayName}`}
      subtitle={rfq ? `RFQ: ${rfq.rfqNumber}` : 'Create a new bid'}
    >
      {!rfq && (
        <Alert severity="warning" sx={{ mb: spacing.lg }}>
          Please select an RFQ to submit a bid
        </Alert>
      )}

      {rfq && (
        <Box sx={{ mb: spacing.xl }}>
          <Typography variant="h6" gutterBottom>
            RFQ Details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {rfq.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Deadline: {new Date(rfq.bidDeadline).toLocaleDateString()}
          </Typography>
        </Box>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
          {/* Standard Bid Fields */}
          <Controller
            name="price"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Price (AED)"
                type="number"
                error={!!errors.price}
                helperText={errors.price?.message}
                fullWidth
              />
            )}
          />

          <Controller
            name="paymentTerms"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Payment Terms"
                multiline
                rows={3}
                error={!!errors.paymentTerms}
                helperText={errors.paymentTerms?.message}
                fullWidth
              />
            )}
          />

          <Controller
            name="deliveryTime"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Delivery Time (days)"
                type="number"
                error={!!errors.deliveryTime}
                helperText={errors.deliveryTime?.message}
                fullWidth
              />
            )}
          />

          {/* Service-Specific Fields */}
          {serviceConfig.bidFields.map((field) => (
            <Controller
              key={field.id}
              name={field.id}
              control={control}
              render={({ field: formField }) => {
                if (field.type === 'boolean') {
                  return (
                    <FormControlLabel
                      control={<Switch {...formField} checked={formField.value} />}
                      label={field.label}
                    />
                  );
                }

                if (field.type === 'select' && field.options) {
                  return (
                    <TextField
                      {...formField}
                      select
                      label={field.label}
                      error={!!errors[field.id]}
                      helperText={errors[field.id]?.message}
                      fullWidth
                      SelectProps={{
                        native: true,
                      }}
                    >
                      {field.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </TextField>
                  );
                }

                if (field.type === 'textarea') {
                  return (
                    <TextField
                      {...formField}
                      label={field.label}
                      multiline
                      rows={4}
                      error={!!errors[field.id]}
                      helperText={errors[field.id]?.message}
                      placeholder={field.placeholder}
                      fullWidth
                    />
                  );
                }

                return (
                  <TextField
                    {...formField}
                    label={field.label}
                    type={field.type}
                    error={!!errors[field.id]}
                    helperText={errors[field.id]?.message}
                    placeholder={field.placeholder}
                    fullWidth
                  />
                );
              }}
            />
          ))}

          <Box sx={{ display: 'flex', gap: spacing.lg, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isPending}
              startIcon={createMutation.isPending ? <CircularProgress size={20} /> : null}
            >
              Submit Bid
            </Button>
          </Box>
        </Box>
      </form>
    </EnterpriseCard>
  );
};