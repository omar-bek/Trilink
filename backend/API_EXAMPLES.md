# TriLink Platform API Examples

## Authentication

### Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "buyer@uae.gov.ae",
  "password": "Password123!",
  "role": "Buyer",
  "companyId": "company_id_here",
  "firstName": "Ahmed",
  "lastName": "Al-Mansoori"
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "buyer@uae.gov.ae",
  "password": "Password123!"
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "buyer@uae.gov.ae",
      "role": "Buyer",
      "companyId": "..."
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Refresh Token
```bash
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your_refresh_token_here"
}
```

## Purchase Requests

### Create Purchase Request
```bash
POST /api/purchase-requests
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Office Equipment Procurement",
  "description": "Procurement of office equipment for government building",
  "items": [
    {
      "name": "Desktop Computers",
      "quantity": 50,
      "unit": "units",
      "specifications": "Intel i7, 16GB RAM, 512GB SSD",
      "estimatedPrice": 3000
    }
  ],
  "budget": 150000,
  "currency": "AED",
  "deliveryLocation": {
    "address": "Government Building, Al Karamah",
    "city": "Abu Dhabi",
    "state": "Abu Dhabi",
    "country": "UAE",
    "zipCode": "00000",
    "coordinates": {
      "lat": 24.4539,
      "lng": 54.3773
    }
  },
  "requiredDeliveryDate": "2024-12-31"
}
```

### Approve Purchase Request (Auto-generates RFQs)
```bash
POST /api/purchase-requests/:id/approve
Authorization: Bearer <access_token>
```

## RFQs

### Get Available RFQs (for Providers)
```bash
GET /api/rfqs/available?targetCompanyType=Supplier&status=open
Authorization: Bearer <access_token>
```

### Get RFQs by Purchase Request
```bash
GET /api/rfqs/purchase-request/:purchaseRequestId
Authorization: Bearer <access_token>
```

## Bids

### Submit Bid
```bash
POST /api/bids
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "rfqId": "rfq_id_here",
  "price": 140000,
  "currency": "AED",
  "terms": "30 days payment terms, warranty included",
  "deliveryTime": 45,
  "deliveryDate": "2024-12-15",
  "isAnonymous": false
}
```

### Evaluate Bid
```bash
POST /api/bids/:id/evaluate
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "status": "accepted",
  "notes": "Best price and delivery time"
}
```

## Contracts

### Create Contract
```bash
POST /api/contracts
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "purchaseRequestId": "pr_id_here",
  "parties": [
    {
      "companyId": "supplier_company_id",
      "userId": "supplier_user_id",
      "role": "Supplier",
      "bidId": "accepted_bid_id"
    },
    {
      "companyId": "logistics_company_id",
      "userId": "logistics_user_id",
      "role": "Logistics",
      "bidId": "accepted_logistics_bid_id"
    }
  ],
  "amounts": {
    "total": 140000,
    "currency": "AED",
    "breakdown": [
      {
        "partyId": "supplier_company_id",
        "amount": 120000,
        "description": "Equipment supply"
      },
      {
        "partyId": "logistics_company_id",
        "amount": 20000,
        "description": "Shipping and logistics"
      }
    ]
  },
  "paymentSchedule": [
    {
      "milestone": "Order Confirmation",
      "amount": 50000,
      "dueDate": "2024-11-01"
    },
    {
      "milestone": "Delivery",
      "amount": 90000,
      "dueDate": "2024-12-15"
    }
  ],
  "terms": "Standard procurement terms and conditions",
  "startDate": "2024-11-01",
  "endDate": "2024-12-31"
}
```

### Sign Contract
```bash
POST /api/contracts/:id/sign
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "signature": "digital_signature_hash_here"
}
```

## Shipments

### Create Shipment
```bash
POST /api/shipments
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "contractId": "contract_id_here",
  "logisticsCompanyId": "logistics_company_id",
  "origin": {
    "address": "Supplier Warehouse, Dubai",
    "city": "Dubai",
    "country": "UAE",
    "coordinates": {
      "lat": 25.2048,
      "lng": 55.2708
    }
  },
  "destination": {
    "address": "Government Building, Abu Dhabi",
    "city": "Abu Dhabi",
    "country": "UAE",
    "coordinates": {
      "lat": 24.4539,
      "lng": 54.3773
    }
  },
  "estimatedDeliveryDate": "2024-12-15"
}
```

### Update GPS Location (Real-time)
```bash
PATCH /api/shipments/:id/location
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "coordinates": {
    "lat": 24.5000,
    "lng": 54.4000
  },
  "address": "Highway E11, Abu Dhabi"
}
```

### Update Shipment Status
```bash
PATCH /api/shipments/:id/status
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "status": "in_transit",
  "description": "Shipment departed from origin warehouse",
  "location": {
    "address": "Highway E11",
    "coordinates": {
      "lat": 24.5000,
      "lng": 54.4000
    }
  }
}
```

## Payments

### Create Payment
```bash
POST /api/payments
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "contractId": "contract_id_here",
  "recipientCompanyId": "supplier_company_id",
  "milestone": "Order Confirmation",
  "amount": 50000,
  "currency": "AED",
  "dueDate": "2024-11-01",
  "notes": "First milestone payment"
}
```

### Process Payment
```bash
POST /api/payments/:id/process
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "paymentMethod": "bank_transfer",
  "transactionId": "TXN-123456789",
  "notes": "Payment processed successfully"
}
```

## Disputes

### Create Dispute
```bash
POST /api/disputes
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "contractId": "contract_id_here",
  "againstCompanyId": "supplier_company_id",
  "type": "Quality",
  "description": "Delivered items do not meet specifications",
  "attachments": [
    {
      "type": "image",
      "url": "https://example.com/evidence.jpg"
    }
  ]
}
```

### Escalate to Government
```bash
POST /api/disputes/:id/escalate
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "governmentNotes": "Requires government intervention"
}
```

## Analytics

### Government Analytics
```bash
GET /api/analytics/government
Authorization: Bearer <access_token>
```

### Company Analytics
```bash
GET /api/analytics/company
Authorization: Bearer <access_token>
```

## Socket.io Real-Time Tracking

### Connect to Shipment Tracking
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/shipments', {
  auth: {
    token: 'your_access_token_here'
  }
});

// Join shipment room
socket.emit('join-shipment', 'shipment_id_here');

// Listen for GPS updates
socket.on('gps-updated', (data) => {
  console.log('GPS Updated:', data);
  // {
  //   shipmentId: "...",
  //   location: {
  //     coordinates: { lat: 24.5000, lng: 54.4000 },
  //     address: "Highway E11"
  //   },
  //   timestamp: "2024-01-15T10:30:00Z"
  // }
});

// Update GPS location (Logistics role only)
socket.emit('update-gps', {
  shipmentId: 'shipment_id_here',
  location: {
    coordinates: {
      lat: 24.5000,
      lng: 54.4000
    },
    address: 'Highway E11, Abu Dhabi'
  }
});
```

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "error": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "requestId": "uuid-request-id"
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (Validation error)
- `401` - Unauthorized (Authentication required)
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (Rate limit exceeded)
- `500` - Internal Server Error
