import { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import { CloudUpload, Delete, Description, Download } from '@mui/icons-material';
import { CompanyDocument } from '@/types/company';

interface DocumentUploadProps {
  documents: CompanyDocument[];
  onUpload: (file: File, type: string) => Promise<void>;
  onDelete?: (documentId: string) => void;
  readOnly?: boolean;
  loading?: boolean;
}

export const DocumentUpload = ({
  documents,
  onUpload,
  onDelete,
  readOnly = false,
  loading = false,
}: DocumentUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      // In a real implementation, you would upload the file to a storage service
      // and get back a URL. For now, we'll use a placeholder URL.
      const fileType = file.name.split('.').pop()?.toLowerCase() || 'unknown';
      const documentType = getDocumentType(file.name);

      // Simulate file upload - replace with actual upload logic
      const fileUrl = URL.createObjectURL(file); // Placeholder - replace with actual upload

      await onUpload(file, documentType);
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const getDocumentType = (fileName: string): string => {
    const name = fileName.toLowerCase();
    if (name.includes('license') || name.includes('permit')) return 'License';
    if (name.includes('certificate')) return 'Certificate';
    if (name.includes('registration')) return 'Registration';
    if (name.includes('tax')) return 'Tax Document';
    return 'Other';
  };

  const handleDownload = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <Box>
      {!readOnly && (
        <Box sx={{ mb: 2 }}>
          <input
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            style={{ display: 'none' }}
            id="document-upload-button"
            type="file"
            onChange={handleFileSelect}
            disabled={uploading || loading}
          />
          <label htmlFor="document-upload-button">
            <Button
              variant="outlined"
              component="span"
              startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
              disabled={uploading || loading}
              fullWidth
            >
              {uploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </label>
          {error && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {error}
            </Alert>
          )}
        </Box>
      )}

      {documents.length > 0 ? (
        <Paper variant="outlined">
          <List>
            {documents.map((doc, index) => (
              <ListItem key={index}>
                <Description sx={{ mr: 2, color: 'text.secondary' }} />
                <ListItemText
                  primary={doc.type}
                  secondary={doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : ''}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleDownload(doc.url)}
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    <Download />
                  </IconButton>
                  {!readOnly && onDelete && (
                    <IconButton
                      edge="end"
                      onClick={() => onDelete(doc.url)}
                      size="small"
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      ) : (
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            textAlign: 'center',
            bgcolor: 'background.default',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            No documents uploaded
          </Typography>
        </Paper>
      )}
    </Box>
  );
};
