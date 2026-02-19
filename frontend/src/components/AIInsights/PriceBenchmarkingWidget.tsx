/**
 * Price Benchmarking Widget
 * 
 * AI-driven price comparison with market intelligence
 * Assistive, trustworthy, explainable, non-intrusive
 */

import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Tooltip,
  IconButton,
  Collapse,
  Chip,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Info,
  ExpandMore,
  ExpandLess,
  AutoAwesome,
} from '@mui/icons-material';
import { EnterpriseCard } from '@/components/common/EnterpriseCard';
import { designTokens } from '@/theme/designTokens';

const { colors, spacing, borders, typography } = designTokens;

export interface PriceBenchmark {
  currentPrice: number;
  marketAverage: number;
  marketLow: number;
  marketHigh: number;
  percentile: number; // 0-100, where user's price sits
  confidence: number; // 0-100, AI confidence in benchmark
  dataPoints: number; // Number of comparable transactions
  lastUpdated: Date;
  explanation?: string;
  recommendations?: string[];
}

interface PriceBenchmarkingWidgetProps {
  benchmark: PriceBenchmark;
  currency?: string;
  compact?: boolean;
  onDismiss?: () => void;
}

export const PriceBenchmarkingWidget = ({
  benchmark,
  currency = 'USD',
  compact = false,
  onDismiss,
}: PriceBenchmarkingWidgetProps) => {
  const [expanded, setExpanded] = useState(!compact);
  const [showExplanation, setShowExplanation] = useState(false);

  const priceDiff = benchmark.currentPrice - benchmark.marketAverage;
  const priceDiffPercent = (priceDiff / benchmark.marketAverage) * 100;
  const isAboveAverage = priceDiff > 0;
  const isBelowAverage = priceDiff < 0;

  const getPriceStatus = (): 'high' | 'fair' | 'low' => {
    if (benchmark.percentile >= 75) return 'high';
    if (benchmark.percentile <= 25) return 'low';
    return 'fair';
  };

  const priceStatus = getPriceStatus();

  const statusConfig = {
    high: {
      color: colors.semantic.warning,
      label: 'Above Market',
      icon: TrendingUp,
      bg: 'rgba(245, 158, 11, 0.1)',
    },
    fair: {
      color: colors.semantic.success,
      label: 'Market Rate',
      icon: TrendingFlat,
      bg: 'rgba(16, 185, 129, 0.1)',
    },
    low: {
      color: colors.intelligence.cerulean,
      label: 'Below Market',
      icon: TrendingDown,
      bg: 'rgba(0, 123, 167, 0.1)',
    },
  };

  const config = statusConfig[priceStatus];
  const StatusIcon = config.icon;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
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
              Price Benchmark
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ color: colors.base.neutral300 }}>
                  Your Price
                </Typography>
                <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: typography.fontWeight.bold }}>
                  {formatCurrency(benchmark.currentPrice)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" sx={{ color: colors.base.neutral300 }}>
                  Market Average
                </Typography>
                <Typography variant="body1" sx={{ color: colors.base.neutral200 }}>
                  {formatCurrency(benchmark.marketAverage)}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: colors.base.neutral400 }}>
                    Market Range
                  </Typography>
                  <Typography variant="caption" sx={{ color: colors.base.neutral400 }}>
                    {formatCurrency(benchmark.marketLow)} - {formatCurrency(benchmark.marketHigh)}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={benchmark.percentile}
                  sx={{
                    height: 6,
                    borderRadius: borders.radius.full,
                    backgroundColor: colors.base.neutral800,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: config.color,
                    },
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="caption" sx={{ color: colors.base.neutral400, fontSize: '10px' }}>
                    Low
                  </Typography>
                  <Typography variant="caption" sx={{ color: colors.base.neutral400, fontSize: '10px' }}>
                    High
                  </Typography>
                </Box>
              </Box>

              {Math.abs(priceDiffPercent) > 1 && (
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
                    {isAboveAverage ? '↑' : '↓'} {Math.abs(priceDiffPercent).toFixed(1)}%{' '}
                    {isAboveAverage ? 'above' : 'below'} market average
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Confidence & Data Quality */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: compact ? 1 : 2 }}>
            <Tooltip
              title={`Based on ${benchmark.dataPoints} comparable transactions. Confidence: ${benchmark.confidence}%`}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Info sx={{ fontSize: 14, color: colors.base.neutral400 }} />
                <Typography variant="caption" sx={{ color: colors.base.neutral400 }}>
                  {benchmark.dataPoints} transactions • {benchmark.confidence}% confidence
                </Typography>
              </Box>
            </Tooltip>
            <Typography variant="caption" sx={{ color: colors.base.neutral500 }}>
              Updated {benchmark.lastUpdated.toLocaleDateString()}
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

      {/* Expandable Details */}
      <Collapse in={expanded}>
        <Divider sx={{ my: 2, borderColor: borders.color.default }} />
        <Box>
          {benchmark.explanation && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="subtitle2" sx={{ color: colors.base.neutral200, fontWeight: 600 }}>
                  Why this benchmark?
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setShowExplanation(!showExplanation)}
                  sx={{ color: colors.intelligence.cerulean, p: 0.5 }}
                >
                  <Info sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
              {showExplanation && (
                <Typography variant="body2" sx={{ color: colors.base.neutral300, lineHeight: 1.6 }}>
                  {benchmark.explanation}
                </Typography>
              )}
            </Box>
          )}

          {benchmark.recommendations && benchmark.recommendations.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ color: colors.base.neutral200, fontWeight: 600, mb: 1 }}>
                Recommendations
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                {benchmark.recommendations.map((rec, idx) => (
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
