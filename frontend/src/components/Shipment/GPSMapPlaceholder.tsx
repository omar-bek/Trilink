import { Box, Typography, Paper } from '@mui/material';
import { LocationOn } from '@mui/icons-material';
import { Shipment } from '@/types/shipment';

interface GPSMapPlaceholderProps {
  shipment: Shipment;
}

export const GPSMapPlaceholder = ({ shipment }: GPSMapPlaceholderProps) => {
  const origin = shipment.origin;
  const destination = shipment.destination;
  const currentLocation = shipment.currentLocation;

  // Calculate approximate distance (simplified)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const totalDistance = calculateDistance(
    origin.coordinates.lat,
    origin.coordinates.lng,
    destination.coordinates.lat,
    destination.coordinates.lng
  );

  const progress = currentLocation
    ? calculateDistance(
        origin.coordinates.lat,
        origin.coordinates.lng,
        currentLocation.coordinates.lat,
        currentLocation.coordinates.lng
      ) / totalDistance
    : 0;

  return (
    <Paper sx={{ p: 3, height: 400, position: 'relative', overflow: 'hidden' }}>
      {/* Map Placeholder */}
      <Box
        sx={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Origin Marker */}
        <Box
          sx={{
            position: 'absolute',
            left: '10%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <LocationOn sx={{ fontSize: 40, color: 'success.main' }} />
          <Typography variant="caption" sx={{ display: 'block', color: 'white', fontWeight: 600 }}>
            Origin
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', color: 'white', fontSize: '0.7rem' }}>
            {origin.city}
          </Typography>
        </Box>

        {/* Current Location Marker */}
        {currentLocation && (
          <Box
            sx={{
              position: 'absolute',
              left: `${10 + progress * 80}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}
          >
            <LocationOn sx={{ fontSize: 40, color: 'primary.main' }} />
            <Typography variant="caption" sx={{ display: 'block', color: 'white', fontWeight: 600 }}>
              Current
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', color: 'white', fontSize: '0.7rem' }}>
              {currentLocation.address.split(',')[0]}
            </Typography>
          </Box>
        )}

        {/* Destination Marker */}
        <Box
          sx={{
            position: 'absolute',
            right: '10%',
            top: '50%',
            transform: 'translate(50%, -50%)',
            textAlign: 'center',
          }}
        >
          <LocationOn sx={{ fontSize: 40, color: 'warning.main' }} />
          <Typography variant="caption" sx={{ display: 'block', color: 'white', fontWeight: 600 }}>
            Destination
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', color: 'white', fontSize: '0.7rem' }}>
            {destination.city}
          </Typography>
        </Box>

        {/* Route Line */}
        <Box
          sx={{
            position: 'absolute',
            left: '10%',
            right: '10%',
            top: '50%',
            height: 3,
            background: 'rgba(255, 255, 255, 0.3)',
            transform: 'translateY(-50%)',
            '&::after': currentLocation
              ? {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  width: `${progress * 100}%`,
                  height: '100%',
                  background: 'rgba(255, 255, 255, 0.8)',
                }
              : {},
          }}
        />

        {/* Info Overlay */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            right: 16,
            background: 'rgba(0, 0, 0, 0.6)',
            borderRadius: 1,
            p: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ color: 'white', display: 'block' }}>
                Total Distance: {totalDistance.toFixed(1)} km
              </Typography>
              {currentLocation && (
                <Typography variant="caption" sx={{ color: 'white', display: 'block' }}>
                  Progress: {(progress * 100).toFixed(1)}%
                </Typography>
              )}
            </Box>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Map placeholder - Integrate Google Maps/Mapbox for full functionality
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};
