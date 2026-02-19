import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { Coordinates } from '@/types/shipment';

// Dynamic import to avoid SSR issues
let MapContainer: any;
let TileLayer: any;
let Marker: any;
let Popup: any;
let Polyline: any;
let L: any;

interface ShipmentMapProps {
  origin?: { coordinates: Coordinates; address: string };
  destination?: { coordinates: Coordinates; address: string };
  currentLocation?: { coordinates: Coordinates; address: string; lastUpdated?: string };
  height?: string;
}

export const ShipmentMap = ({
  origin,
  destination,
  currentLocation,
  height = '600px',
}: ShipmentMapProps) => {
  const [isClient, setIsClient] = useState(false);
  const [mapComponents, setMapComponents] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    // Dynamically import map components and CSS
    Promise.all([
      import('react-leaflet'),
      import('leaflet'),
      import('leaflet/dist/leaflet.css'),
    ]).then(([reactLeaflet, leaflet]) => {
      MapContainer = reactLeaflet.MapContainer;
      TileLayer = reactLeaflet.TileLayer;
      Marker = reactLeaflet.Marker;
      Popup = reactLeaflet.Popup;
      Polyline = reactLeaflet.Polyline;
      L = leaflet.default;
      // Fix for default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
      setMapComponents({ MapContainer, TileLayer, Marker, Popup, Polyline, L });
    });
  }, []);

  if (!isClient || !mapComponents) {
    return (
      <Box
        sx={{
          height,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1A2332',
          borderRadius: 2,
        }}
      >
        <Box sx={{ textAlign: 'center', color: '#CBD5E1' }}>
          Loading map...
        </Box>
      </Box>
    );
  }

  const { MapContainer: Map, TileLayer: Tiles, Marker: Mark, Popup: Pop, Polyline: Line } = mapComponents;

  // Get map center
  const getMapCenter = (): [number, number] => {
    if (currentLocation?.coordinates) {
      return [currentLocation.coordinates.lat, currentLocation.coordinates.lng];
    }
    if (origin?.coordinates) {
      return [origin.coordinates.lat, origin.coordinates.lng];
    }
    return [25.2048, 55.2708]; // Default to Dubai
  };

  // Get route polyline points
  const getRoutePoints = (): [number, number][] => {
    const points: [number, number][] = [];
    if (origin?.coordinates) {
      points.push([origin.coordinates.lat, origin.coordinates.lng]);
    }
    if (currentLocation?.coordinates) {
      points.push([currentLocation.coordinates.lat, currentLocation.coordinates.lng]);
    }
    if (destination?.coordinates) {
      points.push([destination.coordinates.lat, destination.coordinates.lng]);
    }
    return points;
  };

  const routePoints = getRoutePoints();
  const center = getMapCenter();

  // Create custom icons
  const redIcon = L.icon({
    iconUrl:
      'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const greenIcon = L.icon({
    iconUrl:
      'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  return (
    <Box sx={{ height, width: '100%', position: 'relative' }}>
      <Map center={center} zoom={6} style={{ height: '100%', width: '100%', zIndex: 0 }}>
        <Tiles
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {/* Origin Marker */}
        {origin?.coordinates && (
          <Mark position={[origin.coordinates.lat, origin.coordinates.lng]}>
            <Pop>
              <Box>
                <strong>Origin</strong>
                <br />
                {origin.address}
              </Box>
            </Pop>
          </Mark>
        )}
        {/* Current Location Marker */}
        {currentLocation?.coordinates && (
          <Mark position={[currentLocation.coordinates.lat, currentLocation.coordinates.lng]} icon={redIcon}>
            <Pop>
              <Box>
                <strong>Current Location</strong>
                <br />
                {currentLocation.address}
              </Box>
            </Pop>
          </Mark>
        )}
        {/* Destination Marker */}
        {destination?.coordinates && (
          <Mark position={[destination.coordinates.lat, destination.coordinates.lng]} icon={greenIcon}>
            <Pop>
              <Box>
                <strong>Destination</strong>
                <br />
                {destination.address}
              </Box>
            </Pop>
          </Mark>
        )}
        {/* Route Polyline */}
        {routePoints.length > 1 && (
          <Line
            positions={routePoints}
            pathOptions={{ color: '#00A8FF', weight: 3, opacity: 0.7 }}
          />
        )}
      </Map>
    </Box>
  );
};
