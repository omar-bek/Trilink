import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  InputAdornment,
  IconButton,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Chip,
  OutlinedInput,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, Person, Phone, Business, LocationOn, Category } from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import { categoryService } from '@/services/category.service';
import { RegisterCompanyData } from '@/types';
import { Category as CategoryType } from '@/types/category';

const COMPANY_TYPES = [
  'Buyer',
  'Supplier',
  'Logistics',
  'Clearance',
  'Service Provider',
  'Government',
];

export const Register = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<RegisterCompanyData>({
    companyName: '',
    registrationNumber: '',
    companyType: '',
    companyEmail: '',
    companyPhone: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: 'UAE',
      zipCode: '',
    },
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    categoryIds: [],
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [companyEmailError, setCompanyEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const response = await categoryService.getRootCategories();
        if (response.success && response.data) {
          setCategories(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | { value: unknown }> | any) => {
    const value = (e.target?.value ?? e?.target?.value) as string;
    
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

    // Validation
    if (field === 'email' && value) {
      if (!validateEmail(value)) {
        setEmailError('Please enter a valid email address');
      } else {
        setEmailError('');
      }
    }

    if (field === 'companyEmail' && value) {
      if (!validateEmail(value)) {
        setCompanyEmailError('Please enter a valid email address');
      } else {
        setCompanyEmailError('');
      }
    }

    if (field === 'password' && value) {
      if (!validatePassword(value)) {
        setPasswordError('Password must be at least 8 characters long');
      } else {
        setPasswordError('');
      }
    }
  };

  const validateStep = (step: number): boolean => {
    setError('');
    
    if (step === 0) {
      // Company information validation
      if (!formData.companyName || !formData.registrationNumber || !formData.companyType || 
          !formData.companyEmail || !formData.companyPhone) {
        setError('Please fill in all required company fields');
        return false;
      }
      if (!validateEmail(formData.companyEmail)) {
        setCompanyEmailError('Please enter a valid company email address');
        return false;
      }
      if (!formData.address.street || !formData.address.city || !formData.address.state || 
          !formData.address.country || !formData.address.zipCode) {
        setError('Please fill in all address fields');
        return false;
      }
      return true;
    } else if (step === 1) {
      // User information validation
      if (!formData.email || !formData.password || !confirmPassword) {
        setError('Please fill in all required user fields');
        return false;
      }
      if (!validateEmail(formData.email)) {
        setEmailError('Please enter a valid email address');
        return false;
      }
      if (!validatePassword(formData.password)) {
        setPasswordError('Password must be at least 8 characters long');
        return false;
      }
      if (formData.password !== confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateStep(1)) {
      return;
    }

    setLoading(true);

    try {
      const { data } = await authService.registerCompany(formData);

      // Auto-login after registration
      if (data?.accessToken && data?.user) {
        await login(formData.email, formData.password);
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const steps = ['Company Information', 'User Account'];

  const renderStepContent = () => {
    if (activeStep === 0) {
      return (
        <Box sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="companyName"
                label="Company Name"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange('companyName')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Business color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="registrationNumber"
                label="Registration Number"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange('registrationNumber')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl required fullWidth>
                <InputLabel>Company Type</InputLabel>
                <Select
                  value={formData.companyType}
                  label="Company Type"
                  onChange={handleChange('companyType')}
                >
                  {COMPANY_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="companyEmail"
                label="Company Email"
                name="companyEmail"
                type="email"
                value={formData.companyEmail}
                onChange={handleChange('companyEmail')}
                error={!!companyEmailError}
                helperText={companyEmailError}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="companyPhone"
                label="Company Phone"
                name="companyPhone"
                value={formData.companyPhone}
                onChange={handleChange('companyPhone')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="categories-label">
                  <Category sx={{ mr: 1, verticalAlign: 'middle' }} fontSize="small" />
                  Categories (Optional)
                </InputLabel>
                <Select
                  labelId="categories-label"
                  id="categories"
                  multiple
                  value={formData.categoryIds || []}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      categoryIds: typeof value === 'string' ? value.split(',') : value,
                    }));
                  }}
                  input={<OutlinedInput label="Categories (Optional)" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((categoryId) => {
                        const category = categories.find((c) => c.id === categoryId);
                        return category ? (
                          <Chip key={categoryId} label={category.name} size="small" />
                        ) : null;
                      })}
                    </Box>
                  )}
                  disabled={categoriesLoading}
                >
                  {categoriesLoading ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Loading categories...
                    </MenuItem>
                  ) : categories.length === 0 ? (
                    <MenuItem disabled>No categories available</MenuItem>
                  ) : (
                    categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  Select the categories your company operates in
                </Typography>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                Address
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="street"
                label="Street Address"
                name="street"
                value={formData.address.street}
                onChange={handleChange('address.street')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOn color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="city"
                label="City"
                name="city"
                value={formData.address.city}
                onChange={handleChange('address.city')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="state"
                label="State/Province"
                name="state"
                value={formData.address.state}
                onChange={handleChange('address.state')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="country"
                label="Country"
                name="country"
                value={formData.address.country}
                onChange={handleChange('address.country')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="zipCode"
                label="Zip Code"
                name="zipCode"
                value={formData.address.zipCode}
                onChange={handleChange('address.zipCode')}
              />
            </Grid>
          </Grid>
        </Box>
      );
    } else if (activeStep === 1) {
      return (
        <Box sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="firstName"
                label="First Name"
                name="firstName"
                autoComplete="given-name"
                value={formData.firstName}
                onChange={handleChange('firstName')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="lastName"
                label="Last Name"
                name="lastName"
                autoComplete="family-name"
                value={formData.lastName}
                onChange={handleChange('lastName')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="email"
                label="Your Email Address"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange('email')}
                error={!!emailError}
                helperText={emailError || 'This will be your login email'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="phone"
                label="Your Phone Number"
                name="phone"
                autoComplete="tel"
                value={formData.phone}
                onChange={handleChange('phone')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange('password')}
                error={!!passwordError}
                helperText={passwordError || 'Must be at least 8 characters'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </Box>
      );
    }
    return null;
  };

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 4,
          marginBottom: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom sx={{ fontWeight: 600 }}>
            Register Your Company
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Create your company account and become a Company Manager
          </Typography>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={activeStep === steps.length - 1 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
            {renderStepContent()}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ mt: 3, mb: 2 }}
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="contained"
                sx={{ mt: 3, mb: 2, minWidth: 120 }}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={24} />
                ) : activeStep === steps.length - 1 ? (
                  'Register'
                ) : (
                  'Next'
                )}
              </Button>
            </Box>
          </Box>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Link component={RouterLink} to="/login" variant="body2">
              Already have an account? Sign in
            </Link>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};
