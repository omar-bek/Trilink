import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Checkbox,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Warning,
  Security,
  CheckCircle,
  Gavel,
} from '@mui/icons-material';

interface IdentityRevealModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  resourceType: 'RFQ' | 'Bid';
  resourceTitle: string;
  isPending?: boolean;
}

/**
 * IdentityRevealModal Component
 * 
 * Legal-safe identity reveal confirmation modal.
 * Requires explicit acknowledgment before revealing anonymous identity.
 * Designed for national legal scrutiny compliance.
 */
export const IdentityRevealModal: React.FC<IdentityRevealModalProps> = ({
  open,
  onClose,
  onConfirm,
  resourceType,
  resourceTitle,
  isPending = false,
}) => {
  const [acknowledged, setAcknowledged] = useState(false);
  const [understood, setUnderstood] = useState(false);

  const handleConfirm = () => {
    if (acknowledged && understood) {
      onConfirm();
      // Reset state for next use
      setAcknowledged(false);
      setUnderstood(false);
    }
  };

  const handleClose = () => {
    setAcknowledged(false);
    setUnderstood(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Security color="warning" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Reveal Identity - Legal Confirmation Required
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="warning" icon={<Warning />} sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Irreversible Action
          </Typography>
          <Typography variant="body2">
            Revealing the identity of an anonymous {resourceType.toLowerCase()} is a permanent action 
            that cannot be undone. This action will be logged in the audit trail and may be subject 
            to regulatory review.
          </Typography>
        </Alert>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Resource Details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Type:</strong> {resourceType}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Title:</strong> {resourceTitle}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Legal Implications
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <Gavel fontSize="small" color="warning" />
              </ListItemIcon>
              <ListItemText
                primary="Regulatory Compliance"
                secondary="This action must comply with UAE Federal Law No. 2 of 2015 on Commercial Companies and related procurement regulations."
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Security fontSize="small" color="warning" />
              </ListItemIcon>
              <ListItemText
                primary="Audit Trail"
                secondary="All identity reveal actions are permanently logged with timestamp, user identity, and IP address for regulatory compliance."
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle fontSize="small" color="warning" />
              </ListItemIcon>
              <ListItemText
                primary="Irreversible Disclosure"
                secondary="Once identity is revealed, it cannot be re-anonymized. All parties with access will see the identity immediately."
              />
            </ListItem>
          </List>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Note:</strong> Identity reveals are typically performed automatically upon contract 
            award. Manual reveals should only be performed when legally required or with proper 
            authorization.
          </Typography>
        </Alert>

        <Box sx={{ mt: 3 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                color="warning"
              />
            }
            label={
              <Typography variant="body2">
                I acknowledge that this action is <strong>irreversible</strong> and will permanently 
                reveal the identity of this anonymous {resourceType.toLowerCase()}.
              </Typography>
            }
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={understood}
                onChange={(e) => setUnderstood(e.target.checked)}
                color="warning"
              />
            }
            label={
              <Typography variant="body2">
                I understand the <strong>legal implications</strong> and confirm that I have proper 
                authorization to perform this action in compliance with UAE procurement regulations.
              </Typography>
            }
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="warning"
          disabled={!acknowledged || !understood || isPending}
          startIcon={<Security />}
        >
          {isPending ? 'Revealing...' : 'Confirm Identity Reveal'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
