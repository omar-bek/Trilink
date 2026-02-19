# MongoDB Indexes Documentation

This document describes all MongoDB indexes added to optimize query performance across the TriLink platform.

## Overview

Indexes have been added to frequently queried fields and common query patterns to improve:
- Query performance
- Sorting operations
- Filtering by status and date ranges
- Company isolation queries
- User-specific queries

## Index Strategy

### Single Field Indexes
- **createdAt**: Added to all collections for date-based sorting and filtering
- **email**: Added to companies collection for email lookups
- **status**: Already indexed in most collections

### Compound Indexes
Compound indexes are created for common query patterns:
- `{ companyId: 1, status: 1, createdAt: -1 }` - Company-scoped queries filtered by status, sorted by date
- `{ companyId: 1, createdAt: -1 }` - Company-scoped queries sorted by date
- `{ status: 1, createdAt: -1 }` - Status-filtered queries sorted by date

## Collection-Specific Indexes

### Companies (`companies`)
- `{ email: 1 }` - Email lookups
- `{ status: 1, createdAt: -1 }` - Status filtering with date sorting
- `{ createdAt: -1 }` - Date-based queries

### Users (`users`)
- `{ companyId: 1, createdAt: -1 }` - Company users sorted by creation date
- `{ companyId: 1, status: 1, createdAt: -1 }` - Company users filtered by status, sorted by date
- `{ createdAt: -1 }` - Date-based queries
- Existing: `{ companyId: 1, email: 1 }`, `{ companyId: 1, status: 1 }`

### Bids (`bids`)
- `{ createdAt: -1 }` - Date-based queries
- `{ companyId: 1, status: 1, createdAt: -1 }` - Company bids filtered by status, sorted by date
- `{ rfqId: 1, createdAt: -1 }` - RFQ bids sorted by creation date
- `{ providerId: 1, status: 1, createdAt: -1 }` - Provider bids filtered by status, sorted by date
- Existing: `{ rfqId: 1, status: 1 }`, `{ companyId: 1 }`, `{ providerId: 1 }`, `{ aiScore: -1 }`, `{ rfqId: 1, companyId: 1 }`, `{ validity: 1 }`

### Contracts (`contracts`)
- `{ buyerCompanyId: 1, status: 1, createdAt: -1 }` - Buyer contracts filtered by status, sorted by date
- `{ purchaseRequestId: 1, status: 1 }` - Purchase request contracts filtered by status
- Existing: `{ buyerCompanyId: 1, status: 1 }`, `{ purchaseRequestId: 1 }`, `{ 'parties.companyId': 1 }`, `{ 'amounts.total': 1 }`, `{ startDate: 1, endDate: 1 }`, `{ createdAt: -1 }`

### Payments (`payments`)
- `{ createdAt: -1 }` - Date-based queries
- `{ companyId: 1, status: 1, createdAt: -1 }` - Company payments filtered by status, sorted by date
- `{ contractId: 1, status: 1 }` - Contract payments filtered by status
- `{ buyerId: 1, status: 1 }` - Buyer payments filtered by status
- `{ recipientCompanyId: 1, status: 1, createdAt: -1 }` - Recipient payments filtered by status, sorted by date
- Existing: `{ companyId: 1, status: 1 }`, `{ contractId: 1 }`, `{ recipientCompanyId: 1 }`, `{ dueDate: 1 }`

### Disputes (`disputes`)
- `{ createdAt: -1 }` - Date-based queries
- `{ companyId: 1, status: 1, createdAt: -1 }` - Company disputes filtered by status, sorted by date
- `{ contractId: 1, status: 1 }` - Contract disputes filtered by status
- `{ raisedBy: 1, status: 1, createdAt: -1 }` - User disputes filtered by status, sorted by date
- Existing: `{ companyId: 1, status: 1 }`, `{ contractId: 1 }`, `{ escalatedToGovernment: 1 }`, `{ assignedTo: 1, status: 1 }`

### Shipments (`shipments`)
- `{ createdAt: -1 }` - Date-based queries
- `{ companyId: 1, status: 1, createdAt: -1 }` - Company shipments filtered by status, sorted by date
- `{ contractId: 1, status: 1 }` - Contract shipments filtered by status
- `{ logisticsCompanyId: 1, status: 1, createdAt: -1 }` - Logistics company shipments filtered by status, sorted by date
- Existing: `{ companyId: 1, status: 1 }`, `{ contractId: 1 }`, `{ logisticsCompanyId: 1 }`, `{ 'currentLocation.coordinates': '2dsphere' }`, `{ inspectionStatus: 1 }`

### Purchase Requests (`purchaserequests`)
- `{ companyId: 1, status: 1, createdAt: -1 }` - Company purchase requests filtered by status, sorted by date
- `{ buyerId: 1, status: 1, createdAt: -1 }` - Buyer purchase requests filtered by status, sorted by date
- `{ approverId: 1, status: 1 }` - Approver purchase requests filtered by status
- Existing: `{ companyId: 1, status: 1 }`, `{ buyerId: 1 }`, `{ createdAt: -1 }`

### RFQs (`rfqs`)
- `{ createdAt: -1 }` - Date-based queries
- `{ companyId: 1, status: 1, createdAt: -1 }` - Company RFQs filtered by status, sorted by date
- `{ purchaseRequestId: 1, status: 1 }` - Purchase request RFQs filtered by status
- `{ targetRole: 1, status: 1, createdAt: -1 }` - Role-targeted RFQs filtered by status, sorted by date
- Existing: `{ companyId: 1, status: 1 }`, `{ purchaseRequestId: 1 }`, `{ type: 1, status: 1 }`, `{ targetRole: 1, status: 1 }`, `{ deadline: 1 }`

## Running Migrations

To apply these indexes to your database:

```bash
npm run migrate:indexes
```

Or directly:
```bash
npx ts-node src/scripts/migrations/add-indexes.ts
```

## Index Creation Notes

- All indexes are created with `background: true` to avoid blocking database operations
- Migrations are idempotent - running them multiple times is safe
- Existing indexes are not dropped or recreated if they already exist
- Index creation may take some time on large collections

## Query Performance Benefits

These indexes optimize the following common query patterns:

1. **Company-scoped queries**: `find({ companyId: X, status: Y }).sort({ createdAt: -1 })`
2. **User-specific queries**: `find({ buyerId: X, status: Y }).sort({ createdAt: -1 })`
3. **Date-based sorting**: `find({ ... }).sort({ createdAt: -1 })`
4. **Status filtering**: `find({ status: X, ... })`
5. **Relationship queries**: `find({ purchaseRequestId: X, contractId: Y, rfqId: Z })`

## Monitoring Index Usage

To monitor index usage in MongoDB:

```javascript
// Check index usage statistics
db.collection.getIndexes()
db.collection.aggregate([{ $indexStats: {} }])

// Explain query plan
db.collection.find({ ... }).explain("executionStats")
```

## Maintenance

- Regularly review index usage and remove unused indexes
- Monitor index size and impact on write performance
- Consider partial indexes for frequently filtered fields (e.g., `deletedAt: null`)
