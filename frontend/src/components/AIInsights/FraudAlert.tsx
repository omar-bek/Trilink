/**
 * Fraud Alert Component
 * 
 * AI-driven fraud detection alerts
 * Non-intrusive but actionable warnings
 */

import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Collapse,
  Chip,
  Divider,
  Alert,
} from '@mui/material';
import {
  Security,
  Warning,
  Close,
  ExpandMore,
  ExpandLess,
  AutoAwesome,
  CheckCircle,
} from '@mui/icons-material';
import { EnterpriseCard } from '@/components/common/EnterpriseCard';
import { designTokens } from '@/theme/designTokens';

const { colors, spacing, borders, typography } = designTokens;

export interface FraudIndicator {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence?: string[];
  recommendation: string;
}

export interface FraudAlert {
  level: 'low' | 'medium' | 'high' | 'critical';
  score: number; // 0-100
  indicators: FraudIndicator[];
  confidence: number; // 0-100
  transactionId?: string;
  timestamp: Date;
  actionable: boolean;
  actions?: {
    label: string;
    onClick: () => void;
    variant?: 'contained' | 'outlined';
  }[];
}

interface FraudAlertProps {
  alert: FraudAlert;
  compact?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
  onAction?: (action: string) => void;
}

export const FraudAlert = ({
  alert,
  compact = false,
  dismissible = true,
  onDismiss,
  onAction,
}: FraudAlertProps) => {
  const [expanded, setExpanded] = useState(!compact);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const levelConfig = {
    low: {
      color: colors.intelligence.cerulean,
      label: 'Low Risk',
      icon: Security,
      bg: 'rgba(0, 123, 167, 0.1)',
      alertSeverity: 'info' as const,
    },
    medium: {
      color: colors.semantic.warning,
      label: 'Medium Risk',
      icon: Warning,
      bg: 'rgba(245, 158, 11, 0.1)',
      alertSeverity: 'warning' as const,
    },
    high: {
      color: colors.semantic.error,
      label: 'High Risk',
      icon: Warning,
      bg: 'rgba(239, 68, 68, 0.1)',
      alertSeverity: 'error' as const,
    },
    critical: {
      color: colors.semantic.critical,
      label: 'Critical Risk',
      icon: Warning,
      bg: 'rgba(220, 38, 38, 0.15)',
      alertSeverity: 'error' as const,
    },
  };

  const config = levelConfig[alert.level];
  const AlertIcon = config.icon;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  // For critical/high alerts, show more prominently
  if (alert.level === 'critical' || alert.level === 'high') {
    return (
      <Alert
        severity={config.alertSeverity}
        icon={<AlertIcon />}
        action={
          dismissible ? (
            <IconButton size="small" onClick={handleDismiss} sx={{ color: 'inherit' }}>
              <Close />
            </IconButton>
          ) : null
        }
        sx={{
          mb: 2,
          backgroundColor: config.bg,
          border: `2px solid ${config.color}`,
          '& .MuiAlert-icon': {
            color: config.color,
          },
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <AutoAwesome sx={{ fontSize: 16, color: colors.intelligence.cerulean }} />
            <Typography variant="subtitle1" sx={{ fontWeight: typography.fontWeight.bold }}>
              Fraud Alert: {config.label}
            </Typography>
            <Chip
              label={`${alert.score}/100`}
              size="small"
              sx={{
                height: 20,
                backgroundColor: config.color,
                color: '#FFFFFF',
                fontSize: '10px',
                fontWeight: typography.fontWeight.bold,
              }}
            />
          </Box>
          <Typography variant="body2" sx={{ mb: alert.indicators.length > 0 ? 1 : 0 }}>
            {alert.indicators[0]?.description || 'Suspicious activity detected'}
          </Typography>
          {alert.actionable && alert.actions && alert.actions.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
              {alert.actions.map((action, idx) => (
                <Button
                  key={idx}
                  size="small"
                  variant={action.variant || 'outlined'}
                  onClick={() => {
                    action.onClick();
                    onAction?.(action.label);
                  }}
                  sx={{
                    borderColor: config.color,
                    color: config.color,
                    '&:hover': {
                      borderColor: config.color,
                      backgroundColor: `${config.color}20`,
                    },
                  }}
                >
                  {action.label}
                </Button>
              ))}
            </Box>
          )}
        </Box>
      </Alert>
    );
  }

  // For low/medium alerts, show in card format (non-intrusive)
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
              Security Alert
            </Typography>
            <Chip
              label={config.label}
              size="small"
              icon={<AlertIcon sx={{ fontSize: 14 }} />}
              sx={{
                height: 24,
                backgroundColor: config.bg,
                color: config.color,
                fontSize: typography.fontSize.bodyTiny,
                fontWeight: typography.fontWeight.medium,
              }}
            />
            <Chip
              label={`Score: ${alert.score}`}
              size="small"
              sx={{
                height: 24,
                backgroundColor: colors.base.neutral800,
                color: colors.base.neutral200,
                fontSize: typography.fontSize.bodyTiny,
              }}
            />
          </Box>

          {!compact && (
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="body2" sx={{ color: colors.base.neutral300, mb: 1 }}>
                {alert.indicators[0]?.description || 'Unusual patterns detected'}
              </Typography>
              {alert.transactionId && (
                <Typography variant="caption" sx={{ color: colors.base.neutral500 }}>
                  Transaction: {alert.transactionId}
                </Typography>
              )}
            </Box>
          )}

          {/* Confidence & Timestamp */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: compact ? 1 : 1.5 }}>
            <Typography variant="caption" sx={{ color: colors.base.neutral400 }}>
              {alert.confidence}% confidence • {alert.timestamp.toLocaleDateString()}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {!compact && (
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              sx={{ color: colors.base.neutral300 }}
            >
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
          {dismissible && (
            <IconButton size="small" onClick={handleDismiss} sx={{ color: colors.base.neutral300 }}>
              <Close />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Expandable Details */}
      <Collapse in={expanded}>
        <Divider sx={{ my: 2, borderColor: borders.color.default }} />
        <Box>
          <Typography variant="subtitle2" sx={{ color: colors.base.neutral200, fontWeight: 600, mb: 2 }}>
            Indicators
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {alert.indicators.map((indicator, idx) => {
              const severityColor =
                indicator.severity === 'critical' || indicator.severity === 'high'
                  ? colors.semantic.error
                  : indicator.severity === 'medium'
                    ? colors.semantic.warning
                    : colors.intelligence.cerulean;

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
                      {indicator.type}
                    </Typography>
                    <Chip
                      label={indicator.severity.toUpperCase()}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '10px',
                        backgroundColor: `${severityColor}20`,
                        color: severityColor,
                        fontWeight: typography.fontWeight.medium,
                      }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ color: colors.base.neutral300, lineHeight: 1.5, mb: 1 }}>
                    {indicator.description}
                  </Typography>
                  {indicator.evidence && indicator.evidence.length > 0 && (
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" sx={{ color: colors.base.neutral400, display: 'block', mb: 0.5 }}>
                        Evidence:
                      </Typography>
                      <Box component="ul" sx={{ m: 0, pl: 2 }}>
                        {indicator.evidence.map((ev, evIdx) => (
                          <li key={evIdx}>
                            <Typography variant="caption" sx={{ color: colors.base.neutral400 }}>
                              {ev}
                            </Typography>
                          </li>
                        ))}
                      </Box>
                    </Box>
                  )}
                  <Box
                    sx={{
                      mt: 1,
                      pt: 1,
                      borderTop: `1px solid ${borders.color.default}`,
                    }}
                  >
                    <Typography variant="caption" sx={{ color: colors.intelligence.ceruleanLight }}>
                      💡 {indicator.recommendation}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>

          {alert.actionable && alert.actions && alert.actions.length > 0 && (
            <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${borders.color.default}` }}>
              <Typography variant="subtitle2" sx={{ color: colors.base.neutral200, fontWeight: 600, mb: 1.5 }}>
                Recommended Actions
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {alert.actions.map((action, idx) => (
                  <Button
                    key={idx}
                    size="small"
                    variant={action.variant || 'outlined'}
                    onClick={() => {
                      action.onClick();
                      onAction?.(action.label);
                    }}
                    sx={{
                      borderColor: config.color,
                      color: config.color,
                      '&:hover': {
                        borderColor: config.color,
                        backgroundColor: `${config.color}20`,
                      },
                    }}
                  >
                    {action.label}
                  </Button>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Collapse>
    </EnterpriseCard>
  );
};
