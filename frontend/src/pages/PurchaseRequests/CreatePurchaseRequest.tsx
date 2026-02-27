import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack,
} from '@mui/icons-material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useCreatePurchaseRequest } from '@/hooks/usePurchaseRequests';
import { CreatePurchaseRequestDto, PurchaseRequestItem, DeliveryLocation } from '@/types/purchase-request';
import { CategorySelector } from '@/components/Category/CategorySelector';

// Install: npm install react-hook-form @hookform/resolvers yup

const steps = ['Basic Information', 'Items', 'Budget & Delivery'];

const validationSchema = yup.object({
  categoryId: yup.string().required('Category is required'),
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

export const CreatePurchaseRequest = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const createMutation = useCreatePurchaseRequest();

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
  } = useForm<CreatePurchaseRequestDto>({
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

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const handleNext = async () => {
    let fieldsToValidate: (keyof CreatePurchaseRequestDto)[] = [];
    
    if (activeStep === 0) {
      fieldsToValidate = ['categoryId', 'title', 'description'];
    } else if (activeStep === 1) {
      fieldsToValidate = ['items'];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const onSubmit = async (data: CreatePurchaseRequestDto) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        navigate('/purchase-requests');
      },
    });
  };

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
                required
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
                    InputLabelProps={{ sx: { color: 'white' } }}
                    sx={{
                      '& .MuiInputBase-input': { color: 'white' },
                      '& .MuiFormHelperText-root': { color: 'rgba(255, 255, 255, 0.7)' },
                    }}
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
                    InputLabelProps={{ sx: { color: 'white' } }}
                    sx={{
                      '& .MuiInputBase-input': { color: 'white' },
                      '& .MuiFormHelperText-root': { color: 'rgba(255, 255, 255, 0.7)' },
                    }}
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
              <Typography variant="h6" sx={{ color: 'white' }}>Items</Typography>
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
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'white' }}>
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
                            InputLabelProps={{ sx: { color: 'white' } }}
                            sx={{
                              '& .MuiInputBase-input': { color: 'white' },
                              '& .MuiFormHelperText-root': { color: 'rgba(255, 255, 255, 0.7)' },
                            }}
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
                            InputLabelProps={{ sx: { color: 'white' } }}
                            sx={{
                              '& .MuiInputBase-input': { color: 'white' },
                              '& .MuiFormHelperText-root': { color: 'rgba(255, 255, 255, 0.7)' },
                            }}
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
                            InputLabelProps={{ sx: { color: 'white' } }}
                            InputProps={{
                              sx: { '&::placeholder': { color: 'rgba(255, 255, 255, 0.5)' } },
                            }}
                            sx={{
                              '& .MuiInputBase-input': { color: 'white' },
                              '& .MuiFormHelperText-root': { color: 'rgba(255, 255, 255, 0.7)' },
                            }}
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
                            InputLabelProps={{ sx: { color: 'white' } }}
                            sx={{
                              '& .MuiInputBase-input': { color: 'white' },
                              '& .MuiFormHelperText-root': { color: 'rgba(255, 255, 255, 0.7)' },
                            }}
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
                            InputLabelProps={{ sx: { color: 'white' } }}
                            sx={{
                              '& .MuiInputBase-input': { color: 'white' },
                              '& .MuiFormHelperText-root': { color: 'rgba(255, 255, 255, 0.7)' },
                            }}
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
                    InputLabelProps={{ sx: { color: 'white' } }}
                    sx={{
                      '& .MuiInputBase-input': { color: 'white' },
                      '& .MuiFormHelperText-root': { color: 'rgba(255, 255, 255, 0.7)' },
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
                    <InputLabel sx={{ color: 'white' }}>Currency</InputLabel>
                    <Select 
                      {...field} 
                      label="Currency"
                      sx={{
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.23)' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                        '& .MuiSvgIcon-root': { color: 'white' },
                      }}
                    >
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
              <Typography variant="h6" gutterBottom sx={{ mt: 2, color: 'white' }}>
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
                    InputLabelProps={{ sx: { color: 'white' } }}
                    sx={{
                      '& .MuiInputBase-input': { color: 'white' },
                      '& .MuiFormHelperText-root': { color: 'rgba(255, 255, 255, 0.7)' },
                    }}
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
                    InputLabelProps={{ sx: { color: 'white' } }}
                    sx={{
                      '& .MuiInputBase-input': { color: 'white' },
                      '& .MuiFormHelperText-root': { color: 'rgba(255, 255, 255, 0.7)' },
                    }}
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
                    InputLabelProps={{ sx: { color: 'white' } }}
                    sx={{
                      '& .MuiInputBase-input': { color: 'white' },
                      '& .MuiFormHelperText-root': { color: 'rgba(255, 255, 255, 0.7)' },
                    }}
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
                    InputLabelProps={{ sx: { color: 'white' } }}
                    sx={{
                      '& .MuiInputBase-input': { color: 'white' },
                      '& .MuiFormHelperText-root': { color: 'rgba(255, 255, 255, 0.7)' },
                    }}
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
                    <InputLabel sx={{ color: 'white' }}>Country</InputLabel>
                    <Select 
                      {...field} 
                      label="Country"
                      sx={{
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.23)' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                        '& .MuiSvgIcon-root': { color: 'white' },
                      }}
                    >
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
                    InputLabelProps={{ shrink: true, sx: { color: 'white' } }}
                    error={!!errors.requiredDeliveryDate}
                    helperText={errors.requiredDeliveryDate?.message}
                    required
                    sx={{
                      '& .MuiInputBase-input': { color: 'white' },
                      '& .MuiFormHelperText-root': { color: 'rgba(255, 255, 255, 0.7)' },
                      '& .MuiInputBase-input::before': { borderColor: 'rgba(255, 255, 255, 0.23)' },
                    }}
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
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/purchase-requests')}>
          Back
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 600, color: 'white' }}>
          Create Purchase Request
        </Typography>
      </Box>

      {createMutation.isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {createMutation.error?.response?.data?.message || 'Failed to create purchase request'}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel sx={{ '& .MuiStepLabel-label': { color: 'white' } }}>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <form onSubmit={handleSubmit(onSubmit)}>
            {renderStepContent()}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
              >
                Back
              </Button>
              <Box>
                {activeStep < steps.length - 1 ? (
                  <Button variant="contained" onClick={handleNext}>
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Purchase Request'}
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
