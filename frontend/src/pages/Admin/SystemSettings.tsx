import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Stack,
  Paper,
  Tabs,
  Tab,
  Avatar,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Storage as StorageIcon,
  Settings as SettingsIcon,
  CloudUpload as CloudUploadIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import api from '@/services/api';
// FileCategory enum - matches backend
enum FileCategory {
  RFQ_ATTACHMENT = 'rfq_attachment',
  BID_ATTACHMENT = 'bid_attachment',
  DISPUTE_ATTACHMENT = 'dispute_attachment',
  COMPANY_DOCUMENT = 'company_document',
  CONTRACT_DOCUMENT = 'contract_document',
  CUSTOMS_DOCUMENT = 'customs_document',
  PROFILE_IMAGE = 'profile_image',
  PLATFORM_LOGO = 'platform_logo',
  OTHER = 'other',
}

interface SystemSettingsForm {
  // General Settings
  siteName: string;
  siteDescription: string;
  logo?: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  
  // Email Settings
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  
  // Security Settings
  sessionTimeout: number;
  maxLoginAttempts: number;
  requireEmailVerification: boolean;
  requireTwoFactor: boolean;
  passwordMinLength: number;
  
  // Notification Settings
  enableEmailNotifications: boolean;
  enableSmsNotifications: boolean;
  enablePushNotifications: boolean;
  
  // Storage Settings
  maxFileSize: number;
  allowedFileTypes: string;
  storageProvider: 'local' | 's3' | 'azure';
}

const settingsSchema = yup.object({
  siteName: yup.string().required('Site name is required'),
  siteDescription: yup.string().optional(),
  logo: yup.string().optional(),
  maintenanceMode: yup.boolean().optional(),
  allowRegistration: yup.boolean().optional(),
  smtpHost: yup.string().optional(),
  smtpPort: yup.number().min(1).max(65535).optional(),
  smtpUser: yup.string().optional(),
  smtpPassword: yup.string().optional(),
  fromEmail: yup.string().email().optional(),
  fromName: yup.string().optional(),
  sessionTimeout: yup.number().min(5).max(1440).optional(),
  maxLoginAttempts: yup.number().min(3).max(10).optional(),
  requireEmailVerification: yup.boolean().optional(),
  requireTwoFactor: yup.boolean().optional(),
  passwordMinLength: yup.number().min(6).max(32).optional(),
  enableEmailNotifications: yup.boolean().optional(),
  enableSmsNotifications: yup.boolean().optional(),
  enablePushNotifications: yup.boolean().optional(),
  maxFileSize: yup.number().min(1).optional(),
  allowedFileTypes: yup.string().optional(),
  storageProvider: yup.string().oneOf(['local', 's3', 'azure']).optional(),
});

export const SystemSettings = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [logoUploading, setLogoUploading] = useState(false);
  const { data: settingsData, isLoading } = useSettings();
  const updateSettingsMutation = useUpdateSettings();

  const settings = settingsData?.data;

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<SystemSettingsForm>({
    resolver: yupResolver(settingsSchema) as any,
    defaultValues: {
      siteName: 'TriLink Platform',
      siteDescription: 'Government Procurement Platform',
      logo: undefined,
      maintenanceMode: false,
      allowRegistration: true,
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      fromEmail: 'noreply@trilink.gov',
      fromName: 'TriLink Platform',
      sessionTimeout: 60,
      maxLoginAttempts: 5,
      requireEmailVerification: true,
      requireTwoFactor: false,
      passwordMinLength: 8,
      enableEmailNotifications: true,
      enableSmsNotifications: false,
      enablePushNotifications: true,
      maxFileSize: 10,
      allowedFileTypes: 'pdf,doc,docx,xls,xlsx,jpg,jpeg,png',
      storageProvider: 'local',
    },
  });

  const logoUrl = watch('logo');

  // Load settings when data is available
  useEffect(() => {
    if (settings) {
      reset({
        siteName: settings.siteName || 'TriLink Platform',
        siteDescription: settings.siteDescription || 'Government Procurement Platform',
        logo: settings.logo,
        maintenanceMode: settings.maintenanceMode ?? false,
        allowRegistration: settings.allowRegistration ?? true,
        smtpHost: settings.smtpHost || '',
        smtpPort: settings.smtpPort || 587,
        smtpUser: settings.smtpUser || '',
        smtpPassword: settings.smtpPassword || '',
        fromEmail: settings.fromEmail || 'noreply@trilink.gov',
        fromName: settings.fromName || 'TriLink Platform',
        sessionTimeout: settings.sessionTimeout || 60,
        maxLoginAttempts: settings.maxLoginAttempts || 5,
        requireEmailVerification: settings.requireEmailVerification ?? true,
        requireTwoFactor: settings.requireTwoFactor ?? false,
        passwordMinLength: settings.passwordMinLength || 8,
        enableEmailNotifications: settings.enableEmailNotifications ?? true,
        enableSmsNotifications: settings.enableSmsNotifications ?? false,
        enablePushNotifications: settings.enablePushNotifications ?? true,
        maxFileSize: settings.maxFileSize || 10,
        allowedFileTypes: settings.allowedFileTypes || 'pdf,doc,docx,xls,xlsx,jpg,jpeg,png',
        storageProvider: settings.storageProvider || 'local',
      });
    }
  }, [settings, reset]);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setLogoUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'platform_logo');
      formData.append('description', 'Platform Logo');

      const response = await api.post('/uploads/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success && response.data.data?.url) {
        setValue('logo', response.data.data.url, { shouldDirty: true });
      }
    } catch (error: any) {
      console.error('Failed to upload logo:', error);
      alert(error.response?.data?.error || 'Failed to upload logo');
    } finally {
      setLogoUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const onSubmit = async (data: SystemSettingsForm) => {
    try {
      await updateSettingsMutation.mutateAsync(data);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleReset = () => {
    if (settings) {
      reset({
        siteName: settings.siteName || 'TriLink Platform',
        siteDescription: settings.siteDescription || 'Government Procurement Platform',
        logo: settings.logo,
        maintenanceMode: settings.maintenanceMode ?? false,
        allowRegistration: settings.allowRegistration ?? true,
        smtpHost: settings.smtpHost || '',
        smtpPort: settings.smtpPort || 587,
        smtpUser: settings.smtpUser || '',
        smtpPassword: settings.smtpPassword || '',
        fromEmail: settings.fromEmail || 'noreply@trilink.gov',
        fromName: settings.fromName || 'TriLink Platform',
        sessionTimeout: settings.sessionTimeout || 60,
        maxLoginAttempts: settings.maxLoginAttempts || 5,
        requireEmailVerification: settings.requireEmailVerification ?? true,
        requireTwoFactor: settings.requireTwoFactor ?? false,
        passwordMinLength: settings.passwordMinLength || 8,
        enableEmailNotifications: settings.enableEmailNotifications ?? true,
        enableSmsNotifications: settings.enableSmsNotifications ?? false,
        enablePushNotifications: settings.enablePushNotifications ?? true,
        maxFileSize: settings.maxFileSize || 10,
        allowedFileTypes: settings.allowedFileTypes || 'pdf,doc,docx,xls,xlsx,jpg,jpeg,png',
        storageProvider: settings.storageProvider || 'local',
      });
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            System Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure platform-wide settings and preferences
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleReset}
            disabled={!isDirty}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSubmit(onSubmit)}
            disabled={updateSettingsMutation.isPending || !isDirty}
          >
            {updateSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </Stack>
      </Box>


      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab icon={<SettingsIcon />} label="General" />
          <Tab icon={<EmailIcon />} label="Email" />
          <Tab icon={<SecurityIcon />} label="Security" />
          <Tab icon={<NotificationsIcon />} label="Notifications" />
          <Tab icon={<StorageIcon />} label="Storage" />
        </Tabs>
      </Paper>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* General Settings */}
        {activeTab === 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                General Settings
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="siteName"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Site Name"
                        error={!!errors.siteName}
                        helperText={errors.siteName?.message}
                        required
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="siteDescription"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Site Description"
                        error={!!errors.siteDescription}
                        helperText={errors.siteDescription?.message}
                        multiline
                        rows={2}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    Platform Logo
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      src={logoUrl}
                      sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}
                      variant="rounded"
                    >
                      {!logoUrl && <ImageIcon />}
                    </Avatar>
                    <Box>
                      <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="logo-upload-button"
                        type="file"
                        onChange={handleLogoUpload}
                        disabled={logoUploading}
                      />
                      <label htmlFor="logo-upload-button">
                        <Button
                          variant="outlined"
                          component="span"
                          startIcon={logoUploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                          disabled={logoUploading}
                        >
                          {logoUploading ? 'Uploading...' : logoUrl ? 'Change Logo' : 'Upload Logo'}
                        </Button>
                      </label>
                      {logoUrl && (
                        <Button
                          variant="text"
                          color="error"
                          size="small"
                          onClick={() => setValue('logo', undefined, { shouldDirty: true })}
                          sx={{ ml: 1 }}
                        >
                          Remove
                        </Button>
                      )}
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                        Recommended size: 200x200px. Max file size: 5MB
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="maintenanceMode"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch {...field} checked={field.value} />}
                        label="Maintenance Mode"
                      />
                    )}
                  />
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    When enabled, only admins can access the platform
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="allowRegistration"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch {...field} checked={field.value} />}
                        label="Allow User Registration"
                      />
                    )}
                  />
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    Allow new users to register accounts
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Email Settings */}
        {activeTab === 1 && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Email Configuration
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="smtpHost"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="SMTP Host"
                        error={!!errors.smtpHost}
                        helperText={errors.smtpHost?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="smtpPort"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        type="number"
                        label="SMTP Port"
                        error={!!errors.smtpPort}
                        helperText={errors.smtpPort?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="smtpUser"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="SMTP Username"
                        error={!!errors.smtpUser}
                        helperText={errors.smtpUser?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="smtpPassword"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        type="password"
                        label="SMTP Password"
                        error={!!errors.smtpPassword}
                        helperText={errors.smtpPassword?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="fromEmail"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        type="email"
                        label="From Email"
                        error={!!errors.fromEmail}
                        helperText={errors.fromEmail?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="fromName"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="From Name"
                        error={!!errors.fromName}
                        helperText={errors.fromName?.message}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Security Settings */}
        {activeTab === 2 && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Security Settings
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="sessionTimeout"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        type="number"
                        label="Session Timeout (minutes)"
                        error={!!errors.sessionTimeout}
                        helperText={errors.sessionTimeout?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="maxLoginAttempts"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        type="number"
                        label="Max Login Attempts"
                        error={!!errors.maxLoginAttempts}
                        helperText={errors.maxLoginAttempts?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="passwordMinLength"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        type="number"
                        label="Minimum Password Length"
                        error={!!errors.passwordMinLength}
                        helperText={errors.passwordMinLength?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="requireEmailVerification"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch {...field} checked={field.value} />}
                        label="Require Email Verification"
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="requireTwoFactor"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch {...field} checked={field.value} />}
                        label="Require Two-Factor Authentication"
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Notification Settings */}
        {activeTab === 3 && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Notification Settings
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="enableEmailNotifications"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch {...field} checked={field.value} />}
                        label="Email Notifications"
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="enableSmsNotifications"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch {...field} checked={field.value} />}
                        label="SMS Notifications"
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="enablePushNotifications"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch {...field} checked={field.value} />}
                        label="Push Notifications"
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Storage Settings */}
        {activeTab === 4 && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Storage Settings
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="maxFileSize"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        type="number"
                        label="Max File Size (MB)"
                        error={!!errors.maxFileSize}
                        helperText={errors.maxFileSize?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="allowedFileTypes"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Allowed File Types (comma-separated)"
                        error={!!errors.allowedFileTypes}
                        helperText={errors.allowedFileTypes?.message}
                        placeholder="pdf,doc,docx,jpg,png"
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="storageProvider"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        select
                        SelectProps={{ native: true }}
                        label="Storage Provider"
                        error={!!errors.storageProvider}
                        helperText={errors.storageProvider?.message}
                      >
                        <option value="local">Local Storage</option>
                        <option value="s3">Amazon S3</option>
                        <option value="azure">Azure Blob Storage</option>
                      </TextField>
                    )}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
      </form>
    </Box>
  );
};
