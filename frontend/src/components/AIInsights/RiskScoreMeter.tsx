/**
 * Risk Score Meter
 * 
 * AI-driven risk assessment with explainable factors
 * Visual gauge with detailed breakdown
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

export interface RiskFactor {
  name: string;
  score: number; // 0-100, higher = more risk
  weight: number; // 0-1, importance in overall score
  explanation: string;
  recommendation?: string;
}

export interface RiskScore {
  overall: number; // 0-100, higher = more risk
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  confidence: number; // 0-100
  lastUpdated: Date;
  context?: string;
}

interface RiskScoreMeterProps {
  riskScore: RiskScore;
  compact?: boolean;
  showFactors?: boolean;
  onDismiss?: () => void;
}

export const RiskScoreMeter = ({
  riskScore,
  compact = false,
  showFactors = true,
  onDismiss,
}: RiskScoreMeterProps) => {
  const [expanded, setExpanded] = useState(!compact && showFactors);

  const levelConfig = {
    low: {
      color: colors.semantic.success,
      label: 'Low Risk',
      icon: CheckCircle,
      bg: 'rgba(16, 185, 129, 0.1)',
      threshold: 30,
    },
    medium: {
      color: colors.semantic.warning,
      label: 'Medium Risk',
      icon: Warning,
      bg: 'rgba(245, 158, 11, 0.1)',
      threshold: 60,
    },
    high: {
      color: colors.semantic.error,
      label: 'High Risk',
      icon: Warning,
      bg: 'rgba(239, 68, 68, 0.1)',
      threshold: 80,
    },
    critical: {
      color: colors.semantic.critical,
      label: 'Critical Risk',
      icon: Warning,
      bg: 'rgba(220, 38, 38, 0.15)',
      threshold: 100,
    },
  };

  const config = levelConfig[riskScore.level];
  const LevelIcon = config.icon;

  // Calculate weighted risk from factors
  const calculatedRisk = riskScore.factors.reduce(
    (sum, factor) => sum + factor.score * factor.weight,
    0
  );

  return (
    <EnterpriseCard
      variant="default"
      dense={compact}
      sx={{
        borderLeft: `3px solid ${config.color}`,
        backgroundColor: colors.base.blackPearlLight,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <AutoAwesome sx={{ fontSize: 18, color: colors.intelligence.cerulean }} />
            <Typography variant="h6" sx={{ fontWeight: typography.fontWeight.semibold, color: '#FFFFFF' }}>
              Risk Assessment
            </Typography>
            <Chip
              label={config.label}
              size="small"
              icon={<LevelIcon sx={{ fontSize: 14 }} />}
              sx={{
                height: 24,
                backgroundColor: config.bg,
                color: config.color,
                fontSize: typography.fontSize.bodyTiny,
                fontWeight: typography.fontWeight.medium,
              }}
            />
          </Box>

          {!compact && (
            <Box sx={{ mt: 2 }}>
              {/* Risk Score Gauge */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: colors.base.neutral300 }}>
                    Overall Risk Score
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      color: config.color,
                      fontWeight: typography.fontWeight.bold,
                    }}
                  >
                    {riskScore.overall.toFixed(0)}
                    <Typography
                      component="span"
                      variant="body2"
                      sx={{ color: colors.base.neutral400, ml: 0.5 }}
                    >
                      /100
                    </Typography>
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={riskScore.overall}
                  sx={{
                    height: 10,
                    borderRadius: borders.radius.full,
                    backgroundColor: colors.base.neutral800,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: config.color,
                      borderRadius: borders.radius.full,
                    },
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="caption" sx={{ color: colors.base.neutral500, fontSize: '10px' }}>
                    Low
                  </Typography>
                  <Typography variant="caption" sx={{ color: colors.base.neutral500, fontSize: '10px' }}>
                    Critical
                  </Typography>
                </Box>
              </Box>

              {/* Risk Level Indicator */}
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: borders.radius.md,
                  backgroundColor: config.bg,
                  border: `1px solid ${config.color}40`,
                  mb: 2,
                }}
              >
                <Typography variant="body2" sx={{ color: config.color, fontWeight: typography.fontWeight.medium }}>
                  {riskScore.context || `This transaction shows ${config.label.toLowerCase()} indicators.`}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Confidence Indicator */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: compact ? 1 : 2 }}>
            <Tooltip title={`AI confidence in this assessment: ${riskScore.confidence}%`}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Info sx={{ fontSize: 14, color: colors.base.neutral400 }} />
                <Typography variant="caption" sx={{ color: colors.base.neutral400 }}>
                  {riskScore.confidence}% confidence
                </Typography>
              </Box>
            </Tooltip>
            <Typography variant="caption" sx={{ color: colors.base.neutral500 }}>
              Updated {riskScore.lastUpdated.toLocaleDateString()}
            </Typography>
          </Box>
        </Box>

        {!compact && showFactors && (
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
            sx={{ color: colors.base.neutral300 }}
          >
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        )}
      </Box>

      {/* Risk Factors Breakdown */}
      {showFactors && (
        <Collapse in={expanded}>
          <Divider sx={{ my: 2, borderColor: borders.color.default }} />
          <Box>
            <Typography variant="subtitle2" sx={{ color: colors.base.neutral200, fontWeight: 600, mb: 2 }}>
              Risk Factors
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {riskScore.factors
                .sort((a, b) => b.weight - a.weight)
                .map((factor, idx) => {
                  const factorLevel =
                    factor.score >= 70 ? 'high' : factor.score >= 40 ? 'medium' : 'low';
                  const factorColor =
                    factorLevel === 'high'
                      ? colors.semantic.error
                      : factorLevel === 'medium'
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
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: typography.fontWeight.medium }}>
                          {factor.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="caption"
                            sx={{ color: factorColor, fontWeight: typography.fontWeight.semibold }}
                          >
                            {factor.score.toFixed(0)}
                          </Typography>
                          <Chip
                            label={`${(factor.weight * 100).toFixed(0)}% weight`}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '10px',
                              backgroundColor: colors.base.neutral800,
                              color: colors.base.neutral300,
                            }}
                          />
                        </Box>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={factor.score}
                        sx={{
                          height: 4,
                          borderRadius: borders.radius.full,
                          backgroundColor: colors.base.neutral800,
                          mb: 1,
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: factorColor,
                          },
                        }}
                      />
                      <Typography variant="caption" sx={{ color: colors.base.neutral300, lineHeight: 1.5 }}>
                        {factor.explanation}
                      </Typography>
                      {factor.recommendation && (
                        <Box
                          sx={{
                            mt: 1,
                            pt: 1,
                            borderTop: `1px solid ${borders.color.default}`,
                          }}
                        >
                          <Typography variant="caption" sx={{ color: colors.intelligence.ceruleanLight }}>
                            💡 {factor.recommendation}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  );
                })}
            </Box>
          </Box>
        </Collapse>
      )}
    </EnterpriseCard>
  );
};
