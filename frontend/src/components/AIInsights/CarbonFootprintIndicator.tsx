/**
 * Carbon Footprint Indicator
 * 
 * AI-driven environmental impact visualization
 * Sustainable trade insights
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
  LocalFlorist as Eco,
  TrendingDown,
  TrendingUp,
  Info,
  ExpandMore,
  ExpandLess,
  AutoAwesome,
} from '@mui/icons-material';
import { EnterpriseCard } from '@/components/common/EnterpriseCard';
import { designTokens } from '@/theme/designTokens';

const { colors, spacing, borders, typography } = designTokens;

export interface CarbonBreakdown {
  category: string;
  emissions: number; // kg CO2e
  percentage: number;
  description?: string;
}

export interface CarbonFootprint {
  totalEmissions: number; // kg CO2e
  emissionsPerUnit?: number; // kg CO2e per unit
  unit?: string;
  breakdown: CarbonBreakdown[];
  comparison?: {
    industryAverage: number;
    bestInClass: number;
    percentile: number; // 0-100
  };
  offsetCost?: number; // USD
  confidence: number; // 0-100
  lastUpdated: Date;
  recommendations?: string[];
}

interface CarbonFootprintIndicatorProps {
  footprint: CarbonFootprint;
  compact?: boolean;
  showOffset?: boolean;
  onDismiss?: () => void;
}

export const CarbonFootprintIndicator = ({
  footprint,
  compact = false,
  showOffset = true,
  onDismiss,
}: CarbonFootprintIndicatorProps) => {
  const [expanded, setExpanded] = useState(!compact);

  const isBetterThanAverage =
    footprint.comparison && footprint.totalEmissions < footprint.comparison.industryAverage;
  const isBestInClass =
    footprint.comparison && footprint.totalEmissions <= footprint.comparison.bestInClass;

  const getPerformanceLevel = (): 'excellent' | 'good' | 'average' | 'poor' => {
    if (!footprint.comparison) return 'average';
    if (footprint.comparison.percentile <= 25) return 'excellent';
    if (footprint.comparison.percentile <= 50) return 'good';
    if (footprint.comparison.percentile <= 75) return 'average';
    return 'poor';
  };

  const performanceLevel = getPerformanceLevel();

  const levelConfig = {
    excellent: {
      color: colors.semantic.success,
      label: 'Excellent',
      icon: Eco,
      bg: 'rgba(16, 185, 129, 0.1)',
    },
    good: {
      color: colors.intelligence.cerulean,
      label: 'Good',
      icon: TrendingDown,
      bg: 'rgba(0, 123, 167, 0.1)',
    },
    average: {
      color: colors.semantic.warning,
      label: 'Average',
      icon: TrendingUp,
      bg: 'rgba(245, 158, 11, 0.1)',
    },
    poor: {
      color: colors.semantic.error,
      label: 'Needs Improvement',
      icon: TrendingUp,
      bg: 'rgba(239, 68, 68, 0.1)',
    },
  };

  const config = levelConfig[performanceLevel];
  const StatusIcon = config.icon;

  const formatEmissions = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(2)} t CO₂e`;
    }
    return `${value.toFixed(2)} kg CO₂e`;
  };

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
              Carbon Footprint
            </Typography>
            <Chip
              label={config.label}
              size="small"
              icon={<StatusIcon sx={{ fontSize: 14 }} />}
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
              {/* Total Emissions */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: colors.base.neutral300, mb: 0.5 }}>
                  Total Emissions
                </Typography>
                <Typography variant="h4" sx={{ color: '#FFFFFF', fontWeight: typography.fontWeight.bold }}>
                  {formatEmissions(footprint.totalEmissions)}
                </Typography>
                {footprint.emissionsPerUnit && footprint.unit && (
                  <Typography variant="caption" sx={{ color: colors.base.neutral400 }}>
                    {formatEmissions(footprint.emissionsPerUnit)} per {footprint.unit}
                  </Typography>
                )}
              </Box>

              {/* Comparison */}
              {footprint.comparison && (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: colors.base.neutral300 }}>
                      vs Industry Average
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: isBetterThanAverage ? colors.semantic.success : colors.base.neutral200,
                        fontWeight: typography.fontWeight.semibold,
                      }}
                    >
                      {isBetterThanAverage ? '↓' : '↑'}{' '}
                      {Math.abs(
                        ((footprint.totalEmissions - footprint.comparison.industryAverage) /
                          footprint.comparison.industryAverage) *
                          100
                      ).toFixed(1)}
                      %
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={footprint.comparison.percentile}
                    sx={{
                      height: 8,
                      borderRadius: borders.radius.full,
                      backgroundColor: colors.base.neutral800,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: config.color,
                      },
                    }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant="caption" sx={{ color: colors.base.neutral500, fontSize: '10px' }}>
                      Best
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.base.neutral500, fontSize: '10px' }}>
                      Worst
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Offset Cost */}
              {showOffset && footprint.offsetCost && (
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: borders.radius.md,
                    backgroundColor: colors.base.blackPearlLighter,
                    border: `1px solid ${borders.color.default}`,
                    mb: 2,
                  }}
                >
                  <Typography variant="body2" sx={{ color: colors.base.neutral300, mb: 0.5 }}>
                    Estimated Offset Cost
                  </Typography>
                  <Typography variant="h6" sx={{ color: colors.intelligence.cerulean, fontWeight: typography.fontWeight.bold }}>
                    ${footprint.offsetCost.toFixed(2)}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Confidence Indicator */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: compact ? 1 : 2 }}>
            <Tooltip title={`AI confidence in this calculation: ${footprint.confidence}%`}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Info sx={{ fontSize: 14, color: colors.base.neutral400 }} />
                <Typography variant="caption" sx={{ color: colors.base.neutral400 }}>
                  {footprint.confidence}% confidence
                </Typography>
              </Box>
            </Tooltip>
            <Typography variant="caption" sx={{ color: colors.base.neutral500 }}>
              Updated {footprint.lastUpdated.toLocaleDateString()}
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

      {/* Expandable Breakdown */}
      <Collapse in={expanded}>
        <Divider sx={{ my: 2, borderColor: borders.color.default }} />
        <Box>
          <Typography variant="subtitle2" sx={{ color: colors.base.neutral200, fontWeight: 600, mb: 2 }}>
            Emissions Breakdown
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {footprint.breakdown.map((item, idx) => (
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
                    {item.category}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ color: colors.base.neutral200 }}>
                      {formatEmissions(item.emissions)}
                    </Typography>
                    <Chip
                      label={`${item.percentage.toFixed(0)}%`}
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
                  value={item.percentage}
                  sx={{
                    height: 4,
                    borderRadius: borders.radius.full,
                    backgroundColor: colors.base.neutral800,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: colors.semantic.success,
                    },
                  }}
                />
                {item.description && (
                  <Typography variant="caption" sx={{ color: colors.base.neutral400, mt: 0.5, display: 'block' }}>
                    {item.description}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>

          {footprint.recommendations && footprint.recommendations.length > 0 && (
            <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${borders.color.default}` }}>
              <Typography variant="subtitle2" sx={{ color: colors.base.neutral200, fontWeight: 600, mb: 1.5 }}>
                Reduction Recommendations
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                {footprint.recommendations.map((rec, idx) => (
                  <li key={idx}>
                    <Typography variant="body2" sx={{ color: colors.base.neutral300, lineHeight: 1.6 }}>
                      {rec}
                    </Typography>
                  </li>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Collapse>
    </EnterpriseCard>
  );
};
