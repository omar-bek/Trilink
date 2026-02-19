# Bid Management UI Implementation

## Overview

Complete Bid management UI with submit form, withdrawal, comparison table, AI score indicators, and status lifecycle visualization.

## Features

### ✅ Submit Bid Form
- Form with validation
- Pre-filled RFQ information
- Price, currency, payment terms
- Delivery time and date
- Bid validity date
- Anonymous bidder option
- Form validation with Yup

### ✅ Withdraw Bid
- Withdraw submitted bids
- Confirmation dialog
- Only available for providers
- Only for submitted bids

### ✅ Bid Comparison Table (Buyer)
- Side-by-side comparison
- Sorted by AI score, then price
- Rank indicators
- AI score display
- Anonymous bidder indicators
- Quick actions

### ✅ AI Score Indicator
- Visual score display (0-100)
- Color-coded by score:
  - Green: ≥80 (Excellent/Very Good)
  - Yellow: 60-79 (Good/Fair)
  - Red: <60 (Needs Improvement)
- Progress bar visualization
- Tooltip with score details

### ✅ Status Lifecycle UI
- Visual stepper showing bid progression
- Status steps:
  - Draft → Submitted → Under Review → Accepted/Rejected/Withdrawn
- Current status highlighted
- Completed steps marked
- Status descriptions

## Components

### BidStatusBadge
Status badge component with color coding.

```tsx
<BidStatusBadge status={BidStatus.SUBMITTED} />
```

**Status Colors:**
- Draft: Gray
- Submitted: Blue
- Under Review: Yellow
- Accepted: Green
- Rejected: Red
- Withdrawn: Gray

### AIScoreIndicator
AI score visualization component.

```tsx
<AIScoreIndicator score={85} showLabel={true} size="medium" />
```

**Props:**
- `score?: number` - AI score (0-100)
- `showLabel?: boolean` - Show full label and progress bar
- `size?: 'small' | 'medium' | 'large'`

**Score Ranges:**
- 90-100: Excellent (Green)
- 80-89: Very Good (Green)
- 70-79: Good (Yellow)
- 60-69: Fair (Yellow)
- <60: Needs Improvement (Red)

### BidStatusLifecycle
Visual lifecycle stepper component.

```tsx
<BidStatusLifecycle
  status={BidStatus.UNDER_REVIEW}
  createdAt="2024-01-01"
  updatedAt="2024-01-02"
/>
```

### BidListItem
Card component for bid list display.

```tsx
<BidListItem bid={bid} onWithdraw={handleWithdraw} />
```

## Pages

### BidList
- Route: `/bids`
- Features: List, search, status filter
- Access: All authenticated users

### SubmitBid
- Route: `/bids/new?rfqId=xxx`
- Features: Bid submission form
- Access: Providers (Supplier, Logistics, etc.)

### BidDetails
- Route: `/bids/:id`
- Features: Full bid details, lifecycle, actions
- Access: All authenticated users

### BidComparison
- Route: `/rfqs/:rfqId/bids/compare`
- Features: Comparison table for buyers
- Access: Buyers only

## API Integration

### Service (`bid.service.ts`)
- `getBids(filters?)` - List bids
- `getBidsByRFQ(rfqId, filters?)` - Get bids for RFQ
- `getBidById(id)` - Get single bid
- `createBid(data)` - Create bid
- `updateBid(id, data)` - Update bid
- `withdrawBid(id)` - Withdraw bid
- `evaluateBid(id, data)` - Evaluate bid (accept/reject)
- `deleteBid(id)` - Delete bid

### React Query Hooks (`useBids.ts`)
- `useBids(filters?)` - List query
- `useBidsByRFQ(rfqId, filters?)` - Bids by RFQ query
- `useBid(id)` - Single bid query
- `useCreateBid()` - Create mutation
- `useUpdateBid()` - Update mutation
- `useWithdrawBid()` - Withdraw mutation
- `useEvaluateBid()` - Evaluate mutation
- `useDeleteBid()` - Delete mutation

## Usage Examples

### Submit Bid

```tsx
import { SubmitBid } from '@/pages/Bids';

// Navigate with RFQ ID
navigate('/bids/new?rfqId=xxx');
```

### Bid Comparison

```tsx
import { BidComparison } from '@/pages/Bids';

<ProtectedRoute requiredRole={Role.BUYER}>
  <MainLayout>
    <BidComparison />
  </MainLayout>
</ProtectedRoute>
```

### Using Hooks

```tsx
import { useBidsByRFQ, useWithdrawBid } from '@/hooks/useBids';

const { data } = useBidsByRFQ(rfqId, { status: 'submitted' });
const withdrawMutation = useWithdrawBid();

const handleWithdraw = (id: string) => {
  withdrawMutation.mutate(id);
};
```

## Bid Status Workflow

1. **Draft**: Bid being prepared (can edit/delete)
2. **Submitted**: Bid submitted (can withdraw)
3. **Under Review**: Buyer reviewing (read-only for provider)
4. **Accepted**: Bid accepted (final)
5. **Rejected**: Bid rejected (final)
6. **Withdrawn**: Bid withdrawn by provider (final)

## Role-Based Features

### Providers (Supplier, Logistics, etc.)
- Submit bids for available RFQs
- View their own bids
- Withdraw submitted bids
- See AI scores
- Anonymous bidding option

### Buyers
- View all bids for their RFQs
- Compare bids side-by-side
- Accept/reject bids
- See AI scores for decision support
- View bid lifecycle

## AI Score Display

- **Score Range**: 0-100
- **Visualization**: Progress bar + numeric score
- **Color Coding**: Green (high), Yellow (medium), Red (low)
- **Tooltip**: Shows score label (Excellent, Very Good, etc.)
- **Sorting**: Used in comparison table (highest first)

## Comparison Table Features

- **Sorting**: By AI score (desc), then price (asc)
- **Ranking**: Visual rank indicators (#1, #2, etc.)
- **Columns**: Rank, Bidder, Price, AI Score, Delivery Time, Delivery Date, Payment Terms, Status, Actions
- **Highlighting**: Top-ranked bid highlighted
- **Anonymous**: Shows "Anonymous" chip when applicable

## Form Validation

Submit bid form validates:
- Price: Required, min 0
- Currency: Default AED
- Payment Terms: Required, min 10 chars
- Delivery Time: Required, min 1 day
- Delivery Date: Required
- Validity: Required

## Routes

- `GET /api/bids` - List bids
- `GET /api/bids/rfq/:rfqId` - Get bids by RFQ
- `GET /api/bids/:id` - Get bid by ID
- `POST /api/bids` - Create bid
- `PATCH /api/bids/:id` - Update bid
- `POST /api/bids/:id/withdraw` - Withdraw bid
- `POST /api/bids/:id/evaluate` - Evaluate bid
- `DELETE /api/bids/:id` - Delete bid

## Best Practices

1. **Validate before submit** - Ensure all required fields
2. **Show AI scores** - Help buyers make informed decisions
3. **Status awareness** - Disable actions based on status
4. **Confirm destructive actions** - Withdraw, reject
5. **Real-time updates** - Invalidate queries after mutations
6. **Anonymous mode** - Respect privacy preferences

## Future Enhancements

- [ ] Bid editing (for draft bids)
- [ ] File attachments upload
- [ ] Bid templates
- [ ] Bulk bid operations
- [ ] Export comparison to PDF/Excel
- [ ] Bid analytics and insights
- [ ] Email notifications
- [ ] Bid revision history
- [ ] Counter-offer functionality
- [ ] Bid negotiation chat
