# Purchase Requests UI Implementation

## Overview

Complete Purchase Requests UI implementation for Buyer role with list view, details page, and multi-step create form.

## Features

### ✅ PR List Page
- Filterable list of purchase requests
- Search functionality
- Status filtering (Draft, Submitted)
- Action menu (View, Edit, Submit, Delete)
- Responsive card layout
- Loading states

### ✅ PR Details Page
- Complete purchase request information
- Items list with specifications
- Budget and delivery details
- Action buttons (Edit, Submit, Delete)
- Status badges
- Formatted dates and currency

### ✅ Create PR Form (Multi-step)
- **Step 1**: Basic Information (Title, Description)
- **Step 2**: Items (Multiple items with add/remove)
- **Step 3**: Budget & Delivery (Budget, Currency, Location, Date)
- Form validation with Yup
- React Hook Form integration
- Stepper navigation

### ✅ Status Badges
- Draft status (gray)
- Submitted status (blue)
- RFQ Generated status (green)

### ✅ Actions
- **Edit**: Only for draft PRs
- **Submit**: Transitions draft to submitted
- **Delete**: Only for draft PRs
- **View**: Always available

## Components

### StatusBadge
Displays purchase request status with appropriate colors.

```tsx
<StatusBadge status={PurchaseRequestStatus.DRAFT} rfqGenerated={false} />
```

### PRListItem
Card component for displaying purchase request in list.

```tsx
<PRListItem
  purchaseRequest={pr}
  onSubmit={handleSubmit}
  onDelete={handleDelete}
/>
```

## Pages

### PurchaseRequestList
- Route: `/purchase-requests`
- Features: List, search, filter, create button
- Role: Buyer only

### PurchaseRequestDetails
- Route: `/purchase-requests/:id`
- Features: Full details, actions, formatted display
- Role: Buyer only

### CreatePurchaseRequest
- Route: `/purchase-requests/new`
- Features: Multi-step form, validation
- Role: Buyer only

## API Integration

### Service (`purchase-request.service.ts`)
- `getPurchaseRequests(filters?)` - List PRs
- `getPurchaseRequestById(id)` - Get single PR
- `createPurchaseRequest(data)` - Create PR
- `updatePurchaseRequest(id, data)` - Update PR
- `submitPurchaseRequest(id)` - Submit PR
- `deletePurchaseRequest(id)` - Delete PR

### React Query Hooks (`usePurchaseRequests.ts`)
- `usePurchaseRequests(filters?)` - List query
- `usePurchaseRequest(id)` - Single PR query
- `useCreatePurchaseRequest()` - Create mutation
- `useUpdatePurchaseRequest()` - Update mutation
- `useSubmitPurchaseRequest()` - Submit mutation
- `useDeletePurchaseRequest()` - Delete mutation

## Form Validation

Uses Yup schema validation:

```typescript
- title: required, min 3 chars
- description: required, min 10 chars
- items: array, min 1 item
  - name: required
  - quantity: required, min 1
  - unit: required
  - specifications: required
  - estimatedPrice: optional, min 0
- budget: required, min 0
- currency: default 'AED'
- deliveryLocation: all fields required
- requiredDeliveryDate: required
```

## Usage Examples

### List Purchase Requests

```tsx
import { PurchaseRequestList } from '@/pages/PurchaseRequests';

<ProtectedRoute requiredRole={Role.BUYER}>
  <MainLayout>
    <PurchaseRequestList />
  </MainLayout>
</ProtectedRoute>
```

### Create Purchase Request

```tsx
import { CreatePurchaseRequest } from '@/pages/PurchaseRequests';

<CreatePurchaseRequest />
```

### Using Hooks

```tsx
import { usePurchaseRequests, useSubmitPurchaseRequest } from '@/hooks/usePurchaseRequests';

const { data, isLoading } = usePurchaseRequests({ status: PurchaseRequestStatus.DRAFT });
const submitMutation = useSubmitPurchaseRequest();

const handleSubmit = (id: string) => {
  submitMutation.mutate(id);
};
```

## Routes

All routes are protected and require Buyer role:

- `GET /purchase-requests` - List PRs
- `GET /purchase-requests/:id` - Get PR details
- `POST /purchase-requests` - Create PR
- `PATCH /purchase-requests/:id` - Update PR
- `POST /purchase-requests/:id/submit` - Submit PR
- `DELETE /purchase-requests/:id` - Delete PR

## Dependencies

Required packages (already added to package.json):

```json
{
  "react-hook-form": "^7.48.2",
  "@hookform/resolvers": "^3.3.2",
  "yup": "^1.3.3"
}
```

Install with:
```bash
npm install
```

## Form Flow

1. **Step 1: Basic Information**
   - User enters title and description
   - Validation on "Next"

2. **Step 2: Items**
   - User adds items (name, quantity, unit, specifications, estimated price)
   - Can add/remove items dynamically
   - Validation on "Next"

3. **Step 3: Budget & Delivery**
   - User enters budget, currency
   - Delivery location (address, city, state, country, zip)
   - Required delivery date
   - Validation on "Create"

## Status Workflow

- **Draft**: Can edit, submit, or delete
- **Submitted**: Can only view (read-only)
- **RFQ Generated**: Shows special badge (after approval)

## Best Practices

1. **Always validate** before moving to next step
2. **Show loading states** during API calls
3. **Handle errors** gracefully with user-friendly messages
4. **Disable actions** based on status (draft vs submitted)
5. **Confirm destructive actions** (delete, submit)
6. **Invalidate queries** after mutations to refresh data

## Future Enhancements

- [ ] Edit form (similar to create, pre-filled)
- [ ] Bulk actions (delete multiple, submit multiple)
- [ ] Export to PDF/Excel
- [ ] Advanced filters (date range, budget range)
- [ ] Duplicate PR functionality
- [ ] PR templates
- [ ] File attachments
- [ ] Comments/Notes section
- [ ] Approval workflow UI
- [ ] RFQ generation status tracking
