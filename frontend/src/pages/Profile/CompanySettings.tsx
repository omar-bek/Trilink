import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import { Business, Save, Edit, Cancel } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuthStore } from '@/store/auth.store';
import { useCompany, useUpdateCompany, useAddCompanyDocument } from '@/hooks/useCompany';
import { UpdateCompanyDto } from '@/types/company';
import { DocumentUpload } from '@/components/Profile/DocumentUpload';
import { PageSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';
import { CompanyCategoryAssignment } from '@/components/Company/CompanyCategoryAssignment';
import { Role } from '@/types';

const companySchema = yup.object({
  name: yup.string().optional(),
  email: yup.string().email('Invalid email').optional(),
  phone: yup.string().optional(),
  address: yup.object({
    street: yup.string().optional(),
    city: yup.string().optional(),
    state: yup.string().optional(),
    country: yup.string().optional(),
    zipCode: yup.string().optional(),
  }).optional(),
});

export const CompanySettings = () => {
  const { user } = useAuthStore();
  const companyId = user?.companyId || '';
  const isAdmin = user?.role === Role.ADMIN;
  const isCompanyManager = user?.role === Role.COMPANY_MANAGER;

  const { data: companyData, isLoading } = useCompany(companyId);
  const updateCompanyMutation = useUpdateCompany();
  const addDocumentMutation = useAddCompanyDocument();

  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const company = (companyData as any)?.data;
  const readOnly = !isAdmin && !isCompanyManager;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateCompanyDto>({
    resolver: yupResolver(companySchema),
    defaultValues: {
      name: company?.name || '',
      email: company?.email || '',
      phone: company?.phone || '',
      address: {
        street: company?.address?.street || '',
        city: company?.address?.city || '',
        state: company?.address?.state || '',
        country: company?.address?.country || '',
        zipCode: company?.address?.zipCode || '',
      },
    },
  });

  // Update form when company data loads
  useEffect(() => {
    if (company && !isLoading) {
      reset({
        name: company.name,
        email: company.email,
        phone: company.phone,
        address: {
          street: company.address.street,
          city: company.address.city,
          state: company.address.state,
          country: company.address.country,
          zipCode: company.address.zipCode,
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id, isLoading]);

  const onSubmit = async (data: UpdateCompanyDto) => {
    try {
      await updateCompanyMutation.mutateAsync({ companyId, data });
      setSuccessMessage('Company information updated successfully');
      setErrorMessage(null);
      setIsEditing(false);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.error || 'Failed to update company information');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
    setErrorMessage(null);
  };

  const handleDocumentUpload = async (file: File, type: string) => {
    try {
      // In a real implementation, upload file to storage and get URL
      // For now, using a placeholder URL
      const documentUrl = URL.createObjectURL(file);

      await addDocumentMutation.mutateAsync({
        companyId,
        document: {
          type,
          url: documentUrl,
        },
      });
      setSuccessMessage('Document uploaded successfully');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.error || 'Failed to upload document');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (!company) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Failed to load company information</Alert>
      </Box>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Company Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {readOnly
            ? 'View your company information'
            : 'Manage your company information and documents'}
        </Typography>
      </Box>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Company Information */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Business sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Company Information
                </Typography>
              </Box>
              {!readOnly && !isEditing && (
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              )}
            </Box>

            <form onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Company Name"
                        disabled={readOnly || !isEditing}
                        error={!!errors.name}
                        helperText={errors.name?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Registration Number"
                    value={company.registrationNumber}
                    disabled
                    helperText="Registration number cannot be changed"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Company Type"
                    value={company.type}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Email"
                        type="email"
                        disabled={readOnly || !isEditing}
                        error={!!errors.email}
                        helperText={errors.email?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Phone"
                        disabled={readOnly || !isEditing}
                        error={!!errors.phone}
                        helperText={errors.phone?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                    Address
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Controller
                    name="address.street"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Street"
                        disabled={readOnly || !isEditing}
                        error={!!errors.address?.street}
                        helperText={errors.address?.street?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="address.city"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="City"
                        disabled={readOnly || !isEditing}
                        error={!!errors.address?.city}
                        helperText={errors.address?.city?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="address.state"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="State/Province"
                        disabled={readOnly || !isEditing}
                        error={!!errors.address?.state}
                        helperText={errors.address?.state?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="address.country"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Country"
                        disabled={readOnly || !isEditing}
                        error={!!errors.address?.country}
                        helperText={errors.address?.country?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="address.zipCode"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="ZIP/Postal Code"
                        disabled={readOnly || !isEditing}
                        error={!!errors.address?.zipCode}
                        helperText={errors.address?.zipCode?.message}
                      />
                    )}
                  />
                </Grid>

                {!readOnly && isEditing && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                      <Button
                        variant="outlined"
                        startIcon={<Cancel />}
                        onClick={handleCancel}
                        disabled={updateCompanyMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={
                          updateCompanyMutation.isPending ? (
                            <CircularProgress size={20} />
                          ) : (
                            <Save />
                          )
                        }
                        disabled={updateCompanyMutation.isPending}
                      >
                        Save Changes
                      </Button>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </form>
          </Paper>
        </Grid>

        {/* Company Status & Documents */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Company Status
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={company.status}
                      color={getStatusColor(company.status) as any}
                      size="small"
                    />
                  </Box>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Registered
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {new Date(company.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {new Date(company.updatedAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Documents Section */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Company Documents
            </Typography>
            <DocumentUpload
              documents={company.documents || []}
              onUpload={handleDocumentUpload}
              readOnly={readOnly}
              loading={addDocumentMutation.isPending}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Company Categories Section */}
      {!readOnly && (
        <Box sx={{ mt: 3 }}>
          <CompanyCategoryAssignment
            companyId={companyId}
            companyName={company.name}
          />
        </Box>
      )}
    </Box>
  );
};
