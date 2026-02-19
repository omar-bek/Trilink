import { Box, Typography, Grid, Paper, Chip, LinearProgress } from '@mui/material';
import { LocalShipping, Speed, CheckCircle, Warning } from '@mui/icons-material';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface LogisticsEfficiencyMetricsProps {
  timeRange: string;
}

export const LogisticsEfficiencyMetrics = ({ timeRange }: LogisticsEfficiencyMetricsProps) => {
  // Mock data
  const efficiencyTrend = [
    { month: 'Jan', onTime: 82, cost: 100, speed: 78, reliability: 85 },
    { month: 'Feb', onTime: 84, cost: 98, speed: 80, reliability: 87 },
    { month: 'Mar', onTime: 86, cost: 95, speed: 82, reliability: 88 },
    { month: 'Apr', onTime: 88, cost: 93, speed: 84, reliability: 90 },
    { month: 'May', onTime: 90, cost: 91, speed: 86, reliability: 92 },
    { month: 'Jun', onTime: 92, cost: 89, speed: 88, reliability: 93 },
  ];

  const providerPerformance = [
    { provider: 'LogiTech', onTime: 94, cost: 88, speed: 92, reliability: 96, overall: 92.5 },
    { provider: 'FastTrack', onTime: 91, cost: 85, speed: 95, reliability: 93, overall: 91 },
    { provider: 'GlobalLog', onTime: 89, cost: 92, speed: 87, reliability: 90, overall: 89.5 },
    { provider: 'SwiftMove', onTime: 87, cost: 90, speed: 89, reliability: 88, overall: 88.5 },
    { provider: 'PrimeShip', onTime: 85, cost: 87, speed: 85, reliability: 86, overall: 85.75 },
  ];

  const kpiMetrics = [
    { label: 'On-Time Delivery', value: 92, target: 90, icon: <CheckCircle />, color: 'success' },
    { label: 'Cost Efficiency', value: 89, target: 85, icon: <Speed />, color: 'info' },
    { label: 'Delivery Speed', value: 88, target: 85, icon: <LocalShipping />, color: 'primary' },
    { label: 'Reliability Score', value: 93, target: 90, icon: <CheckCircle />, color: 'success' },
  ];

  const routeEfficiency = [
    { route: 'UAE-China', distance: 5800, avgTime: 12, cost: 8500, efficiency: 92 },
    { route: 'UAE-India', distance: 2200, avgTime: 5, cost: 3200, efficiency: 95 },
    { route: 'UAE-USA', distance: 12500, avgTime: 18, cost: 18500, efficiency: 88 },
    { route: 'UAE-Germany', distance: 5200, avgTime: 10, cost: 7200, efficiency: 90 },
    { route: 'UAE-Japan', distance: 8500, avgTime: 14, cost: 11200, efficiency: 89 },
  ];

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, fontSize: '1rem' }}>
        Logistics Efficiency Metrics
      </Typography>

      <Grid container spacing={2}>
        {/* KPI Cards */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            {kpiMetrics.map((kpi) => (
              <Grid item xs={12} sm={6} md={3} key={kpi.label}>
                <Paper
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 0,
                    bgcolor: 'background.paper',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Box sx={{ color: `${kpi.color}.main` }}>{kpi.icon}</Box>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                      {kpi.label}
                    </Typography>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                    {kpi.value}%
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={(kpi.value / 100) * 100}
                      sx={{ flex: 1, height: 6, borderRadius: 1 }}
                      color={kpi.value >= kpi.target ? 'success' : 'warning'}
                    />
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                      Target: {kpi.target}%
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Efficiency Trend */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, fontSize: '0.875rem' }}>
              Logistics Efficiency Trend
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={efficiencyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" style={{ fontSize: '0.75rem' }} />
                <YAxis domain={[70, 100]} stroke="#9ca3af" style={{ fontSize: '0.75rem' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                <Line type="monotone" dataKey="onTime" stroke="#10b981" strokeWidth={2} name="On-Time %" />
                <Line type="monotone" dataKey="cost" stroke="#3b82f6" strokeWidth={2} name="Cost Efficiency" />
                <Line type="monotone" dataKey="speed" stroke="#f59e0b" strokeWidth={2} name="Speed Index" />
                <Line type="monotone" dataKey="reliability" stroke="#8b5cf6" strokeWidth={2} name="Reliability" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Provider Performance Radar */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, fontSize: '0.875rem' }}>
              Top Provider Performance
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={providerPerformance.slice(0, 3)}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="provider" stroke="#9ca3af" style={{ fontSize: '0.7rem' }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9ca3af" style={{ fontSize: '0.7rem' }} />
                <Radar name="On-Time" dataKey="onTime" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                <Radar name="Cost" dataKey="cost" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Radar name="Speed" dataKey="speed" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                <Radar name="Reliability" dataKey="reliability" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                <Legend wrapperStyle={{ fontSize: '0.7rem' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Route Efficiency */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, fontSize: '0.875rem' }}>
              Route Efficiency Analysis
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={routeEfficiency}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="route" stroke="#9ca3af" style={{ fontSize: '0.75rem' }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: '0.75rem' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                <Bar dataKey="efficiency" fill="#4682B4" name="Efficiency %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
