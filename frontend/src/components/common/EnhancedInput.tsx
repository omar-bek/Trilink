/**
 * Enhanced Input Component
 * 
 * A polished input component with:
 * - Better styling
 * - Icon support
 * - Error states
 * - Helper text
 */

import { TextField, TextFieldProps, InputAdornment, Box } from '@mui/material';
import { ReactNode } from 'react';

export interface EnhancedInputProps extends Omit<TextFieldProps, 'helperText'> {
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  helperText?: string;
  error?: boolean;
}

export const EnhancedInput = ({
  startIcon,
  endIcon,
  helperText,
  error,
  sx,
  ...props
}: EnhancedInputProps) => {
  return (
    <TextField
      {...props}
      error={error}
      helperText={helperText}
      InputProps={{
        startAdornment: startIcon ? (
          <InputAdornment position="start">
            <Box sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
              {startIcon}
            </Box>
          </InputAdornment>
        ) : undefined,
        endAdornment: endIcon ? (
          <InputAdornment position="end">
            <Box sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
              {endIcon}
            </Box>
          </InputAdornment>
        ) : undefined,
        ...props.InputProps,
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 2,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'primary.main',
            },
          },
          '&.Mui-focused': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderWidth: 2,
            },
          },
        },
        ...sx,
      }}
    />
  );
};
