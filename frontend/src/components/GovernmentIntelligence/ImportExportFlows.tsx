import { useState } from 'react';
import { Box, Typography, Grid, Paper, Tabs, Tab } from '@mui/material';
import { Map, ShowChart } from '@mui/icons-material';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface ImportExportFlowsProps {
  timeRange: string;
}

export const ImportExportFlows = ({ timeRange }: ImportExportFlowsProps) => {
  const [viewMode, setViewMode] = useState(0);

  // Mock data - replace with actual API data
  const tradeFlowData = [
    { month: 'Jan', imports: 450000000, exports: 320000000, net: 130000000 },
    { month: 'Feb', imports: 520000000, exports: 380000000, net: 140000000 },
    { month: 'Mar', imports: 480000000, exports: 410000000, net: 70000000 },
    { month: 'Apr', imports: 550000000, exports: 450000000, net: 100000000 },
    { month: 'May', imports: 600000000, exports: 500000000, net: 100000000 },
    { month: 'Jun', imports: 580000000, exports: 520000000, net: 60000000 },
  ];

  const countryFlowData = [
    { country: 'China', imports: 250000000, exports: 180000000, volume: 1250 },
    { country: 'India', imports: 180000000, exports: 150000000, volume: 980 },
    { country: 'USA', imports: 120000000, exports: 95000000, volume: 650 },
    { country: 'Germany', imports: 95000000, exports: 75000000, volume: 420 },
    { country: 'Japan', imports: 85000000, exports: 68000000, volume: 380 },
  ];

  const portLocations = [
    { name: 'Dubai Port', lat: 25.2631, lng: 55.2972, volume: 450000000, type: 'import' },
    { name: 'Abu Dhabi Port', lat: 24.4539, lng: 54.3773, volume: 320000000, type: 'export' },
    { name: 'Sharjah Port', lat: 25.3573, lng: 55.4033, volume: 180000000, type: 'mixed' },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          Import/Export Trade Flows
        </Typography>
        <Tabs value={viewMode} onChange={(_, v) => setViewMode(v)} size="small">
          <Tab label="Charts" icon={<ShowChart fontSize="small" />} iconPosition="start" />
          <Tab label="Map View" icon={<Map fontSize="small" />} iconPosition="start" />
        </Tabs>
      </Box>

      {viewMode === 0 && (
        <Grid container spacing={2}>
          {/* Trade Flow Trend */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, fontSize: '0.875rem' }}>
                Monthly Trade Flow Trend (AED)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={tradeFlowData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" style={{ fontSize: '0.75rem' }} />
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
                  <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                  <Area
                    type="monotone"
                    dataKey="imports"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Imports"
                  />
                  <Area
                    type="monotone"
                    dataKey="exports"
                    fill="#10b981"
                    fillOpacity={0.3}
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Exports"
                  />
                  <Line
                    type="monotone"
                    dataKey="net"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Net Trade"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Country-wise Flows */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, fontSize: '0.875rem' }}>
                Top Trading Partners
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={countryFlowData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9ca3af" style={{ fontSize: '0.75rem' }} tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`} />
                  <YAxis dataKey="country" type="category" stroke="#9ca3af" style={{ fontSize: '0.75rem' }} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                    }}
                    formatter={(value: number) => `AED ${(value / 1000000).toFixed(2)}M`}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                  <Bar dataKey="imports" fill="#3b82f6" name="Imports" />
                  <Bar dataKey="exports" fill="#10b981" name="Exports" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Trade Volume by Country */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, fontSize: '0.875rem' }}>
                Shipment Volume by Country
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={countryFlowData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="country" stroke="#9ca3af" style={{ fontSize: '0.75rem' }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '0.75rem' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                    }}
                  />
                  <Bar dataKey="volume" fill="#4682B4" name="Shipments" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {viewMode === 1 && (
        <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 0, height: 600 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, fontSize: '0.875rem' }}>
            Port Activity & Trade Flow Map
          </Typography>
          <MapContainer
            center={[25.0, 55.0]}
            zoom={8}
            style={{ height: '550px', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {portLocations.map((port, index) => (
              <CircleMarker
                key={index}
                center={[port.lat, port.lng]}
                radius={Math.sqrt(port.volume / 10000000)}
                pathOptions={{
                  color: port.type === 'import' ? '#3b82f6' : port.type === 'export' ? '#10b981' : '#f59e0b',
                  fillColor: port.type === 'import' ? '#3b82f6' : port.type === 'export' ? '#10b981' : '#f59e0b',
                  fillOpacity: 0.6,
                }}
              >
                <Popup>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {port.name}
                    </Typography>
                    <Typography variant="body2">
                      Volume: AED {(port.volume / 1000000).toFixed(0)}M
                    </Typography>
                    <Typography variant="body2">
                      Type: {port.type}
                    </Typography>
                  </Box>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </Paper>
      )}
    </Box>
  );
};
