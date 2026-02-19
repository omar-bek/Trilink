import { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  Alert,
} from '@mui/material';
import {
  AttachFile,
  Delete,
  CloudUpload,
} from '@mui/icons-material';
import { DisputeAttachment } from '@/types/dispute';

interface AttachmentUploadProps {
  attachments: DisputeAttachment[];
  onChange: (attachments: DisputeAttachment[]) => void;
  maxFiles?: number;
}

export const AttachmentUpload = ({
  attachments,
  onChange,
  maxFiles = 10,
}: AttachmentUploadProps) => {
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (attachments.length + files.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const newAttachments: DisputeAttachment[] = [];

    Array.from(files).forEach((file) => {
      // In a real implementation, you would upload the file to a storage service
      // and get back a URL. For now, we'll create a placeholder URL.
      const reader = new FileReader();
      reader.onload = () => {
        const attachment: DisputeAttachment = {
          type: file.type || 'application/octet-stream',
          url: URL.createObjectURL(file), // Placeholder - replace with actual upload URL
          uploadedAt: new Date().toISOString(),
        };
        newAttachments.push(attachment);
        
        if (newAttachments.length === files.length) {
          onChange([...attachments, ...newAttachments]);
          setError(null);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemove = (index: number) => {
    const updated = attachments.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <input
          accept="*/*"
          style={{ display: 'none' }}
          id="attachment-upload"
          multiple
          type="file"
          onChange={handleFileSelect}
        />
        <label htmlFor="attachment-upload">
          <Button
            variant="outlined"
            component="span"
            startIcon={<CloudUpload />}
            disabled={attachments.length >= maxFiles}
          >
            Upload Attachments
          </Button>
        </label>
        <Typography variant="body2" color="text.secondary">
          {attachments.length}/{maxFiles} files
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {attachments.length > 0 && (
        <Paper variant="outlined" sx={{ p: 1 }}>
          <List dense>
            {attachments.map((attachment, index) => (
              <ListItem key={index}>
                <AttachFile fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <ListItemText
                  primary={attachment.type.split('/')[1] || 'File'}
                  secondary={attachment.url}
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" size="small" onClick={() => handleRemove(index)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};
