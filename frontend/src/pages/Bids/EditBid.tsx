import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useBid, useUpdateBid } from '@/hooks/useBids';
import { UpdateBidDto, BidStatus } from '@/types/bid';
import { PageSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';

const validationSchema = yup.object({
  price: yup.number().min(0, 'Price must be positive').optional(),
  paymentTerms: yup.string().min(10, 'Please provide detailed payment terms').optional(),
  deliveryTime: yup.number().min(1, 'Delivery time must be at least 1 day').optional(),
  deliveryDate: yup.string().optional(),
  validity: yup.string().optional(),
});

export const EditBid = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role = user?.role as Role;

  const { data, isLoading, error } = useBid(id);
  const updateMutation = useUpdateBid();

  const bid = data?.data;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateBidDto>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      price: 0,
      paymentTerms: '',
      deliveryTime: 30,
      deliveryDate: '',
      validity: '',
    },
  });

  // Load data when bid is fetched
  useEffect(() => {
    if (bid) {
      reset({
        price: bid.price,
        paymentTerms: bid.paymentTerms,
        deliveryTime: bid.deliveryTime,
        deliveryDate: bid.deliveryDate.split('T')[0], // Extract date part
        validity: bid.validity.split('T')[0], // Extract date part
      });
    }
  }, [bid, reset]);

  const onSubmit = async (data: UpdateBidDto) => {
    if (!id) return;

    updateMutation.mutate(
      { id, data },
      {
        onSuccess: () => {
          navigate(`/bids/${id}`);
        },
      }
    );
  };

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error || !bid) {
    return (
      <Alert severity="error">
        Failed to load bid. Please try again.
      </Alert>
    );
  }

  // Check if user can edit this bid
  const isProvider = role !== Role.BUYER && role !== Role.ADMIN && role !== Role.GOVERNMENT;
  const isBidOwner = user?.companyId === bid?.companyId;
  const canEdit = isProvider && isBidOwner && (bid.status === BidStatus.DRAFT || bid.status === BidStatus.SUBMITTED);

  if (!canEdit) {
    return (
      <Alert severity="error">
        You cannot edit this bid. Only the bid owner can edit draft or submitted bids.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(`/bids/${id}`)}>
          Back
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Edit Bid
        </Typography>
      </Box>

      {updateMutation.isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {updateMutation.error?.response?.data?.message || 'Failed to update bid'}
        </Alert>
      )}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="price"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Bid Price"
                      error={!!errors.price}
                      helperText={errors.price?.message}
                      InputProps={{
                        inputProps: { min: 0, step: 0.01 },
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Currency"
                  value={bid.currency}
                  disabled
                  helperText="Currency cannot be changed"
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="paymentTerms"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Payment Terms"
                      multiline
                      rows={4}
                      placeholder="Describe payment terms, milestones, and conditions..."
                      error={!!errors.paymentTerms}
                      helperText={errors.paymentTerms?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="deliveryTime"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Delivery Time (Days)"
                      error={!!errors.deliveryTime}
                      helperText={errors.deliveryTime?.message}
                      InputProps={{
                        inputProps: { min: 1 },
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="deliveryDate"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="date"
                      label="Delivery Date"
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.deliveryDate}
                      helperText={errors.deliveryDate?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="validity"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="date"
                      label="Bid Validity Until"
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.validity}
                      helperText={errors.validity?.message || 'Date until which this bid remains valid'}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button variant="outlined" onClick={() => navigate(`/bids/${id}`)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Updating...
                      </>
                    ) : (
                      'Update Bid'
                    )}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};
