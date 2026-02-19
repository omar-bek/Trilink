import {
  Box,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Stack,
  Grid,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  AccessTime,
  Description,
  History,
  Info,
} from '@mui/icons-material';
import { RiskBadge, type RiskLevel } from './RiskBadge';
import { ConfidenceIndicator, type ConfidenceLevel } from './ConfidenceIndicator';


export interface ScoreBreakdown {
  price: {
    score: number;
    maxScore: number;
    weight: number;
    explanation: string;
    confidence: ConfidenceLevel;
    risk: RiskLevel;
  };
  delivery: {
    score: number;
    maxScore: number;
    weight: number;
    explanation: string;
    confidence: ConfidenceLevel;
    risk: RiskLevel;
  };
  terms: {
    score: number;
    maxScore: number;
    weight: number;
    explanation: string;
    confidence: ConfidenceLevel;
    risk: RiskLevel;
  };
  history: {
    score: number;
    maxScore: number;
    weight: number;
    explanation: string;
    confidence: ConfidenceLevel;
    risk: RiskLevel;
  };
}

interface AIScoreBreakdownProps {
  totalScore: number;
  breakdown: ScoreBreakdown;
  overallConfidence: ConfidenceLevel;
  overallRisk: RiskLevel;
}

const factorConfig = [
  {
    key: 'price' as const,
    label: 'Price Competitiveness',
    icon: <TrendingUp />,
    color: 'primary' as const,
  },
  {
    key: 'delivery' as const,
    label: 'Delivery Time',
    icon: <AccessTime />,
    color: 'info' as const,
  },
  {
    key: 'terms' as const,
    label: 'Payment Terms',
    icon: <Description />,
    color: 'secondary' as const,
  },
  {
    key: 'history' as const,
    label: 'Provider History',
    icon: <History />,
    color: 'warning' as const,
  },
];

export const AIScoreBreakdown = ({
  totalScore,
  breakdown,
  overallConfidence,
  overallRisk,
}: AIScoreBreakdownProps) => {
  const getScoreColor = (score: number, maxScore: number): 'success' | 'warning' | 'error' => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'error';
  };

  return (
    <Box>
      {/* Overall Summary */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <Typography variant="h6" gutterBottom>
                Overall AI Score
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {totalScore}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  / 100
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={totalScore}
                color={getScoreColor(totalScore, 100)}
                sx={{ height: 10, borderRadius: 5, mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Overall Confidence
                  </Typography>
                  <ConfidenceIndicator level={overallConfidence} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Overall Risk
                  </Typography>
                  <RiskBadge level={overallRisk} />
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Detailed Factor Breakdown
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Each factor is scored independently with its own confidence and risk assessment. The total score is the sum of all factor scores.
        </Typography>
      </Box>
      <Grid container spacing={2}>
        {factorConfig.map((config) => {
          const factor = breakdown[config.key];
          const percentage = (factor.score / factor.maxScore) * 100;
          const scoreColor = getScoreColor(factor.score, factor.maxScore);

          return (
            <Grid item xs={12} sm={6} key={config.key}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <Box sx={{ color: `${config.color}.main` }}>{config.icon}</Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1 }}>
                      {config.label}
                    </Typography>
                    <Chip
                      label={`${factor.score}/${factor.maxScore}`}
                      size="small"
                      color={scoreColor}
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>

                  <Box sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Score: {factor.score} / {factor.maxScore} ({(factor.weight * 100).toFixed(0)}% weight)
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {percentage.toFixed(0)}% • Contributes {factor.score} points
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={percentage}
                      color={scoreColor}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {factor.explanation}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={2}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        Confidence
                      </Typography>
                      <ConfidenceIndicator level={factor.confidence} size="small" />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        Risk
                      </Typography>
                      <RiskBadge level={factor.risk} size="small" />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};
