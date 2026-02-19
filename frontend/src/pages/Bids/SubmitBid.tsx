import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Divider,
  IconButton,
  Paper,
} from '@mui/material';
import { ArrowBack, Route, LocalShipping, GpsFixed, Add, Delete } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useCreateBid, useBidsByRFQ, useWithdrawBid } from '@/hooks/useBids';
import { useRFQ } from '@/hooks/useRFQs';
import { CreateBidDto, BidStatus } from '@/types/bid';
import { RFQType } from '@/types/rfq';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';
import { formatDate } from '@/utils';
import { AnonymousToggle } from '@/components/Anonymity/AnonymousToggle';
import { notificationService } from '@/utils/notification';

const createValidationSchema = (isLogistics: boolean, rfqItems?: Array<{ name: string; quantity: number; unit: string }>) => {
  const baseSchema: Record<string, any> = {
    price: yup.number().required('Price is required').min(0, 'Price must be positive'),
    currency: yup.string().default('AED'),
    paymentTerms: yup.string().required('Payment terms are required').min(10, 'Please provide detailed payment terms'),
    paymentSchedule: yup.array().of(
      yup.object({
        milestone: yup.string().required('Milestone name is required'),
        amount: yup.number().min(0, 'Amount must be positive'),
        percentage: yup.number().min(0, 'Percentage must be between 0 and 100').max(100, 'Percentage must be between 0 and 100'),
        dueDate: yup.string(),
        description: yup.string(),
      })
    ).test('first-is-downpayment', 'First payment must be "Downpayment"', function(paymentSchedule) {
      if (!paymentSchedule || paymentSchedule.length === 0) return true;
      const firstPayment = paymentSchedule[0];
      return firstPayment?.milestone?.toLowerCase() === 'downpayment';
    }).test('total-percentage', 'Payment schedule percentages must total exactly 100%', function(paymentSchedule) {
      if (!paymentSchedule || paymentSchedule.length === 0) return true;
      const totalPercentage = paymentSchedule.reduce((sum, payment) => sum + (payment.percentage || 0), 0);
      return Math.abs(totalPercentage - 100) < 0.01; // Allow small floating point differences
    }).optional(),
    deliveryTime: yup.number().required('Delivery time is required').min(1, 'Delivery time must be at least 1 day'),
    deliveryDate: yup.string().required('Delivery date is required'),
    validity: yup.string().required('Bid validity date is required'),
    anonymousBidder: yup.boolean().default(false),
  };

  // Add items validation if RFQ has items
  if (rfqItems && rfqItems.length > 0) {
    baseSchema.items = yup.array().of(
      yup.object({
        name: yup.string().required(),
        quantity: yup.number().required().min(1),
        unit: yup.string().required(),
        price: yup.number().required('Item price is required').min(0, 'Item price must be positive'),
      })
    ).min(1, 'At least one item price is required');
  }

  if (isLogistics) {
    return yup.object({
      ...baseSchema,
      costPerShipment: yup.number().required('Cost per shipment is required').min(0, 'Cost must be positive'),
      transitTime: yup.number().required('Transit time is required').min(1, 'Transit time must be at least 1 day'),
      route: yup.string().required('Route selection is required').min(10, 'Please provide route details'),
      trackingAvailable: yup.boolean().default(true),
    });
  }

  return yup.object(baseSchema);
};

export const SubmitBid = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rfqId = searchParams.get('rfqId');
  const createMutation = useCreateBid();
  const { user } = useAuthStore();

  const { data: rfqData, isLoading: isLoadingRFQ, error: rfqError } = useRFQ(rfqId || undefined);
  const rfq = rfqData?.data;

  // Check for existing bids for this RFQ (only from current user's company)
  const { data: existingBidsData, refetch: refetchBids } = useBidsByRFQ(rfqId || undefined);
  const existingBids = existingBidsData?.data || [];
  // Backend already filters to only return current user's company's bids for providers
  const existingBid = existingBids.length > 0 ? existingBids[0] : null;

  const withdrawMutation = useWithdrawBid();

  // Check if this is a logistics RFQ
  const isLogisticsRFQ = rfq?.type === RFQType.LOGISTICS || user?.role === Role.LOGISTICS;

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CreateBidDto & { items?: Array<{ name: string; quantity: number; unit: string; price: number }> }>({
    resolver: yupResolver(createValidationSchema(isLogisticsRFQ, rfq?.items)) as any,
    defaultValues: {
      rfqId: rfqId || '',
      price: 0,
      currency: 'AED',
      paymentTerms: '',
      paymentSchedule: [],
      deliveryTime: 30,
      deliveryDate: '',
      validity: '',
      anonymousBidder: false,
      items: rfq?.items?.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        price: 0,
      })) || [],
      // Logistics-specific defaults
      costPerShipment: 0,
      transitTime: 7,
      route: '',
      trackingAvailable: true,
    },
  });

  const watchedPrice = watch('price');
  const watchedPaymentSchedule = watch('paymentSchedule') || [];
  const watchedCurrency = watch('currency');

  // Calculate amounts from percentages when price changes
  useEffect(() => {
    if (watchedPaymentSchedule.length > 0 && watchedPrice > 0) {
      const updatedSchedule = watchedPaymentSchedule.map((payment: any, index: number) => {
        const percentage = parseFloat(payment.percentage) || 0;
        if (percentage > 0) {
          const calculatedAmount = (watchedPrice * percentage) / 100;
          return { ...payment, amount: calculatedAmount };
        }
        return payment;
      });
      // Only update if amounts actually changed to avoid infinite loops
      const hasChanges = updatedSchedule.some((payment: any, index: number) => {
        const oldAmount = watchedPaymentSchedule[index]?.amount || 0;
        const newAmount = payment.amount || 0;
        return Math.abs(oldAmount - newAmount) > 0.01;
      });
      if (hasChanges) {
        setValue('paymentSchedule', updatedSchedule, { shouldDirty: false });
      }
    }
  }, [watchedPrice, setValue]);

  // Set RFQ ID when available
  useEffect(() => {
    if (rfqId) {
      setValue('rfqId', rfqId);
    }
  }, [rfqId, setValue]);

  // Initialize items when RFQ is loaded
  useEffect(() => {
    if (rfq?.items && rfq.items.length > 0) {
      const items = rfq.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        price: 0,
      }));
      setValue('items', items);
    }
  }, [rfq, setValue]);

  // Set default delivery date based on RFQ
  useEffect(() => {
    if (rfq && !watch('deliveryDate')) {
      setValue('deliveryDate', rfq.requiredDeliveryDate.split('T')[0]);
    }
  }, [rfq, setValue, watch]);

  // Set default validity (30 days from now)
  useEffect(() => {
    if (!watch('validity')) {
      const validityDate = new Date();
      validityDate.setDate(validityDate.getDate() + 30);
      setValue('validity', validityDate.toISOString().split('T')[0]);
    }
  }, [setValue, watch]);

  // Calculate total price from items
  const itemsPrices = watch('items');
  useEffect(() => {
    if (itemsPrices && itemsPrices.length > 0) {
      const total = itemsPrices.reduce((sum, item) => {
        const itemPrice = typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0);
        const quantity = typeof item.quantity === 'string' ? parseFloat(item.quantity) : (item.quantity || 0);
        return sum + (itemPrice * quantity);
      }, 0);
      setValue('price', total);
    }
  }, [itemsPrices, setValue]);

  const onSubmit = async (data: CreateBidDto & { items?: Array<{ name: string; quantity: number; unit: string; price: number }> }) => {
    if (!rfqId) {
      return;
    }

    // Prevent submission if RFQ belongs to the same company
    if (rfq && user?.companyId && rfq.companyId && user.companyId === rfq.companyId) {
      notificationService.showError('You cannot submit a bid for an RFQ created by your own company.');
      return;
    }

    // Prevent submission if bid already exists
    if (existingBid) {
      notificationService.showError('A bid already exists for this RFQ. Please update or withdraw the existing bid.');
      return;
    }

    // Prevent double submission
    if (createMutation.isPending) {
      return;
    }

    // Remove logistics-specific fields that are not in backend schema
    const { costPerShipment, transitTime, route, trackingAvailable, ...bidData } = data;

    // Convert string numbers to actual numbers (TextField type="number" returns strings)
    const price = typeof bidData.price === 'string' ? parseFloat(bidData.price) : (bidData.price || 0);
    const deliveryTime = typeof bidData.deliveryTime === 'string' ? parseInt(bidData.deliveryTime, 10) : (bidData.deliveryTime || 1);

    // Process items if provided
    const processedItems = bidData.items?.map(item => ({
      name: item.name,
      quantity: typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity,
      unit: item.unit,
      price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
    }));

    // Calculate total price from items if provided
    let totalPrice = Number(price);
    if (processedItems && processedItems.length > 0) {
      totalPrice = processedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    // Ensure all required fields are present
    const bidPayload = {
      rfqId,
      price: totalPrice,
      currency: bidData.currency || 'AED',
      paymentTerms: bidData.paymentTerms || '',
      deliveryTime: Number(deliveryTime),
      deliveryDate: bidData.deliveryDate || '',
      validity: bidData.validity || '',
      anonymousBidder: bidData.anonymousBidder || false,
      // Include payment schedule if provided
      ...(bidData.paymentSchedule && bidData.paymentSchedule.length > 0 ? { paymentSchedule: bidData.paymentSchedule } : {}),
      // Include items if provided
      ...(processedItems && processedItems.length > 0 ? { items: processedItems } : {}),
      // Only include attachments if they exist
      ...(bidData.attachments && bidData.attachments.length > 0 ? { attachments: bidData.attachments } : {}),
    };

    // Validate required fields
    if (!bidPayload.paymentTerms || !bidPayload.deliveryDate || !bidPayload.validity) {
      console.error('Missing required fields:', bidPayload);
      return;
    }

    createMutation.mutate(
      bidPayload,
      {
        onSuccess: () => {
          // Refetch bids to update the UI immediately
          refetchBids();
          // Navigate after a short delay to allow query to update
          setTimeout(() => {
            navigate('/bids');
          }, 500);
        },
        onError: (error: any) => {
          // If error is about existing bid, refetch to show the existing bid
          if (error?.response?.data?.message?.includes('already exists')) {
            refetchBids();
          }
        },
      }
    );
  };

  if (isLoadingRFQ) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!rfqId) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          RFQ ID is missing. Please select an RFQ first.
        </Alert>
        <Button variant="outlined" onClick={() => navigate('/rfqs')}>
          Browse RFQs
        </Button>
      </Box>
    );
  }

  if (rfqError || !rfq) {
    const errorMessage = (rfqError as any)?.response?.data?.message || 'RFQ not found';
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}. Please select a valid RFQ.
        </Alert>
        <Button variant="outlined" onClick={() => navigate('/rfqs')}>
          Browse RFQs
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
          Back
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Submit Bid
        </Typography>
      </Box>

      {/* RFQ Info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            RFQ Information
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>Title:</strong> {rfq.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Budget:</strong> {rfq.budget} {rfq.currency} | <strong>Items:</strong>{' '}
            {rfq.items.length} | <strong>Required Delivery:</strong> {formatDate(rfq.requiredDeliveryDate)}
          </Typography>
        </CardContent>
      </Card>

      {/* Same Company Warning */}
      {rfq && user?.companyId && rfq.companyId && user.companyId === rfq.companyId && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Cannot Submit Bid
          </Typography>
          <Typography variant="body2">
            You cannot submit a bid for an RFQ created by your own company. This RFQ belongs to your company.
          </Typography>
        </Alert>
      )}

      {/* Existing Bid Warning */}
      {existingBid && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => navigate(`/bids/${existingBid._id || existingBid.id}`)}
              >
                View Bid
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => navigate(`/bids/${existingBid._id || existingBid.id}/edit`)}
              >
                Update Bid
              </Button>
              {existingBid.status === BidStatus.SUBMITTED && (
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to withdraw this bid? You can submit a new one after withdrawing.')) {
                      const bidId = existingBid._id || existingBid.id;
                      if (!bidId) return;
                      withdrawMutation.mutate(bidId, {
                        onSuccess: () => {
                          // Refetch bids to update the UI
                          window.location.reload();
                        },
                      });
                    }
                  }}
                  disabled={withdrawMutation.isPending}
                >
                  {withdrawMutation.isPending ? 'Withdrawing...' : 'Withdraw'}
                </Button>
              )}
            </Box>
          }
        >
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            You already have a bid for this RFQ
          </Typography>
          <Typography variant="body2">
            Status: <strong>{existingBid.status}</strong> |
            Price: <strong>{existingBid.price} {existingBid.currency}</strong>
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            You can update your existing bid or withdraw it to submit a new one.
          </Typography>
        </Alert>
      )}

      {createMutation.isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            {createMutation.error?.response?.data?.error || 'Failed to submit bid'}
          </Typography>
          {createMutation.error?.response?.data?.errors && (
            <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
              {createMutation.error.response.data.errors.map((err: any, idx: number) => (
                <li key={idx}>
                  <Typography variant="body2">
                    {err.field || err.path?.join('.')}: {err.message}
                  </Typography>
                </li>
              ))}
            </Box>
          )}
          {createMutation.error?.response?.data?.message && (
            <>
              <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
                {createMutation.error.response.data.message}
              </Typography>
              {createMutation.error.response.data.message.includes('already exists') && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontStyle: 'italic' }}>
                    Please wait a moment while we load your existing bid information...
                  </Typography>
                  {existingBid && (
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => navigate(`/bids/${existingBid._id || existingBid.id}`)}
                      >
                        View Existing Bid
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => navigate(`/bids/${existingBid._id || existingBid.id}/edit`)}
                      >
                        Update Bid
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
            </>
          )}
        </Alert>
      )}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              {/* Items with individual prices */}
              {rfq?.items && rfq.items.length > 0 && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
                      Item Prices
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Enter the price for each item. Total price will be calculated automatically.
                    </Typography>
                  </Grid>
                  {rfq.items.map((rfqItem, index) => (
                    <Grid item xs={12} key={index}>
                      <Card variant="outlined" sx={{ p: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} md={4}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {rfqItem.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Quantity: {rfqItem.quantity} {rfqItem.unit}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Controller
                              name={`items.${index}.price`}
                              control={control}
                              render={({ field }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  type="number"
                                  label={`Price per ${rfqItem.unit}`}
                                  error={!!errors.items?.[index]?.price}
                                  helperText={errors.items?.[index]?.price?.message || 'Enter price per unit'}
                                  required
                                  InputProps={{
                                    inputProps: { min: 0, step: 0.01 },
                                    startAdornment: <Typography sx={{ mr: 1 }}>{watch('currency') || 'AED'}</Typography>,
                                  }}
                                />
                              )}
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Typography variant="body2" color="text.secondary">
                              Subtotal: {(() => {
                                const itemPriceValue = watch(`items.${index}.price`);
                                const itemPrice = typeof itemPriceValue === 'string'
                                  ? parseFloat(itemPriceValue || '0')
                                  : (typeof itemPriceValue === 'number' ? itemPriceValue : 0);
                                const subtotal = itemPrice * rfqItem.quantity;
                                return `${subtotal.toFixed(2)} ${watch('currency') || 'AED'}`;
                              })()}
                            </Typography>
                          </Grid>
                          {/* Hidden fields for item details */}
                          <Controller
                            name={`items.${index}.name`}
                            control={control}
                            render={({ field }) => <input type="hidden" {...field} value={rfqItem.name} />}
                          />
                          <Controller
                            name={`items.${index}.quantity`}
                            control={control}
                            render={({ field }) => <input type="hidden" {...field} value={rfqItem.quantity} />}
                          />
                          <Controller
                            name={`items.${index}.unit`}
                            control={control}
                            render={({ field }) => <input type="hidden" {...field} value={rfqItem.unit} />}
                          />
                        </Grid>
                      </Card>
                    </Grid>
                  ))}
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                  </Grid>
                </>
              )}

              <Grid item xs={12} md={6}>
                <Controller
                  name="price"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Total Bid Price"
                      error={!!errors.price}
                      helperText={errors.price?.message || (rfq?.items && rfq.items.length > 0 ? 'Calculated automatically from item prices' : 'Enter total bid price')}
                      required
                      disabled={rfq?.items && rfq.items.length > 0}
                      InputProps={{
                        inputProps: { min: 0, step: 0.01 },
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="currency"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Currency</InputLabel>
                      <Select {...field} label="Currency">
                        <MenuItem value="AED">AED - UAE Dirham</MenuItem>
                        <MenuItem value="USD">USD - US Dollar</MenuItem>
                        <MenuItem value="EUR">EUR - Euro</MenuItem>
                        <MenuItem value="GBP">GBP - British Pound</MenuItem>
                      </Select>
                    </FormControl>
                  )}
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
                      required
                    />
                  )}
                />
              </Grid>

              {/* Payment Schedule */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Payment Schedule (Optional)
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Define payment schedule with amounts and percentages (total must equal 100%)
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Add />}
                        onClick={() => {
                          const currentSchedule = watchedPaymentSchedule || [];
                          // If no payments exist, add Downpayment as first payment
                          if (currentSchedule.length === 0) {
                            setValue('paymentSchedule', [
                              { milestone: 'Downpayment', percentage: 0, amount: 0, dueDate: '', description: '' },
                            ]);
                          } else {
                            setValue('paymentSchedule', [
                              ...currentSchedule,
                              { milestone: '', percentage: 0, amount: 0, dueDate: '', description: '' },
                            ]);
                          }
                        }}
                      >
                        Add Payment
                      </Button>
                    </Box>

                    {/* Total Bid Price - Always visible */}
                    <Box sx={{ mb: 2, p: 1.5, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Total Bid Price: {watchedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {watch('currency') || 'AED'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Used to calculate payment amounts
                      </Typography>
                    </Box>

                    {watchedPaymentSchedule.length === 0 && (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          Payment schedule is required. The first payment must be "Downpayment".
                        </Typography>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<Add />}
                          onClick={() => {
                            setValue('paymentSchedule', [
                              { milestone: 'Downpayment', percentage: 0, amount: 0, dueDate: '', description: '' },
                            ]);
                          }}
                        >
                          Add Downpayment (Required)
                        </Button>
                      </Alert>
                    )}

                    {watchedPaymentSchedule.map((payment: any, index: number) => {
                      const paymentPercentage = parseFloat(payment.percentage) || 0;
                      const calculatedAmount = watchedPrice > 0 ? (watchedPrice * paymentPercentage) / 100 : 0;
                      const isFirstPayment = index === 0;
                      const isDownpayment = payment.milestone?.toLowerCase() === 'downpayment';

                      return (
                        <Paper 
                          key={index} 
                          sx={{ 
                            p: 2, 
                            mb: 2, 
                            bgcolor: 'background.paper',
                            border: '1px solid', 
                            borderColor: 'divider',
                          }}
                        >
                          {isFirstPayment && (
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                Required: First payment must be "Downpayment"
                              </Typography>
                            </Box>
                          )}
                          <Grid container spacing={2} alignItems="center">
                            {/* Milestone Name */}
                            <Grid item xs={12} sm={4}>
                              <Controller
                                name={`paymentSchedule.${index}.milestone`}
                                control={control}
                                render={({ field }) => (
                                  <TextField
                                    {...field}
                                    fullWidth
                                    label="Milestone Name"
                                    placeholder={isFirstPayment ? "Downpayment" : "e.g., Upon Delivery"}
                                    size="small"
                                    required
                                    disabled={isFirstPayment && isDownpayment}
                                    error={isFirstPayment && !isDownpayment}
                                    helperText={isFirstPayment && !isDownpayment ? "First payment must be 'Downpayment'" : undefined}
                                  />
                                )}
                              />
                            </Grid>

                            {/* Percentage */}
                            <Grid item xs={12} sm={3}>
                              <Controller
                                name={`paymentSchedule.${index}.percentage`}
                                control={control}
                                render={({ field }) => (
                                  <TextField
                                    {...field}
                                    fullWidth
                                    type="number"
                                    label="Percentage %"
                                    size="small"
                                    InputProps={{
                                      inputProps: { min: 0, max: 100, step: 0.01 },
                                    }}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0;
                                      field.onChange(value);
                                      // Calculate amount from percentage × total price
                                      if (watchedPrice > 0) {
                                        const calculatedAmount = (watchedPrice * value) / 100;
                                        setValue(`paymentSchedule.${index}.amount`, calculatedAmount);
                                      }
                                    }}
                                    required
                                  />
                                )}
                              />
                            </Grid>

                            {/* Amount (calculated: Percentage × Total) */}
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                type="number"
                                label="Amount (Percentage × Total)"
                                size="small"
                                value={calculatedAmount.toFixed(2)}
                                disabled
                                InputProps={{
                                  endAdornment: (
                                    <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                                      {watch('currency') || 'AED'}
                                    </Typography>
                                  ),
                                }}
                                helperText={`${paymentPercentage}% × ${watchedPrice.toLocaleString()} = ${calculatedAmount.toFixed(2)} ${watch('currency') || 'AED'}`}
                              />
                            </Grid>

                            {/* Delete Button */}
                            <Grid item xs={12} sm={1}>
                              <IconButton
                                color="error"
                                disabled={isFirstPayment && watchedPaymentSchedule.length === 1}
                                onClick={() => {
                                  // Prevent deleting the first payment if it's the only one
                                  if (isFirstPayment && watchedPaymentSchedule.length === 1) {
                                    return;
                                  }
                                  const updated = watchedPaymentSchedule.filter((_: any, i: number) => i !== index);
                                  setValue('paymentSchedule', updated);
                                }}
                                title={isFirstPayment && watchedPaymentSchedule.length === 1 ? "Cannot delete required Downpayment" : "Delete payment"}
                              >
                                <Delete />
                              </IconButton>
                            </Grid>

                            {/* Due Date */}
                            <Grid item xs={12} sm={6}>
                              <Controller
                                name={`paymentSchedule.${index}.dueDate`}
                                control={control}
                                render={({ field }) => (
                                  <TextField
                                    {...field}
                                    fullWidth
                                    type="date"
                                    label="Due Date"
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                  />
                                )}
                              />
                            </Grid>

                            {/* Description */}
                            <Grid item xs={12} sm={6}>
                              <Controller
                                name={`paymentSchedule.${index}.description`}
                                control={control}
                                render={({ field }) => (
                                  <TextField
                                    {...field}
                                    fullWidth
                                    label="Description (Optional)"
                                    size="small"
                                    placeholder="e.g., Upon delivery"
                                  />
                                )}
                              />
                            </Grid>
                          </Grid>
                        </Paper>
                      );
                    })}

                    {/* Total Summary */}
                    {watchedPaymentSchedule.length > 0 && (
                      <Paper sx={{ p: 2, mt: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              Total Percentage:
                            </Typography>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 600,
                                color: Math.abs(
                                  watchedPaymentSchedule.reduce((sum: number, p: any) => sum + (parseFloat(p.percentage) || 0), 0) - 100
                                ) < 0.01 ? 'text.primary' : 'error.main',
                              }}
                            >
                              {watchedPaymentSchedule
                                .reduce((sum: number, p: any) => sum + (parseFloat(p.percentage) || 0), 0)
                                .toFixed(2)}%
                              {Math.abs(
                                watchedPaymentSchedule.reduce((sum: number, p: any) => sum + (parseFloat(p.percentage) || 0), 0) - 100
                              ) >= 0.01 && (
                                <Typography component="span" variant="body2" sx={{ ml: 1, color: 'error.main' }}>
                                  (Must be exactly 100%)
                                </Typography>
                              )}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              Total Amount:
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {watchedPaymentSchedule
                                .reduce((sum: number, p: any) => {
                                  const percentage = parseFloat(p.percentage) || 0;
                                  return sum + (watchedPrice > 0 ? (watchedPrice * percentage) / 100 : 0);
                                }, 0)
                                .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                              {watch('currency') || 'AED'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              of {watchedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {watch('currency') || 'AED'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Paper>
                    )}

                    {errors.paymentSchedule && (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        {errors.paymentSchedule.message}
                      </Alert>
                    )}
                  </CardContent>
                </Card>
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
                      required
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
                      required
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
                      required
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="anonymousBidder"
                  control={control}
                  render={({ field }) => (
                    <AnonymousToggle
                      value={field.value || false}
                      onChange={field.onChange}
                      label="Submit as Anonymous Bidder"
                      helperText="Hide company identity from buyer until bid acceptance"
                      showLegalWarning={true}
                    />
                  )}
                />
              </Grid>

              {/* Logistics-Specific Fields */}
              {isLogisticsRFQ && (
                <>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }}>
                      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocalShipping />
                        Logistics-Specific Information
                      </Typography>
                    </Divider>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Controller
                      name="costPerShipment"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          type="number"
                          label="Cost per Shipment"
                          error={!!errors.costPerShipment}
                          helperText={errors.costPerShipment?.message || 'Total cost for transporting this shipment'}
                          required
                          InputProps={{
                            inputProps: { min: 0, step: 0.01 },
                            startAdornment: <Typography sx={{ mr: 1 }}>{watch('currency') || 'AED'}</Typography>,
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Controller
                      name="transitTime"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          type="number"
                          label="Transit Time (Days)"
                          error={!!errors.transitTime}
                          helperText={errors.transitTime?.message || 'Estimated days from pickup to delivery'}
                          required
                          InputProps={{
                            inputProps: { min: 1 },
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Controller
                      name="route"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Route Selection"
                          multiline
                          rows={3}
                          placeholder="Describe the transport route, including waypoints, ports, or transit points..."
                          error={!!errors.route}
                          helperText={errors.route?.message || 'Specify the route from origin to destination'}
                          required
                          InputProps={{
                            startAdornment: <Route sx={{ mr: 1, color: 'text.secondary' }} />,
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Controller
                      name="trackingAvailable"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={
                            <Switch
                              {...field}
                              checked={field.value}
                              color="primary"
                            />
                          }
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <GpsFixed fontSize="small" />
                              <Typography>Real-time GPS Tracking Available</Typography>
                            </Box>
                          }
                        />
                      )}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, ml: 4 }}>
                      Enable real-time GPS tracking for this shipment
                    </Typography>
                  </Grid>
                </>
              )}

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button variant="outlined" onClick={() => navigate(-1)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={
                      createMutation.isPending ||
                      !!existingBid ||
                      (rfq && user?.companyId && rfq.companyId && user.companyId === rfq.companyId)
                    }
                  >
                    {createMutation.isPending
                      ? 'Submitting...'
                      : existingBid
                        ? 'Bid Already Exists'
                        : 'Submit Bid'}
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
