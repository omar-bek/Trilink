# Payments UI Implementation

## Overview

Complete Payments management UI with payment list, milestone view, approval actions for buyers, and status badges.

## Features

### ✅ Payment List
- Filterable list of payments
- Status filtering
- Search functionality
- Overdue indicators
- Payment summary cards

### ✅ Payment Details
- Complete payment information
- Approval actions (Buyer only)
- Status display
- Payment history
- Notes and rejection reasons

### ✅ Milestone View
- Visual stepper showing payment milestones
- Grouped by milestone
- Status per milestone
- Total amounts per milestone
- Progress tracking

### ✅ Approval Actions (Buyer)
- Approve payment dialog
- Reject payment dialog
- Optional approval notes
- Required rejection reason
- Status updates

### ✅ Status Badges
- Color-coded status indicators
- All 8 payment statuses supported
- Clear visual feedback

## Components

### PaymentStatusBadge
Status badge component with color coding.

```tsx
<PaymentStatusBadge status={PaymentStatus.PENDING_APPROVAL} />
```

**Status Colors:**
- Pending Approval: Yellow
- Approved: Blue
- Rejected: Red
- Processing: Primary Blue
- Completed: Green
- Failed: Red
- Cancelled: Gray
- Refunded: Gray

### MilestoneView
Component displaying payment milestones in a stepper format.

```tsx
<MilestoneView payments={payments} contractId={contractId} />
```

**Features:**
- Groups payments by milestone
- Visual stepper progression
- Status per milestone
- Total amounts
- Payment details per milestone

### ApprovalActions
Component for buyer approval/rejection actions.

```tsx
<ApprovalActions payment={payment} />
```

**Features:**
- Only visible to buyers
- Only for pending approval payments
- Approve dialog with optional notes
- Reject dialog with required reason
- Status updates after actions

### PaymentListItem
Card component for payment list display.

```tsx
<PaymentListItem payment={payment} />
```

**Features:**
- Status badge
- Amount display
- Due date
- Overdue indicator
- Notes preview

## Pages

### PaymentList
- Route: `/payments`
- Features: List, search, status filter
- Access: All authenticated users

### PaymentDetails
- Route: `/payments/:id`
- Features: Full details, approval actions, status
- Access: All authenticated users (filtered by company)

### PaymentMilestones
- Route: `/payments/milestones` or `/payments/milestones/:contractId`
- Features: Milestone view grouped by contract
- Access: All authenticated users

## API Integration

### Service (`payment.service.ts`)
- `getPayments(filters?)` - List payments
- `getPaymentById(id)` - Get single payment
- `approvePayment(id, data)` - Approve payment
- `rejectPayment(id, data)` - Reject payment

### React Query Hooks (`usePayments.ts`)
- `usePayments(filters?)` - List query
- `usePayment(id)` - Single payment query
- `useApprovePayment()` - Approve mutation
- `useRejectPayment()` - Reject mutation

## Usage Examples

### Payment List

```tsx
import { PaymentList } from '@/pages/Payments';

<ProtectedRoute>
  <MainLayout>
    <PaymentList />
  </MainLayout>
</ProtectedRoute>
```

### Payment Details with Approval

```tsx
import { PaymentDetails } from '@/pages/Payments';

<ProtectedRoute>
  <MainLayout>
    <PaymentDetails />
  </MainLayout>
</ProtectedRoute>
```

### Milestone View

```tsx
import { PaymentMilestones } from '@/pages/Payments';

<ProtectedRoute>
  <MainLayout>
    <PaymentMilestones />
  </MainLayout>
</ProtectedRoute>
```

### Using Hooks

```tsx
import { usePayments, useApprovePayment } from '@/hooks/usePayments';

const { data } = usePayments({ status: PaymentStatus.PENDING_APPROVAL });
const approveMutation = useApprovePayment();

const handleApprove = () => {
  approveMutation.mutate({
    id: paymentId,
    data: { notes: 'Approved for milestone completion' }
  });
};
```

## Payment Status Workflow

1. **Pending Approval**: Waiting for buyer approval
2. **Approved**: Buyer approved, ready for processing
3. **Rejected**: Buyer rejected (requires reason)
4. **Processing**: Payment being processed
5. **Completed**: Payment completed successfully
6. **Failed**: Payment processing failed
7. **Cancelled**: Payment cancelled
8. **Refunded**: Payment refunded

## Approval Flow

### Approve Payment

1. Buyer views payment details
2. Clicks "Approve Payment" button
3. Optional: Adds approval notes
4. Confirms approval
5. Payment status changes to "Approved"
6. Payment ready for processing

### Reject Payment

1. Buyer views payment details
2. Clicks "Reject Payment" button
3. **Required**: Provides rejection reason
4. Confirms rejection
5. Payment status changes to "Rejected"
6. Rejection reason visible to recipient

## Milestone View Features

- **Grouping**: Payments grouped by milestone name
- **Stepper**: Visual progression through milestones
- **Status**: Overall status per milestone
- **Amounts**: Total amount per milestone
- **Details**: Individual payment details within milestone
- **Progress**: Visual progress indicator

## Role-Based Features

### Buyers
- View all payments for their company
- Approve/reject pending payments
- See payment history
- View milestone progress

### Providers (Suppliers, Logistics, etc.)
- View payments they're receiving
- See approval status
- View rejection reasons
- Track payment milestones

## Overdue Indicators

- **Visual Indicator**: Red border on overdue payment cards
- **Badge**: "Overdue" chip displayed
- **Due Date**: Highlighted in red
- **Condition**: Payment is overdue if due date passed and status not completed

## Routes

- `GET /api/payments` - List payments
- `GET /api/payments/:id` - Get payment by ID
- `POST /api/payments/:id/approve` - Approve payment
- `POST /api/payments/:id/reject` - Reject payment

## Best Practices

1. **Approval Required**: Always require rejection reason
2. **Status Awareness**: Disable actions based on payment status
3. **Real-time Updates**: Invalidate queries after mutations
4. **Error Handling**: Show clear error messages
5. **Loading States**: Show loading indicators during operations
6. **Overdue Alerts**: Clearly indicate overdue payments

## Future Enhancements

- [ ] Payment creation form
- [ ] Bulk approval/rejection
- [ ] Payment reminders
- [ ] Email notifications
- [ ] Payment analytics
- [ ] Export payment reports
- [ ] Payment scheduling
- [ ] Recurring payments
- [ ] Payment templates
- [ ] Invoice generation
- [ ] Payment reconciliation
- [ ] Multi-currency support
- [ ] Payment gateway integration
- [ ] Automated payment processing
