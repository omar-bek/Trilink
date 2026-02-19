# Frontend Pagination Implementation Guide

## Overview

All list components now support pagination with two viewing modes:
1. **Paginated View**: Traditional pagination with page numbers
2. **Infinite Scroll**: Virtual scrolling for large lists

## Components

### Pagination Component
Located at `src/components/common/Pagination.tsx`

**Props:**
- `page`: Current page number
- `limit`: Items per page
- `total`: Total number of items
- `totalPages`: Total number of pages
- `onPageChange`: Callback when page changes
- `onLimitChange`: Optional callback when limit changes
- `limitOptions`: Array of limit options (default: [10, 20, 50, 100])
- `showLimitSelector`: Show limit selector (default: true)
- `showTotal`: Show total count (default: true)

### VirtualList Component
Located at `src/components/common/VirtualList.tsx`

**Props:**
- `items`: Array of items to display
- `renderItem`: Function to render each item
- `loading`: Loading state
- `hasNextPage`: Whether more items are available
- `onLoadMore`: Callback to load more items
- `emptyMessage`: Message when no items
- `containerHeight`: Height of container (default: '100%')
- `gap`: Gap between items (default: 8)

### usePagination Hook
Located at `src/hooks/usePagination.ts`

**Usage:**
```typescript
const pagination = usePagination({ initialLimit: 20 });
// Returns: { page, limit, total, totalPages, setPage, setLimit, ... }
```

## Implementation Pattern

### 1. Update Service
```typescript
// Add PaginationParams interface
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Update service method
getItems: async (
  filters?: Filters,
  pagination?: PaginationParams
): Promise<ApiResponse<Item[] | PaginatedResponse<Item>>> => {
  const params = new URLSearchParams();
  // ... add filters
  if (pagination?.page) params.append('page', pagination.page.toString());
  if (pagination?.limit) params.append('limit', pagination.limit.toString());
  // ...
  const response = await api.get(...);
  return response.data;
}
```

### 2. Update Hook
```typescript
export const useItems = (filters?: Filters, pagination?: PaginationParams) => {
  return useQuery({
    queryKey: ['items', filters, pagination],
    queryFn: () => itemService.getItems(filters, pagination),
    staleTime: 2 * 60 * 1000,
  });
};
```

### 3. Update Component
```typescript
const pagination = usePagination({ initialLimit: 20 });
const { data, isLoading } = useItems(filters, pagination.paginationParams);

const isPaginated = data?.data && 'pagination' in data.data;
const paginatedData = isPaginated ? (data.data as PaginatedResponse<Item>) : null;
const items = paginatedData ? paginatedData.data : (data?.data || []);

// Update total when data changes
useEffect(() => {
  if (paginatedData?.pagination) {
    pagination.setTotal(paginatedData.pagination.total);
  }
}, [paginatedData, pagination]);

// Render with pagination or infinite scroll
{paginatedData ? (
  <Pagination {...paginatedData.pagination} onPageChange={pagination.setPage} />
) : (
  <VirtualList items={items} ... />
)}
```

## Status

✅ **Completed:**
- Pagination utilities (backend)
- Pagination components (frontend)
- RFQs API and component

🔄 **To Update:**
- Contracts API and component
- Bids API and component
- Payments API and component
- Shipments API and component
- Disputes API and component
- PurchaseRequests API and component

## Notes

- All APIs maintain backward compatibility (no pagination params = all results)
- Frontend components support both paginated and infinite scroll modes
- Virtual scrolling uses intersection observer for performance
- Pagination state is managed via React Query cache
