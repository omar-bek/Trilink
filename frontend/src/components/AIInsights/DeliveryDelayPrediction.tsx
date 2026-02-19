/**
 * Delivery Delay Prediction
 * 
 * AI-driven delivery timeline prediction with probability
 * Assistive insights for logistics planning
 */

import { useState } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Tooltip,
  IconButton,
  Collapse,
  Chip,
  Divider,
} from '@mui/material';
import {
  Schedule,
  Warning,
  CheckCircle,
  Info,
  ExpandMore,
  ExpandLess,
  AutoAwesome,
} from '@mui/icons-material';
import { EnterpriseCard } from '@/components/common/EnterpriseCard';
import { designTokens } from '@/theme/designTokens';

const { colors, spacing, borders, typography } = designTokens;

export interface DelayFactor {
  name: string;
  impact: 'low' | 'medium' | 'high';
  description: string;
  mitigation?: string;
}

export interface DeliveryPrediction {
  estimatedDelivery: Date;
  onTimeProbability: number; // 0-100
  delayProbability: number; // 0-100
  expectedDelayDays?: number;
  confidence: number; // 0-100
  factors: DelayFactor[];
  route?: {
    origin: string;
    destination: string;
    distance?: number;
  };
  lastUpdated: Date;
}

interface DeliveryDelayPredictionProps {
  prediction: DeliveryPrediction;
  scheduledDelivery?: Date;
  compact?: boolean;
  onDismiss?: () => void;
}

export const DeliveryDelayPrediction = ({
  prediction,
  scheduledDelivery,
  compact = false,
  onDismiss,
}: DeliveryDelayPredictionProps) => {
  const [expanded, setExpanded] = useState(!compact);

  const isDelayed = prediction.delayProbability > 50;
  const isOnTime = prediction.onTimeProbability > 70;

  const statusConfig = isDelayed
    ? {
        color: colors.semantic.warning,
        label: 'Delay Likely',
        icon: Warning,
        bg: 'rgba(245, 158, 11, 0.1)',
      }
    : isOnTime
      ? {
          color: colors.semantic.success,
          label: 'On Time',
          icon: CheckCircle,
          bg: 'rgba(16, 185, 129, 0.1)',
        }
      : {
          color: colors.intelligence.cerulean,
          label: 'Monitoring',
          icon: Schedule,
          bg: 'rgba(0, 123, 167, 0.1)',
        };

  const StatusIcon = statusConfig.icon;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUntil = (date: Date) => {
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntil = getDaysUntil(prediction.estimatedDelivery);

  return (
    <EnterpriseCard
      variant="default"
      dense={compact}
      sx={{
        borderLeft: `3px solid ${statusConfig.color}`,
        backgroundColor: colors.base.blackPearlLight,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <AutoAwesome sx={{ fontSize: 18, color: colors.intelligence.cerulean }} />
            <Typography variant="h6" sx={{ fontWeight: typography.fontWeight.semibold, color: '#FFFFFF' }}>
              Delivery Prediction
            </Typography>
            <Chip
              label={statusConfig.label}
              size="small"
              icon={<StatusIcon sx={{ fontSize: 14 }} />}
              sx={{
                height: 24,
                backgroundColor: statusConfig.bg,
                color: statusConfig.color,
                fontSize: typography.fontSize.bodyTiny,
                fontWeight: typography.fontWeight.medium,
              }}
            />
          </Box>

          {!compact && (
            <Box sx={{ mt: 2 }}>
              {/* Estimated Delivery */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: colors.base.neutral300, mb: 0.5 }}>
                  Estimated Delivery
                </Typography>
                <Typography variant="h5" sx={{ color: '#FFFFFF', fontWeight: typography.fontWeight.bold }}>
                  {formatDate(prediction.estimatedDelivery)}
                </Typography>
                {daysUntil >= 0 && (
                  <Typography variant="caption" sx={{ color: colors.base.neutral400 }}>
                    {daysUntil === 0 ? 'Today' : `${daysUntil} day${daysUntil !== 1 ? 's' : ''} away`}
                  </Typography>
                )}
                {scheduledDelivery && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" sx={{ color: colors.base.neutral400 }}>
                      Scheduled: {formatDate(scheduledDelivery)}
                    </Typography>
                    {prediction.expectedDelayDays && prediction.expectedDelayDays > 0 && (
                      <Typography
                        variant="caption"
                        sx={{ color: colors.semantic.warning, ml: 1 }}
                      >
                        (+{prediction.expectedDelayDays} days delay)
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>

              {/* Probability Indicators */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: colors.base.neutral300 }}>
                    On-Time Probability
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: isOnTime ? colors.semantic.success : colors.base.neutral200,
                      fontWeight: typography.fontWeight.semibold,
                    }}
                  >
                    {prediction.onTimeProbability.toFixed(0)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={prediction.onTimeProbability}
                  sx={{
                    height: 8,
                    borderRadius: borders.radius.full,
                    backgroundColor: colors.base.neutral800,
                    mb: 1.5,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: colors.semantic.success,
                    },
                  }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: colors.base.neutral300 }}>
                    Delay Probability
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: isDelayed ? colors.semantic.warning : colors.base.neutral200,
                      fontWeight: typography.fontWeight.semibold,
                    }}
                  >
                    {prediction.delayProbability.toFixed(0)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={prediction.delayProbability}
                  sx={{
                    height: 8,
                    borderRadius: borders.radius.full,
                    backgroundColor: colors.base.neutral800,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: colors.semantic.warning,
                    },
                  }}
                />
              </Box>

              {/* Route Info */}
              {prediction.route && (
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: borders.radius.md,
                    backgroundColor: colors.base.blackPearlLighter,
                    border: `1px solid ${borders.color.default}`,
                    mb: 2,
                  }}
                >
                  <Typography variant="caption" sx={{ color: colors.base.neutral400, display: 'block', mb: 0.5 }}>
                    Route
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.base.neutral200 }}>
                    {prediction.route.origin} → {prediction.route.destination}
                  </Typography>
                  {prediction.route.distance && (
                    <Typography variant="caption" sx={{ color: colors.base.neutral400 }}>
                      {prediction.route.distance.toLocaleString()} km
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          )}

          {/* Confidence Indicator */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: compact ? 1 : 2 }}>
            <Tooltip title={`AI confidence in this prediction: ${prediction.confidence}%`}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Info sx={{ fontSize: 14, color: colors.base.neutral400 }} />
                <Typography variant="caption" sx={{ color: colors.base.neutral400 }}>
                  {prediction.confidence}% confidence
                </Typography>
              </Box>
            </Tooltip>
            <Typography variant="caption" sx={{ color: colors.base.neutral500 }}>
              Updated {prediction.lastUpdated.toLocaleDateString()}
            </Typography>
          </Box>
        </Box>

        {!compact && (
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
            sx={{ color: colors.base.neutral300 }}
          >
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        )}
      </Box>

      {/* Delay Factors */}
      <Collapse in={expanded}>
        <Divider sx={{ my: 2, borderColor: borders.color.default }} />
        <Box>
          <Typography variant="subtitle2" sx={{ color: colors.base.neutral200, fontWeight: 600, mb: 2 }}>
            Risk Factors
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {prediction.factors.map((factor, idx) => {
              const impactColor =
                factor.impact === 'high'
                  ? colors.semantic.error
                  : factor.impact === 'medium'
                    ? colors.semantic.warning
                    : colors.semantic.success;

              return (
                <Box
                  key={idx}
                  sx={{
                    p: 1.5,
                    borderRadius: borders.radius.md,
                    backgroundColor: colors.base.blackPearlLighter,
                    border: `1px solid ${borders.color.default}`,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: typography.fontWeight.medium }}>
                      {factor.name}
                    </Typography>
                    <Chip
                      label={factor.impact.toUpperCase()}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '10px',
                        backgroundColor: `${impactColor}20`,
                        color: impactColor,
                        fontWeight: typography.fontWeight.medium,
                      }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ color: colors.base.neutral300, lineHeight: 1.5 }}>
                    {factor.description}
                  </Typography>
                  {factor.mitigation && (
                    <Box
                      sx={{
                        mt: 1,
                        pt: 1,
                        borderTop: `1px solid ${borders.color.default}`,
                      }}
                    >
                      <Typography variant="caption" sx={{ color: colors.intelligence.ceruleanLight }}>
                        💡 Mitigation: {factor.mitigation}
                      </Typography>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Collapse>
    </EnterpriseCard>
  );
};
