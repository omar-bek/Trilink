import React from 'react';
import {
  Box,
  FormControlLabel,
  Switch,
  Typography,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import { Security, Info } from '@mui/icons-material';

interface AnonymousToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  helperText?: string;
  showLegalWarning?: boolean;
  disabled?: boolean;
}

/**
 * AnonymousToggle Component
 * 
 * Provides explicit anonymity control with legal-safe language.
 * Designed for RFQ and Bid forms to enable/disable anonymity mode.
 */
export const AnonymousToggle: React.FC<AnonymousToggleProps> = ({
  value,
  onChange,
  label = 'Post as Anonymous',
  helperText,
  showLegalWarning = true,
  disabled = false,
}) => {
  return (
    <Card 
      variant="outlined" 
      sx={{ 
        p: 2, 
        bgcolor: value ? 'action.selected' : 'transparent',
        borderColor: value ? 'primary.main' : 'divider',
        transition: 'all 0.2s',
      }}
    >
      <FormControlLabel
        control={
          <Switch
            checked={value}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            color="primary"
          />
        }
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Security fontSize="small" color={value ? 'primary' : 'disabled'} />
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {label}
              </Typography>
              {helperText && (
                <Typography variant="body2" color="text.secondary">
                  {helperText}
                </Typography>
              )}
            </Box>
          </Box>
        }
        sx={{ width: '100%', m: 0 }}
      />

      {value && showLegalWarning && (
        <Alert 
          severity="warning" 
          icon={<Info />}
          sx={{ mt: 2 }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Legal Acknowledgment Required
          </Typography>
          <Typography variant="body2" component="div">
            By enabling anonymity mode, you acknowledge that:
            <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
              <li>Your identity will remain hidden from all parties until contract award</li>
              <li>Identity will be automatically revealed to the winning party upon contract creation</li>
              <li>This action is logged in the audit trail and cannot be reversed</li>
              <li>You agree to comply with UAE procurement regulations regarding anonymous transactions</li>
            </Box>
          </Typography>
        </Alert>
      )}
    </Card>
  );
};
