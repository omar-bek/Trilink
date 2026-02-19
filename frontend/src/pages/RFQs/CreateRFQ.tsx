import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
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
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack,
} from '@mui/icons-material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useCreateRFQ, useUpdateRFQ, useRFQ } from '@/hooks/useRFQs';
import { CreateRFQDto, RFQItem, DeliveryLocation, RFQType } from '@/types/rfq';
import { Role } from '@/types';
import { usePurchaseRequests } from '@/hooks/usePurchaseRequests';
import { AnonymousToggle } from '@/components/Anonymity/AnonymousToggle';

const steps = ['Basic Information', 'Items', 'Budget & Delivery', 'Target & Settings'];

const validationSchema = yup.object({
  purchaseRequestId: yup.string().required('Purchase request is required'),
  type: yup.string().required('RFQ type is required'),
  targetRole: yup.string().required('Target role is required'),
  targetCompanyType: yup.string().required('Target company type is required'),
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
  deadline: yup.string().required('Deadline is required'),
  anonymousBuyer: yup.boolean().optional(),
});

export const CreateRFQ = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const purchaseRequestId = searchParams.get('purchaseRequestId');
  const [activeStep, setActiveStep] = useState(0);
  const isEditMode = !!id;
  const createMutation = useCreateRFQ();
  const updateMutation = useUpdateRFQ();
  const { data: rfqData } = useRFQ(id);
  const rfq = rfqData?.data;
  const { data: purchaseRequestsData } = usePurchaseRequests();
  const purchaseRequests = purchaseRequestsData?.data || [];

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
    reset,
  } = useForm<CreateRFQDto>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      purchaseRequestId: purchaseRequestId || '',
      type: RFQType.SUPPLIER,
      targetRole: Role.SUPPLIER,
      targetCompanyType: 'Supplier',
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
      deadline: '',
      anonymousBuyer: false,
    },
  });

  // Load RFQ data for edit mode
  useEffect(() => {
    if (isEditMode && rfq) {
      reset({
        purchaseRequestId: rfq.purchaseRequestId,
        type: rfq.type,
        targetRole: rfq.targetRole,
        targetCompanyType: rfq.targetCompanyType,
        title: rfq.title,
        description: rfq.description,
        items: rfq.items,
        budget: rfq.budget,
        currency: rfq.currency,
        deliveryLocation: rfq.deliveryLocation,
        requiredDeliveryDate: rfq.requiredDeliveryDate.split('T')[0],
        deadline: new Date(rfq.deadline).toISOString().slice(0, 16),
        anonymousBuyer: rfq.anonymousBuyer,
      });
    }
  }, [isEditMode, rfq, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const handleNext = async () => {
    let fieldsToValidate: (keyof CreateRFQDto)[] = [];
    
    if (activeStep === 0) {
      fieldsToValidate = ['purchaseRequestId', 'type', 'targetRole', 'targetCompanyType', 'title', 'description'];
    } else if (activeStep === 1) {
      fieldsToValidate = ['items'];
    } else if (activeStep === 2) {
      fieldsToValidate = ['budget', 'currency', 'deliveryLocation', 'requiredDeliveryDate', 'deadline'];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const onSubmit = async (data: CreateRFQDto) => {
    if (isEditMode && id) {
      updateMutation.mutate(
        {
          id,
          data: {
            title: data.title,
            description: data.description,
            items: data.items,
            budget: data.budget,
            deadline: data.deadline,
          },
        },
        {
          onSuccess: () => {
            navigate(`/rfqs/${id}`);
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          navigate('/rfqs');
        },
      });
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Controller
                name="purchaseRequestId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.purchaseRequestId} disabled={isEditMode}>
                    <InputLabel>Purchase Request</InputLabel>
                    <Select {...field} label="Purchase Request">
                      {purchaseRequests.map((pr) => (
                        <MenuItem key={pr._id} value={pr._id}>
                          {pr.title}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.purchaseRequestId && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                        {errors.purchaseRequestId.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.type}>
                    <InputLabel>RFQ Type</InputLabel>
                    <Select {...field} label="RFQ Type">
                      <MenuItem value={RFQType.SUPPLIER}>Supplier</MenuItem>
                      <MenuItem value={RFQType.LOGISTICS}>Logistics</MenuItem>
                      <MenuItem value={RFQType.CLEARANCE}>Clearance</MenuItem>
                      <MenuItem value={RFQType.SERVICE_PROVIDER}>Service Provider</MenuItem>
                    </Select>
                    {errors.type && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                        {errors.type.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="targetRole"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.targetRole}>
                    <InputLabel>Target Role</InputLabel>
                    <Select {...field} label="Target Role">
                      <MenuItem value={Role.SUPPLIER}>Supplier</MenuItem>
                      <MenuItem value={Role.LOGISTICS}>Logistics</MenuItem>
                      <MenuItem value={Role.CLEARANCE}>Clearance</MenuItem>
                      <MenuItem value={Role.SERVICE_PROVIDER}>Service Provider</MenuItem>
                    </Select>
                    {errors.targetRole && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                        {errors.targetRole.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="targetCompanyType"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Target Company Type"
                    error={!!errors.targetCompanyType}
                    helperText={errors.targetCompanyType?.message}
                    required
                  />
                )}
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
                    <Grid item xs={12}>
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
            <Grid item xs={12} md={6}>
              <Controller
                name="deadline"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="datetime-local"
                    label="Bid Deadline"
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.deadline}
                    helperText={errors.deadline?.message}
                    required
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Controller
                name="anonymousBuyer"
                control={control}
                render={({ field }) => (
                  <AnonymousToggle
                    value={field.value || false}
                    onChange={field.onChange}
                    label="Post as Anonymous Buyer"
                    helperText="Hide buyer identity from providers until contract award"
                    showLegalWarning={true}
                    disabled={isEditMode && rfq?.status !== 'draft'}
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
        <Button startIcon={<ArrowBack />} onClick={() => navigate(isEditMode ? `/rfqs/${id}` : '/rfqs')}>
          Back
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          {isEditMode ? 'Edit RFQ' : 'Create RFQ'}
        </Typography>
      </Box>

      {(createMutation.isError || updateMutation.isError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {createMutation.error?.response?.data?.message ||
            updateMutation.error?.response?.data?.message ||
            `Failed to ${isEditMode ? 'update' : 'create'} RFQ`}
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
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? (isEditMode ? 'Updating...' : 'Creating...')
                      : (isEditMode ? 'Update RFQ' : 'Create RFQ')}
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
