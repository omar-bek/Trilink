import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Card,
  CardContent,
  TextField,
  Grid,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack,
} from '@mui/icons-material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { usePurchaseRequest, useUpdatePurchaseRequest } from '@/hooks/usePurchaseRequests';
import { UpdatePurchaseRequestDto, PurchaseRequestItem } from '@/types/purchase-request';
import { PageSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';
import { CategorySelector } from '@/components/Category/CategorySelector';

const steps = ['Basic Information', 'Items', 'Budget & Delivery'];

const validationSchema = yup.object({
  categoryId: yup.string().optional(),
  subCategoryId: yup.string().optional().nullable(),
  title: yup.string().required('Title is required').min(3, 'Title must be at least 3 characters'),
  description: yup.string().required('Description is required').min(10, 'Description must be at least 10 characters'),
  items: yup
    .array()
    .of(
      yup.object({
        name: yup.string().required('Item name is required'),
        quantity: yup.number().required('Quantity is required').min(1, 'Quantity must be at least 1'),
        unit: yup.string().required('Unit is required'),
        specifications: yup.string().required('Specifications are required'),
        estimatedPrice: yup.number().min(0, 'Price must be positive').optional(),
      })
    )
    .min(1, 'At least one item is required'),
  budget: yup.number().required('Budget is required').min(0, 'Budget must be positive'),
  currency: yup.string().default('AED'),
  deliveryLocation: yup.object({
    address: yup.string().required('Address is required'),
    city: yup.string().required('City is required'),
    state: yup.string().required('State is required'),
    country: yup.string().required('Country is required'),
    zipCode: yup.string().required('Zip code is required'),
  }),
  requiredDeliveryDate: yup.string().required('Delivery date is required'),
});

export const EditPurchaseRequest = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  const { data, isLoading, error } = usePurchaseRequest(id);
  const updateMutation = useUpdatePurchaseRequest();

  const purchaseRequest = data?.data;

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
    reset,
  } = useForm<UpdatePurchaseRequestDto>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      categoryId: '',
      subCategoryId: '',
      title: '',
      description: '',
      items: [{ name: '', quantity: 1, unit: '', specifications: '' }],
      budget: 0,
      currency: 'AED',
      deliveryLocation: {
        address: '',
        city: '',
        state: '',
        country: 'UAE',
        zipCode: '',
      },
      requiredDeliveryDate: '',
    },
  });

  // Load data when purchase request is fetched
  useEffect(() => {
    if (purchaseRequest) {
      reset({
        categoryId: purchaseRequest.categoryId || purchaseRequest.id || '',
        subCategoryId: purchaseRequest.subCategoryId || '',
        title: purchaseRequest.title,
        description: purchaseRequest.description,
        items: purchaseRequest.items,
        budget: purchaseRequest.budget,
        currency: purchaseRequest.currency,
        deliveryLocation: purchaseRequest.deliveryLocation,
        requiredDeliveryDate: purchaseRequest.requiredDeliveryDate.split('T')[0], // Extract date part
      });
    }
  }, [purchaseRequest, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const handleNext = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();

    let fieldsToValidate: (keyof UpdatePurchaseRequestDto)[] = [];

    if (activeStep === 0) {
      fieldsToValidate = ['title', 'description'];
    } else if (activeStep === 1) {
      fieldsToValidate = ['items'];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();
    setActiveStep((prev) => prev - 1);
  };

  const onSubmit = async (data: UpdatePurchaseRequestDto) => {
    if (!id) return;

    updateMutation.mutate(
      { id, data },
      {
        onSuccess: () => {
          navigate(`/purchase-requests/${id}`);
        },
      }
    );
  };

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error || !purchaseRequest) {
    return (
      <Alert severity="error">
        Failed to load purchase request. Please try again.
      </Alert>
    );
  }

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <CategorySelector
                control={control}
                name="categoryId"
                subCategoryName="subCategoryId"
                label="Category"
                subCategoryLabel="Sub-Category (Optional)"
                required={false}
                error={!!errors.categoryId}
                helperText={errors.categoryId?.message}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Title"
                    error={!!errors.title}
                    helperText={errors.title?.message}
                    required
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Description"
                    multiline
                    rows={4}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                    required
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Items</Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={() => append({ name: '', quantity: 1, unit: '', specifications: '' })}
                variant="outlined"
                size="small"
              >
                Add Item
              </Button>
            </Box>
            {errors.items && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errors.items.message}
              </Alert>
            )}
            {fields.map((field, index) => (
              <Card key={field.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Item {index + 1}
                    </Typography>
                    {fields.length > 1 && (
                      <IconButton
                        color="error"
                        onClick={() => remove(index)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Controller
                        name={`items.${index}.name`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Item Name"
                            error={!!errors.items?.[index]?.name}
                            helperText={errors.items?.[index]?.name?.message}
                            required
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Controller
                        name={`items.${index}.quantity`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            type="number"
                            label="Quantity"
                            error={!!errors.items?.[index]?.quantity}
                            helperText={errors.items?.[index]?.quantity?.message}
                            required
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Controller
                        name={`items.${index}.unit`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Unit"
                            placeholder="e.g., kg, pcs, boxes"
                            error={!!errors.items?.[index]?.unit}
                            helperText={errors.items?.[index]?.unit?.message}
                            required
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Controller
                        name={`items.${index}.specifications`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Specifications"
                            multiline
                            rows={2}
                            error={!!errors.items?.[index]?.specifications}
                            helperText={errors.items?.[index]?.specifications?.message}
                            required
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Controller
                        name={`items.${index}.estimatedPrice`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            type="number"
                            label="Estimated Price (Optional)"
                            error={!!errors.items?.[index]?.estimatedPrice}
                            helperText={errors.items?.[index]?.estimatedPrice?.message}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </Box>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Controller
                name="budget"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Budget"
                    error={!!errors.budget}
                    helperText={errors.budget?.message}
                    required
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
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Delivery Location
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="deliveryLocation.address"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Address"
                    error={!!errors.deliveryLocation?.address}
                    helperText={errors.deliveryLocation?.address?.message}
                    required
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name="deliveryLocation.city"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="City"
                    error={!!errors.deliveryLocation?.city}
                    helperText={errors.deliveryLocation?.city?.message}
                    required
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name="deliveryLocation.state"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="State/Emirate"
                    error={!!errors.deliveryLocation?.state}
                    helperText={errors.deliveryLocation?.state?.message}
                    required
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name="deliveryLocation.zipCode"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Zip Code"
                    error={!!errors.deliveryLocation?.zipCode}
                    helperText={errors.deliveryLocation?.zipCode?.message}
                    required
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="deliveryLocation.country"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Country</InputLabel>
                    <Select {...field} label="Country">
                      <MenuItem value="UAE">United Arab Emirates</MenuItem>
                      <MenuItem value="SA">Saudi Arabia</MenuItem>
                      <MenuItem value="KW">Kuwait</MenuItem>
                      <MenuItem value="QA">Qatar</MenuItem>
                      <MenuItem value="OM">Oman</MenuItem>
                      <MenuItem value="BH">Bahrain</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="requiredDeliveryDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="date"
                    label="Required Delivery Date"
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.requiredDeliveryDate}
                    helperText={errors.requiredDeliveryDate?.message}
                    required
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(`/purchase-requests/${id}`)}>
          Back
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Edit Purchase Request
        </Typography>
      </Box>

      {updateMutation.isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {(() => {
            const error = updateMutation.error?.response?.data;
            if (error?.message) return error.message;
            if (error?.error) return error.error;
            if (error?.errors && Array.isArray(error.errors)) {
              return `Validation errors: ${error.errors.map((e: any) => `${e.field || 'field'}: ${e.message || e}`).join(', ')}`;
            }
            return 'Failed to update purchase request';
          })()}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <form
            onSubmit={handleSubmit(onSubmit)}
            onKeyDown={(e) => {
              // Prevent form submission on Enter key unless we're on the last step
              if (e.key === 'Enter' && activeStep < steps.length - 1) {
                e.preventDefault();
                e.stopPropagation();
                // Don't auto-trigger handleNext, let user click the button
              }
            }}
          >
            {renderStepContent()}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                type="button"
                disabled={activeStep === 0}
                onClick={handleBack}
              >
                Back
              </Button>
              <Box>
                {activeStep < steps.length - 1 ? (
                  <Button
                    type="button"
                    variant="contained"
                    onClick={handleNext}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? 'Updating...' : 'Update Purchase Request'}
                  </Button>
                )}
              </Box>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};
