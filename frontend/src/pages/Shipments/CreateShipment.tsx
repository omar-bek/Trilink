import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useCreateShipment } from '@/hooks/useShipments';
import { CreateShipmentDto, OriginDestination } from '@/types/shipment';
import { useContracts } from '@/hooks/useContracts';
import { useQuery } from '@tanstack/react-query';
import { companyService } from '@/services/company.service';
import { CompanyType } from '@/types/company';

const steps = ['Contract & Logistics', 'Origin', 'Destination', 'Delivery Date'];

const validationSchema = yup.object({
  contractId: yup.string().required('Contract is required'),
  logisticsCompanyId: yup.string().required('Logistics company is required'),
  origin: yup.object({
    address: yup.string().required('Address is required'),
    city: yup.string().required('City is required'),
    country: yup.string().required('Country is required'),
    coordinates: yup.object({
      lat: yup.number().required('Latitude is required'),
      lng: yup.number().required('Longitude is required'),
    }),
  }),
  destination: yup.object({
    address: yup.string().required('Address is required'),
    city: yup.string().required('City is required'),
    country: yup.string().required('Country is required'),
    coordinates: yup.object({
      lat: yup.number().required('Latitude is required'),
      lng: yup.number().required('Longitude is required'),
    }),
  }),
  estimatedDeliveryDate: yup.string().required('Estimated delivery date is required'),
});

export const CreateShipment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const contractId = searchParams.get('contractId');
  const [activeStep, setActiveStep] = useState(0);
  const createMutation = useCreateShipment();
  const { data: contractsData } = useContracts();
  const contracts = contractsData?.data || [];

  // Fetch logistics companies
  const { data: logisticsData } = useQuery({
    queryKey: ['companies', 'logistics'],
    queryFn: async () => {
      const response = await companyService.getCompanies({ type: CompanyType.LOGISTICS });
      return response.data;
    },
  });
  const logisticsCompanies = logisticsData || [];

  const {
    control,
    handleSubmit,
    formState: { errors },
    trigger,
  } = useForm<CreateShipmentDto>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      contractId: contractId || '',
      logisticsCompanyId: '',
      origin: {
        address: '',
        city: '',
        country: '',
        coordinates: { lat: 0, lng: 0 },
      },
      destination: {
        address: '',
        city: '',
        country: '',
        coordinates: { lat: 0, lng: 0 },
      },
      estimatedDeliveryDate: '',
    },
  });

  const handleNext = async () => {
    let fieldsToValidate: (keyof CreateShipmentDto)[] = [];
    
    if (activeStep === 0) {
      fieldsToValidate = ['contractId', 'logisticsCompanyId'];
    } else if (activeStep === 1) {
      fieldsToValidate = ['origin'];
    } else if (activeStep === 2) {
      fieldsToValidate = ['destination'];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const onSubmit = async (data: CreateShipmentDto) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        navigate('/shipments');
      },
    });
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Controller
                name="contractId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.contractId}>
                    <InputLabel>Contract</InputLabel>
                    <Select {...field} label="Contract">
                      {contracts.map((contract) => (
                        <MenuItem key={contract._id} value={contract._id}>
                          Contract #{contract._id.slice(-8)} - {contract.status}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.contractId && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                        {errors.contractId.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="logisticsCompanyId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.logisticsCompanyId}>
                    <InputLabel>Logistics Company</InputLabel>
                    <Select {...field} label="Logistics Company">
                      {logisticsCompanies.map((company) => (
                        <MenuItem key={company._id} value={company._id}>
                          {company.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.logisticsCompanyId && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                        {errors.logisticsCompanyId.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Origin Location
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="origin.address"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Address"
                    error={!!errors.origin?.address}
                    helperText={errors.origin?.address?.message}
                    required
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="origin.city"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="City"
                    error={!!errors.origin?.city}
                    helperText={errors.origin?.city?.message}
                    required
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="origin.country"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Country"
                    error={!!errors.origin?.country}
                    helperText={errors.origin?.country?.message}
                    required
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="origin.coordinates.lat"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Latitude"
                    error={!!errors.origin?.coordinates?.lat}
                    helperText={errors.origin?.coordinates?.lat?.message}
                    required
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="origin.coordinates.lng"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Longitude"
                    error={!!errors.origin?.coordinates?.lng}
                    helperText={errors.origin?.coordinates?.lng?.message}
                    required
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Destination Location
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="destination.address"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Address"
                    error={!!errors.destination?.address}
                    helperText={errors.destination?.address?.message}
                    required
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="destination.city"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="City"
                    error={!!errors.destination?.city}
                    helperText={errors.destination?.city?.message}
                    required
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="destination.country"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Country"
                    error={!!errors.destination?.country}
                    helperText={errors.destination?.country?.message}
                    required
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="destination.coordinates.lat"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Latitude"
                    error={!!errors.destination?.coordinates?.lat}
                    helperText={errors.destination?.coordinates?.lat?.message}
                    required
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="destination.coordinates.lng"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Longitude"
                    error={!!errors.destination?.coordinates?.lng}
                    helperText={errors.destination?.coordinates?.lng?.message}
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
            <Grid item xs={12} md={6}>
              <Controller
                name="estimatedDeliveryDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="date"
                    label="Estimated Delivery Date"
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.estimatedDeliveryDate}
                    helperText={errors.estimatedDeliveryDate?.message}
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
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/shipments')}>
          Back
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Create Shipment
        </Typography>
      </Box>

      {createMutation.isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {createMutation.error?.response?.data?.message || 'Failed to create shipment'}
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
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Shipment'}
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
