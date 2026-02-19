import { Box, Typography, Button, Paper } from '@mui/material';
import { ReactNode } from 'react';

interface EmptyStateProps {
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: ReactNode;
  fullHeight?: boolean;
}

/**
 * Standardized Empty State Component
 * 
 * Displays when:
 * - No data is available
 * - Filtered results are empty
 * - Initial state (no items created yet)
 */
export const EmptyState = ({
  title,
  message,
  action,
  icon,
  fullHeight = false,
}: EmptyStateProps) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        textAlign: 'center',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        minHeight: fullHeight ? '400px' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {icon && (
        <Box sx={{ color: 'text.secondary', mb: 2, fontSize: 48 }}>
          {icon}
        </Box>
      )}

      {title && (
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
      )}

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 600 }}>
        {message}
      </Typography>

      {action && (
        <Button variant="contained" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Paper>
  );
};
