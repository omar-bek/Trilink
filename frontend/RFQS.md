# RFQ Pages Implementation

## Overview

Complete RFQ (Request for Quotation) UI implementation with role-based filtering, deadline countdown, and anonymous mode indicator.

## Features

### ✅ RFQ List Page
- Role-based filtering (Buyers see their RFQs, Providers see available RFQs)
- Status filtering (Draft, Open, Closed, Cancelled)
- Type filtering (Supplier, Logistics, Clearance, Service Provider)
- Search functionality
- Deadline countdown for open RFQs
- Anonymous mode indicator
- Responsive card layout

### ✅ RFQ Details Page
- Complete RFQ information
- Items list with specifications
- Budget and delivery details
- Deadline countdown (live updates)
- Anonymous mode indicator
- Action button for providers (Submit Bid)
- Role-aware display

### ✅ Deadline Countdown
- Real-time countdown timer
- Color-coded by urgency:
  - Red: Expired or < 24 hours
  - Yellow: < 3 days
  - Default: > 3 days
- Updates every second
- Shows days/hours or hours/minutes or minutes/seconds

### ✅ Anonymous Mode Indicator
- Badge showing "Anonymous Buyer"
- Tooltip explanation
- Only shown when anonymousBuyer is true
- Hidden for buyers (they see their own RFQs)

## Components

### DeadlineCountdown
Real-time countdown component for RFQ deadlines.

```tsx
<DeadlineCountdown deadline={rfq.deadline} showIcon={true} />
```

**Props:**
- `deadline: string | Date` - Deadline date
- `showIcon?: boolean` - Show clock icon (default: true)

**Features:**
- Auto-updates every second
- Color-coded by urgency
- Shows "Expired" when deadline passed

### AnonymousBadge
Badge component indicating anonymous buyer mode.

```tsx
<AnonymousBadge anonymous={rfq.anonymousBuyer} />
```

**Props:**
- `anonymous: boolean` - Whether buyer is anonymous

### RFQStatusBadge
Status badge for RFQ status.

```tsx
<RFQStatusBadge status={RFQStatus.OPEN} />
```

**Status Colors:**
- Draft: Gray
- Open: Green
- Closed: Gray
- Cancelled: Red

### RFQListItem
Card component for displaying RFQ in list.

```tsx
<RFQListItem rfq={rfq} />
```

## Pages

### RFQList
- Route: `/rfqs`
- Features: List, search, filters, role-based data
- Access: All authenticated users (filtered by role)

### RFQDetails
- Route: `/rfqs/:id`
- Features: Full details, countdown, anonymous indicator
- Access: All authenticated users

## Role-Based Filtering

### Buyers (Buyer, Admin, Government)
- See RFQs created by their company
- Endpoint: `GET /api/rfqs`
- Filtered by companyId

### Providers (Supplier, Logistics, Clearance, Service Provider)
- See available RFQs matching their role
- Endpoint: `GET /api/rfqs/available`
- Filtered by targetRole

## API Integration

### Service (`rfq.service.ts`)
- `getRFQs(filters?)` - Get RFQs for buyers
- `getAvailableRFQs(filters?)` - Get available RFQs for providers
- `getRFQById(id)` - Get single RFQ
- `getRFQsByPurchaseRequest(purchaseRequestId)` - Get RFQs by PR

### React Query Hooks (`useRFQs.ts`)
- `useRFQs(filters?)` - List query (role-aware)
- `useRFQ(id)` - Single RFQ query
- `useRFQsByPurchaseRequest(purchaseRequestId)` - RFQs by PR query

## Usage Examples

### List RFQs

```tsx
import { RFQList } from '@/pages/RFQs';

<ProtectedRoute>
  <MainLayout>
    <RFQList />
  </MainLayout>
</ProtectedRoute>
```

### Using Hooks

```tsx
import { useRFQs } from '@/hooks/useRFQs';
import { RFQStatus } from '@/types/rfq';

const { data, isLoading } = useRFQs({ 
  status: RFQStatus.OPEN,
  type: RFQType.SUPPLIER 
});
```

### Deadline Countdown

```tsx
import { DeadlineCountdown } from '@/components/RFQ/DeadlineCountdown';

<DeadlineCountdown deadline="2024-12-31T23:59:59Z" />
```

## Routes

- `GET /api/rfqs` - Get RFQs (Buyers)
- `GET /api/rfqs/available` - Get available RFQs (Providers)
- `GET /api/rfqs/:id` - Get RFQ by ID
- `GET /api/rfqs/purchase-request/:purchaseRequestId` - Get RFQs by PR

## Features by Role

### Buyer View
- See "My RFQs" header
- See all RFQs created by their company
- Can filter by status and type
- Anonymous badge hidden (they know it's theirs)

### Provider View
- See "Available RFQs" header
- See RFQs matching their role (targetRole)
- Can filter by status and type
- See anonymous badge when applicable
- Can submit bids from details page

## Deadline Countdown Logic

- **Expired**: Red badge, shows "Expired"
- **< 24 hours**: Red badge, shows hours/minutes
- **< 3 days**: Yellow badge, shows days/hours
- **> 3 days**: Default badge, shows days/hours
- Updates every second for open RFQs

## Anonymous Mode

When `anonymousBuyer` is true:
- Badge shown to providers
- Alert message on details page
- Buyer identity hidden in RFQ
- Helps prevent bias in bidding

## Best Practices

1. **Role-based filtering** - Automatically filters by user role
2. **Real-time updates** - Countdown updates every second
3. **Clear indicators** - Status badges and anonymous mode clearly visible
4. **Responsive design** - Works on all screen sizes
5. **Loading states** - Shows skeletons during data fetch
6. **Error handling** - Graceful error messages

## Future Enhancements

- [ ] RFQ creation form (for buyers)
- [ ] RFQ editing
- [ ] RFQ closing/cancellation
- [ ] Email notifications for new RFQs
- [ ] Save RFQs as favorites
- [ ] Export RFQ details
- [ ] Advanced filters (date range, budget range)
- [ ] RFQ comparison view
- [ ] Bid statistics per RFQ
