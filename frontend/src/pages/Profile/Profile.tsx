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
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import { Save, Lock, Person } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuthStore } from '@/store/auth.store';
import { useProfile, useUpdateProfile, useChangePassword } from '@/hooks/useProfile';
import { UpdateUserProfileDto, ChangePasswordDto } from '@/types/user';
import { PageSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';

const profileSchema = yup.object({
  firstName: yup.string().optional(),
  lastName: yup.string().optional(),
  phone: yup.string().optional(),
});

const passwordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .required('New password is required')
    .test('not-same-as-current', 'New password must be different from current password', function (value) {
      const { currentPassword } = this.parent;
      return !currentPassword || value !== currentPassword;
    }),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Passwords must match')
    .required('Please confirm your password'),
});

export const Profile = () => {
  const { user } = useAuthStore();
  const userId = user?.id || '';

  const { data: profileData, isLoading } = useProfile(userId);
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const profile = profileData?.data;

  const {
    control: profileControl,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<UpdateUserProfileDto>({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      phone: profile?.phone || '',
    },
  });

  const {
    control: passwordControl,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<ChangePasswordDto>({
    resolver: yupResolver(passwordSchema),
  });

  // Update form when profile data loads
  useEffect(() => {
    if (profile && !isLoading) {
      resetProfile({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
      });
    }
  }, [profile, isLoading, resetProfile]);

  const onProfileSubmit = async (data: UpdateUserProfileDto) => {
    try {
      await updateProfileMutation.mutateAsync({ userId, data });
      setSuccessMessage('Profile updated successfully');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error: any) {
      // Error handled by mutation's onError callback
    }
  };

  const onPasswordSubmit = async (data: ChangePasswordDto) => {
    try {
      setErrorMessage(null);
      await changePasswordMutation.mutateAsync({ userId, data });
      setSuccessMessage('Password changed successfully');
      resetPassword();
      setShowPasswordForm(false);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to change password. Please check your current password and try again.';
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (!profile) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Failed to load profile</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Profile Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your personal information and account settings
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
        {/* Profile Information */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Person sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Personal Information
              </Typography>
            </Box>

            <form onSubmit={handleProfileSubmit(onProfileSubmit)}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="firstName"
                    control={profileControl}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="First Name"
                        error={!!profileErrors.firstName}
                        helperText={profileErrors.firstName?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="lastName"
                    control={profileControl}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Last Name"
                        error={!!profileErrors.lastName}
                        helperText={profileErrors.lastName?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={profile.email}
                    disabled
                    helperText="Email cannot be changed"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name="phone"
                    control={profileControl}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Phone"
                        error={!!profileErrors.phone}
                        helperText={profileErrors.phone?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Role"
                    value={profile.role}
                    disabled
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={
                        updateProfileMutation.isPending ? (
                          <CircularProgress size={20} />
                        ) : (
                          <Save />
                        )
                      }
                      disabled={updateProfileMutation.isPending}
                    >
                      Save Changes
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>

        {/* Account Information */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Account Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {profile.status}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Member Since
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
                {profile.lastLogin && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Last Login
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {new Date(profile.lastLogin).toLocaleString()}
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Change Password */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Lock sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Change Password
                </Typography>
              </Box>
              {!showPasswordForm && (
                <Button variant="outlined" onClick={() => setShowPasswordForm(true)}>
                  Change Password
                </Button>
              )}
            </Box>

            {showPasswordForm && (
              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Controller
                      name="currentPassword"
                      control={passwordControl}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          type="password"
                          label="Current Password"
                          error={!!passwordErrors.currentPassword}
                          helperText={passwordErrors.currentPassword?.message || 'Enter your current password'}
                          autoComplete="current-password"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="newPassword"
                      control={passwordControl}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          type="password"
                          label="New Password"
                          error={!!passwordErrors.newPassword}
                          helperText={
                            passwordErrors.newPassword?.message ||
                            'Must be at least 8 characters with uppercase, lowercase, and a number'
                          }
                          autoComplete="new-password"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="confirmPassword"
                      control={passwordControl}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          type="password"
                          label="Confirm New Password"
                          error={!!passwordErrors.confirmPassword}
                          helperText={passwordErrors.confirmPassword?.message || 'Re-enter your new password'}
                          autoComplete="new-password"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setShowPasswordForm(false);
                          resetPassword();
                          setErrorMessage(null);
                        }}
                        disabled={changePasswordMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={
                          changePasswordMutation.isPending ? (
                            <CircularProgress size={20} />
                          ) : (
                            <Lock />
                          )
                        }
                        disabled={changePasswordMutation.isPending}
                      >
                        Change Password
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </form>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
