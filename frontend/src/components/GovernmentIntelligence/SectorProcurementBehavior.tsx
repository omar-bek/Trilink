import { Box, Typography, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface SectorProcurementBehaviorProps {
  timeRange: string;
  sectorFilter: string;
}

export const SectorProcurementBehavior = ({ timeRange, sectorFilter }: SectorProcurementBehaviorProps) => {
  // Mock data
  const sectorData = [
    { sector: 'Healthcare', procurement: 320000000, contracts: 145, avgValue: 2206896, growth: 15.2 },
    { sector: 'Education', procurement: 280000000, contracts: 198, avgValue: 1414141, growth: 8.7 },
    { sector: 'Infrastructure', procurement: 450000000, contracts: 87, avgValue: 5172413, growth: 22.3 },
    { sector: 'Technology', procurement: 180000000, contracts: 234, avgValue: 769230, growth: 18.5 },
    { sector: 'Energy', procurement: 520000000, contracts: 56, avgValue: 9285714, growth: 12.1 },
    { sector: 'Manufacturing', procurement: 380000000, contracts: 167, avgValue: 2275449, growth: 9.8 },
  ];

  const sectorDistribution = [
    { name: 'Energy', value: 520000000 },
    { name: 'Infrastructure', value: 450000000 },
    { name: 'Manufacturing', value: 380000000 },
    { name: 'Healthcare', value: 320000000 },
    { name: 'Education', value: 280000000 },
    { name: 'Technology', value: 180000000 },
  ];

  const procurementPatterns = [
    { metric: 'Avg Contract Size', Healthcare: 85, Education: 60, Infrastructure: 95, Technology: 40, Energy: 100, Manufacturing: 75 },
    { metric: 'Procurement Frequency', Healthcare: 70, Education: 90, Infrastructure: 50, Technology: 95, Energy: 45, Manufacturing: 80 },
    { metric: 'Price Sensitivity', Healthcare: 60, Education: 75, Infrastructure: 55, Technology: 85, Energy: 50, Manufacturing: 70 },
    { metric: 'Delivery Speed', Healthcare: 90, Education: 65, Infrastructure: 70, Technology: 80, Energy: 60, Manufacturing: 75 },
    { metric: 'Quality Focus', Healthcare: 100, Education: 85, Infrastructure: 80, Technology: 90, Energy: 75, Manufacturing: 85 },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, fontSize: '1rem' }}>
        Sector Procurement Behavior Analysis
      </Typography>

      <Grid container spacing={2}>
        {/* Sector Procurement Value */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, fontSize: '0.875rem' }}>
              Procurement Value by Sector (AED)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sectorData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="sector" stroke="#9ca3af" style={{ fontSize: '0.75rem' }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: '0.75rem' }} tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                  }}
                  formatter={(value: number) => `AED ${(value / 1000000).toFixed(2)}M`}
                />
                <Bar dataKey="procurement" fill="#4682B4" name="Procurement Value" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Sector Distribution */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, fontSize: '0.875rem' }}>
              Sector Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sectorDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sectorDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                  }}
                  formatter={(value: number) => `AED ${(value / 1000000).toFixed(2)}M`}
                />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Procurement Patterns Radar */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, fontSize: '0.875rem' }}>
              Procurement Behavior Patterns (Radar Analysis)
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={procurementPatterns}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="metric" stroke="#9ca3af" style={{ fontSize: '0.75rem' }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9ca3af" style={{ fontSize: '0.75rem' }} />
                <Radar name="Healthcare" dataKey="Healthcare" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Radar name="Education" dataKey="Education" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                <Radar name="Infrastructure" dataKey="Infrastructure" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                <Radar name="Technology" dataKey="Technology" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                <Radar name="Energy" dataKey="Energy" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                <Radar name="Manufacturing" dataKey="Manufacturing" stroke="#ec4899" fill="#ec4899" fillOpacity={0.6} />
                <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
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

        {/* Sector Performance Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, fontSize: '0.875rem' }}>
              Sector Performance Metrics
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Sector</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Procurement Value</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Contracts</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Avg Value</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Growth %</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sectorData.map((row) => (
                    <TableRow key={row.sector}>
                      <TableCell sx={{ fontSize: '0.75rem' }}>{row.sector}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                        AED {(row.procurement / 1000000).toFixed(2)}M
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{row.contracts}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                        AED {(row.avgValue / 1000).toFixed(0)}K
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.75rem', color: row.growth > 0 ? 'success.main' : 'error.main' }}>
                        {row.growth > 0 ? '+' : ''}{row.growth}%
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
