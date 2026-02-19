# Database Migrations

This directory contains database migration scripts for managing schema changes and index updates.

## Running Migrations

### Add Indexes Migration

This migration adds indexes to frequently queried fields across all collections to improve query performance.

```bash
# Using ts-node
npx ts-node src/scripts/migrations/add-indexes.ts

# Or compile and run
npm run build
node dist/scripts/migrations/add-indexes.js
```

## Migration Scripts

### add-indexes.ts

Adds indexes to the following collections:
- **companies**: email, status+createdAt, createdAt
- **users**: companyId+createdAt, companyId+status+createdAt, createdAt
- **bids**: createdAt, companyId+status+createdAt, rfqId+createdAt, providerId+status+createdAt
- **contracts**: buyerCompanyId+status+createdAt, purchaseRequestId+status
- **payments**: createdAt, companyId+status+createdAt, contractId+status, buyerId+status, recipientCompanyId+status+createdAt
- **disputes**: createdAt, companyId+status+createdAt, contractId+status, raisedBy+status+createdAt
- **shipments**: createdAt, companyId+status+createdAt, contractId+status, logisticsCompanyId+status+createdAt
- **purchaserequests**: companyId+status+createdAt, buyerId+status+createdAt, approverId+status
- **rfqs**: createdAt, companyId+status+createdAt, purchaseRequestId+status, targetRole+status+createdAt

All indexes are created in the background to avoid blocking operations.

## Notes

- Migrations are idempotent - running them multiple times is safe
- Indexes are created with `background: true` to avoid blocking database operations
- Existing indexes are not dropped or recreated if they already exist
