import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Divider,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { isValidId } from '@/utils/routeValidation';
import {
  ArrowBack,
  Gavel,
  CheckCircle,
  Upload,
  Edit,
  Delete,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  useDispute,
  useEscalateDispute,
  useResolveDispute,
  useAddAttachments,
  useUpdateDispute,
  useDeleteDispute,
} from '@/hooks/useDisputes';
import { userService } from '@/services/user.service';
import { DisputeStatusBadge } from '@/components/Dispute/DisputeStatusBadge';
import { AttachmentUpload } from '@/components/Dispute/AttachmentUpload';
import { ActivityHistory } from '@/components/Audit/ActivityHistory';
import { DisputeAssignment } from '@/components/Dispute/DisputeAssignment';
import { formatDateTime } from '@/utils';
import { PageSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton';
import { DisputeStatus, DisputeAttachment, UpdateDisputeDto } from '@/types/dispute';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';
import { Tabs, Tab } from '@mui/material';

export const DisputeDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role = user?.role as Role;
  const [activeTab, setActiveTab] = useState(0);
  const [escalateDialogOpen, setEscalateDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [attachmentDialogOpen, setAttachmentDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [governmentNotes, setGovernmentNotes] = useState('');
  const [resolution, setResolution] = useState('');
  const [updateStatus, setUpdateStatus] = useState<DisputeStatus>(DisputeStatus.OPEN);
  const [newAttachments, setNewAttachments] = useState<DisputeAttachment[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [dueDate, setDueDate] = useState<string>('');

  // Validate ID - reject invalid values like "create", "new", etc.
  const validId = isValidId(id) ? id : undefined;

  // Redirect if ID is missing or invalid
  useEffect(() => {
    if (!isValidId(id)) {
      navigate('/disputes', { replace: true });
    }
  }, [id, navigate]);

  if (!isValidId(id)) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Invalid dispute ID. Redirecting...
      </Alert>
    );
  }

  const { data, isLoading, error } = useDispute(validId);
  const escalateMutation = useEscalateDispute();
  const resolveMutation = useResolveDispute();
  const addAttachmentsMutation = useAddAttachments();
  const updateMutation = useUpdateDispute();
  const deleteMutation = useDeleteDispute();

  const dispute = data?.data;
  const isGovernment = role === Role.GOVERNMENT || role === Role.ADMIN;
  const canEscalate = !dispute?.escalatedToGovernment && dispute?.status !== DisputeStatus.RESOLVED;
  const canResolve = isGovernment && dispute?.escalatedToGovernment && dispute?.status !== DisputeStatus.RESOLVED;
  const canAddAttachments = dispute?.status !== DisputeStatus.RESOLVED;
  const canUpdate = dispute?.status !== DisputeStatus.RESOLVED;
  const canDelete = dispute?.status !== DisputeStatus.RESOLVED;

  // Fetch government users for assignment dropdown
  const { data: companyUsers } = useQuery({
    queryKey: ['users', 'company', user?.companyId, 'government'],
    queryFn: async () => {
      if (!user?.companyId) return { data: [] };
      const response = await userService.getUsersByCompany(user.companyId);
      return {
        data: response.data?.filter((u) => u.role === Role.GOVERNMENT || u.role === Role.ADMIN) || [],
      };
    },
    enabled: !!user?.companyId && escalateDialogOpen,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error || !dispute) {
    return (
      <Alert severity="error">
        Failed to load dispute. Please try again.
      </Alert>
    );
  }

  const handleEscalate = () => {
    if (!selectedUserId || !validId) {
      return;
    }
    escalateMutation.mutate(
      {
        id: validId,
        data: { 
          assignedToUserId: selectedUserId,
          governmentNotes: governmentNotes || undefined,
          dueDate: dueDate || undefined,
        },
      },
      {
        onSuccess: () => {
          setEscalateDialogOpen(false);
          setGovernmentNotes('');
          setSelectedUserId('');
          setDueDate('');
        },
      }
    );
  };

  const handleResolve = () => {
    if (!resolution.trim()) {
      return;
    }
    resolveMutation.mutate(
      {
        id: validId!,
        data: { resolution },
      },
      {
        onSuccess: () => {
          setResolveDialogOpen(false);
          setResolution('');
        },
      }
    );
  };

  const handleAddAttachments = () => {
    if (newAttachments.length === 0) {
      return;
    }
    addAttachmentsMutation.mutate(
      {
        id: validId!,
        data: { attachments: newAttachments },
      },
      {
        onSuccess: () => {
          setAttachmentDialogOpen(false);
          setNewAttachments([]);
        },
      }
    );
  };

  const handleUpdate = () => {
    const updateData: UpdateDisputeDto = {
      status: updateStatus,
    };
    updateMutation.mutate(
      {
        id: validId!,
        data: updateData,
      },
      {
        onSuccess: () => {
          setUpdateDialogOpen(false);
        },
      }
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate(dispute._id, {
      onSuccess: () => {
        navigate('/disputes');
      },
    });
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/disputes')}>
          Back
        </Button>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {dispute.type} Dispute
            </Typography>
            <DisputeStatusBadge status={dispute.status} />
            {dispute.escalatedToGovernment && (
              <Chip
                icon={<Gavel />}
                label="Escalated to Government"
                color="error"
                size="small"
              />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary">
            Dispute #{(dispute.id || dispute._id || '').slice(-6)} • Created {formatDateTime(dispute.createdAt)}
            {dispute.dueDate && (
              <> • Due: {formatDateTime(dispute.dueDate)}</>
            )}
          </Typography>
        </Box>
        {canEscalate && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<Gavel />}
            onClick={() => setEscalateDialogOpen(true)}
          >
            Escalate to Government
          </Button>
        )}
        {canResolve && (
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircle />}
            onClick={() => setResolveDialogOpen(true)}
          >
            Resolve Dispute
          </Button>
        )}
        {canAddAttachments && (
          <Button
            variant="outlined"
            startIcon={<Upload />}
            onClick={() => setAttachmentDialogOpen(true)}
          >
            Add Attachments
          </Button>
        )}
        {canUpdate && (
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => {
              setUpdateStatus(dispute?.status || DisputeStatus.OPEN);
              setUpdateDialogOpen(true);
            }}
          >
            Update
          </Button>
        )}
        {canDelete && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* Description */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Description
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                {dispute.description}
              </Typography>
            </CardContent>
          </Card>

          {/* Attachments */}
          {dispute.attachments.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                  Attachments ({dispute.attachments.length})
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {dispute.attachments.map((attachment, index) => (
                    <Box
                      key={index}
                      sx={{
                        p: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant="body2">{attachment.type}</Typography>
                      <Button size="small" href={attachment.url} target="_blank">
                        View
                      </Button>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Resolution */}
          {dispute.status === DisputeStatus.RESOLVED && dispute.resolution && (
            <Card sx={{ mb: 3, borderLeft: '4px solid', borderColor: 'success.main' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CheckCircle color="success" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Resolution
                  </Typography>
                </Box>
                <Typography variant="body1" color="text.secondary">
                  {dispute.resolution}
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Government Notes */}
          {dispute.escalatedToGovernment && dispute.governmentNotes && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Government Notes
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {dispute.governmentNotes}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Assignment & SLA */}
          {dispute && <DisputeAssignment dispute={dispute} />}
          
          {/* Dispute Details */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Dispute Details
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Status
                  </Typography>
                  <DisputeStatusBadge status={dispute.status} />
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Type
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {dispute.type}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Contract ID
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {dispute.contractId.slice(-8)}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Against Company
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {dispute.againstCompanyId.slice(-8)}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Raised By
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {dispute.raisedBy.slice(-8)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Escalate Dialog */}
      <Dialog open={escalateDialogOpen} onClose={() => setEscalateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Escalate to Government</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Escalating this dispute requires assignment to a government user. This action cannot be undone.
          </DialogContentText>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>Assign To (Required)</InputLabel>
              <Select
                value={selectedUserId}
                label="Assign To (Required)"
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <MenuItem value="" disabled>
                  Select a government user
                </MenuItem>
                {companyUsers?.data?.map((govUser) => (
                  <MenuItem key={govUser._id} value={govUser._id}>
                    {govUser.firstName} {govUser.lastName} ({govUser.email})
                  </MenuItem>
                ))}
                {companyUsers?.data?.length === 0 && (
                  <MenuItem disabled>No government users found in your company</MenuItem>
                )}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              type="date"
              label="Due Date (Optional)"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Notes (Optional)"
              multiline
              rows={3}
              value={governmentNotes}
              onChange={(e) => setGovernmentNotes(e.target.value)}
              placeholder="Add any notes for the government..."
            />
            {escalateMutation.isError && (
              <Alert severity="error">
                {escalateMutation.error?.response?.data?.message || 'Failed to escalate dispute'}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEscalateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleEscalate}
            variant="contained"
            color="error"
            disabled={!selectedUserId || escalateMutation.isPending}
          >
            {escalateMutation.isPending ? 'Escalating...' : 'Escalate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onClose={() => setResolveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Resolve Dispute</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Provide a resolution for this dispute. This will mark the dispute as resolved.
          </DialogContentText>
          <TextField
            fullWidth
            label="Resolution"
            multiline
            rows={4}
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder="Describe the resolution..."
            required
            error={!resolution.trim() && resolveMutation.isError}
            helperText={!resolution.trim() ? 'Resolution is required' : ''}
          />
          {resolveMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {resolveMutation.error?.response?.data?.message || 'Failed to resolve dispute'}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleResolve}
            variant="contained"
            color="success"
            disabled={!resolution.trim() || resolveMutation.isPending}
          >
            {resolveMutation.isPending ? 'Resolving...' : 'Resolve'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Attachments Dialog */}
      <Dialog open={attachmentDialogOpen} onClose={() => setAttachmentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Attachments</DialogTitle>
        <DialogContent>
          <AttachmentUpload
            attachments={newAttachments}
            onChange={setNewAttachments}
            maxFiles={10}
          />
          {addAttachmentsMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {addAttachmentsMutation.error?.response?.data?.message || 'Failed to add attachments'}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAttachmentDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddAttachments}
            variant="contained"
            disabled={newAttachments.length === 0 || addAttachmentsMutation.isPending}
          >
            {addAttachmentsMutation.isPending ? 'Adding...' : 'Add Attachments'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Dialog */}
      <Dialog open={updateDialogOpen} onClose={() => setUpdateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Dispute</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Update the status of this dispute.
          </DialogContentText>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={updateStatus}
              label="Status"
              onChange={(e) => setUpdateStatus(e.target.value as DisputeStatus)}
            >
              <MenuItem value={DisputeStatus.OPEN}>Open</MenuItem>
              <MenuItem value={DisputeStatus.UNDER_REVIEW}>Under Review</MenuItem>
              <MenuItem value={DisputeStatus.ESCALATED}>Escalated</MenuItem>
              <MenuItem value={DisputeStatus.RESOLVED} disabled>
                Resolved (Use Resolve button)
              </MenuItem>
            </Select>
          </FormControl>
          {updateMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {updateMutation.error?.response?.data?.message || 'Failed to update dispute'}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpdate}
            variant="contained"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? <CircularProgress size={20} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Dispute</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this dispute? This action cannot be undone.
          </DialogContentText>
          {deleteMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteMutation.error?.response?.data?.message || 'Failed to delete dispute'}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleteMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Activity History Tab */}
      <Box sx={{ mt: 4 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Details" />
          <Tab label="Activity History" />
        </Tabs>
        <Box sx={{ mt: 3 }}>
          {activeTab === 0 && (
            <Box>
              {/* Details content is already shown above */}
            </Box>
          )}
          {activeTab === 1 && id && (
            <ActivityHistory
              resource="dispute"
              resourceId={validId}
              title="Dispute Activity History"
              showExport={true}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};
