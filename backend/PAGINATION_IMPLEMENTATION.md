# Pagination Implementation Guide

## Overview

All list endpoints now support pagination with the following query parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `sortBy` - Field to sort by (default: createdAt)
- `sortOrder` - Sort direction: 'asc' or 'desc' (default: desc)

## Response Format

When pagination parameters are provided, the response format changes:

**Without pagination:**
```json
{
  "success": true,
  "data": [...items...]
}
```

**With pagination:**
```json
{
  "success": true,
  "data": {
    "data": [...items...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

## Backward Compatibility

All endpoints maintain backward compatibility. If pagination parameters are not provided, they return all results as before.

## Implementation Status

✅ **Completed:**
- RFQs API
- Pagination utilities
- Frontend pagination components
- Frontend virtual scrolling component

🔄 **In Progress:**
- Bids API
- Payments API
- Shipments API
- Disputes API
- PurchaseRequests API

## Usage Examples

### Backend API Call
```typescript
GET /api/rfqs?page=1&limit=20&sortBy=createdAt&sortOrder=desc&status=open
```

### Frontend Hook Usage
```typescript
const pagination = usePagination({ initialLimit: 20 });
const { data } = useRFQs(filters, pagination.paginationParams);
```

### Frontend Component
```tsx
<Pagination
  page={pagination.page}
  limit={pagination.limit}
  total={paginatedData.pagination.total}
  totalPages={paginatedData.pagination.totalPages}
  onPageChange={pagination.setPage}
  onLimitChange={pagination.setLimit}
/>
```
