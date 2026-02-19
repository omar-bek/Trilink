# Contracts UI Implementation

## Overview

Complete Contracts management UI with contract list, details, parties overview, digital signature flow, and status timeline visualization.

## Features

### ✅ Contract List
- Filterable list of contracts
- Status filtering
- Search functionality
- Signature progress indicators
- Contract summary cards

### ✅ Contract Details
- Complete contract information
- Contract terms display
- Payment schedule table
- Status timeline
- Parties overview
- Signature flow integration
- Contract activation (for buyers)

### ✅ Parties Overview
- List of all contract parties
- Signature status per party
- Party roles and amounts
- Current user indicator
- Signed date display

### ✅ Digital Signature Flow
- Signature dialog with confirmation
- Terms acceptance checkboxes
- Signature text input
- Real-time signature status
- Only shows for parties who haven't signed
- Prevents duplicate signatures

### ✅ Status Timeline
- Visual stepper showing contract progression
- Status steps:
  - Draft → Pending Signatures → Signed → Active → Completed/Terminated/Cancelled
- Current status highlighted
- Completed steps marked
- Signature progress indicator

## Components

### ContractStatusBadge
Status badge component with color coding.

```tsx
<ContractStatusBadge status={ContractStatus.PENDING_SIGNATURES} />
```

**Status Colors:**
- Draft: Gray
- Pending Signatures: Yellow
- Signed: Blue
- Active: Green
- Completed: Green
- Terminated: Red
- Cancelled: Red

### PartiesOverview
Component displaying all contract parties with signature status.

```tsx
<PartiesOverview contract={contract} />
```

**Features:**
- Shows all parties
- Signature status per party
- Party roles and amounts
- Current user indicator
- Signed date display

### SignatureFlow
Digital signature component with dialog.

```tsx
<SignatureFlow contract={contract} />
```

**Features:**
- Only visible to contract parties
- Shows "Signed" state if already signed
- Signature dialog with confirmation
- Terms acceptance checkboxes
- Signature text input

### ContractStatusTimeline
Visual timeline component showing contract status progression.

```tsx
<ContractStatusTimeline
  status={contract.status}
  createdAt={contract.createdAt}
  updatedAt={contract.updatedAt}
  signaturesCount={contract.signatures.length}
  totalParties={contract.parties.length}
/>
```

### ContractListItem
Card component for contract list display.

```tsx
<ContractListItem contract={contract} />
```

## Pages

### ContractList
- Route: `/contracts`
- Features: List, search, status filter
- Access: All authenticated users

### ContractDetails
- Route: `/contracts/:id`
- Features: Full contract details, parties, signature flow, timeline
- Access: All authenticated users (filtered by company)

## API Integration

### Service (`contract.service.ts`)
- `getContracts(filters?)` - List contracts
- `getContractById(id)` - Get single contract
- `signContract(id, data)` - Sign contract
- `activateContract(id)` - Activate contract

### React Query Hooks (`useContracts.ts`)
- `useContracts(filters?)` - List query
- `useContract(id)` - Single contract query
- `useSignContract()` - Sign mutation
- `useActivateContract()` - Activate mutation

## Usage Examples

### Contract List

```tsx
import { ContractList } from '@/pages/Contracts';

<ProtectedRoute>
  <MainLayout>
    <ContractList />
  </MainLayout>
</ProtectedRoute>
```

### Contract Details

```tsx
import { ContractDetails } from '@/pages/Contracts';

<ProtectedRoute>
  <MainLayout>
    <ContractDetails />
  </MainLayout>
</ProtectedRoute>
```

### Using Hooks

```tsx
import { useContract, useSignContract } from '@/hooks/useContracts';

const { data } = useContract(contractId);
const signMutation = useSignContract();

const handleSign = () => {
  signMutation.mutate({
    id: contractId,
    data: { signature: 'signature-hash' }
  });
};
```

## Contract Status Workflow

1. **Draft**: Contract being prepared
2. **Pending Signatures**: Waiting for all parties to sign
3. **Signed**: All parties have signed
4. **Active**: Contract is active and in effect (buyer activates)
5. **Completed**: Contract completed successfully
6. **Terminated**: Contract terminated early
7. **Cancelled**: Contract cancelled before activation

## Digital Signature Flow

### Signature Process

1. **Check Eligibility**: User must be a party to the contract
2. **Check Status**: Contract must be in "Pending Signatures" status
3. **Check Already Signed**: User must not have already signed
4. **Open Dialog**: User clicks "Sign Contract" button
5. **Review Terms**: User reads and confirms understanding
6. **Provide Signature**: User enters their name
7. **Submit**: Signature is hashed and sent to backend
8. **Update Status**: Contract status updates based on signatures

### Signature Dialog Features

- Signature text input (pre-filled with user name)
- "I have read and understood" checkbox
- "I agree to terms" checkbox
- Both checkboxes required to sign
- Error handling
- Loading state during submission

## Parties Overview Features

- **Party List**: Shows all parties with roles
- **Signature Status**: Visual indicator (checkmark/pending)
- **Current User**: Highlights user's own party
- **Amount Display**: Shows party-specific amounts
- **Signed Date**: Displays when party signed
- **Role Display**: Shows party role (Supplier, Logistics, etc.)

## Payment Schedule Display

- **Table Format**: Clean table showing milestones
- **Columns**: Milestone, Amount, Due Date, Status
- **Status Colors**: Paid (green), Pending (yellow), Default (gray)
- **Currency Formatting**: Properly formatted amounts

## Status Timeline Features

- **Visual Stepper**: Vertical stepper component
- **Status Steps**: All contract statuses shown
- **Current Status**: Highlighted in blue
- **Completed Steps**: Green checkmarks
- **Terminal States**: Red X for terminated/cancelled
- **Signature Progress**: Shows X/Y signatures during pending state

## Role-Based Features

### All Users
- View contracts they're party to
- Sign contracts (if party and not signed)
- View contract details
- See payment schedule

### Buyers
- Activate contracts after all signatures
- View all contracts for their company
- See all parties and their status

### Providers
- Sign contracts they're party to
- View contract terms
- Track payment milestones

## Routes

- `GET /api/contracts` - List contracts
- `GET /api/contracts/:id` - Get contract by ID
- `POST /api/contracts/:id/sign` - Sign contract
- `POST /api/contracts/:id/activate` - Activate contract

## Best Practices

1. **Signature Security**: In production, use proper cryptographic signing
2. **Terms Review**: Always show terms before signature
3. **Status Awareness**: Disable actions based on contract status
4. **Real-time Updates**: Invalidate queries after mutations
5. **Error Handling**: Show clear error messages
6. **Loading States**: Show loading indicators during operations

## Future Enhancements

- [ ] Contract creation form
- [ ] Contract editing (for draft contracts)
- [ ] Contract templates
- [ ] PDF export/download
- [ ] Email notifications for signature requests
- [ ] Contract amendments
- [ ] Digital signature with certificate
- [ ] Contract analytics
- [ ] Bulk contract operations
- [ ] Contract search and filters
- [ ] Contract reminders
- [ ] Contract expiry notifications
- [ ] Contract renewal workflow
