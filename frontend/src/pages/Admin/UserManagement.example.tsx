/**
 * UserManagement.tsx - MOBILE-SAFE VERSION
 * 
 * This is an example of how to convert UserManagement to use ResponsiveTable.
 * Replace the Table section (lines 185-243) with this implementation.
 */

import { Typography, Chip, Box, IconButton } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { ResponsiveTable, ResponsiveTableColumn } from '@/components/common';
import { UserProfile } from '@/types/user';

// Example helper functions (implement these in your actual component)
const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
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

// Example handlers (implement these in your actual component)
const handleEdit = (user: UserProfile) => {
  // Implement edit logic
  console.log('Edit user:', user);
};

const handleDelete = (user: UserProfile) => {
  // Implement delete logic
  console.log('Delete user:', user);
};

// Example data (replace with your actual data)
const users: UserProfile[] = [];

// ... existing imports and code ...

// Add this column definition (replace the Table section)
const columns: ResponsiveTableColumn<UserProfile>[] = [
  {
    id: 'name',
    label: 'Name',
    priority: 'high',
    render: (user) => (
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {user.firstName || user.lastName
          ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
          : 'N/A'}
      </Typography>
    ),
    mobileLabel: 'User',
  },
  {
    id: 'email',
    label: 'Email',
    priority: 'high',
    render: (user) => (
      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
        {user.email}
      </Typography>
    ),
  },
  {
    id: 'role',
    label: 'Role',
    priority: 'high',
    render: (user) => <Chip label={user.role} size="small" />,
  },
  {
    id: 'companyId',
    label: 'Company ID',
    priority: 'medium',
    render: (user) => (
      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
        {user.companyId?.slice(-8) || 'N/A'}
      </Typography>
    ),
    mobileLabel: 'Company',
  },
  {
    id: 'status',
    label: 'Status',
    priority: 'high',
    render: (user) => (
      <Chip
        label={user.status}
        size="small"
        color={getStatusColor(user.status) as any}
      />
    ),
  },
  {
    id: 'actions',
    label: 'Actions',
    priority: 'high',
    render: (user) => (
      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(user);
          }}
          title="Edit User"
        >
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          color="error"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(user);
          }}
          title="Delete User"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    ),
    align: 'right',
    mobileLabel: 'Actions',
  },
];

// Replace the Paper/TableContainer/Table section with:
<ResponsiveTable
  columns={columns}
  data={users}
  keyExtractor={(user) => user.id}
  emptyMessage="No users found"
  onRowClick={(user) => handleEdit(user)}
  tableProps={{ stickyHeader: true }}
/>
