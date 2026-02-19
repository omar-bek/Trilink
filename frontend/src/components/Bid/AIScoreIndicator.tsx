import { Box, Typography, LinearProgress, Tooltip, IconButton, Stack, Chip } from '@mui/material';
import { AutoAwesome, HelpOutline, Code, Schedule } from '@mui/icons-material';
import { useState } from 'react';
import { AIRecommendationModal } from './AIRecommendationModal';
import { RiskBadge } from './RiskBadge';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import type { ScoreBreakdown } from './AIScoreBreakdown';
import type { RiskLevel } from './RiskBadge';
import type { ConfidenceLevel } from './ConfidenceIndicator';

interface AIScoreIndicatorProps {
  score?: number;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
  aiMetadata?: {
    totalScore: number;
    breakdown: ScoreBreakdown;
    overallConfidence: ConfidenceLevel;
    overallRisk: RiskLevel;
    recommendation: string;
    timestamp?: Date;
    modelVersion?: string;
  };
}

export const AIScoreIndicator = ({
  score,
  showLabel = true,
  size = 'medium',
  aiMetadata,
}: AIScoreIndicatorProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const displayScore = score ?? aiMetadata?.totalScore;

  if (displayScore === undefined || displayScore === null) {
    return null;
  }

  const getScoreColor = (score: number): 'success' | 'warning' | 'error' => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Improvement';
  };

  const sizeConfig = {
    small: { iconSize: 16, fontSize: '0.75rem' },
    medium: { iconSize: 20, fontSize: '0.875rem' },
    large: { iconSize: 24, fontSize: '1rem' },
  };

  const config = sizeConfig[size];

  return (
    <>
      <Tooltip title={`AI Score: ${displayScore}/100 - ${getScoreLabel(displayScore)}${aiMetadata ? '. Click for details.' : ''}`}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <AutoAwesome sx={{ fontSize: config.iconSize, color: `${getScoreColor(displayScore)}.main` }} />
          {showLabel && (
            <Box sx={{ flex: 1, minWidth: 100 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" sx={{ fontSize: config.fontSize, fontWeight: 500 }}>
                  AI Score
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ fontSize: config.fontSize, fontWeight: 600 }}
                  color={`${getScoreColor(displayScore)}.main`}
                >
                  {displayScore}/100
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={displayScore}
                color={getScoreColor(displayScore)}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
          )}
          {!showLabel && (
            <Typography
              variant="body2"
              sx={{ fontWeight: 600 }}
              color={`${getScoreColor(displayScore)}.main`}
            >
              {displayScore}
            </Typography>
          )}
          {/* Confidence & Risk Badges - Always visible when metadata available */}
          {aiMetadata && showLabel && (
            <Stack direction="row" spacing={0.5} sx={{ ml: 0.5 }} flexWrap="wrap">
              <ConfidenceIndicator level={aiMetadata.overallConfidence} size="small" />
              <RiskBadge level={aiMetadata.overallRisk} size="small" />
            </Stack>
          )}
          {aiMetadata && (
            <Tooltip title="View detailed AI explanation (Why this score?)">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setModalOpen(true);
                }}
                sx={{ ml: 0.5 }}
                aria-label="View AI score explanation"
              >
                <HelpOutline fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Tooltip>

      {aiMetadata && (
        <AIRecommendationModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          totalScore={aiMetadata.totalScore}
          breakdown={aiMetadata.breakdown}
          overallConfidence={aiMetadata.overallConfidence}
          overallRisk={aiMetadata.overallRisk}
          recommendation={aiMetadata.recommendation}
          timestamp={aiMetadata.timestamp}
          modelVersion={aiMetadata.modelVersion}
        />
      )}
    </>
  );
};
