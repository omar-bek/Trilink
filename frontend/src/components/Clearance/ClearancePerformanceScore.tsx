import { Card, CardContent, Box, Typography, LinearProgress, Grid } from '@mui/material';
import { TrendingUp, CheckCircle, Warning, Error } from '@mui/icons-material';

interface ScoreMetric {
  label: string;
  value: number;
  max: number;
  color: 'success' | 'warning' | 'error';
  icon: React.ReactNode;
}

export const ClearancePerformanceScore = () => {
  const metrics: ScoreMetric[] = [
    {
      label: 'On-Time Clearance Rate',
      value: 94,
      max: 100,
      color: 'success',
      icon: <CheckCircle />,
    },
    {
      label: 'Documentation Accuracy',
      value: 87,
      max: 100,
      color: 'success',
      icon: <CheckCircle />,
    },
    {
      label: 'Compliance Score',
      value: 92,
      max: 100,
      color: 'success',
      icon: <CheckCircle />,
    },
    {
      label: 'Average Clearance Time',
      value: 2.3,
      max: 5,
      color: 'warning',
      icon: <Warning />,
    },
  ];

  const overallScore = Math.round(
    metrics.reduce((sum, m) => sum + (m.value / m.max) * 100, 0) / metrics.length
  );

  const getScoreColor = (score: number): string => {
    if (score >= 90) return '#10b981';
    if (score >= 75) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#FFFFFF', mb: 0.5 }}>
              Clearance Performance Score
            </Typography>
            <Typography variant="body2" sx={{ color: '#CBD5E1' }}>
              Overall compliance and efficiency metrics
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: getScoreColor(overallScore),
                lineHeight: 1,
              }}
            >
              {overallScore}
            </Typography>
            <Typography variant="body2" sx={{ color: '#CBD5E1', mt: 0.5 }}>
              / 100
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {metrics.map((metric, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Box sx={{ color: getScoreColor((metric.value / metric.max) * 100) }}>
                    {metric.icon}
                  </Box>
                  <Typography variant="body2" sx={{ color: '#CBD5E1', fontWeight: 500 }}>
                    {metric.label}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={(metric.value / metric.max) * 100}
                      sx={{
                        height: 8,
                        borderRadius: 1,
                        backgroundColor: 'rgba(135, 206, 235, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getScoreColor((metric.value / metric.max) * 100),
                        },
                      }}
                    />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: getScoreColor((metric.value / metric.max) * 100),
                      minWidth: 50,
                      textAlign: 'right',
                    }}
                  >
                    {metric.value}
                    {metric.max === 100 ? '%' : `/${metric.max}`}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};
