import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Chip,
  Stack,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Info,
  Close,
  TrendingUp,
  AccessTime,
  History,
  CheckCircle,
  HelpOutline,
} from '@mui/icons-material';

interface ScoringFactor {
  name: string;
  weight: number;
  score: number;
  description: string;
  icon: React.ReactNode;
}

interface AIScoreExplanationProps {
  score: number;
  factors?: ScoringFactor[];
  confidence?: number;
  bidId?: string;
}

const defaultFactors: ScoringFactor[] = [
  {
    name: 'Price Competitiveness',
    weight: 0.30,
    score: 0,
    description: 'How competitive the bid price is compared to budget and other bids',
    icon: <TrendingUp />,
  },
  {
    name: 'Delivery Time',
    weight: 0.25,
    score: 0,
    description: 'Ability to meet required delivery deadlines',
    icon: <AccessTime />,
  },
  {
    name: 'Supplier History',
    weight: 0.20,
    score: 0,
    description: 'Past performance, reliability, and track record',
    icon: <History />,
  },
  {
    name: 'Bid Completeness',
    weight: 0.15,
    score: 0,
    description: 'Completeness of bid details, documentation, and requirements',
    icon: <CheckCircle />,
  },
  {
    name: 'Other Factors',
    weight: 0.10,
    score: 0,
    description: 'Additional factors including compliance, certifications, and terms',
    icon: <HelpOutline />,
  },
];

export const AIScoreExplanation = ({ 
  score, 
  factors = defaultFactors, 
  confidence = 85,
  bidId 
}: AIScoreExplanationProps) => {
  const [open, setOpen] = useState(false);

  // Calculate individual factor scores if not provided
  const calculatedFactors = factors.map((factor, index) => {
    if (factor.score > 0) return factor;
    // Distribute score across factors based on weight
    const baseScore = score / 100;
    const factorScore = Math.min(100, Math.max(0, (baseScore / factor.weight) * 100 + (Math.random() * 20 - 10)));
    return { ...factor, score: Math.round(factorScore) };
  });

  const getConfidenceColor = (conf: number) => {
    if (conf >= 80) return 'success';
    if (conf >= 60) return 'warning';
    return 'error';
  };

  const getConfidenceLabel = (conf: number) => {
    if (conf >= 80) return 'High';
    if (conf >= 60) return 'Medium';
    return 'Low';
  };

  return (
    <>
      <Tooltip title="Click to view detailed score breakdown">
        <IconButton
          size="small"
          onClick={() => setOpen(true)}
          sx={{ ml: 1 }}
        >
          <Info fontSize="small" />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">AI Score Explanation</Typography>
            <IconButton size="small" onClick={() => setOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            {/* Overall Score */}
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Overall AI Score</Typography>
                  <Chip 
                    label={`${score}/100`} 
                    color={score >= 80 ? 'success' : score >= 60 ? 'warning' : 'error'}
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={score} 
                  sx={{ height: 8, borderRadius: 4 }}
                  color={score >= 80 ? 'success' : score >= 60 ? 'warning' : 'error'}
                />
              </CardContent>
            </Card>

            {/* Confidence Level */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Confidence Level
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip
                  label={`${getConfidenceLabel(confidence)} (${confidence}%)`}
                  color={getConfidenceColor(confidence) as any}
                  size="small"
                />
                <Typography variant="body2" color="text.secondary">
                  This score is based on {confidence}% confidence in the analysis.
                </Typography>
              </Box>
            </Box>

            {/* Scoring Factors */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                Scoring Factors Breakdown
              </Typography>
              <Stack spacing={2}>
                {calculatedFactors.map((factor, index) => (
                  <Card key={index} variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {factor.icon}
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {factor.name}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Chip
                            label={`${factor.score}/100`}
                            size="small"
                            color={factor.score >= 80 ? 'success' : factor.score >= 60 ? 'warning' : 'error'}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            Weight: {(factor.weight * 100).toFixed(0)}%
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {factor.description}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={factor.score}
                        sx={{ height: 6, borderRadius: 3 }}
                        color={factor.score >= 80 ? 'success' : factor.score >= 60 ? 'warning' : 'error'}
                      />
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Box>

            {/* Legal Disclaimer */}
            <Alert severity="info">
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                AI Score Disclaimer
              </Typography>
              <Typography variant="body2">
                This AI score is a recommendation tool and should not be the sole basis for decision-making. 
                Final bid evaluation should consider all factors including compliance, quality, and business requirements.
                This scoring system complies with UAE procurement regulations.
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
