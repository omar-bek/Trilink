import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  Card,
  CardContent,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  Cancel,
  Delete as DeleteIcon,
  Business,
  Email,
  Phone,
  LocationOn,
  People,
  Description,
} from '@mui/icons-material';
import { useCompany, useApproveCompany, useRejectCompany, useDeleteCompany } from '@/hooks/useCompany';
import { useUsersByCompany } from '@/hooks/useUsers';
import { PageSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';
import { formatDate } from '@/utils';

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

export const CompanyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const companyId = id || '';

  const { data: companyData, isLoading: isLoadingCompany } = useCompany(companyId);
  const { data: usersData, isLoading: isLoadingUsers } = useUsersByCompany(companyId);
  
  const approveMutation = useApproveCompany();
  const rejectMutation = useRejectCompany();
  const deleteMutation = useDeleteCompany();

  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const company = (companyData as any)?.data;
  const users = usersData?.data || [];

  if (isLoadingCompany) {
    return <PageSkeleton />;
  }

  if (!company) {
    return (
      <Box>
        <Alert severity="error">Company not found</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/admin/companies')} sx={{ mt: 2 }}>
          Back to Companies
        </Button>
      </Box>
    );
  }

  const handleApprove = () => {
    approveMutation.mutate(companyId, {
      onSuccess: () => {
        setApproveDialogOpen(false);
      },
    });
  };

  const handleReject = () => {
    rejectMutation.mutate(companyId, {
      onSuccess: () => {
        setRejectDialogOpen(false);
      },
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate(companyId, {
      onSuccess: () => {
        navigate('/admin/companies');
      },
    });
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/admin/companies')}>
            Back
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Company Details
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {company.status?.toLowerCase() === 'pending' && (
            <>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircle />}
                onClick={() => setApproveDialogOpen(true)}
                disabled={approveMutation.isPending}
              >
                Approve
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<Cancel />}
                onClick={() => setRejectDialogOpen(true)}
                disabled={rejectMutation.isPending}
              >
                Reject
              </Button>
            </>
          )}
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteDialogOpen(true)}
            disabled={deleteMutation.isPending}
          >
            Delete
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={3}>
        {/* Company Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 3 }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                    {company.name}
                  </Typography>
                  <Chip
                    label={company.status}
                    color={getStatusColor(company.status) as any}
                    sx={{ mr: 1 }}
                  />
                  <Chip label={company.type} variant="outlined" />
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Business color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Registration Number
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {company.registrationNumber}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Email color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {company.email}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Phone color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {company.phone}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'start', gap: 1, mb: 2 }}>
                    <LocationOn color="action" sx={{ mt: 0.5 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Address
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {company.address.street}
                        <br />
                        {company.address.city}, {company.address.state}
                        <br />
                        {company.address.country} {company.address.zipCode}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Company ID
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {company.id}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Created At
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(company.createdAt)}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(company.updatedAt)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Documents */}
          {company.documents && company.documents.length > 0 && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Description />
                  Documents
                </Typography>
                <Grid container spacing={2}>
                  {company.documents.map((doc, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          {doc.type}
                        </Typography>
                        <Button
                          size="small"
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="outlined"
                        >
                          View Document
                        </Button>
                        {doc.uploadedAt && (
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                            Uploaded: {formatDate(doc.uploadedAt)}
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Users List */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <People />
                Company Users ({users.length})
              </Typography>
              
              {isLoadingUsers ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : users.length === 0 ? (
                <Alert severity="info">No users found for this company.</Alert>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id} hover>
                          <TableCell>
                            {user.firstName || user.lastName
                              ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                              : 'N/A'}
                            <br />
                            <Typography variant="caption" color="text.secondary">
                              {user.email}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={user.role} size="small" />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={user.status}
                              size="small"
                              color={user.status === 'active' ? 'success' : 'default'}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Approve Dialog */}
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
            onClick={handleApprove}
            disabled={approveMutation.isPending}
          >
            {approveMutation.isPending ? <CircularProgress size={20} /> : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
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
            onClick={handleReject}
            disabled={rejectMutation.isPending}
          >
            {rejectMutation.isPending ? <CircularProgress size={20} /> : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Company</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Are you sure you want to delete <strong>{company.name}</strong>? This action cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleteMutation.isPending}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
