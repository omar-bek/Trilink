import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Grid,
  CircularProgress,
  Stack,
  InputAdornment,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Skeleton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle,
  Cancel,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  MoreVert as MoreVertIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  useCompanies,
  useCreateCompany,
  useUpdateCompany,
  useDeleteCompany,
  useApproveCompany,
  useRejectCompany,
} from '@/hooks/useCompany';
import { useCompanyCategories } from '@/hooks/useCompanyCategories';
import { Company, CreateCompanyDto, UpdateCompanyDto, CompanyType } from '@/types/company';
import { useDebounce } from '@/hooks/useDebounce';
import { Pagination } from '@/components/common/Pagination';

const createCompanySchema = yup.object({
  name: yup.string().required('Company name is required').min(2, 'Name must be at least 2 characters'),
  registrationNumber: yup
    .string()
    .required('Registration number is required')
    .min(3, 'Registration number must be at least 3 characters'),
  type: yup.mixed<CompanyType>().oneOf(Object.values(CompanyType)).required('Company type is required'),
  email: yup.string().email('Invalid email address').required('Email is required'),
  phone: yup.string().required('Phone number is required').min(8, 'Phone number must be at least 8 characters'),
  address: yup.object({
    street: yup.string().required('Street address is required'),
    city: yup.string().required('City is required'),
    state: yup.string().required('State is required'),
    country: yup.string().required('Country is required'),
    zipCode: yup.string().required('Zip code is required'),
  }),
});

const updateCompanySchema = yup.object({
  name: yup.string().min(2, 'Name must be at least 2 characters').optional(),
  email: yup.string().email('Invalid email address').optional(),
  phone: yup.string().min(8, 'Phone number must be at least 8 characters').optional(),
  address: yup.object({
    street: yup.string().optional(),
    city: yup.string().optional(),
    state: yup.string().optional(),
    country: yup.string().optional(),
    zipCode: yup.string().optional(),
  }).optional(),
});

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
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

/**
 * Company Row Component - Displays a single company row with categories
 */
const CompanyRow = ({ company }: { company: Company }) => {
  const navigate = useNavigate();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const { data: categoriesData } = useCompanyCategories(company.id);
  const categories = categoriesData?.data || [];

  const updateMutation = useUpdateCompany();
  const deleteMutation = useDeleteCompany();
  const approveMutation = useApproveCompany();
  const rejectMutation = useRejectCompany();

  const {
    control: updateControl,
    handleSubmit: handleUpdateSubmit,
    reset: resetUpdate,
    formState: { errors: updateErrors },
  } = useForm<UpdateCompanyDto>({
    resolver: yupResolver(updateCompanySchema),
  });

  const handleEdit = () => {
    resetUpdate({
      name: company.name,
      email: company.email,
      phone: company.phone,
      address: company.address,
    });
    setEditDialogOpen(true);
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleApprove = () => {
    setApproveDialogOpen(true);
  };

  const handleReject = () => {
    setRejectDialogOpen(true);
  };

  const handleViewDetails = () => {
    navigate(`/admin/companies/${company.id}`);
    setMenuAnchor(null);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const onSubmitUpdate = (data: UpdateCompanyDto) => {
    updateMutation.mutate(
      { companyId: company.id, data },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
          resetUpdate();
        },
      }
    );
  };

  const onConfirmDelete = () => {
    deleteMutation.mutate(company.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
      },
    });
  };

  const onConfirmApprove = () => {
    approveMutation.mutate(company.id, {
      onSuccess: () => {
        setApproveDialogOpen(false);
      },
    });
  };

  const onConfirmReject = () => {
    rejectMutation.mutate(company.id, {
      onSuccess: () => {
        setRejectDialogOpen(false);
      },
    });
  };

  return (
    <>
      <TableRow hover>
        <TableCell>{company.name}</TableCell>
        <TableCell>{company.registrationNumber}</TableCell>
        <TableCell>{company.type}</TableCell>
        <TableCell>
          {categories.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No categories
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {categories.slice(0, 3).map((category) => (
                <Chip
                  key={category.id}
                  label={category.name || category.nameAr || 'Unnamed'}
                  size="small"
                  variant="outlined"
                />
              ))}
              {categories.length > 3 && (
                <Chip
                  label={`+${categories.length - 3} more`}
                  size="small"
                  variant="outlined"
                  color="default"
                />
              )}
            </Box>
          )}
        </TableCell>
        <TableCell>{company.email}</TableCell>
        <TableCell>{company.phone}</TableCell>
        <TableCell>
          <Chip
            label={company.status}
            color={getStatusColor(company.status) as any}
            size="small"
          />
        </TableCell>
        <TableCell align="right">
          <IconButton
            size="small"
            onClick={handleMenuOpen}
            aria-label="Actions"
            aria-controls={menuAnchor ? 'company-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={menuAnchor ? 'true' : undefined}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
          <Menu
            id="company-menu"
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={handleViewDetails}>
              <ListItemIcon>
                <VisibilityIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>View Details</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => { handleEdit(); handleMenuClose(); }}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Edit</ListItemText>
            </MenuItem>
            {company.status?.toLowerCase() === 'pending' && (
              <>
                <Divider />
                <MenuItem onClick={() => { handleApprove(); handleMenuClose(); }}>
                  <ListItemIcon>
                    <CheckCircle fontSize="small" color="success" />
                  </ListItemIcon>
                  <ListItemText>Approve</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => { handleReject(); handleMenuClose(); }}>
                  <ListItemIcon>
                    <Cancel fontSize="small" color="error" />
                  </ListItemIcon>
                  <ListItemText>Reject</ListItemText>
                </MenuItem>
              </>
            )}
            <Divider />
            <MenuItem
              onClick={() => { handleDelete(); handleMenuClose(); }}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          </Menu>
        </TableCell>
      </TableRow>

      {/* Edit Company Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleUpdateSubmit(onSubmitUpdate)}>
          <DialogTitle>Edit Company</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="name"
                  control={updateControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Company Name"
                      error={!!updateErrors.name}
                      helperText={updateErrors.name?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="email"
                  control={updateControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="email"
                      label="Email"
                      error={!!updateErrors.email}
                      helperText={updateErrors.email?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="phone"
                  control={updateControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Phone"
                      error={!!updateErrors.phone}
                      helperText={updateErrors.phone?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Address
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="address.street"
                  control={updateControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Street Address"
                      error={!!updateErrors.address?.street}
                      helperText={updateErrors.address?.street?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="address.city"
                  control={updateControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="City"
                      error={!!updateErrors.address?.city}
                      helperText={updateErrors.address?.city?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="address.state"
                  control={updateControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="State"
                      error={!!updateErrors.address?.state}
                      helperText={updateErrors.address?.state?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="address.country"
                  control={updateControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Country"
                      error={!!updateErrors.address?.country}
                      helperText={updateErrors.address?.country?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="address.zipCode"
                  control={updateControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Zip Code"
                      error={!!updateErrors.address?.zipCode}
                      helperText={updateErrors.address?.zipCode?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)} disabled={updateMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <CircularProgress size={20} /> : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Company</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Are you sure you want to delete <strong>{company.name}</strong>? This action
            cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleteMutation.isPending}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={onConfirmDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approve Company Dialog */}
      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)}>
        <DialogTitle>Approve Company</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Are you sure you want to approve <strong>{company.name}</strong> registration?
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)} disabled={approveMutation.isPending}>
            Cancel
          </Button>
          <Button
            color="success"
            variant="contained"
            onClick={onConfirmApprove}
            disabled={approveMutation.isPending}
          >
            {approveMutation.isPending ? <CircularProgress size={20} /> : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Company Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>Reject Company</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Are you sure you want to reject <strong>{company.name}</strong> registration?
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)} disabled={rejectMutation.isPending}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={onConfirmReject}
            disabled={rejectMutation.isPending}
          >
            {rejectMutation.isPending ? <CircularProgress size={20} /> : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

/**
 * Company Management Page (Admin Only)
 * Allows admins to view, create, update, approve, and reject companies
 */
export const CompanyManagement = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState<{ type?: CompanyType; status?: string }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Build filters (search is handled client-side)
  const apiFilters = useMemo(() => {
    return { ...filters };
  }, [filters]);

  const { data: companiesResponse, isLoading } = useCompanies(apiFilters);
  const allCompanies = companiesResponse?.data || [];

  // Client-side search and pagination (until backend supports it)
  const filteredCompanies = useMemo(() => {
    if (!debouncedSearch.trim()) {
      return allCompanies;
    }
    const query = debouncedSearch.toLowerCase();
    return allCompanies.filter((company) => {
      return (
        company.name.toLowerCase().includes(query) ||
        company.email.toLowerCase().includes(query) ||
        company.registrationNumber.toLowerCase().includes(query) ||
        company.phone?.toLowerCase().includes(query)
      );
    });
  }, [allCompanies, debouncedSearch]);

  const companies = useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredCompanies.slice(startIndex, endIndex);
  }, [filteredCompanies, page, rowsPerPage]);

  const totalPages = Math.ceil(filteredCompanies.length / rowsPerPage);


  // Reset to first page when filters or search change
  useEffect(() => {
    setPage(1);
  }, [filters, debouncedSearch]);

  const createMutation = useCreateCompany();

  const {
    control: createControl,
    handleSubmit: handleCreateSubmit,
    reset: resetCreate,
    formState: { errors: createErrors },
  } = useForm<CreateCompanyDto>({
    resolver: yupResolver(createCompanySchema),
    defaultValues: {
      name: '',
      registrationNumber: '',
      type: CompanyType.BUYER,
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
      },
    },
  });

  const handleCreate = () => {
    resetCreate();
    setCreateDialogOpen(true);
  };

  const onSubmitCreate = (data: CreateCompanyDto) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setCreateDialogOpen(false);
        resetCreate();
      },
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Company Management
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          Create Company
        </Button>
      </Box>

      {/* Filters and Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            fullWidth
            placeholder="Search companies by name, email, or registration number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1 }}
          />
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Type</InputLabel>
            <Select
              value={filters.type || ''}
              label="Filter by Type"
              onChange={(e) => {
                const value = e.target.value;
                setFilters({ ...filters, type: value ? (value as CompanyType) : undefined });
              }}
            >
              <MenuItem value="">All Types</MenuItem>
              {Object.values(CompanyType).map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Status</InputLabel>
            <Select
              value={filters.status || ''}
              label="Filter by Status"
              onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Registration Number</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Categories</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton /></TableCell>
                      <TableCell><Skeleton /></TableCell>
                      <TableCell><Skeleton /></TableCell>
                      <TableCell><Skeleton /></TableCell>
                      <TableCell><Skeleton /></TableCell>
                      <TableCell><Skeleton /></TableCell>
                      <TableCell><Skeleton /></TableCell>
                      <TableCell><Skeleton /></TableCell>
                    </TableRow>
                  ))}
                </>
              ) : companies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <BusinessIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        {debouncedSearch || Object.keys(filters).some(k => filters[k as keyof typeof filters])
                          ? 'No companies found'
                          : 'No companies yet'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
                        {debouncedSearch || Object.keys(filters).some(k => filters[k as keyof typeof filters])
                          ? 'Try adjusting your search or filters to find what you\'re looking for.'
                          : 'Get started by creating your first company. Companies can be buyers, suppliers, or logistics providers.'}
                      </Typography>
                      {!debouncedSearch && !Object.keys(filters).some(k => filters[k as keyof typeof filters]) && (
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={handleCreate}
                        >
                          Create Company
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                companies.map((company) => (
                  <CompanyRow key={company.id} company={company} />
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {!isLoading && filteredCompanies.length > 0 && (
          <Box sx={{ p: 2 }}>
            <Pagination
              page={page}
              limit={rowsPerPage}
              total={filteredCompanies.length}
              totalPages={totalPages}
              onPageChange={setPage}
              onLimitChange={(newLimit) => {
                setRowsPerPage(newLimit);
                setPage(1);
              }}
              limitOptions={[5, 10, 25, 50]}
            />
          </Box>
        )}
      </Paper>

      {/* Create Company Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleCreateSubmit(onSubmitCreate)}>
          <DialogTitle>Create Company</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="name"
                  control={createControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Company Name"
                      error={!!createErrors.name}
                      helperText={createErrors.name?.message}
                      required
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="registrationNumber"
                  control={createControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Registration Number"
                      error={!!createErrors.registrationNumber}
                      helperText={createErrors.registrationNumber?.message}
                      required
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="type"
                  control={createControl}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!createErrors.type}>
                      <InputLabel>Company Type</InputLabel>
                      <Select {...field} label="Company Type">
                        {Object.values(CompanyType).map((type) => (
                          <MenuItem key={type} value={type}>
                            {type}
                          </MenuItem>
                        ))}
                      </Select>
                      {createErrors.type && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                          {createErrors.type.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="email"
                  control={createControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="email"
                      label="Email"
                      error={!!createErrors.email}
                      helperText={createErrors.email?.message}
                      required
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="phone"
                  control={createControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Phone"
                      error={!!createErrors.phone}
                      helperText={createErrors.phone?.message}
                      required
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Address
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="address.street"
                  control={createControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Street Address"
                      error={!!createErrors.address?.street}
                      helperText={createErrors.address?.street?.message}
                      required
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="address.city"
                  control={createControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="City"
                      error={!!createErrors.address?.city}
                      helperText={createErrors.address?.city?.message}
                      required
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="address.state"
                  control={createControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="State"
                      error={!!createErrors.address?.state}
                      helperText={createErrors.address?.state?.message}
                      required
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="address.country"
                  control={createControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Country"
                      error={!!createErrors.address?.country}
                      helperText={createErrors.address?.country?.message}
                      required
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="address.zipCode"
                  control={createControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Zip Code"
                      error={!!createErrors.address?.zipCode}
                      helperText={createErrors.address?.zipCode?.message}
                      required
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              {createMutation.isPending ? <CircularProgress size={20} /> : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
