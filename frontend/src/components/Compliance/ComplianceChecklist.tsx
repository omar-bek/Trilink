/**
 * Compliance Acceptance Checklist
 * Ensures all compliance requirements are met before platform usage
 */

import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Button,
  Alert,
  Stack,
  Divider,
  Chip,
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  VerifiedUser,
  Security,
  Assessment,
  Description,
} from '@mui/icons-material';

interface ComplianceItem {
  id: string;
  title: string;
  description: string;
  category: 'audit' | 'signature' | 'tax' | 'document' | 'general';
  required: boolean;
}

const complianceItems: ComplianceItem[] = [
  {
    id: 'audit-trail',
    title: 'Audit Trail Visibility',
    description: 'All platform activities are logged with cryptographic timestamping for legal compliance',
    category: 'audit',
    required: true,
  },
  {
    id: 'document-versioning',
    title: 'Document Versioning',
    description: 'All documents maintain complete version history with immutable audit trail',
    category: 'document',
    required: true,
  },
  {
    id: 'timestamping',
    title: 'Cryptographic Timestamping',
    description: 'All audit logs use RFC 3161-compliant cryptographic timestamping',
    category: 'audit',
    required: true,
  },
  {
    id: 'vat-compliance',
    title: 'VAT & Tax Compliance',
    description: 'UAE 5% VAT is automatically calculated and displayed on all payments',
    category: 'tax',
    required: true,
  },
  {
    id: 'pki-signatures',
    title: 'PKI Digital Signatures',
    description: 'All contracts use PKI-based digital signatures with certificate verification',
    category: 'signature',
    required: true,
  },
  {
    id: 'export-reports',
    title: 'Exportable Reports',
    description: 'Audit trails can be exported in PDF/Excel format for legal proceedings',
    category: 'audit',
    required: true,
  },
  {
    id: 'immutable-logs',
    title: 'Immutable Audit Logs',
    description: 'All audit logs are cryptographically protected and cannot be modified',
    category: 'audit',
    required: true,
  },
  {
    id: 'government-access',
    title: 'Government Audit Portal',
    description: 'Government users have dedicated portal for compliance monitoring',
    category: 'audit',
    required: true,
  },
];

interface ComplianceChecklistProps {
  onAccept?: () => void;
  readOnly?: boolean;
}

export const ComplianceChecklist = ({ onAccept, readOnly = false }: ComplianceChecklistProps) => {
  const [acceptedItems, setAcceptedItems] = useState<Set<string>>(new Set());

  const handleToggle = (itemId: string) => {
    if (readOnly) return;
    const newAccepted = new Set(acceptedItems);
    if (newAccepted.has(itemId)) {
      newAccepted.delete(itemId);
    } else {
      newAccepted.add(itemId);
    }
    setAcceptedItems(newAccepted);
  };

  const allRequiredAccepted = complianceItems
    .filter((item) => item.required)
    .every((item) => acceptedItems.has(item.id));

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'audit':
        return <Assessment />;
      case 'signature':
        return <VerifiedUser />;
      case 'tax':
        return <Description />;
      case 'document':
        return <Description />;
      default:
        return <Security />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'audit':
        return 'primary';
      case 'signature':
        return 'success';
      case 'tax':
        return 'warning';
      case 'document':
        return 'info';
      default:
        return 'default';
    }
  };

  const groupedItems = complianceItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ComplianceItem[]>);

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <Security color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Compliance Acceptance Checklist
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Please review and accept all compliance requirements. All items marked as required must be
            accepted to ensure legal compliance and court-defensibility of the platform.
          </Typography>
        </Alert>

        <Stack spacing={3}>
          {Object.entries(groupedItems).map(([category, items]) => (
            <Box key={category}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {getCategoryIcon(category)}
                <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                  {category === 'audit' ? 'Audit Trail' : category === 'signature' ? 'Digital Signatures' : category === 'tax' ? 'Tax Compliance' : 'Document Management'}
                </Typography>
                <Chip
                  label={`${items.filter((item) => acceptedItems.has(item.id)).length}/${items.length}`}
                  size="small"
                  color={getCategoryColor(category) as any}
                />
              </Box>

              <Stack spacing={2}>
                {items.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: acceptedItems.has(item.id) ? 'success.main' : 'divider',
                      borderRadius: 1,
                      bgcolor: acceptedItems.has(item.id) ? 'success.50' : 'background.paper',
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={acceptedItems.has(item.id)}
                          onChange={() => handleToggle(item.id)}
                          disabled={readOnly}
                          icon={<RadioButtonUnchecked />}
                          checkedIcon={<CheckCircle />}
                        />
                      }
                      label={
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {item.title}
                            </Typography>
                            {item.required && (
                              <Chip label="Required" size="small" color="error" />
                            )}
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {item.description}
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {acceptedItems.size} of {complianceItems.length} items accepted
            </Typography>
            {allRequiredAccepted && (
              <Alert severity="success" sx={{ mt: 1 }}>
                All required compliance items have been accepted.
              </Alert>
            )}
          </Box>
          {!readOnly && (
            <Button
              variant="contained"
              size="large"
              onClick={onAccept}
              disabled={!allRequiredAccepted}
              startIcon={<VerifiedUser />}
            >
              Accept Compliance Requirements
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
