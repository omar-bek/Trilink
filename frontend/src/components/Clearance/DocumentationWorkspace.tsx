import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Button,
  Chip,
  Alert,
  Divider,
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  Description,
  Upload,
  Download,
  Verified,
  Warning,
} from '@mui/icons-material';

interface Document {
  id: string;
  name: string;
  type: string;
  status: 'required' | 'uploaded' | 'verified' | 'rejected';
  uploadedAt?: string;
  verifiedAt?: string;
  rejectionReason?: string;
}

interface ClearanceCase {
  id: string;
  rfqId: string;
  title: string;
  documents: Document[];
}

// Mock data
const mockCase: ClearanceCase = {
  id: '1',
  rfqId: 'RFQ-2024-001',
  title: 'Electronics Import Clearance',
  documents: [
    {
      id: '1',
      name: 'Commercial Invoice',
      type: 'invoice',
      status: 'verified',
      uploadedAt: '2024-01-15T10:00:00Z',
      verifiedAt: '2024-01-15T11:00:00Z',
    },
    {
      id: '2',
      name: 'Packing List',
      type: 'packing',
      status: 'uploaded',
      uploadedAt: '2024-01-15T10:30:00Z',
    },
    {
      id: '3',
      name: 'Certificate of Origin',
      type: 'certificate',
      status: 'required',
    },
    {
      id: '4',
      name: 'Bill of Lading',
      type: 'shipping',
      status: 'required',
    },
  ],
};

export const DocumentationWorkspace = () => {
  const [selectedCase] = useState<ClearanceCase>(mockCase);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());

  const handleDocumentToggle = (docId: string) => {
    const newSelected = new Set(selectedDocuments);
    if (newSelected.has(docId)) {
      newSelected.delete(docId);
    } else {
      newSelected.add(docId);
    }
    setSelectedDocuments(newSelected);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <Verified sx={{ color: '#10b981' }} />;
      case 'uploaded':
        return <CheckCircle sx={{ color: '#4682B4' }} />;
      case 'rejected':
        return <Warning sx={{ color: '#ef4444' }} />;
      default:
        return <RadioButtonUnchecked sx={{ color: '#CBD5E1' }} />;
    }
  };

  const getStatusColor = (status: string): 'success' | 'info' | 'error' | 'default' => {
    switch (status) {
      case 'verified':
        return 'success';
      case 'uploaded':
        return 'info';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const requiredCount = selectedCase.documents.filter((d) => d.status === 'required').length;
  const verifiedCount = selectedCase.documents.filter((d) => d.status === 'verified').length;
  const totalCount = selectedCase.documents.length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#FFFFFF', mb: 0.5 }}>
            Documentation Review Workspace
          </Typography>
          <Typography variant="body2" sx={{ color: '#CBD5E1' }}>
            {selectedCase.title} - {selectedCase.rfqId}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Upload />}
            sx={{ borderColor: '#4682B4', color: '#87CEEB' }}
          >
            Upload Documents
          </Button>
          <Button
            variant="contained"
            startIcon={<Verified />}
            sx={{ backgroundColor: '#4682B4', '&:hover': { backgroundColor: '#2563EB' } }}
            disabled={requiredCount > 0}
          >
            Verify All
          </Button>
        </Box>
      </Box>

      {/* Progress Summary */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: '#1E293B' }}>
            <CardContent>
              <Typography variant="body2" sx={{ color: '#CBD5E1', mb: 1 }}>
                Total Documents
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#FFFFFF' }}>
                {totalCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: '#1E293B' }}>
            <CardContent>
              <Typography variant="body2" sx={{ color: '#CBD5E1', mb: 1 }}>
                Verified
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#10b981' }}>
                {verifiedCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: '#1E293B' }}>
            <CardContent>
              <Typography variant="body2" sx={{ color: '#CBD5E1', mb: 1 }}>
                Pending
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#f59e0b' }}>
                {requiredCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Documents List */}
      <Card sx={{ backgroundColor: '#1E293B' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#FFFFFF', mb: 2 }}>
            Required Documents
          </Typography>

          {requiredCount > 0 && (
            <Alert severity="warning" sx={{ mb: 2, backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
              {requiredCount} document{requiredCount !== 1 ? 's' : ''} still required for clearance
            </Alert>
          )}

          <List>
            {selectedCase.documents.map((doc, index) => (
              <Box key={doc.id}>
                <ListItem
                  sx={{
                    backgroundColor:
                      doc.status === 'verified'
                        ? 'rgba(16, 185, 129, 0.1)'
                        : doc.status === 'rejected'
                        ? 'rgba(239, 68, 68, 0.1)'
                        : 'transparent',
                    borderRadius: 1,
                    mb: 1,
                    '&:hover': {
                      backgroundColor: 'rgba(51, 65, 85, 0.5)',
                    },
                  }}
                >
                  <ListItemIcon>
                    {getStatusIcon(doc.status)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" sx={{ color: '#FFFFFF', fontWeight: 500 }}>
                          {doc.name}
                        </Typography>
                        <Chip
                          label={doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                          size="small"
                          color={getStatusColor(doc.status)}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" sx={{ color: '#CBD5E1' }}>
                          Type: {doc.type}
                        </Typography>
                        {doc.uploadedAt && (
                          <Typography variant="caption" sx={{ color: '#CBD5E1', display: 'block' }}>
                            Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                          </Typography>
                        )}
                        {doc.verifiedAt && (
                          <Typography variant="caption" sx={{ color: '#10b981', display: 'block' }}>
                            Verified: {new Date(doc.verifiedAt).toLocaleDateString()}
                          </Typography>
                        )}
                        {doc.rejectionReason && (
                          <Typography variant="caption" sx={{ color: '#ef4444', display: 'block' }}>
                            Rejected: {doc.rejectionReason}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {doc.status === 'uploaded' && (
                      <Button
                        size="small"
                        startIcon={<Verified />}
                        sx={{ color: '#87CEEB' }}
                      >
                        Verify
                      </Button>
                    )}
                    {doc.status !== 'required' && (
                      <Button
                        size="small"
                        startIcon={<Download />}
                        sx={{ color: '#87CEEB' }}
                      >
                        Download
                      </Button>
                    )}
                  </Box>
                </ListItem>
                {index < selectedCase.documents.length - 1 && (
                  <Divider sx={{ borderColor: 'rgba(135, 206, 235, 0.1)' }} />
                )}
              </Box>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};
