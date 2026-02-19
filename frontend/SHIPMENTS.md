# Shipment Tracking UI Implementation

## Overview

Complete Shipment tracking UI with real-time status updates via WebSocket, GPS map placeholder, timeline view, and shipment management.

## Features

### ✅ Shipment List
- Filterable list of shipments
- Status filtering
- Search functionality
- Live tracking indicators
- Real-time updates

### ✅ Shipment Details
- Complete shipment information
- GPS map placeholder with route visualization
- Real-time timeline
- Current location display
- Origin and destination details

### ✅ Real-time Status Updates (WebSocket)
- Socket.io client integration
- Automatic subscription to shipment updates
- Status change notifications
- GPS location updates
- Optimistic UI updates

### ✅ GPS Map Placeholder
- Visual route representation
- Origin, destination, and current location markers
- Progress calculation
- Distance display
- Ready for Google Maps/Mapbox integration

### ✅ Timeline View
- Chronological tracking events
- Status icons per event
- Location information
- Event descriptions
- Color-coded by status

## Components

### ShipmentStatusBadge
Status badge component with color coding.

```tsx
<ShipmentStatusBadge status={ShipmentStatus.IN_TRANSIT} />
```

**Status Colors:**
- In Production: Gray
- Ready for Pickup: Blue
- In Transit: Primary Blue
- In Clearance: Yellow
- Delivered: Green
- Cancelled: Red

### ShipmentTimeline
Timeline component showing tracking events.

```tsx
<ShipmentTimeline shipment={shipment} />
```

**Features:**
- Chronological event display
- Status icons
- Location information
- Event descriptions
- Color-coded by status

### GPSMapPlaceholder
Map placeholder component with route visualization.

```tsx
<GPSMapPlaceholder shipment={shipment} />
```

**Features:**
- Origin marker (green)
- Destination marker (yellow)
- Current location marker (blue)
- Route line with progress
- Distance calculation
- Progress percentage

### ShipmentListItem
Card component for shipment list display.

```tsx
<ShipmentListItem shipment={shipment} />
```

## Pages

### ShipmentList
- Route: `/shipments`
- Features: List, search, status filter
- Access: All authenticated users

### ShipmentDetails
- Route: `/shipments/:id`
- Features: Full details, map, timeline, real-time updates
- Access: All authenticated users (filtered by company)

## API Integration

### Service (`shipment.service.ts`)
- `getShipments(filters?)` - List shipments
- `getShipmentById(id)` - Get single shipment

### React Query Hooks (`useShipments.ts`)
- `useShipments(filters?)` - List query (refetches every 30s)
- `useShipment(id)` - Single shipment query (refetches every 30s)

### Socket Service (`socket.service.ts`)
- `connect(token)` - Connect to WebSocket server
- `disconnect()` - Disconnect from server
- `subscribeToShipment(shipmentId, callbacks)` - Subscribe to updates
- `unsubscribeFromShipment(shipmentId)` - Unsubscribe from updates
- `isConnected()` - Check connection status

### Socket Hook (`useShipmentSocket.ts`)
- Automatically subscribes to shipment updates
- Handles status and location updates
- Updates React Query cache
- Cleans up on unmount

## WebSocket Integration

### Connection Flow

1. **Initial Connection**: Socket connects on app initialization if token exists
2. **Auth Changes**: Socket connects/disconnects based on auth state
3. **Shipment Subscription**: When viewing shipment details, subscribes to updates
4. **Event Handling**: Listens for `shipment:{id}:status` and `shipment:{id}:location` events
5. **Cache Updates**: Updates React Query cache on events

### Socket Events

**Client → Server:**
- `subscribe:shipment` - Subscribe to shipment updates
- `unsubscribe:shipment` - Unsubscribe from shipment updates

**Server → Client:**
- `shipment:{shipmentId}:status` - Status update event
- `shipment:{shipmentId}:location` - GPS location update event

### Real-time Updates

- **Status Updates**: Invalidates queries to refetch latest data
- **Location Updates**: Optimistically updates current location in cache
- **Automatic Refetch**: React Query refetches every 30 seconds as fallback

## Usage Examples

### Shipment List

```tsx
import { ShipmentList } from '@/pages/Shipments';

<ProtectedRoute>
  <MainLayout>
    <ShipmentList />
  </MainLayout>
</ProtectedRoute>
```

### Shipment Details with Real-time Updates

```tsx
import { ShipmentDetails } from '@/pages/Shipments';

// Real-time updates are automatically handled by useShipmentSocket hook
<ProtectedRoute>
  <MainLayout>
    <ShipmentDetails />
  </MainLayout>
</ProtectedRoute>
```

### Using Hooks

```tsx
import { useShipments, useShipment } from '@/hooks/useShipments';
import { useShipmentSocket } from '@/hooks/useShipmentSocket';

const { data } = useShipments({ status: ShipmentStatus.IN_TRANSIT });
const { data: shipment } = useShipment(shipmentId);

// Real-time updates (automatically subscribes)
useShipmentSocket(shipmentId);
```

## Shipment Status Workflow

1. **In Production**: Items being produced/prepared
2. **Ready for Pickup**: Ready for logistics pickup
3. **In Transit**: In transit to destination
4. **In Clearance**: At customs/clearance
5. **Delivered**: Successfully delivered
6. **Cancelled**: Cancelled shipment

## GPS Map Placeholder

### Features

- **Visual Route**: Shows origin → destination route
- **Markers**: Origin (green), Current (blue), Destination (yellow)
- **Progress Line**: Visual progress indicator
- **Distance Calculation**: Calculates total distance
- **Progress Percentage**: Shows completion percentage

### Integration Ready

The placeholder is designed to be easily replaced with:
- Google Maps API
- Mapbox GL JS
- Leaflet
- Any other mapping library

## Timeline Features

- **Chronological Order**: Events sorted by timestamp (newest first)
- **Status Icons**: Different icons per status
- **Location Display**: Shows location address when available
- **Event Descriptions**: Full description of each event
- **Color Coding**: Current status highlighted, completed in green

## Routes

- `GET /api/shipments` - List shipments
- `GET /api/shipments/:id` - Get shipment by ID
- `PATCH /api/shipments/:id/status` - Update shipment status
- `PATCH /api/shipments/:id/location` - Update GPS location

## Socket.io Setup

### Backend Requirements

The backend should implement Socket.io server with:
- Authentication middleware (JWT token)
- Room-based subscriptions (`shipment:{id}`)
- Event emission on status/location updates

### Frontend Configuration

Socket connects to `VITE_API_URL` (defaults to `http://localhost:3000`).

## Best Practices

1. **Real-time Updates**: Use WebSocket for instant updates
2. **Fallback Polling**: React Query refetches every 30s as fallback
3. **Optimistic Updates**: Update cache immediately for location updates
4. **Cleanup**: Always unsubscribe on component unmount
5. **Error Handling**: Handle socket connection errors gracefully
6. **Reconnection**: Socket.io handles reconnection automatically

## Future Enhancements

- [ ] Google Maps/Mapbox integration
- [ ] Real-time route visualization
- [ ] Push notifications for status changes
- [ ] Shipment creation form
- [ ] Bulk shipment operations
- [ ] Export tracking data
- [ ] Email/SMS notifications
- [ ] Delivery proof upload
- [ ] Shipment analytics
- [ ] Estimated time of arrival (ETA) calculations
- [ ] Multi-stop route support
- [ ] Driver assignment
- [ ] Vehicle tracking integration
