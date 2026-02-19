import { Box, Typography, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, LinearProgress } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, Cell } from 'recharts';

interface SupplierPerformanceScoresProps {
  timeRange: string;
}

export const SupplierPerformanceScores = ({ timeRange }: SupplierPerformanceScoresProps) => {
  // Mock data
  const supplierScores = [
    { name: 'ABC Corp', quality: 92, delivery: 88, price: 85, compliance: 95, overall: 90, contracts: 45, value: 12500000 },
    { name: 'XYZ Ltd', quality: 88, delivery: 92, price: 90, compliance: 87, overall: 89, contracts: 38, value: 9800000 },
    { name: 'Tech Solutions', quality: 85, delivery: 85, price: 92, compliance: 90, overall: 88, contracts: 52, value: 15200000 },
    { name: 'Global Supply', quality: 90, delivery: 90, price: 88, compliance: 92, overall: 90, contracts: 42, value: 11800000 },
    { name: 'Prime Industries', quality: 87, delivery: 87, price: 85, compliance: 88, overall: 87, contracts: 35, value: 8700000 },
    { name: 'Elite Manufacturing', quality: 93, delivery: 89, price: 82, compliance: 96, overall: 90, contracts: 28, value: 9500000 },
  ];

  const scoreDistribution = [
    { range: '90-100', count: 124, color: '#10b981' },
    { range: '80-89', count: 287, color: '#3b82f6' },
    { range: '70-79', count: 198, color: '#f59e0b' },
    { range: '60-69', count: 95, color: '#ef4444' },
    { range: '<60', count: 43, color: '#991b1b' },
  ];

  const performanceMatrix = supplierScores.map((s) => ({
    x: s.quality,
    y: s.delivery,
    z: s.overall,
    name: s.name,
  }));

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#991b1b'];

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, fontSize: '1rem' }}>
        Supplier Performance Scoring System
      </Typography>

      <Grid container spacing={2}>
        {/* Score Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, fontSize: '0.875rem' }}>
              Performance Score Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoreDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" style={{ fontSize: '0.75rem' }} />
                <YAxis dataKey="range" type="category" stroke="#9ca3af" style={{ fontSize: '0.75rem' }} width={60} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {scoreDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Performance Matrix */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, fontSize: '0.875rem' }}>
              Quality vs Delivery Performance Matrix
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Quality"
                  domain={[70, 100]}
                  stroke="#9ca3af"
                  style={{ fontSize: '0.75rem' }}
                  label={{ value: 'Quality Score', position: 'insideBottom', offset: -5, style: { fontSize: '0.7rem' } }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Delivery"
                  domain={[70, 100]}
                  stroke="#9ca3af"
                  style={{ fontSize: '0.75rem' }}
                  label={{ value: 'Delivery Score', angle: -90, position: 'insideLeft', style: { fontSize: '0.7rem' } }}
                />
                <ZAxis type="number" dataKey="z" range={[50, 400]} name="Overall" />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                  }}
                  formatter={(value: any, name: string) => {
                    if (name === 'Overall') return [`${value}`, 'Overall Score'];
                    return [value, name];
                  }}
                />
                <Scatter name="Suppliers" data={performanceMatrix} fill="#4682B4">
                  {performanceMatrix.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.z >= 90 ? '#10b981' : entry.z >= 80 ? '#3b82f6' : '#f59e0b'} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Top Performers Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, fontSize: '0.875rem' }}>
              Top Performing Suppliers
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Supplier</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Quality</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Delivery</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Price</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Compliance</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Overall</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Contracts</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Total Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {supplierScores
                    .sort((a, b) => b.overall - a.overall)
                    .map((supplier) => (
                      <TableRow key={supplier.name}>
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{supplier.name}</TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={supplier.quality}
                              sx={{ width: 60, height: 6, borderRadius: 1 }}
                              color={supplier.quality >= 90 ? 'success' : supplier.quality >= 80 ? 'info' : 'warning'}
                            />
                            <Typography variant="caption" sx={{ fontSize: '0.7rem', minWidth: 30 }}>
                              {supplier.quality}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={supplier.delivery}
                              sx={{ width: 60, height: 6, borderRadius: 1 }}
                              color={supplier.delivery >= 90 ? 'success' : supplier.delivery >= 80 ? 'info' : 'warning'}
                            />
                            <Typography variant="caption" sx={{ fontSize: '0.7rem', minWidth: 30 }}>
                              {supplier.delivery}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={supplier.price}
                              sx={{ width: 60, height: 6, borderRadius: 1 }}
                              color={supplier.price >= 90 ? 'success' : supplier.price >= 80 ? 'info' : 'warning'}
                            />
                            <Typography variant="caption" sx={{ fontSize: '0.7rem', minWidth: 30 }}>
                              {supplier.price}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={supplier.compliance}
                              sx={{ width: 60, height: 6, borderRadius: 1 }}
                              color={supplier.compliance >= 90 ? 'success' : supplier.compliance >= 80 ? 'info' : 'warning'}
                            />
                            <Typography variant="caption" sx={{ fontSize: '0.7rem', minWidth: 30 }}>
                              {supplier.compliance}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={supplier.overall}
                            color={supplier.overall >= 90 ? 'success' : supplier.overall >= 80 ? 'info' : 'warning'}
                            size="small"
                            sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                          {supplier.contracts}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                          AED {(supplier.value / 1000000).toFixed(2)}M
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
