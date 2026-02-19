import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  Divider,
  Chip,
  Stack,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { Close, HelpOutline, Info, Psychology, Code, Schedule } from '@mui/icons-material';
import { AIScoreBreakdown, type ScoreBreakdown } from './AIScoreBreakdown';
import { AIDisclaimer } from './AIDisclaimer';
import { RiskBadge } from './RiskBadge';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import type { RiskLevel } from './RiskBadge';
import type { ConfidenceLevel } from './ConfidenceIndicator';

interface AIRecommendationModalProps {
  open: boolean;
  onClose: () => void;
  totalScore: number;
  breakdown: ScoreBreakdown;
  overallConfidence: ConfidenceLevel;
  overallRisk: RiskLevel;
  recommendation: string;
  timestamp?: Date;
  modelVersion?: string;
}

export const AIRecommendationModal = ({
  open,
  onClose,
  totalScore,
  breakdown,
  overallConfidence,
  overallRisk,
  recommendation,
  timestamp,
  modelVersion,
}: AIRecommendationModalProps) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HelpOutline color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Why This Score? - AI Explainability Report
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose} aria-label="Close">
            <Close />
          </IconButton>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Complete audit-safe explanation of AI scoring decision. All factors, confidence levels, and risk assessments are documented for legal review.
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          {/* Header with Overall Score, Confidence, and Risk */}
          <Card variant="outlined" sx={{ mb: 3, bgcolor: 'background.paper' }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Overall AI Score
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                    {totalScore}
                    <Typography component="span" variant="h6" color="text.secondary" sx={{ ml: 0.5 }}>
                      /100
                    </Typography>
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                    Confidence Level
                  </Typography>
                  <ConfidenceIndicator level={overallConfidence} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                    Risk Assessment
                  </Typography>
                  <RiskBadge level={overallRisk} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Recommendation Summary */}
          <Alert severity="info" icon={<Psychology />} sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              AI Recommendation
            </Typography>
            <Typography variant="body2">{recommendation}</Typography>
          </Alert>

          {/* Model Version & Timestamp - Prominent Display */}
          <Card variant="outlined" sx={{ mb: 3, bgcolor: 'action.hover' }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                {modelVersion && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Code fontSize="small" color="primary" />
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        AI Model Version
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {modelVersion}
                      </Typography>
                    </Box>
                  </Box>
                )}
                {timestamp && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Schedule fontSize="small" color="primary" />
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Analysis Timestamp
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {new Date(timestamp).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZoneName: 'short',
                        })}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Score Breakdown */}
          <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
            Detailed Score Breakdown
          </Typography>
          <AIScoreBreakdown
            totalScore={totalScore}
            breakdown={breakdown}
            overallConfidence={overallConfidence}
            overallRisk={overallRisk}
          />

          <Divider sx={{ my: 3 }} />

          {/* Legal Disclaimer */}
          <AIDisclaimer />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
