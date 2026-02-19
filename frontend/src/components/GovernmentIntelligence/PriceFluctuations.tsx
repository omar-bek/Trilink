import { Box, Typography, Grid, Paper, Chip } from '@mui/material';
import { TrendingUp, TrendingDown, ShowChart } from '@mui/icons-material';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface PriceFluctuationsProps {
  timeRange: string;
}

export const PriceFluctuations = ({ timeRange }: PriceFluctuationsProps) => {
  // Mock data
  const priceTrendData = [
    { date: 'Jan', healthcare: 100, education: 100, infrastructure: 100, technology: 100, energy: 100 },
    { date: 'Feb', healthcare: 102.5, education: 98.3, infrastructure: 105.2, technology: 101.8, energy: 103.1 },
    { date: 'Mar', healthcare: 104.2, education: 97.1, infrastructure: 108.5, technology: 103.5, energy: 105.8 },
    { date: 'Apr', healthcare: 103.8, education: 96.5, infrastructure: 110.2, technology: 105.2, energy: 107.3 },
    { date: 'May', healthcare: 105.5, education: 95.8, infrastructure: 112.8, technology: 107.1, energy: 109.5 },
    { date: 'Jun', healthcare: 107.2, education: 94.2, infrastructure: 115.3, technology: 109.5, energy: 111.8 },
  ];

  const volatilityData = [
    { category: 'Healthcare', volatility: 2.8, trend: 'up', change: 7.2 },
    { category: 'Education', volatility: 1.5, trend: 'down', change: -5.8 },
    { category: 'Infrastructure', volatility: 4.2, trend: 'up', change: 15.3 },
    { category: 'Technology', volatility: 3.1, trend: 'up', change: 9.5 },
    { category: 'Energy', volatility: 3.8, trend: 'up', change: 11.8 },
  ];

  const priceIndexData = [
    { month: 'Jan', index: 100.0 },
    { month: 'Feb', index: 101.8 },
    { month: 'Mar', index: 103.8 },
    { month: 'Apr', index: 104.4 },
    { month: 'May', index: 106.1 },
    { month: 'Jun', index: 107.6 },
  ];

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, fontSize: '1rem' }}>
        Price Fluctuation Intelligence
      </Typography>

      <Grid container spacing={2}>
        {/* Price Index Trend */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                Procurement Price Index (Base: Jan = 100)
              </Typography>
              <Chip
                icon={<TrendingUp />}
                label="+7.6% YoY"
                color="success"
                size="small"
                sx={{ fontSize: '0.7rem' }}
              />
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={priceIndexData}>
                <defs>
                  <linearGradient id="colorIndex" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4682B4" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#4682B4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" style={{ fontSize: '0.75rem' }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: '0.75rem' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                  }}
                />
                <ReferenceLine y={100} stroke="#9ca3af" strokeDasharray="3 3" label="Base" />
                <Area
                  type="monotone"
                  dataKey="index"
                  stroke="#4682B4"
                  fillOpacity={1}
                  fill="url(#colorIndex)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Sector Price Trends */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, fontSize: '0.875rem' }}>
              Sector Price Trends (Indexed)
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={priceTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '0.75rem' }} />
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
                <ReferenceLine y={100} stroke="#9ca3af" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="healthcare" stroke="#3b82f6" strokeWidth={2} name="Healthcare" />
                <Line type="monotone" dataKey="education" stroke="#10b981" strokeWidth={2} name="Education" />
                <Line type="monotone" dataKey="infrastructure" stroke="#f59e0b" strokeWidth={2} name="Infrastructure" />
                <Line type="monotone" dataKey="technology" stroke="#ef4444" strokeWidth={2} name="Technology" />
                <Line type="monotone" dataKey="energy" stroke="#8b5cf6" strokeWidth={2} name="Energy" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Volatility Analysis */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, fontSize: '0.875rem' }}>
              Price Volatility & Change
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {volatilityData.map((item) => (
                <Box key={item.category}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                      {item.category}
                    </Typography>
                    <Chip
                      icon={item.trend === 'up' ? <TrendingUp /> : <TrendingDown />}
                      label={`${item.change > 0 ? '+' : ''}${item.change}%`}
                      color={item.trend === 'up' ? 'success' : 'error'}
                      size="small"
                      sx={{ fontSize: '0.65rem', height: 20 }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ flex: 1, height: 6, bgcolor: 'action.hover', borderRadius: 1, overflow: 'hidden' }}>
                      <Box
                        sx={{
                          width: `${item.volatility * 10}%`,
                          height: '100%',
                          bgcolor: item.volatility > 3 ? 'warning.main' : 'info.main',
                        }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', minWidth: 40 }}>
                      Vol: {item.volatility}%
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
