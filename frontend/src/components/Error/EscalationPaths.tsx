import { Box, Typography, Paper, Stack, Button, Divider, Chip } from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  Support as SupportIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  AccountBalance as FinanceIcon,
  Gavel as LegalIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { ErrorType } from './ErrorStates';

interface EscalationContact {
  team: string;
  email: string;
  phone: string;
  icon: React.ReactNode;
  availability: string;
  priority: 'critical' | 'high' | 'normal';
}

interface EscalationPathsProps {
  errorType: ErrorType;
  context?: string;
  errorDetails?: string;
  showFullDetails?: boolean;
}

const escalationContacts: Record<string, EscalationContact> = {
  payment: {
    team: 'Finance Team',
    email: 'finance@trilink.ae',
    phone: '+971-4-XXX-XXXX',
    icon: <FinanceIcon />,
    availability: '24/7 for critical issues',
    priority: 'critical',
  },
  contract: {
    team: 'Legal Team',
    email: 'legal@trilink.ae',
    phone: '+971-4-XXX-XXXX',
    icon: <LegalIcon />,
    availability: 'Business hours (9 AM - 6 PM GST)',
    priority: 'high',
  },
  government: {
    team: 'Government Relations',
    email: 'government@trilink.ae',
    phone: '+971-4-XXX-XXXX',
    icon: <BusinessIcon />,
    availability: 'Business hours (9 AM - 6 PM GST)',
    priority: 'high',
  },
  security: {
    team: 'Security Team',
    email: 'security@trilink.ae',
    phone: '+971-4-XXX-XXXX',
    icon: <SecurityIcon />,
    availability: '24/7',
    priority: 'critical',
  },
  admin: {
    team: 'Administration',
    email: 'admin@trilink.ae',
    phone: '+971-4-XXX-XXXX',
    icon: <AdminIcon />,
    availability: 'Business hours (9 AM - 6 PM GST)',
    priority: 'normal',
  },
  default: {
    team: 'Support Team',
    email: 'support@trilink.ae',
    phone: '+971-4-XXX-XXXX',
    icon: <SupportIcon />,
    availability: '24/7',
    priority: 'normal',
  },
};

const getEscalationContact = (errorType: ErrorType, context?: string): EscalationContact => {
  const contextLower = context?.toLowerCase() || '';
  
  if (errorType === ErrorType.PAYMENT_FAILURE || contextLower.includes('payment') || contextLower.includes('finance')) {
    return escalationContacts.payment;
  }
  
  if (contextLower.includes('contract') || contextLower.includes('legal')) {
    return escalationContacts.contract;
  }
  
  if (contextLower.includes('government') || contextLower.includes('gov')) {
    return escalationContacts.government;
  }
  
  if (errorType === ErrorType.PERMISSION_ERROR || contextLower.includes('security') || contextLower.includes('access')) {
    return escalationContacts.security;
  }
  
  if (contextLower.includes('admin') || contextLower.includes('administrator')) {
    return escalationContacts.admin;
  }
  
  return escalationContacts.default;
};

export const EscalationPaths = ({
  errorType,
  context,
  errorDetails,
  showFullDetails = true,
}: EscalationPathsProps) => {
  const contact = getEscalationContact(errorType, context);
  const priorityColor = {
    critical: 'error',
    high: 'warning',
    normal: 'info',
  }[contact.priority];

  const handleEmail = () => {
    const subject = encodeURIComponent(`Support Request: ${context || errorType}`);
    const body = encodeURIComponent(
      `Error Type: ${errorType}\nContext: ${context || 'N/A'}\n\nError Details:\n${errorDetails || 'N/A'}\n\nTimestamp: ${new Date().toISOString()}`
    );
    window.open(`mailto:${contact.email}?subject=${subject}&body=${body}`, '_blank');
  };

  const handlePhone = () => {
    window.open(`tel:${contact.phone}`, '_self');
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: 'background.paper',
      }}
    >
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SupportIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Need Help?
          </Typography>
        </Box>

        <Divider />

        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            {contact.icon}
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {contact.team}
            </Typography>
            <Chip
              label={contact.priority.toUpperCase()}
              color={priorityColor as any}
              size="small"
            />
          </Stack>
          
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            {contact.availability}
          </Typography>

          <Stack spacing={1}>
            <Button
              variant="outlined"
              startIcon={<EmailIcon />}
              onClick={handleEmail}
              fullWidth
              sx={{ justifyContent: 'flex-start' }}
            >
              {contact.email}
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<PhoneIcon />}
              onClick={handlePhone}
              fullWidth
              sx={{ justifyContent: 'flex-start' }}
            >
              {contact.phone}
            </Button>
          </Stack>
        </Box>

        {showFullDetails && (
          <>
            <Divider />
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                <strong>Other Support Channels:</strong>
              </Typography>
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  • Live Chat: Available in-app (bottom right)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  • Help Center: help.trilink.ae
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  • Emergency Hotline: +971-4-XXX-XXXX (24/7)
                </Typography>
              </Stack>
            </Box>
          </>
        )}

        {errorDetails && showFullDetails && (
          <>
            <Divider />
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                <strong>Error Reference:</strong>
              </Typography>
              <Typography
                variant="caption"
                component="pre"
                sx={{
                  p: 1,
                  bgcolor: 'rgba(0, 0, 0, 0.05)',
                  borderRadius: 1,
                  fontSize: '0.75rem',
                  overflow: 'auto',
                  maxHeight: 100,
                }}
              >
                {errorDetails}
              </Typography>
            </Box>
          </>
        )}
      </Stack>
    </Paper>
  );
};
