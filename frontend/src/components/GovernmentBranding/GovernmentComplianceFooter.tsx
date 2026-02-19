import { Box, Typography, Link, Divider, Stack } from '@mui/material';
import { UAEGovernmentFlag } from './UAEGovernmentFlag';
import { UAEGovernmentBadge } from './UAEGovernmentBadge';

/**
 * Government Compliance Footer Component
 * 
 * Professional footer displaying government authority, compliance information,
 * and official platform status. Maintains enterprise aesthetic.
 */
export const GovernmentComplianceFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        pt: 4,
        pb: 3,
        px: 3,
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        backgroundColor: 'transparent',
      }}
    >
      <Stack spacing={2}>
        {/* Government Authority Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <UAEGovernmentFlag size="small" />
            <Typography variant="body2" sx={{ color: '#CBD5E1', fontWeight: 500 }}>
              United Arab Emirates
            </Typography>
          </Box>
          <UAEGovernmentBadge variant="official" size="small" />
        </Box>

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Compliance Information */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="caption" sx={{ color: '#94A3B8', lineHeight: 1.6 }}>
            TriLink is the official digital trade and procurement platform of the United Arab Emirates.
            All transactions are subject to UAE federal laws and regulations.
          </Typography>
          <Typography variant="caption" sx={{ color: '#94A3B8', lineHeight: 1.6 }}>
            This platform complies with UAE data protection regulations and government security standards.
          </Typography>
        </Box>

        {/* Links Section */}
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Link
            href="#"
            onClick={(e) => {
              e.preventDefault();
              // Navigate to terms or open modal
            }}
            sx={{
              color: '#94A3B8',
              fontSize: '0.75rem',
              textDecoration: 'none',
              '&:hover': {
                color: '#CBD5E1',
                textDecoration: 'underline',
              },
            }}
          >
            Terms of Service
          </Link>
          <Link
            href="#"
            onClick={(e) => {
              e.preventDefault();
              // Navigate to privacy or open modal
            }}
            sx={{
              color: '#94A3B8',
              fontSize: '0.75rem',
              textDecoration: 'none',
              '&:hover': {
                color: '#CBD5E1',
                textDecoration: 'underline',
              },
            }}
          >
            Privacy Policy
          </Link>
          <Link
            href="#"
            onClick={(e) => {
              e.preventDefault();
              // Navigate to compliance or open modal
            }}
            sx={{
              color: '#94A3B8',
              fontSize: '0.75rem',
              textDecoration: 'none',
              '&:hover': {
                color: '#CBD5E1',
                textDecoration: 'underline',
              },
            }}
          >
            Compliance Information
          </Link>
        </Box>

        {/* Copyright */}
        <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.7rem' }}>
          © {currentYear} TriLink - UAE Government Digital Platform. All rights reserved.
        </Typography>
      </Stack>
    </Box>
  );
};
