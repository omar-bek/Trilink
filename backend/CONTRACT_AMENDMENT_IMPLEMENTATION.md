# Contract Amendment Workflow Implementation

This document describes the contract amendment workflow implemented for the TriLink Platform.

## Overview

The contract amendment feature allows parties to propose changes to active contracts, track approval status, and maintain a complete history of all amendments. Amendments require approval from all parties before being applied to the contract.

## Features

- ✅ **Versioning**: Contracts maintain version numbers that increment with each amendment
- ✅ **Amendment Creation**: Create amendments for active contracts
- ✅ **Approval Workflow**: All parties must approve before amendment is applied
- ✅ **Amendment History**: Complete history stored in MongoDB
- ✅ **Original Contract Snapshot**: Each amendment stores a snapshot of the original contract
- ✅ **Status Tracking**: Track amendment status (draft, pending_approval, approved, rejected, active)

## API Endpoints

### POST /api/contracts/:id/amendments

Create a new amendment for a contract.

**Request Body:**
```json
{
  "reason": "Change in delivery timeline",
  "description": "Extending delivery date by 2 weeks due to supply chain delays",
  "changes": {
    "endDate": "2024-12-31T00:00:00Z",
    "terms": "Updated terms...",
    "amounts": {
      "total": 50000,
      "breakdown": [...]
    },
    "paymentSchedule": [...]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "contractId": "...",
    "version": 2,
    "amendmentNumber": "AMEND-001",
    "reason": "...",
    "description": "...",
    "changes": {...},
    "originalContract": {...},
    "approvals": [],
    "status": "pending_approval",
    "createdBy": {...},
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### GET /api/contracts/:id/amendments

Get all amendments for a contract.

**Query Parameters:**
- `status` (optional): Filter by status (draft, pending_approval, approved, rejected, active)

### GET /api/contracts/:id/amendments/:amendmentId

Get a specific amendment by ID.

### POST /api/contracts/:id/amendments/:amendmentId/approve

Approve or reject an amendment.

**Request Body:**
```json
{
  "approved": true,
  "comments": "Approved as discussed"
}
```

**Response:**
- If all parties approve: Amendment is automatically applied to contract
- If any party rejects: Amendment status changes to rejected

## Workflow

1. **Create Amendment**
   - User creates amendment for an active contract
   - Amendment is automatically submitted for approval (status: `pending_approval`)
   - Original contract snapshot is stored

2. **Approval Process**
   - Each party reviews and approves/rejects
   - Approval is recorded with timestamp and optional comments
   - If any party rejects, amendment is marked as rejected

3. **Apply Amendment**
   - When all parties approve:
     - Amendment status changes to `approved`
     - Amendment is automatically applied to contract
     - Contract version increments
     - Amendment status changes to `active`
     - Contract fields are updated with amendment changes

## Database Schema

### ContractAmendment Collection

```typescript
{
  contractId: ObjectId,
  version: Number,              // Amendment version (1, 2, 3...)
  amendmentNumber: String,       // Human-readable number (AMEND-001)
  reason: String,
  description: String,
  changes: {                     // Only changed fields
    terms?: String,
    amounts?: {...},
    paymentSchedule?: [...],
    startDate?: Date,
    endDate?: Date
  },
  originalContract: {            // Snapshot of original
    terms: String,
    amounts: {...},
    paymentSchedule: [...],
    startDate: Date,
    endDate: Date
  },
  approvals: [{
    partyId: ObjectId,
    userId: ObjectId,
    approved: Boolean,
    comments?: String,
    approvedAt?: Date
  }],
  status: String,                // draft, pending_approval, approved, rejected, active
  createdBy: {
    userId: ObjectId,
    companyId: ObjectId
  },
  appliedAt?: Date,
  appliedBy?: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Contract Schema Updates

- Added `version` field (default: 1, increments with each amendment)

## Implementation Details

### Amendment Status Flow

```
DRAFT → PENDING_APPROVAL → APPROVED → ACTIVE
                          ↓
                       REJECTED
```

### Version Management

- Contract version starts at 1
- Each approved amendment increments version
- Amendment version number is sequential per contract (1, 2, 3...)

### Approval Logic

- All parties must approve for amendment to be applied
- If any party rejects, amendment is rejected
- Each party can only approve/reject once
- Approval is tracked with timestamp and optional comments

### Security

- Only parties to the contract can create amendments
- Only parties to the contract can approve/reject
- Only active contracts can be amended
- Amendment history is immutable (read-only after creation)

## File Structure

```
backend/src/modules/contracts/
├── amendment.schema.ts          # Amendment MongoDB schema
├── amendment.repository.ts      # Amendment data access layer
├── schema.ts                     # Updated Contract schema (added version)
├── service.ts                    # Amendment business logic
├── controller.ts                 # Amendment HTTP handlers
├── routes.ts                     # Amendment routes
└── types.ts                      # Amendment TypeScript types
```

## Usage Examples

### Create Amendment

```typescript
POST /api/contracts/507f1f77bcf86cd799439011/amendments
Authorization: Bearer <token>

{
  "reason": "Price adjustment",
  "description": "Reducing total amount by 10%",
  "changes": {
    "amounts": {
      "total": 45000
    }
  }
}
```

### Approve Amendment

```typescript
POST /api/contracts/507f1f77bcf86cd799439011/amendments/507f1f77bcf86cd799439012/approve
Authorization: Bearer <token>

{
  "approved": true,
  "comments": "Agreed to price reduction"
}
```

### Get Amendment History

```typescript
GET /api/contracts/507f1f77bcf86cd799439011/amendments
Authorization: Bearer <token>
```

## Error Handling

### Common Errors

- **400 Bad Request**: Contract not active, invalid changes, already responded
- **403 Forbidden**: User not a party to contract
- **404 Not Found**: Contract or amendment not found

### Error Responses

```json
{
  "success": false,
  "error": "Contract cannot be amended in current status: signed",
  "requestId": "..."
}
```

## Testing

### Manual Testing

1. **Create active contract**
2. **Create amendment**
   ```bash
   POST /api/contracts/{contractId}/amendments
   ```
3. **Approve from each party**
   ```bash
   POST /api/contracts/{contractId}/amendments/{amendmentId}/approve
   ```
4. **Verify contract updated**
   ```bash
   GET /api/contracts/{contractId}
   ```
5. **Check amendment history**
   ```bash
   GET /api/contracts/{contractId}/amendments
   ```

## Future Enhancements

Potential improvements:
- [ ] Amendment templates
- [ ] Email notifications for amendment requests
- [ ] Amendment comparison view (diff)
- [ ] Amendment expiration (time-limited approvals)
- [ ] Partial approvals (approve specific changes only)
- [ ] Amendment comments/negotiation thread
- [ ] Amendment PDF generation

## Related Documentation

- [Contract Management](./README.md)
- [OpenAPI Specification](./openapi.yaml)
