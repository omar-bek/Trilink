import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  FormControlLabel,
  Chip,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Send,
  AttachMoney,
  Schedule,
  Warning,
  Description,
  CheckCircle,
} from '@mui/icons-material';
import { formatCurrency } from '@/utils';

interface RequiredDocument {
  id: string;
  name: string;
  provided: boolean;
}

interface ComplianceRisk {
  level: 'low' | 'medium' | 'high';
  description: string;
  mitigation: string;
}

export const SubmitClearanceBid = () => {
  const { rfqId } = useParams<{ rfqId: string }>();
  const navigate = useNavigate();

  const [serviceFee, setServiceFee] = useState<number>(0);
  const [estimatedTime, setEstimatedTime] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  // Mock data
  const requiredDocuments: RequiredDocument[] = [
    { id: '1', name: 'Commercial Invoice', provided: true },
    { id: '2', name: 'Packing List', provided: true },
    { id: '3', name: 'Certificate of Origin', provided: false },
    { id: '4', name: 'Bill of Lading', provided: false },
  ];

  const complianceRisks: ComplianceRisk[] = [
    {
      level: 'low',
      description: 'Standard documentation requirements',
      mitigation: 'All standard documents are available',
    },
    {
      level: 'medium',
      description: 'HS code verification may be required',
      mitigation: 'HS code has been verified and confirmed',
    },
  ];

  const handleSubmit = () => {
    // Handle bid submission
    console.log('Submitting clearance bid...', {
      rfqId,
      serviceFee,
      estimatedTime,
      notes,
    });
    // Navigate to bids list after submission
    navigate('/bids');
  };

  const getRiskColor = (level: string): 'success' | 'warning' | 'error' => {
    switch (level) {
      case 'low':
        return 'success';
      case 'medium':
        return 'warning';
      case 'high':
        return 'error';
      default:
        return 'success';
    }
  };

  const allDocumentsProvided = requiredDocuments.every((doc) => doc.provided);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/bids')} sx={{ color: '#87CEEB' }}>
          Back
        </Button>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#FFFFFF', mb: 0.5 }}>
            Submit Clearance Bid
          </Typography>
          <Typography variant="body2" sx={{ color: '#CBD5E1' }}>
            RFQ: {rfqId || 'N/A'}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Main Form */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3, backgroundColor: '#1E293B' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#FFFFFF', mb: 3 }}>
                Bid Details
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Service Fee (USD)"
                    type="number"
                    value={serviceFee || ''}
                    onChange={(e) => setServiceFee(parseFloat(e.target.value) || 0)}
                    fullWidth
                    InputProps={{
                      startAdornment: <AttachMoney sx={{ color: '#CBD5E1', mr: 1 }} />,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#0F172A',
                        color: '#F1F5F9',
                        '& fieldset': {
                          borderColor: 'rgba(135, 206, 235, 0.3)',
                        },
                        '&:hover fieldset': {
                          borderColor: '#87CEEB',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#4682B4',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#CBD5E1',
                        '&.Mui-focused': {
                          color: '#87CEEB',
                        },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Estimated Clearance Time (Days)"
                    type="number"
                    value={estimatedTime || ''}
                    onChange={(e) => setEstimatedTime(parseInt(e.target.value) || 0)}
                    fullWidth
                    InputProps={{
                      startAdornment: <Schedule sx={{ color: '#CBD5E1', mr: 1 }} />,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#0F172A',
                        color: '#F1F5F9',
                        '& fieldset': {
                          borderColor: 'rgba(135, 206, 235, 0.3)',
                        },
                        '&:hover fieldset': {
                          borderColor: '#87CEEB',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#4682B4',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#CBD5E1',
                        '&.Mui-focused': {
                          color: '#87CEEB',
                        },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Additional Notes"
                    multiline
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    fullWidth
                    placeholder="Add any additional information or special requirements..."
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#0F172A',
                        color: '#F1F5F9',
                        '& fieldset': {
                          borderColor: 'rgba(135, 206, 235, 0.3)',
                        },
                        '&:hover fieldset': {
                          borderColor: '#87CEEB',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#4682B4',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#CBD5E1',
                        '&.Mui-focused': {
                          color: '#87CEEB',
                        },
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Compliance Risks */}
          <Card sx={{ backgroundColor: '#1E293B' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Warning sx={{ color: '#f59e0b' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                  Compliance Risks
                </Typography>
              </Box>

              {complianceRisks.length === 0 ? (
                <Alert severity="success" sx={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                  No compliance risks identified. All requirements are met.
                </Alert>
              ) : (
                <List>
                  {complianceRisks.map((risk, index) => (
                    <Box key={index}>
                      <ListItem
                        sx={{
                          backgroundColor: 'rgba(51, 65, 85, 0.3)',
                          borderRadius: 1,
                          mb: 1,
                        }}
                      >
                        <ListItemIcon>
                          <Chip
                            label={risk.level.toUpperCase()}
                            size="small"
                            color={getRiskColor(risk.level)}
                            sx={{ textTransform: 'uppercase' }}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body1" sx={{ color: '#FFFFFF', fontWeight: 500 }}>
                              {risk.description}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body2" sx={{ color: '#CBD5E1', mt: 0.5 }}>
                              Mitigation: {risk.mitigation}
                            </Typography>
                          }
                        />
                      </ListItem>
                    </Box>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Required Documents */}
          <Card sx={{ mb: 3, backgroundColor: '#1E293B' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Description sx={{ color: '#87CEEB' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                  Required Documents
                </Typography>
              </Box>

              {!allDocumentsProvided && (
                <Alert severity="warning" sx={{ mb: 2, backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                  Some required documents are missing
                </Alert>
              )}

              <List>
                {requiredDocuments.map((doc) => (
                  <ListItem key={doc.id} sx={{ px: 0 }}>
                    <ListItemIcon>
                      {doc.provided ? (
                        <CheckCircle sx={{ color: '#10b981' }} />
                      ) : (
                        <Warning sx={{ color: '#f59e0b' }} />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ color: doc.provided ? '#FFFFFF' : '#CBD5E1' }}>
                          {doc.name}
                        </Typography>
                      }
                    />
                    <Chip
                      label={doc.provided ? 'Provided' : 'Missing'}
                      size="small"
                      color={doc.provided ? 'success' : 'warning'}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card sx={{ backgroundColor: '#1E293B' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#FFFFFF', mb: 2 }}>
                Bid Summary
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#CBD5E1' }}>
                    Service Fee
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                    {formatCurrency(serviceFee, 'USD')}
                  </Typography>
                </Box>

                <Divider sx={{ borderColor: 'rgba(135, 206, 235, 0.1)' }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#CBD5E1' }}>
                    Estimated Time
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                    {estimatedTime} day{estimatedTime !== 1 ? 's' : ''}
                  </Typography>
                </Box>

                <Divider sx={{ borderColor: 'rgba(135, 206, 235, 0.1)' }} />

                <Box
                  sx={{
                    p: 2,
                    backgroundColor: 'rgba(70, 130, 180, 0.1)',
                    borderRadius: 1,
                    border: '1px solid rgba(70, 130, 180, 0.3)',
                  }}
                >
                  <Typography variant="body2" sx={{ color: '#CBD5E1', mb: 1 }}>
                    Compliance Status
                  </Typography>
                  <Chip
                    label={allDocumentsProvided ? 'Compliant' : 'Review Required'}
                    color={allDocumentsProvided ? 'success' : 'warning'}
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              </Box>

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Save />}
                  onClick={() => navigate('/bids')}
                  sx={{
                    borderColor: '#4682B4',
                    color: '#87CEEB',
                    '&:hover': {
                      borderColor: '#87CEEB',
                      backgroundColor: 'rgba(70, 130, 180, 0.1)',
                    },
                  }}
                >
                  Save Draft
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<Send />}
                  onClick={handleSubmit}
                  disabled={!serviceFee || !estimatedTime || !allDocumentsProvided}
                  sx={{
                    backgroundColor: '#4682B4',
                    '&:hover': { backgroundColor: '#2563EB' },
                    '&:disabled': {
                      backgroundColor: 'rgba(70, 130, 180, 0.3)',
                      color: 'rgba(203, 213, 225, 0.5)',
                    },
                  }}
                >
                  Submit Bid
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
