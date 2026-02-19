import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  Button,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  HelpOutline,
  Code,
  Schedule,
  Psychology,
  VerifiedUser,
} from '@mui/icons-material';
import { useState } from 'react';
import { AIRecommendationModal } from './AIRecommendationModal';
import { RiskBadge, type RiskLevel } from './RiskBadge';
import { ConfidenceIndicator, type ConfidenceLevel } from './ConfidenceIndicator';
import { AIDisclaimer } from './AIDisclaimer';
import type { ScoreBreakdown } from './AIScoreBreakdown';
import { formatDateTime } from '@/utils';

interface AIExplanationSummaryProps {
  totalScore: number;
  breakdown: ScoreBreakdown;
  overallConfidence: ConfidenceLevel;
  overallRisk: RiskLevel;
  recommendation: string;
  timestamp?: Date | string;
  modelVersion?: string;
  variant?: 'compact' | 'standard' | 'detailed';
  showDisclaimer?: boolean;
  showModelInfo?: boolean;
}

/**
 * AI Explanation Summary Component
 * 
 * Provides a comprehensive, audit-safe summary of AI scoring decisions.
 * Displays all required elements for legal explainability:
 * - Total score with visual indicator
 * - Confidence level
 * - Risk assessment
 * - Model version disclosure
 * - Timestamp
 * - Quick access to full explanation
 * 
 * Used across BidList, BidDetails, BidComparison, and BidListItem.
 */
export const AIExplanationSummary = ({
  totalScore,
  breakdown,
  overallConfidence,
  overallRisk,
  recommendation,
  timestamp,
  modelVersion,
  variant = 'standard',
  showDisclaimer = false,
  showModelInfo = true,
}: AIExplanationSummaryProps) => {
  const [modalOpen, setModalOpen] = useState(false);

  const getScoreColor = (score: number): 'success' | 'warning' | 'error' => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const scoreColor = getScoreColor(totalScore);

  // Compact variant for list views
  if (variant === 'compact') {
    return (
      <>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Chip
            label={`${totalScore}/100`}
            color={scoreColor}
            size="small"
            sx={{ fontWeight: 600 }}
          />
          <ConfidenceIndicator level={overallConfidence} size="small" />
          <RiskBadge level={overallRisk} size="small" />
          <Tooltip title="View detailed AI explanation">
            <Button
              size="small"
              startIcon={<HelpOutline />}
              onClick={(e) => {
                e.stopPropagation();
                setModalOpen(true);
              }}
              sx={{ minWidth: 'auto', px: 1 }}
            >
              Why?
            </Button>
          </Tooltip>
        </Stack>

        <AIRecommendationModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          totalScore={totalScore}
          breakdown={breakdown}
          overallConfidence={overallConfidence}
          overallRisk={overallRisk}
          recommendation={recommendation}
          timestamp={timestamp instanceof Date ? timestamp : timestamp ? new Date(timestamp) : undefined}
          modelVersion={modelVersion}
        />
      </>
    );
  }

  // Standard variant for card displays
  if (variant === 'standard') {
    return (
      <>
        <Card variant="outlined" sx={{ bgcolor: 'background.paper' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                  AI Score
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: `${scoreColor}.main` }}>
                  {totalScore}
                  <Typography component="span" variant="h6" color="text.secondary" sx={{ ml: 0.5 }}>
                    /100
                  </Typography>
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<HelpOutline />}
                onClick={() => setModalOpen(true)}
              >
                Why This Score?
              </Button>
            </Box>

            <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap">
              <Box sx={{ flex: 1, minWidth: 120 }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Confidence
                </Typography>
                <ConfidenceIndicator level={overallConfidence} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 120 }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Risk
                </Typography>
                <RiskBadge level={overallRisk} />
              </Box>
            </Stack>

            {showModelInfo && (
              <>
                <Divider sx={{ my: 2 }} />
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  {modelVersion && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Code fontSize="small" color="primary" />
                      <Typography variant="caption" color="text.secondary">
                        Model: {modelVersion}
                      </Typography>
                    </Box>
                  )}
                  {timestamp && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Schedule fontSize="small" color="primary" />
                      <Typography variant="caption" color="text.secondary">
                        {timestamp instanceof Date
                          ? formatDateTime(timestamp)
                          : formatDateTime(new Date(timestamp))}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </>
            )}

            {showDisclaimer && (
              <>
                <Divider sx={{ my: 2 }} />
                <AIDisclaimer variant="compact" />
              </>
            )}
          </CardContent>
        </Card>

        <AIRecommendationModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          totalScore={totalScore}
          breakdown={breakdown}
          overallConfidence={overallConfidence}
          overallRisk={overallRisk}
          recommendation={recommendation}
          timestamp={timestamp instanceof Date ? timestamp : timestamp ? new Date(timestamp) : undefined}
          modelVersion={modelVersion}
        />
      </>
    );
  }

  // Detailed variant for full page displays
  return (
    <>
      <Card variant="outlined" sx={{ bgcolor: 'background.paper', mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Psychology color="primary" />
                AI Score Analysis & Explanation
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Fully explainable and audit-safe AI decision support
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<HelpOutline />}
              onClick={() => setModalOpen(true)}
            >
              Full Explanation
            </Button>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, color: `${scoreColor}.main`, mb: 1 }}>
              {totalScore}
              <Typography component="span" variant="h5" color="text.secondary" sx={{ ml: 0.5 }}>
                /100
              </Typography>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {recommendation}
            </Typography>
          </Box>

          <Stack direction="row" spacing={3} sx={{ mb: 3 }} flexWrap="wrap">
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                Confidence Level
              </Typography>
              <ConfidenceIndicator level={overallConfidence} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                Risk Assessment
              </Typography>
              <RiskBadge level={overallRisk} />
            </Box>
          </Stack>

          {showModelInfo && (
            <>
              <Divider sx={{ my: 3 }} />
              <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VerifiedUser fontSize="small" />
                  Model Transparency & Audit Information
                </Typography>
                <Stack direction="row" spacing={3} flexWrap="wrap" sx={{ mt: 1 }}>
                  {modelVersion && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        AI Model Version
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {modelVersion}
                      </Typography>
                    </Box>
                  )}
                  {timestamp && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Analysis Timestamp
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {timestamp instanceof Date
                          ? formatDateTime(timestamp)
                          : formatDateTime(new Date(timestamp))}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Box>
            </>
          )}

          {showDisclaimer && (
            <>
              <Divider sx={{ my: 3 }} />
              <AIDisclaimer />
            </>
          )}
        </CardContent>
      </Card>

      <AIRecommendationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        totalScore={totalScore}
        breakdown={breakdown}
        overallConfidence={overallConfidence}
        overallRisk={overallRisk}
        recommendation={recommendation}
        timestamp={timestamp instanceof Date ? timestamp : timestamp ? new Date(timestamp) : undefined}
        modelVersion={modelVersion}
      />
    </>
  );
};
