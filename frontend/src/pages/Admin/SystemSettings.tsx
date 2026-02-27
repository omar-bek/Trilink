import { useState } from 'react';
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
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Storage as StorageIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

interface SystemSettingsForm {
  // General Settings
  siteName: string;
  siteDescription: string;
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
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SystemSettingsForm>({
    resolver: yupResolver(settingsSchema) as any,
    defaultValues: {
      siteName: 'TriLink Platform',
      siteDescription: 'Government Procurement Platform',
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

  const onSubmit = async (data: SystemSettingsForm) => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      // TODO: Implement API call to save settings
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    reset();
  };

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
            disabled={isSaving || !isDirty}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Stack>
      </Box>

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully!
        </Alert>
      )}

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
                      />
                    )}
                  />
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
