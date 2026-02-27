import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Grid,
} from '@mui/material';
import {
  Assignment,
  CloudUpload,
  CheckCircle,
  Cancel,
  Warning,
  AccessTime,
  Description,
  Download,
  Refresh,
  Gavel,
  History,
} from '@mui/icons-material';
import { Shipment, CustomsClearanceStatus, SubmitCustomsDocumentsDto, ResubmitCustomsDocumentsDto, UpdateCustomsClearanceStatusDto } from '@/types/shipment';
import { formatDateTime } from '@/utils';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';
import { useSubmitCustomsDocuments, useUpdateCustomsClearanceStatus, useResubmitCustomsDocuments } from '@/hooks/useShipments';
import api from '@/services/api';

interface CustomsClearanceProps {
  shipment: Shipment;
  onUpdate?: () => void;
}

const DOCUMENT_TYPES = [
  'Commercial Invoice',
  'Packing List',
  'Certificate of Origin',
  'Customs Declaration',
  'Bill of Lading',
  'Insurance Certificate',
  'Import License',
  'Export License',
  'Phytosanitary Certificate',
  'Other',
];

const STATUS_CONFIG: Record<CustomsClearanceStatus, { label: string; color: 'success' | 'warning' | 'error' | 'info' | 'default'; icon: any }> = {
  [CustomsClearanceStatus.NOT_REQUIRED]: {
    label: 'Not Required',
    color: 'default',
    icon: CheckCircle,
  },
  [CustomsClearanceStatus.PENDING]: {
    label: 'Pending Submission',
    color: 'warning',
    icon: AccessTime,
  },
  [CustomsClearanceStatus.DOCUMENTS_SUBMITTED]: {
    label: 'Documents Submitted',
    color: 'info',
    icon: CloudUpload,
  },
  [CustomsClearanceStatus.UNDER_REVIEW]: {
    label: 'Under Review',
    color: 'warning',
    icon: Gavel,
  },
  [CustomsClearanceStatus.APPROVED]: {
    label: 'Approved',
    color: 'success',
    icon: CheckCircle,
  },
  [CustomsClearanceStatus.REJECTED]: {
    label: 'Rejected',
    color: 'error',
    icon: Cancel,
  },
  [CustomsClearanceStatus.RESUBMITTED]: {
    label: 'Resubmitted',
    color: 'info',
    icon: Refresh,
  },
};

export const CustomsClearance = ({ shipment, onUpdate }: CustomsClearanceProps) => {
  const { user } = useAuthStore();
  const role = user?.role as Role;
  const isGovernment = role === Role.GOVERNMENT || role === Role.ADMIN;
  const canSubmitDocuments = !isGovernment && shipment.status === 'in_clearance';

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [resubmitDialogOpen, setResubmitDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [documentTypes, setDocumentTypes] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [resubmitNotes, setResubmitNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submitDocumentsMutation = useSubmitCustomsDocuments();
  const updateStatusMutation = useUpdateCustomsClearanceStatus();
  const resubmitMutation = useResubmitCustomsDocuments();

  const customsStatus = shipment.customsClearanceStatus || CustomsClearanceStatus.NOT_REQUIRED;
  const statusConfig = STATUS_CONFIG[customsStatus];

  // Initialize customs status if shipment is in clearance but status is not set
  useEffect(() => {
    if (shipment.status === 'in_clearance' && !shipment.customsClearanceStatus) {
      // Status will be set when documents are submitted
    }
  }, [shipment]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    setDocumentTypes(files.map(() => ''));
    setError(null);
  };

  const handleDocumentTypeChange = (index: number, type: string) => {
    const newTypes = [...documentTypes];
    newTypes[index] = type;
    setDocumentTypes(newTypes);
  };

  const uploadFiles = async (): Promise<string[]> => {
    const uploadPromises = selectedFiles.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'customs_document');
      formData.append('description', `Customs document: ${file.name}`);

      const response = await api.post('/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.data.id;
    });

    return Promise.all(uploadPromises);
  };

  const handleSubmitDocuments = async () => {
    if (selectedFiles.length === 0) {
      return;
    }

    if (documentTypes.some((type) => !type)) {
      return;
    }

    try {
      setUploading(true);
      const documentIds = await uploadFiles();

      const payload: SubmitCustomsDocumentsDto = {
        documentIds,
        documentTypes,
      };

      await submitDocumentsMutation.mutateAsync({ id: shipment._id, data: payload });

      setUploadDialogOpen(false);
      setSelectedFiles([]);
      setDocumentTypes([]);
      if (onUpdate) onUpdate();
    } catch (err: any) {
      // Error is handled by the mutation hook
    } finally {
      setUploading(false);
    }
  };

  const handleResubmit = async () => {
    if (selectedFiles.length === 0) {
      return;
    }

    if (documentTypes.some((type) => !type)) {
      return;
    }

    try {
      setUploading(true);
      const documentIds = await uploadFiles();

      const payload: ResubmitCustomsDocumentsDto = {
        documentIds,
        documentTypes,
        notes: resubmitNotes || undefined,
      };

      await resubmitMutation.mutateAsync({ id: shipment._id, data: payload });

      setResubmitDialogOpen(false);
      setSelectedFiles([]);
      setDocumentTypes([]);
      setResubmitNotes('');
      if (onUpdate) onUpdate();
    } catch (err: any) {
      // Error is handled by the mutation hook
    } finally {
      setUploading(false);
    }
  };

  const handleStatusUpdate = async (status: CustomsClearanceStatus, description: string, rejectionReason?: string) => {
    try {
      const payload: UpdateCustomsClearanceStatusDto = {
        status,
        description,
        rejectionReason,
        customsAuthority: (user as any)?.companyName || 'Customs Authority',
      };

      await updateStatusMutation.mutateAsync({ id: shipment._id, data: payload });

      setStatusDialogOpen(false);
      if (onUpdate) onUpdate();
    } catch (err: any) {
      // Error is handled by the mutation hook
    }
  };

  const StatusIcon = statusConfig.icon;

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assignment color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Customs Clearance
            </Typography>
          </Box>
          <Chip
            label={statusConfig.label}
            color={statusConfig.color}
            icon={<StatusIcon />}
            sx={{ fontWeight: 600 }}
          />
        </Box>

        {/* Status Alert */}
        {customsStatus === CustomsClearanceStatus.REJECTED && shipment.customsRejectionReason && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Clearance Rejected
            </Typography>
            <Typography variant="body2">{shipment.customsRejectionReason}</Typography>
            {shipment.customsResubmissionCount && (
              <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                Resubmission attempt: {shipment.customsResubmissionCount}
              </Typography>
            )}
          </Alert>
        )}

        {customsStatus === CustomsClearanceStatus.APPROVED && (
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
              Clearance Approved
            </Typography>
            {shipment.customsClearedAt && (
              <Typography variant="body2">
                Cleared on {formatDateTime(shipment.customsClearedAt)}
                {shipment.customsAuthority && ` by ${shipment.customsAuthority}`}
              </Typography>
            )}
            {shipment.customsAuthority && !shipment.customsClearedAt && (
              <Typography variant="body2" color="text.secondary">
                Authority: {shipment.customsAuthority}
              </Typography>
            )}
          </Alert>
        )}

        {/* Customs Authority Information */}
        {shipment.customsAuthority && customsStatus !== CustomsClearanceStatus.APPROVED && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Customs Authority
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {shipment.customsAuthority}
            </Typography>
          </Box>
        )}

        {customsStatus === CustomsClearanceStatus.UNDER_REVIEW && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
              Under Review
            </Typography>
            <Typography variant="body2">
              Your documents are being reviewed by customs authorities.
            </Typography>
          </Alert>
        )}

        {/* Action Buttons */}
        {canSubmitDocuments && (
          <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
            {customsStatus === CustomsClearanceStatus.REJECTED ? (
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={() => setResubmitDialogOpen(true)}
              >
                Resubmit Documents
              </Button>
            ) : (
              <Button
                variant="contained"
                startIcon={<CloudUpload />}
                onClick={() => setUploadDialogOpen(true)}
                disabled={customsStatus === CustomsClearanceStatus.DOCUMENTS_SUBMITTED || customsStatus === CustomsClearanceStatus.UNDER_REVIEW}
              >
                {customsStatus === CustomsClearanceStatus.PENDING || customsStatus === CustomsClearanceStatus.NOT_REQUIRED
                  ? 'Submit Documents'
                  : 'Update Documents'}
              </Button>
            )}
          </Box>
        )}

        {isGovernment && customsStatus !== CustomsClearanceStatus.APPROVED && customsStatus !== CustomsClearanceStatus.NOT_REQUIRED && (
          <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={() => handleStatusUpdate(CustomsClearanceStatus.APPROVED, 'Customs clearance approved')}
              disabled={updateStatusMutation.isPending}
            >
              Approve
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Cancel />}
              onClick={() => setStatusDialogOpen(true)}
              disabled={updateStatusMutation.isPending}
            >
              Reject
            </Button>
            <Button
              variant="outlined"
              startIcon={<Gavel />}
              onClick={() => handleStatusUpdate(CustomsClearanceStatus.UNDER_REVIEW, 'Documents under review')}
              disabled={updateStatusMutation.isPending}
            >
              Mark Under Review
            </Button>
          </Box>
        )}

        {/* Documents List */}
        {shipment.customsDocuments && shipment.customsDocuments.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              Submitted Documents
            </Typography>
            <List>
              {shipment.customsDocuments.map((doc, index) => (
                <ListItem key={index} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                  <Description sx={{ mr: 2, color: 'text.secondary' }} />
                  <ListItemText
                    primary={doc.documentType}
                    secondary={`Uploaded ${formatDateTime(doc.uploadedAt)}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" size="small">
                      <Download />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Clearance Events Timeline */}
        {shipment.customsClearanceEvents && shipment.customsClearanceEvents.length > 0 && (
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <History fontSize="small" />
              Clearance Timeline
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {shipment.customsClearanceEvents
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((event, index) => {
                  const eventConfig = STATUS_CONFIG[event.status];
                  const EventIcon = eventConfig.icon;
                  return (
                    <Paper key={index} sx={{ p: 2, borderLeft: '4px solid', borderColor: `${eventConfig.color}.main` }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            bgcolor: `${eventConfig.color}.light`,
                            color: `${eventConfig.color}.dark`,
                          }}
                        >
                          <EventIcon fontSize="small" />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {eventConfig.label}
                            </Typography>
                            {event.customsAuthority && (
                              <Chip label={event.customsAuthority} size="small" variant="outlined" />
                            )}
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {event.description}
                          </Typography>
                          {event.rejectionReason && (
                            <Alert severity="error" sx={{ mt: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                                Rejection Reason:
                              </Typography>
                              <Typography variant="body2">{event.rejectionReason}</Typography>
                            </Alert>
                          )}
                          <Typography variant="caption" color="text.secondary">
                            {formatDateTime(event.timestamp)}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  );
                })}
            </Box>
          </Box>
        )}


        {/* Submit Documents Dialog */}
        <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Submit Customs Documents</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <input
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                id="customs-file-upload"
                type="file"
                multiple
                onChange={handleFileSelect}
              />
              <label htmlFor="customs-file-upload">
                <Button variant="outlined" component="span" startIcon={<CloudUpload />} fullWidth>
                  Select Files
                </Button>
              </label>

              {selectedFiles.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Selected Files ({selectedFiles.length})
                  </Typography>
                  {selectedFiles.map((file, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <TextField
                        fullWidth
                        select
                        label={`Document Type for ${file.name}`}
                        value={documentTypes[index] || ''}
                        onChange={(e) => handleDocumentTypeChange(index, e.target.value)}
                        size="small"
                      >
                        {DOCUMENT_TYPES.map((type) => (
                          <MenuItem key={type} value={type}>
                            {type}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmitDocuments}
              variant="contained"
              disabled={submitDocumentsMutation.isPending || uploading || selectedFiles.length === 0 || documentTypes.some((type) => !type)}
            >
              {(submitDocumentsMutation.isPending || uploading) ? <CircularProgress size={20} /> : 'Submit'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Resubmit Documents Dialog */}
        <Dialog open={resubmitDialogOpen} onClose={() => setResubmitDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Resubmit Customs Documents</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Alert severity="warning">
                <Typography variant="body2">
                  Please review the rejection reason and submit corrected documents.
                </Typography>
              </Alert>

              <input
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                id="customs-resubmit-upload"
                type="file"
                multiple
                onChange={handleFileSelect}
              />
              <label htmlFor="customs-resubmit-upload">
                <Button variant="outlined" component="span" startIcon={<CloudUpload />} fullWidth>
                  Select Files
                </Button>
              </label>

              {selectedFiles.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Selected Files ({selectedFiles.length})
                  </Typography>
                  {selectedFiles.map((file, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <TextField
                        fullWidth
                        select
                        label={`Document Type for ${file.name}`}
                        value={documentTypes[index] || ''}
                        onChange={(e) => handleDocumentTypeChange(index, e.target.value)}
                        size="small"
                      >
                        {DOCUMENT_TYPES.map((type) => (
                          <MenuItem key={type} value={type}>
                            {type}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Box>
                  ))}
                </Box>
              )}

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes (Optional)"
                value={resubmitNotes}
                onChange={(e) => setResubmitNotes(e.target.value)}
                placeholder="Add any notes about the resubmission..."
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setResubmitDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleResubmit}
              variant="contained"
              disabled={resubmitMutation.isPending || uploading || selectedFiles.length === 0 || documentTypes.some((type) => !type)}
            >
              {(resubmitMutation.isPending || uploading) ? <CircularProgress size={20} /> : 'Resubmit'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Reject Status Dialog */}
        <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Reject Customs Clearance</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Rejection Reason"
                placeholder="Please provide a detailed reason for rejection..."
                required
                id="rejection-reason"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                const reason = (document.getElementById('rejection-reason') as HTMLInputElement)?.value;
                if (reason) {
                  handleStatusUpdate(CustomsClearanceStatus.REJECTED, 'Customs clearance rejected', reason);
                }
              }}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? <CircularProgress size={20} /> : 'Reject'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};
