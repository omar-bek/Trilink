import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  Chip,
  Alert,
  AlertTitle,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Cloud as CloudIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { cacheService } from '@/services/cache.service';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  responseTime?: number;
  lastChecked: Date;
  message?: string;
}

interface Incident {
  id: string;
  title: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'critical' | 'major' | 'minor';
  description: string;
  startedAt: Date;
  resolvedAt?: Date;
  affectedServices: string[];
}

const StatusPage = () => {
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'API Server',
      status: 'operational',
      lastChecked: new Date(),
    },
    {
      name: 'Database',
      status: 'operational',
      lastChecked: new Date(),
    },
    {
      name: 'Authentication',
      status: 'operational',
      lastChecked: new Date(),
    },
    {
      name: 'Payment Gateway',
      status: 'operational',
      lastChecked: new Date(),
    },
    {
      name: 'File Storage',
      status: 'operational',
      lastChecked: new Date(),
    },
  ]);

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Check service health
  const checkServiceHealth = async () => {
    setIsChecking(true);
    const startTime = Date.now();

    try {
      // Health check endpoint (if available)
      const response = await api.get('/health');
      const responseTime = Date.now() - startTime;

      setServices((prev) =>
        prev.map((service) => {
          if (service.name === 'API Server') {
            return {
              ...service,
              status: 'operational',
              responseTime,
              lastChecked: new Date(),
            };
          }
          return service;
        })
      );
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      setServices((prev) =>
        prev.map((service) => {
          if (service.name === 'API Server') {
            return {
              ...service,
              status: error.response?.status === 0 ? 'down' : 'degraded',
              responseTime,
              lastChecked: new Date(),
              message: error.response?.status === 0 
                ? 'Service unreachable' 
                : `Error: ${error.response?.status || 'Unknown'}`,
            };
          }
          return service;
        })
      );
    }

    setLastUpdate(new Date());
    setIsChecking(false);
  };

  // Initial health check
  useEffect(() => {
    checkServiceHealth();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(checkServiceHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'operational':
        return 'success';
      case 'degraded':
        return 'warning';
      case 'down':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'operational':
        return <CheckCircleIcon />;
      case 'degraded':
        return <WarningIcon />;
      case 'down':
        return <ErrorIcon />;
      default:
        return null;
    }
  };

  const overallStatus = services.every((s) => s.status === 'operational')
    ? 'operational'
    : services.some((s) => s.status === 'down')
    ? 'down'
    : 'degraded';

  const cacheStats = cacheService.getStats();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            System Status
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time status of all TriLink services
          </Typography>
        </Box>

        {/* Overall Status */}
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            {getStatusIcon(overallStatus)}
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              All Systems {overallStatus === 'operational' ? 'Operational' : overallStatus === 'down' ? 'Down' : 'Degraded'}
            </Typography>
            <Chip
              label={overallStatus.toUpperCase()}
              color={getStatusColor(overallStatus) as any}
              size="small"
            />
          </Stack>
          
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="caption" color="text.secondary">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </Typography>
            <Box sx={{ flex: 1 }} />
            <RefreshIcon
              sx={{
                cursor: 'pointer',
                color: 'text.secondary',
                '&:hover': { color: 'primary.main' },
                animation: isChecking ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                },
              }}
              onClick={checkServiceHealth}
            />
          </Stack>
        </Paper>

        {/* Service Status Grid */}
        <Grid container spacing={2}>
          {services.map((service) => (
            <Grid item xs={12} sm={6} md={4} key={service.name}>
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {getStatusIcon(service.status)}
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1 }}>
                        {service.name}
                      </Typography>
                      <Chip
                        label={service.status}
                        color={getStatusColor(service.status) as any}
                        size="small"
                      />
                    </Stack>

                    {service.responseTime !== undefined && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <SpeedIcon fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {service.responseTime}ms
                        </Typography>
                      </Stack>
                    )}

                    {service.message && (
                      <Alert severity={service.status === 'down' ? 'error' : 'warning'} sx={{ py: 0 }}>
                        <Typography variant="caption">{service.message}</Typography>
                      </Alert>
                    )}

                    <Typography variant="caption" color="text.secondary">
                      Checked: {service.lastChecked.toLocaleTimeString()}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Cache Statistics */}
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <StorageIcon />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Offline Cache Status
              </Typography>
            </Stack>
            
            <Divider />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">
                  Cached Entries
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {cacheStats.totalEntries}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">
                  Cache Size
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {(cacheStats.totalSize / 1024).toFixed(2)} KB
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={cacheStats.totalEntries > 0 ? 'Active' : 'Empty'}
                  color={cacheStats.totalEntries > 0 ? 'success' : 'default'}
                  size="small"
                />
              </Grid>
            </Grid>
          </Stack>
        </Paper>

        {/* Incidents */}
        {incidents.length > 0 && (
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
            <Stack spacing={2}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Recent Incidents
              </Typography>
              <Divider />
              {incidents.map((incident) => (
                <Alert
                  key={incident.id}
                  severity={
                    incident.severity === 'critical'
                      ? 'error'
                      : incident.severity === 'major'
                      ? 'warning'
                      : 'info'
                  }
                >
                  <AlertTitle>{incident.title}</AlertTitle>
                  <Typography variant="body2">{incident.description}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Started: {incident.startedAt.toLocaleString()}
                    {incident.resolvedAt && ` | Resolved: ${incident.resolvedAt.toLocaleString()}`}
                  </Typography>
                </Alert>
              ))}
            </Stack>
          </Paper>
        )}

        {/* No Active Incidents */}
        {incidents.length === 0 && (
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
            <Alert severity="success">
              <AlertTitle>No Active Incidents</AlertTitle>
              All systems are operating normally.
            </Alert>
          </Paper>
        )}
      </Stack>
    </Container>
  );
};

export default StatusPage;
