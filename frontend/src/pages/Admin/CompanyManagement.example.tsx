/**
 * CompanyManagement.tsx - MOBILE-SAFE VERSION
 * 
 * This is an example of how to convert CompanyManagement to use ResponsiveTable.
 * Replace the Table section (lines 276-361) with this implementation.
 */

import { Typography, Chip, Box, IconButton } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, CheckCircle, Cancel } from '@mui/icons-material';
import { ResponsiveTable, ResponsiveTableColumn } from '@/components/common';
import { Company } from '@/types/company';

// Example helper functions (implement these in your actual component)
const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'approved':
      return 'success';
    case 'inactive':
    case 'rejected':
      return 'error';
    case 'pending':
      return 'warning';
    default:
      return 'default';
  }
};

// Example handlers (implement these in your actual component)
const handleEdit = (company: Company) => {
  // Implement edit logic
  console.log('Edit company:', company);
};

const handleDelete = (company: Company) => {
  // Implement delete logic
  console.log('Delete company:', company);
};

const handleApprove = (company: Company) => {
  // Implement approve logic
  console.log('Approve company:', company);
};

const handleReject = (company: Company) => {
  // Implement reject logic
  console.log('Reject company:', company);
};

// Example data (replace with your actual data)
const companies: Company[] = [];

// ... existing imports and code ...

// Add this column definition (replace the Table section)
const columns: ResponsiveTableColumn<Company>[] = [
  {
    id: 'name',
    label: 'Name',
    priority: 'high',
    render: (company) => (
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {company.name}
      </Typography>
    ),
    mobileLabel: 'Company',
  },
  {
    id: 'registrationNumber',
    label: 'Registration Number',
    priority: 'high',
    render: (company) => (
      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
        {company.registrationNumber}
      </Typography>
    ),
    mobileLabel: 'Reg. Number',
  },
  {
    id: 'type',
    label: 'Type',
    priority: 'medium',
    render: (company) => (
      <Chip label={company.type} size="small" variant="outlined" />
    ),
  },
  {
    id: 'email',
    label: 'Email',
    priority: 'medium',
    render: (company) => (
      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
        {company.email}
      </Typography>
    ),
  },
  {
    id: 'phone',
    label: 'Phone',
    priority: 'low',
    render: (company) => (
      <Typography variant="body2">{company.phone}</Typography>
    ),
  },
  {
    id: 'status',
    label: 'Status',
    priority: 'high',
    render: (company) => (
      <Chip
        label={company.status}
        color={getStatusColor(company.status) as any}
        size="small"
      />
    ),
  },
  {
    id: 'actions',
    label: 'Actions',
    priority: 'high',
    render: (company) => (
      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(company);
          }}
          title="Edit Company"
        >
          <EditIcon fontSize="small" />
        </IconButton>
        {company.status?.toLowerCase() === 'pending' && (
          <>
            <IconButton
              size="small"
              color="success"
              onClick={(e) => {
                e.stopPropagation();
                handleApprove(company);
              }}
              title="Approve Company"
            >
              <CheckCircle fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                handleReject(company);
              }}
              title="Reject Company"
            >
              <Cancel fontSize="small" />
            </IconButton>
          </>
        )}
        <IconButton
          size="small"
          color="error"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(company);
          }}
          title="Delete Company"
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
  data={companies}
  keyExtractor={(company) => company.id}
  emptyMessage="No companies found"
  tableProps={{ stickyHeader: true }}
/>
