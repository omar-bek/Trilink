import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
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
  CircularProgress,
  Grid,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Divider,
  Card,
  CardContent,
  Stack,
  Avatar,
  Skeleton,
  InputAdornment,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Security as SecurityIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Download as DownloadIcon,
  Clear as ClearIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';
import { useUsersByCompany, useAllUsers, useCreateUser, useUpdateUser, useDeleteUser, useUpdateUserPermissions } from '@/hooks/useUsers';
import { CreateUserDto, UpdateUserDto, UserProfile } from '@/types/user';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ResponsiveTable, ResponsiveTableColumn } from '@/components/common/ResponsiveTable';
import { useDebounce } from '@/hooks/useDebounce';
import { Pagination } from '@/components/common/Pagination';
import { exportToCSV } from '@/utils/export';

const createUserSchema = yup.object({
  email: yup.string().email('Invalid email address').required('Email is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  firstName: yup.string().optional(),
  lastName: yup.string().optional(),
  phone: yup.string().optional(),
  role: yup.string().required('Role is required'),
  companyId: yup.string().required('Company ID is required'),
});

const updateUserSchema = yup.object({
  firstName: yup.string().optional(),
  lastName: yup.string().optional(),
  phone: yup.string().optional(),
  status: yup.string().oneOf(['active', 'inactive', 'pending']).optional(),
});

/**
 * Actions Menu Component for User Row
 */
const ActionsMenu = ({
  user,
  onEdit,
  onDelete,
  onManagePermissions,
}: {
  user: UserProfile;
  onEdit: (user: UserProfile) => void;
  onDelete: (user: UserProfile) => void;
  onManagePermissions: (user: UserProfile) => void;
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton
        size="small"
        onClick={handleClick}
        aria-label="Actions"
        aria-controls={open ? 'user-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            onManagePermissions(user);
            handleClose();
          }}
        >
          <ListItemIcon>
            <SecurityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Manage Permissions</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            onEdit(user);
            handleClose();
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            onDelete(user);
            handleClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

/**
 * User Management Page
 * Allows admins to view, create, update, and delete users across all companies
 * Allows Company Managers to view, create, update, and delete users in their company
 */
export const UserManagement = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === Role.ADMIN;
  const isCompanyManager = user?.role === Role.COMPANY_MANAGER;
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Build filters for API
  const apiFilters = useMemo(() => {
    const filters: { role?: string; status?: string } = {};
    if (roleFilter !== 'all') filters.role = roleFilter;
    if (statusFilter !== 'all') filters.status = statusFilter;
    return Object.keys(filters).length > 0 ? filters : undefined;
  }, [roleFilter, statusFilter]);

  // Fetch all users if admin, otherwise fetch by company
  const { data: allUsersData, isLoading: isLoadingAll } = useAllUsers(
    isAdmin ? apiFilters : undefined,
    { enabled: !!isAdmin && !!user } // Only fetch if admin and user is loaded
  );
  const { data: companyUsersData, isLoading: isLoadingCompany } = useUsersByCompany(
    isAdmin ? undefined : user?.companyId
  );

  const allUsers = isAdmin
    ? (allUsersData?.data || [])
    : (companyUsersData?.data || []);
  const isLoading = isAdmin ? isLoadingAll : isLoadingCompany;

  // Filter users by search query (client-side filtering)
  const filteredUsers = useMemo(() => {
    let filtered = allUsers;

    // Apply search filter
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter((user) => {
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
        const email = user.email.toLowerCase();
        const companyName = (user.companyName || '').toLowerCase();

        return (
          fullName.includes(query) ||
          email.includes(query) ||
          companyName.includes(query)
        );
      });
    }

    return filtered;
  }, [allUsers, debouncedSearch]);

  // Pagination
  const users = useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, page, rowsPerPage]);

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);

  // Reset to first page when filters or search change
  useEffect(() => {
    setPage(1);
  }, [roleFilter, statusFilter, debouncedSearch]);

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();
  const updatePermissionsMutation = useUpdateUserPermissions();

  const {
    control: createControl,
    handleSubmit: handleCreateSubmit,
    reset: resetCreate,
    formState: { errors: createErrors },
  } = useForm<CreateUserDto>({
    resolver: yupResolver(createUserSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      role: Role.BUYER,
      companyId: user?.companyId || '',
    },
  });

  const {
    control: updateControl,
    handleSubmit: handleUpdateSubmit,
    reset: resetUpdate,
  } = useForm<UpdateUserDto>({
    resolver: yupResolver(updateUserSchema),
  });

  const handleCreate = () => {
    resetCreate({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      role: Role.BUYER,
      companyId: user?.companyId || '',
    });
    setCreateDialogOpen(true);
  };

  const handleEdit = (user: UserProfile) => {
    setSelectedUser(user);
    resetUpdate({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      status: user.status,
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (user: UserProfile) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleManagePermissions = (user: UserProfile) => {
    setSelectedUser(user);
    setPermissionsDialogOpen(true);
  };

  const onSubmitCreate = async (data: CreateUserDto) => {
    try {
      // Company Manager: automatically set companyId to their company
      if (isCompanyManager && user?.companyId) {
        data.companyId = user.companyId;
      }
      await createMutation.mutateAsync(data);
      setCreateDialogOpen(false);
      resetCreate();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const onSubmitUpdate = async (data: UpdateUserDto) => {
    if (!selectedUser) return;
    try {
      await updateMutation.mutateAsync({ userId: selectedUser.id, data });
      setEditDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const onDelete = async () => {
    if (!selectedUser) return;
    try {
      await deleteMutation.mutateAsync(selectedUser.id);
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon fontSize="small" />;
      case 'inactive':
        return <CancelIcon fontSize="small" />;
      case 'pending':
        return <ScheduleIcon fontSize="small" />;
      default:
        return undefined;
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = allUsers.length;
    const active = allUsers.filter((u) => u.status === 'active').length;
    const inactive = allUsers.filter((u) => u.status === 'inactive').length;
    const pending = allUsers.filter((u) => u.status === 'pending').length;
    return { total, active, inactive, pending };
  }, [allUsers]);

  // Get user initials for avatar
  const getUserInitials = (user: UserProfile) => {
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    if (first || last) return `${first}${last}`.toUpperCase();
    return user.email.charAt(0).toUpperCase();
  };

  // Get role color
  const getRoleColor = (role: string) => {
    const roleColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
      [Role.ADMIN]: 'error',
      [Role.COMPANY_MANAGER]: 'primary',
      [Role.BUYER]: 'info',
      [Role.SUPPLIER]: 'success',
      [Role.LOGISTICS]: 'warning',
      [Role.CLEARANCE]: 'secondary',
      [Role.SERVICE_PROVIDER]: 'default',
      [Role.GOVERNMENT]: 'error',
    };
    return roleColors[role] || 'default';
  };

  // Export to CSV
  const handleExport = () => {
    const exportData = filteredUsers.map((user) => ({
      Name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A',
      Email: user.email,
      Role: user.role,
      Company: user.companyName || user.companyId || 'N/A',
      Status: user.status,
      Phone: user.phone || 'N/A',
    }));

    exportToCSV(exportData, 'users', {
      Name: 'Name',
      Email: 'Email',
      Role: 'Role',
      Company: 'Company',
      Status: 'Status',
      Phone: 'Phone',
    });
  };

  // Define table columns
  const columns: ResponsiveTableColumn<UserProfile>[] = [
    {
      id: 'name',
      label: 'Name',
      priority: 'high',
      render: (user) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              width: 40,
              height: 40,
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            {getUserInitials(user)}
          </Avatar>
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {user.firstName || user.lastName
                ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                : 'N/A'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user.email}
            </Typography>
          </Box>
        </Box>
      ),
      mobileRender: (user) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              width: 48,
              height: 48,
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            {getUserInitials(user)}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {user.firstName || user.lastName
                ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                : 'N/A'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user.email}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'role',
      label: 'Role',
      priority: 'high',
      render: (user) => (
        <Chip
          label={user.role}
          size="small"
          color={getRoleColor(user.role)}
          variant="outlined"
          sx={{ fontWeight: 500 }}
        />
      ),
    },
    {
      id: 'company',
      label: 'Company',
      priority: 'medium',
      render: (user) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon fontSize="small" color="action" />
          <Typography variant="body2">
            {user.companyName || user.companyId || 'N/A'}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      priority: 'high',
      render: (user) => {
        const icon = getStatusIcon(user.status);
        return (
          <Chip
            {...(icon ? { icon } : {})}
            label={user.status}
            size="small"
            color={getStatusColor(user.status) as any}
            sx={{ fontWeight: 500 }}
          />
        );
      },
    },
    {
      id: 'actions',
      label: 'Actions',
      priority: 'low',
      align: 'right',
      render: (user) => <ActionsMenu user={user} onEdit={handleEdit} onDelete={handleDelete} onManagePermissions={handleManagePermissions} />,
      mobileRender: (user) => (
        <Stack direction="row" spacing={1} sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<SecurityIcon />}
            onClick={(e) => {
              e.stopPropagation();
              handleManagePermissions(user);
            }}
            fullWidth
          >
            Permissions
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(user);
            }}
            fullWidth
          >
            Edit
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(user);
            }}
            fullWidth
          >
            Delete
          </Button>
        </Stack>
      ),
    },
  ];

  // Custom mobile card renderer
  const mobileCardRenderer = (user: UserProfile, columns: ResponsiveTableColumn<UserProfile>[], index: number) => {
    const nameColumn = columns.find((c) => c.id === 'name');
    const roleColumn = columns.find((c) => c.id === 'role');
    const companyColumn = columns.find((c) => c.id === 'company');
    const statusColumn = columns.find((c) => c.id === 'status');
    const actionsColumn = columns.find((c) => c.id === 'actions');

    return (
      <Card
        sx={{
          mb: 2,
          transition: 'box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out',
          '&:hover': {
            boxShadow: 3,
            transform: 'translateY(-2px)',
          },
        }}
      >
        <CardContent>
          {nameColumn && (
            <Box sx={{ mb: 2 }}>
              {nameColumn.mobileRender ? nameColumn.mobileRender(user, index) : nameColumn.render(user, index)}
            </Box>
          )}
          <Stack spacing={1.5}>
            {roleColumn && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Role:
                </Typography>
                {roleColumn.render(user, index)}
              </Box>
            )}
            {statusColumn && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Status:
                </Typography>
                {statusColumn.render(user, index)}
              </Box>
            )}
            {companyColumn && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Company:
                </Typography>
                {companyColumn.render(user, index)}
              </Box>
            )}
          </Stack>
          {actionsColumn && (
            <Box sx={{ mt: 2 }}>
              {actionsColumn.mobileRender ? actionsColumn.mobileRender(user, index) : actionsColumn.render(user, index)}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            User Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage users and their permissions
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={filteredUsers.length === 0}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
            sx={{ minWidth: 140 }}
          >
            Create User
          </Button>
        </Stack>
      </Box>

      {/* Statistics Cards */}
      {!isLoading && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                      Total Users
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {stats.total}
                    </Typography>
                  </Box>
                  <PeopleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'success.main', color: 'success.contrastText' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                      Active
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {stats.active}
                    </Typography>
                  </Box>
                  <CheckCircleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'error.main', color: 'error.contrastText' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                      Inactive
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {stats.inactive}
                    </Typography>
                  </Box>
                  <CancelIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'warning.main', color: 'warning.contrastText' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                      Pending
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {stats.pending}
                    </Typography>
                  </Box>
                  <ScheduleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(25, 118, 210, 0.02) 100%)',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              placeholder="Search by name, email, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
              size="medium"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.paper',
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.5}>
            <FormControl fullWidth size="medium">
              <InputLabel>Role</InputLabel>
              <Select
                value={roleFilter}
                label="Role"
                onChange={(e) => setRoleFilter(e.target.value)}
                sx={{
                  bgcolor: 'background.paper',
                }}
              >
                <MenuItem value="all">All Roles</MenuItem>
                <MenuItem value={Role.ADMIN}>Admin</MenuItem>
                <MenuItem value={Role.BUYER}>Buyer</MenuItem>
                <MenuItem value={Role.SUPPLIER}>Supplier</MenuItem>
                <MenuItem value={Role.LOGISTICS}>Logistics</MenuItem>
                <MenuItem value={Role.CLEARANCE}>Clearance</MenuItem>
                <MenuItem value={Role.SERVICE_PROVIDER}>Service Provider</MenuItem>
                <MenuItem value={Role.COMPANY_MANAGER}>Company Manager</MenuItem>
                <MenuItem value={Role.GOVERNMENT}>Government</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2.5}>
            <FormControl fullWidth size="medium">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{
                  bgcolor: 'background.paper',
                }}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setSearchQuery('');
                setRoleFilter('all');
                setStatusFilter('all');
              }}
              size="medium"
              startIcon={<ClearIcon />}
            >
              Clear
            </Button>
          </Grid>
        </Grid>

        {/* Active Filters Chips */}
        {(debouncedSearch || roleFilter !== 'all' || statusFilter !== 'all') && (
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {debouncedSearch && (
              <Chip
                label={`Search: "${debouncedSearch}"`}
                onDelete={() => setSearchQuery('')}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {roleFilter !== 'all' && (
              <Chip
                label={`Role: ${roleFilter}`}
                onDelete={() => setRoleFilter('all')}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {statusFilter !== 'all' && (
              <Chip
                label={`Status: ${statusFilter}`}
                onDelete={() => setStatusFilter('all')}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
        )}
      </Paper>

      {/* Users Table */}
      {isLoading ? (
        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="60%" height={24} />
                  <Skeleton variant="text" width="40%" height={20} />
                </Box>
                <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
                <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
              </Box>
            ))}
          </Stack>
        </Paper>
      ) : (
        <>
          <ResponsiveTable
            columns={columns}
            data={users}
            keyExtractor={(user) => user.id}
            emptyMessage={
              debouncedSearch || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'No users match the selected filters'
                : 'No users found'
            }
            mobileCardRenderer={mobileCardRenderer}
            tableProps={{
              stickyHeader: true,
              size: 'medium',
            }}
            cardProps={{
              variant: 'outlined',
            }}
          />
          {filteredUsers.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Pagination
                page={page}
                limit={rowsPerPage}
                total={filteredUsers.length}
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
        </>
      )}

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreateSubmit(onSubmitCreate)}>
          <DialogTitle>Create User</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Controller
                  name="email"
                  control={createControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Email"
                      type="email"
                      error={!!createErrors.email}
                      helperText={createErrors.email?.message}
                      required
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="password"
                  control={createControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Password"
                      type="password"
                      error={!!createErrors.password}
                      helperText={createErrors.password?.message}
                      required
                    />
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <Controller
                  name="firstName"
                  control={createControl}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="First Name" />
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <Controller
                  name="lastName"
                  control={createControl}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Last Name" />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="phone"
                  control={createControl}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Phone" />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="role"
                  control={createControl}
                  render={({ field }) => (
                    <FormControl fullWidth required>
                      <InputLabel>Role</InputLabel>
                      <Select {...field} label="Role">
                        <MenuItem value={Role.BUYER}>Buyer</MenuItem>
                        <MenuItem value={Role.SUPPLIER}>Supplier</MenuItem>
                        <MenuItem value={Role.LOGISTICS}>Logistics</MenuItem>
                        <MenuItem value={Role.CLEARANCE}>Clearance</MenuItem>
                        <MenuItem value={Role.SERVICE_PROVIDER}>Service Provider</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              {isAdmin && (
                <Grid item xs={12}>
                  <Controller
                    name="companyId"
                    control={createControl}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Company ID"
                        required
                        error={!!createErrors.companyId}
                        helperText={createErrors.companyId?.message}
                      />
                    )}
                  />
                </Grid>
              )}
              {isCompanyManager && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    User will be created for your company ({user?.companyId})
                  </Alert>
                </Grid>
              )}
            </Grid>
            {createMutation.isError && createMutation.error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {createMutation.error instanceof Error
                  ? createMutation.error.message
                  : 'Failed to create user'}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              {createMutation.isPending ? <CircularProgress size={20} /> : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleUpdateSubmit(onSubmitUpdate)}>
          <DialogTitle>Edit User</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Controller
                  name="firstName"
                  control={updateControl}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="First Name" />
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <Controller
                  name="lastName"
                  control={updateControl}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Last Name" />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="phone"
                  control={updateControl}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Phone" />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="status"
                  control={updateControl}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select {...field} label="Status">
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>
            {updateMutation.isError && updateMutation.error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {updateMutation.error instanceof Error
                  ? updateMutation.error.message
                  : 'Failed to update user'}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <CircularProgress size={20} /> : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            Are you sure you want to delete user <strong>{selectedUser?.email}</strong>? This action
            cannot be undone.
          </Alert>
          {deleteMutation.isError && deleteMutation.error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteMutation.error instanceof Error
                ? deleteMutation.error.message
                : 'Failed to delete user'}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={onDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manage Permissions Dialog */}
      <Dialog open={permissionsDialogOpen} onClose={() => setPermissionsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Manage Permissions - {selectedUser?.firstName} {selectedUser?.lastName} ({selectedUser?.email})
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Custom permissions are added to the user's role permissions. Select permissions to grant to this user.
          </Alert>

          <PermissionsManager
            user={selectedUser}
            onSave={async (permissions) => {
              if (!selectedUser) return;
              try {
                await updatePermissionsMutation.mutateAsync({
                  userId: selectedUser.id,
                  customPermissions: permissions,
                });
                setPermissionsDialogOpen(false);
                setSelectedUser(null);
              } catch (error) {
                // Error handled by mutation
              }
            }}
            onCancel={() => {
              setPermissionsDialogOpen(false);
              setSelectedUser(null);
            }}
            loading={updatePermissionsMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

// Permissions Manager Component
const PERMISSIONS = [
  {
    category: 'Purchase Requests', permissions: [
      'create:purchase-request',
      'view:purchase-request',
      'update:purchase-request',
      'delete:purchase-request',
      'approve:purchase-request',
    ]
  },
  {
    category: 'RFQs', permissions: [
      'create:rfq',
      'view:rfq',
      'update:rfq',
      'respond:rfq',
    ]
  },
  {
    category: 'Bids', permissions: [
      'create:bid',
      'view:bid',
      'update:bid',
      'evaluate:bid',
    ]
  },
  {
    category: 'Contracts', permissions: [
      'create:contract',
      'view:contract',
      'update:contract',
      'sign:contract',
    ]
  },
  {
    category: 'Shipments', permissions: [
      'create:shipment',
      'view:shipment',
      'update:shipment',
      'track:shipment',
      'update:gps',
    ]
  },
  {
    category: 'Payments', permissions: [
      'create:payment',
      'view:payment',
      'update:payment',
      'delete:payment',
      'process:payment',
    ]
  },
  {
    category: 'Disputes', permissions: [
      'create:dispute',
      'view:dispute',
      'update:dispute',
      'delete:dispute',
      'resolve:dispute',
      'escalate:dispute',
    ]
  },
  {
    category: 'Analytics', permissions: [
      'view:analytics',
      'view:government-analytics',
    ]
  },
  {
    category: 'Users & Companies', permissions: [
      'view:users',
      'manage:users',
      'view:companies',
      'manage:companies',
    ]
  },
];

interface PermissionsManagerProps {
  user: UserProfile | null;
  onSave: (permissions: string[]) => void;
  onCancel: () => void;
  loading: boolean;
}

const PermissionsManager = ({ user, onSave, onCancel, loading }: PermissionsManagerProps) => {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    user?.customPermissions || []
  );

  useEffect(() => {
    if (user) {
      setSelectedPermissions(user.customPermissions || []);
    }
  }, [user]);

  const handleTogglePermission = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSelectAll = (categoryPermissions: string[]) => {
    const allSelected = categoryPermissions.every((p) => selectedPermissions.includes(p));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((p) => !categoryPermissions.includes(p)));
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...categoryPermissions])]);
    }
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {PERMISSIONS.map((category) => (
          <Grid item xs={12} md={6} key={category.category}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {category.category}
                </Typography>
                <Button
                  size="small"
                  onClick={() => handleSelectAll(category.permissions)}
                >
                  {category.permissions.every((p) => selectedPermissions.includes(p))
                    ? 'Deselect All'
                    : 'Select All'}
                </Button>
              </Box>
              <Divider sx={{ mb: 1 }} />
              <FormGroup>
                {category.permissions.map((permission) => (
                  <FormControlLabel
                    key={permission}
                    control={
                      <Checkbox
                        checked={selectedPermissions.includes(permission)}
                        onChange={() => handleTogglePermission(permission)}
                      />
                    }
                    label={permission.replace(/:/g, ' ').replace(/-/g, ' ')}
                  />
                ))}
              </FormGroup>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {selectedPermissions.length} permission(s) selected
        </Typography>
        <Box>
          <Button onClick={onCancel} sx={{ mr: 1 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => onSave(selectedPermissions)}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Save Permissions'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
