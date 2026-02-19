import { Box, Typography, Grid, Paper, Chip, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { TrendingUp, TrendingDown, Warning, CheckCircle, ShowChart } from '@mui/icons-material';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis, Cell } from 'recharts';

interface IndustrialOpportunitySignalsProps {
  timeRange: string;
}

export const IndustrialOpportunitySignals = ({ timeRange }: IndustrialOpportunitySignalsProps) => {
  // Mock data - Predictive analytics
  const opportunityIndex = [
    { month: 'Jan', index: 65, signal: 'moderate' },
    { month: 'Feb', index: 68, signal: 'moderate' },
    { month: 'Mar', index: 70, signal: 'high' },
    { month: 'Apr', index: 72, signal: 'high' },
    { month: 'May', index: 75, signal: 'high' },
    { month: 'Jun', index: 78, signal: 'very_high' },
    { month: 'Jul', index: 80, signal: 'very_high' },
    { month: 'Aug', index: 82, signal: 'very_high' },
  ];

  const sectorOpportunities = [
    { sector: 'Renewable Energy', opportunity: 92, growth: 25.5, investment: 450000000, risk: 'low', trend: 'up' },
    { sector: 'AI & Technology', opportunity: 88, growth: 22.3, investment: 380000000, risk: 'medium', trend: 'up' },
    { sector: 'Healthcare Innovation', opportunity: 85, growth: 18.7, investment: 320000000, risk: 'low', trend: 'up' },
    { sector: 'Smart Infrastructure', opportunity: 82, growth: 15.2, investment: 520000000, risk: 'medium', trend: 'up' },
    { sector: 'Sustainable Manufacturing', opportunity: 78, growth: 12.8, investment: 280000000, risk: 'low', trend: 'up' },
    { sector: 'Logistics Tech', opportunity: 75, growth: 10.5, investment: 195000000, risk: 'medium', trend: 'up' },
  ];

  const predictiveSignals = [
    { signal: 'High Growth Potential', sector: 'Renewable Energy', confidence: 94, timeframe: '6-12 months', impact: 'high' },
    { signal: 'Market Expansion', sector: 'AI & Technology', confidence: 89, timeframe: '3-6 months', impact: 'high' },
    { signal: 'Investment Surge', sector: 'Healthcare Innovation', confidence: 87, timeframe: '6-9 months', impact: 'medium' },
    { signal: 'Policy Alignment', sector: 'Smart Infrastructure', confidence: 92, timeframe: '12-18 months', impact: 'high' },
    { signal: 'Supply Chain Shift', sector: 'Sustainable Manufacturing', confidence: 81, timeframe: '9-12 months', impact: 'medium' },
  ];

  const riskReturnMatrix = sectorOpportunities.map((s) => ({
    x: s.opportunity,
    y: s.growth,
    z: s.investment / 1000000,
    name: s.sector,
    risk: s.risk,
  }));

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'very_high':
        return 'success';
      case 'high':
        return 'info';
      case 'moderate':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getSignalLabel = (signal: string) => {
    switch (signal) {
      case 'very_high':
        return 'Very High';
      case 'high':
        return 'High';
      case 'moderate':
        return 'Moderate';
      default:
        return 'Low';
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, fontSize: '1rem' }}>
        Industrial Opportunity Signals (Predictive Analytics)
      </Typography>

      <Alert severity="info" sx={{ mb: 3, fontSize: '0.75rem' }}>
        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
          <strong>AI-Powered Predictions:</strong> These signals are generated using machine learning models analyzing
          procurement patterns, market trends, policy changes, and economic indicators. Confidence scores indicate
          prediction reliability.
        </Typography>
      </Alert>

      <Grid container spacing={2}>
        {/* Opportunity Index Trend */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                Industrial Opportunity Index (0-100)
              </Typography>
              <Chip
                icon={<TrendingUp />}
                label={`Current: ${opportunityIndex[opportunityIndex.length - 1].index} (${getSignalLabel(opportunityIndex[opportunityIndex.length - 1].signal)})`}
                color={getSignalColor(opportunityIndex[opportunityIndex.length - 1].signal) as any}
                size="small"
                sx={{ fontSize: '0.7rem' }}
              />
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={opportunityIndex}>
                <defs>
                  <linearGradient id="colorOpportunity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" style={{ fontSize: '0.75rem' }} />
                <YAxis domain={[0, 100]} stroke="#9ca3af" style={{ fontSize: '0.75rem' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="index"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorOpportunity)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Risk-Return Matrix */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, fontSize: '0.875rem' }}>
              Opportunity vs Growth Matrix
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Opportunity"
                  domain={[70, 100]}
                  stroke="#9ca3af"
                  style={{ fontSize: '0.75rem' }}
                  label={{ value: 'Opportunity Score', position: 'insideBottom', offset: -5, style: { fontSize: '0.7rem' } }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Growth"
                  domain={[0, 30]}
                  stroke="#9ca3af"
                  style={{ fontSize: '0.75rem' }}
                  label={{ value: 'Growth %', angle: -90, position: 'insideLeft', style: { fontSize: '0.7rem' } }}
                />
                <ZAxis type="number" dataKey="z" range={[50, 600]} name="Investment" />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                  }}
                  formatter={(value: any, name: string) => {
                    if (name === 'Investment') return [`AED ${value}M`, 'Investment'];
                    return [value, name];
                  }}
                />
                <Scatter name="Sectors" data={riskReturnMatrix} fill="#4682B4" />
              </ScatterChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Sector Opportunities */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, fontSize: '0.875rem' }}>
              Top Opportunity Sectors
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={sectorOpportunities} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" domain={[0, 100]} stroke="#9ca3af" style={{ fontSize: '0.75rem' }} />
                <YAxis dataKey="sector" type="category" stroke="#9ca3af" style={{ fontSize: '0.75rem' }} width={120} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                  }}
                />
                <Bar dataKey="opportunity" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Predictive Signals Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, fontSize: '0.875rem' }}>
              Active Predictive Signals
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Signal</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Sector</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Confidence</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Timeframe</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Impact</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {predictiveSignals.map((signal) => (
                    <TableRow key={signal.signal}>
                      <TableCell sx={{ fontSize: '0.75rem' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TrendingUp fontSize="small" color="success" />
                          {signal.signal}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>{signal.sector}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${signal.confidence}%`}
                          size="small"
                          color={signal.confidence >= 90 ? 'success' : signal.confidence >= 85 ? 'info' : 'warning'}
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>{signal.timeframe}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={signal.impact}
                          size="small"
                          color={signal.impact === 'high' ? 'success' : 'info'}
                          sx={{ fontSize: '0.7rem', textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label="Monitor"
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
