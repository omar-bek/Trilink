import { Box, Typography, Grid, Paper, Chip } from '@mui/material';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import 'leaflet/dist/leaflet.css';

interface ClearanceTimeHeatmapProps {
  timeRange: string;
}

export const ClearanceTimeHeatmap = ({ timeRange }: ClearanceTimeHeatmapProps) => {
  // Mock data
  const portClearanceData = [
    { port: 'Dubai Port', avgTime: 2.5, minTime: 1.2, maxTime: 4.8, volume: 1250, efficiency: 92 },
    { port: 'Abu Dhabi Port', avgTime: 3.2, minTime: 1.8, maxTime: 5.5, volume: 980, efficiency: 87 },
    { port: 'Sharjah Port', avgTime: 2.8, minTime: 1.5, maxTime: 4.2, volume: 750, efficiency: 89 },
    { port: 'Ajman Port', avgTime: 3.8, minTime: 2.1, maxTime: 6.2, volume: 420, efficiency: 82 },
    { port: 'Fujairah Port', avgTime: 2.2, minTime: 1.0, maxTime: 3.8, volume: 680, efficiency: 91 },
  ];

  const monthlyClearanceData = [
    { month: 'Jan', avgTime: 3.2, volume: 1250 },
    { month: 'Feb', avgTime: 2.9, volume: 1380 },
    { month: 'Mar', avgTime: 2.7, volume: 1520 },
    { month: 'Apr', avgTime: 2.5, volume: 1450 },
    { month: 'May', avgTime: 2.4, volume: 1680 },
    { month: 'Jun', avgTime: 2.3, volume: 1720 },
  ];

  const portLocations = [
    { name: 'Dubai Port', lat: 25.2631, lng: 55.2972, avgTime: 2.5, efficiency: 92 },
    { name: 'Abu Dhabi Port', lat: 24.4539, lng: 54.3773, avgTime: 3.2, efficiency: 87 },
    { name: 'Sharjah Port', lat: 25.3573, lng: 55.4033, avgTime: 2.8, efficiency: 89 },
    { name: 'Ajman Port', lat: 25.4058, lng: 55.4333, avgTime: 3.8, efficiency: 82 },
    { name: 'Fujairah Port', lat: 25.1288, lng: 56.3264, avgTime: 2.2, efficiency: 91 },
  ];

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return '#10b981';
    if (efficiency >= 85) return '#3b82f6';
    if (efficiency >= 80) return '#f59e0b';
    return '#ef4444';
  };

  const getTimeColor = (time: number) => {
    if (time <= 2.5) return '#10b981';
    if (time <= 3.5) return '#3b82f6';
    if (time <= 4.5) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, fontSize: '1rem' }}>
        Customs Clearance Time Analytics
      </Typography>

      <Grid container spacing={2}>
        {/* Clearance Time Map */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 0, height: 500 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, fontSize: '0.875rem' }}>
              Port Clearance Efficiency Heatmap
            </Typography>
            <MapContainer
              center={[25.0, 55.0]}
              zoom={8}
              style={{ height: '450px', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {portLocations.map((port, index) => (
                <CircleMarker
                  key={index}
                  center={[port.lat, port.lng]}
                  radius={15 + port.efficiency / 2}
                  pathOptions={{
                    color: getEfficiencyColor(port.efficiency),
                    fillColor: getEfficiencyColor(port.efficiency),
                    fillOpacity: 0.6,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        {port.name}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        Avg Clearance: {port.avgTime} days
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        Efficiency: {port.efficiency}%
                      </Typography>
                      <Chip
                        label={port.efficiency >= 90 ? 'Excellent' : port.efficiency >= 85 ? 'Good' : 'Needs Improvement'}
                        size="small"
                        color={port.efficiency >= 90 ? 'success' : port.efficiency >= 85 ? 'info' : 'warning'}
                        sx={{ mt: 0.5, fontSize: '0.65rem' }}
                      />
                    </Box>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </Paper>
        </Grid>

        {/* Monthly Trend */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, fontSize: '0.875rem' }}>
              Average Clearance Time Trend (Days)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyClearanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" style={{ fontSize: '0.75rem' }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: '0.75rem' }} label={{ value: 'Days', angle: -90, position: 'insideLeft', style: { fontSize: '0.7rem' } }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                  }}
                />
                <Bar dataKey="avgTime" radius={[4, 4, 0, 0]}>
                  {monthlyClearanceData.map((entry, index) => (
                    <Cell key={index} fill={getTimeColor(entry.avgTime)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Port Performance Table */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, fontSize: '0.875rem' }}>
              Port Performance Metrics
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {portClearanceData.map((port) => (
                <Box
                  key={port.port}
                  sx={{
                    p: 1.5,
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem', mb: 0.5 }}>
                    {port.port}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                      Avg Time:
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {port.avgTime} days
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                      Efficiency:
                    </Typography>
                    <Chip
                      label={`${port.efficiency}%`}
                      size="small"
                      color={port.efficiency >= 90 ? 'success' : port.efficiency >= 85 ? 'info' : 'warning'}
                      sx={{ height: 18, fontSize: '0.65rem' }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                      Volume:
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                      {port.volume} shipments
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
