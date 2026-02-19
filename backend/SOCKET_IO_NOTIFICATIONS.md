# Socket.io Real-Time Notifications

This document describes the Socket.io real-time notification system for the TriLink Platform.

## Overview

Socket.io provides real-time, bidirectional communication between the server and clients. The system uses namespaces to organize different types of events and rooms for targeted message delivery.

## Architecture

### Namespaces

The system uses multiple namespaces for different event types:

- `/bids` - Bid-related events
- `/contracts` - Contract-related events
- `/payments` - Payment-related events
- `/disputes` - Dispute-related events
- `/shipments` - Shipment tracking events (existing)

### Rooms

Clients automatically join rooms based on their context:

- `company:{companyId}` - All users from a company
- `user:{userId}` - Specific user
- `contract:{contractId}` - Contract-specific room
- `rfq:{rfqId}` - RFQ-specific room
- `dispute:{disputeId}` - Dispute-specific room
- `shipment:{shipmentId}` - Shipment-specific room

## Authentication

All Socket.io connections require JWT authentication:

```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-access-token-here'
  }
});
```

## Client Connection Examples

### Basic Connection

```javascript
import io from 'socket.io-client';

// Connect to a namespace
const bidsSocket = io('http://localhost:3000/bids', {
  auth: {
    token: localStorage.getItem('accessToken')
  }
});

bidsSocket.on('connect', () => {
  console.log('Connected to bids namespace');
});

bidsSocket.on('disconnect', () => {
  console.log('Disconnected from bids namespace');
});
```

### Bids Namespace

```javascript
const bidsSocket = io('http://localhost:3000/bids', {
  auth: { token: accessToken }
});

// Join RFQ room to receive bid notifications
bidsSocket.emit('join-rfq', rfqId);

// Listen for bid events
bidsSocket.on('bid:submitted', (payload) => {
  console.log('New bid submitted:', payload.data);
});

bidsSocket.on('bid:accepted', (payload) => {
  console.log('Bid accepted:', payload.data);
});

bidsSocket.on('bid:rejected', (payload) => {
  console.log('Bid rejected:', payload.data);
});

bidsSocket.on('bid:withdrawn', (payload) => {
  console.log('Bid withdrawn:', payload.data);
});

// Leave RFQ room
bidsSocket.emit('leave-rfq', rfqId);
```

### Contracts Namespace

```javascript
const contractsSocket = io('http://localhost:3000/contracts', {
  auth: { token: accessToken }
});

// Join contract room
contractsSocket.emit('join-contract', contractId);

// Listen for contract events
contractsSocket.on('contract:signed', (payload) => {
  console.log('Contract signed:', payload.data);
  // payload.data contains:
  // - contractId
  // - signedBy (if partial signature)
  // - allPartiesSigned (if all signed)
  // - signaturesCount, totalParties
});

contractsSocket.on('contract:activated', (payload) => {
  console.log('Contract activated:', payload.data);
});

contractsSocket.on('contract:amendment:created', (payload) => {
  console.log('Amendment created:', payload.data);
});

contractsSocket.on('contract:amendment:approved', (payload) => {
  console.log('Amendment approved:', payload.data);
});

contractsSocket.on('contract:amendment:rejected', (payload) => {
  console.log('Amendment rejected:', payload.data);
});

contractsSocket.emit('leave-contract', contractId);
```

### Payments Namespace

```javascript
const paymentsSocket = io('http://localhost:3000/payments', {
  auth: { token: accessToken }
});

// Join contract room for payment notifications
paymentsSocket.emit('join-contract', contractId);

// Listen for payment events
paymentsSocket.on('payment:created', (payload) => {
  console.log('Payment created:', payload.data);
});

paymentsSocket.on('payment:approved', (payload) => {
  console.log('Payment approved:', payload.data);
});

paymentsSocket.on('payment:rejected', (payload) => {
  console.log('Payment rejected:', payload.data);
});

paymentsSocket.on('payment:processed', (payload) => {
  console.log('Payment processed:', payload.data);
});

paymentsSocket.on('payment:completed', (payload) => {
  console.log('Payment completed:', payload.data);
});
```

### Disputes Namespace

```javascript
const disputesSocket = io('http://localhost:3000/disputes', {
  auth: { token: accessToken }
});

// Join dispute room
disputesSocket.emit('join-dispute', disputeId);

// Listen for dispute events
disputesSocket.on('dispute:created', (payload) => {
  console.log('Dispute created:', payload.data);
});

disputesSocket.on('dispute:escalated', (payload) => {
  console.log('Dispute escalated to government:', payload.data);
  // Government users receive this in their company room
});

disputesSocket.on('dispute:resolved', (payload) => {
  console.log('Dispute resolved:', payload.data);
});

disputesSocket.emit('leave-dispute', disputeId);
```

## Event Types

### Bid Events

- `bid:submitted` - New bid submitted for an RFQ
- `bid:accepted` - Bid accepted by buyer
- `bid:rejected` - Bid rejected by buyer
- `bid:withdrawn` - Bid withdrawn by provider
- `bid:updated` - Bid updated

**Recipients:**
- `bid:submitted` → Buyer company
- `bid:accepted/rejected` → Buyer and Provider companies
- `bid:withdrawn` → Buyer company

### Contract Events

- `contract:signed` - Contract signed (partial or complete)
- `contract:activated` - Contract activated after all signatures
- `contract:amendment:created` - Amendment created
- `contract:amendment:approved` - Amendment approved (partial or complete)
- `contract:amendment:rejected` - Amendment rejected

**Recipients:**
- All contract parties receive contract events
- Amendment events sent to all parties

### Payment Events

- `payment:created` - New payment created
- `payment:approved` - Payment approved by buyer
- `payment:rejected` - Payment rejected by buyer
- `payment:processed` - Payment processing started
- `payment:completed` - Payment completed

**Recipients:**
- Buyer and recipient companies receive payment events

### Dispute Events

- `dispute:created` - New dispute created
- `dispute:escalated` - Dispute escalated to government
- `dispute:resolved` - Dispute resolved by government
- `dispute:updated` - Dispute updated

**Recipients:**
- `dispute:created` → Companies involved in dispute
- `dispute:escalated` → Companies involved + Government users (broadcast)
- `dispute:resolved` → Companies involved

## Event Payload Structure

All events follow this structure:

```typescript
{
  event: SocketEvent,        // Event type (e.g., 'bid:submitted')
  data: {                    // Event-specific data
    // ... event data
  },
  timestamp: Date           // Event timestamp
}
```

### Example Payloads

**Bid Submitted:**
```json
{
  "event": "bid:submitted",
  "data": {
    "bidId": "507f1f77bcf86cd799439011",
    "rfqId": "507f1f77bcf86cd799439012",
    "companyId": "507f1f77bcf86cd799439013",
    "providerId": "507f1f77bcf86cd799439014",
    "price": 50000,
    "currency": "AED",
    "status": "submitted",
    "rfqTitle": "Office Supplies RFQ"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Contract Signed:**
```json
{
  "event": "contract:signed",
  "data": {
    "contractId": "507f1f77bcf86cd799439011",
    "purchaseRequestId": "507f1f77bcf86cd799439012",
    "buyerCompanyId": "507f1f77bcf86cd799439013",
    "signedBy": {
      "companyId": "507f1f77bcf86cd799439014",
      "userId": "507f1f77bcf86cd799439015"
    },
    "signaturesCount": 2,
    "totalParties": 3,
    "allPartiesSigned": false,
    "status": "pending_signatures"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Payment Approved:**
```json
{
  "event": "payment:approved",
  "data": {
    "paymentId": "507f1f77bcf86cd799439011",
    "contractId": "507f1f77bcf86cd799439012",
    "companyId": "507f1f77bcf86cd799439013",
    "recipientCompanyId": "507f1f77bcf86cd799439014",
    "amount": 15000,
    "currency": "AED",
    "status": "approved",
    "milestone": "Initial Payment",
    "approvedBy": "507f1f77bcf86cd799439015",
    "notes": "Approved as discussed"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Dispute Escalated:**
```json
{
  "event": "dispute:escalated",
  "data": {
    "disputeId": "507f1f77bcf86cd799439011",
    "contractId": "507f1f77bcf86cd799439012",
    "companyId": "507f1f77bcf86cd799439013",
    "againstCompanyId": "507f1f77bcf86cd799439014",
    "type": "Quality",
    "status": "escalated",
    "escalatedToGovernment": true,
    "governmentNotes": "Escalated for review"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Automatic Room Subscriptions

When a client connects to any namespace, they automatically join:

1. **Company Room**: `company:{companyId}` - Receives all events for their company
2. **User Room**: `user:{userId}` - Receives user-specific events

These rooms are joined automatically on connection, so clients don't need to explicitly join them.

## Manual Room Subscriptions

Clients can also manually join specific rooms:

- `join-rfq` - Join RFQ room for bid notifications
- `join-contract` - Join contract room for contract/payment notifications
- `join-dispute` - Join dispute room for dispute notifications
- `join-shipment` - Join shipment room for tracking updates

## Error Handling

Socket.io emits error events:

```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error.message);
  // Handle error (e.g., re-authenticate, reconnect)
});
```

Common errors:
- `Authentication token required` - No token provided
- `Invalid authentication token` - Token expired or invalid
- `Permission denied` - User doesn't have permission
- `Resource not found` - Resource doesn't exist

## Reconnection

Socket.io automatically handles reconnection:

```javascript
socket.on('connect', () => {
  console.log('Connected');
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  // Socket.io will automatically attempt to reconnect
});

socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts');
  // Rejoin rooms if needed
  socket.emit('join-contract', contractId);
});
```

## Best Practices

1. **Token Management**
   - Store access token securely
   - Refresh token before expiration
   - Handle token expiration gracefully

2. **Room Management**
   - Join rooms only when needed
   - Leave rooms when no longer needed
   - Rejoin rooms after reconnection

3. **Event Handling**
   - Handle all event types your app needs
   - Update UI reactively based on events
   - Show notifications to users

4. **Error Handling**
   - Always handle error events
   - Implement retry logic for critical operations
   - Log errors for debugging

5. **Performance**
   - Don't subscribe to unnecessary rooms
   - Clean up event listeners on component unmount
   - Use debouncing for rapid events

## React Hook Example

```typescript
import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

export const useSocket = (namespace: string, token: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(`http://localhost:3000/${namespace}`, {
      auth: { token }
    });

    newSocket.on('connect', () => {
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [namespace, token]);

  return { socket, connected };
};

// Usage
const { socket, connected } = useSocket('bids', accessToken);

useEffect(() => {
  if (!socket) return;

  socket.emit('join-rfq', rfqId);
  socket.on('bid:submitted', handleBidSubmitted);

  return () => {
    socket.emit('leave-rfq', rfqId);
    socket.off('bid:submitted', handleBidSubmitted);
  };
}, [socket, rfqId]);
```

## Testing

### Manual Testing

1. **Start server**
   ```bash
   npm run dev
   ```

2. **Connect client**
   ```javascript
   const socket = io('http://localhost:3000/bids', {
     auth: { token: 'your-token' }
   });
   ```

3. **Trigger events**
   - Create a bid → Should receive `bid:submitted`
   - Accept a bid → Should receive `bid:accepted`
   - Sign a contract → Should receive `contract:signed`
   - Approve payment → Should receive `payment:approved`
   - Escalate dispute → Should receive `dispute:escalated`

### Debugging

Enable Socket.io debug logs:

```bash
DEBUG=socket.io:* npm run dev
```

## Security Considerations

1. **Authentication**: All connections require valid JWT tokens
2. **Authorization**: Room access is verified before joining
3. **Company Isolation**: Users only receive events for their company
4. **Rate Limiting**: Consider implementing rate limiting for socket events

## Related Documentation

- [Socket.io Documentation](https://socket.io/docs/v4/)
- [Authentication Guide](./README.md)
- [API Documentation](./openapi.yaml)
