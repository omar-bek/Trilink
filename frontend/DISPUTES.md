# Dispute Management UI Implementation

## Overview

Complete Dispute management UI with dispute list, create dispute form, attachments upload, and government escalation view.

## Features

### ✅ Dispute List
- Filterable list of disputes
- Status filtering
- Escalated filter toggle
- Search functionality
- Escalated indicator badges
- Create dispute button

### ✅ Create Dispute Form
- Form with validation
- Contract ID selection
- Against company selection
- Dispute type selection
- Description field (min 20 chars)
- Attachments upload
- Form validation with Yup

### ✅ Attachments Upload
- File upload component
- Multiple file support (max 10)
- File type display
- Remove file functionality
- File count indicator

### ✅ Government Escalation View
- Escalated disputes list (Government only)
- Escalation dialog
- Government notes field
- Resolve dispute dialog
- Resolution field

### ✅ Dispute Details
- Complete dispute information
- Description display
- Attachments list
- Escalation actions
- Resolution display
- Government notes display

## Components

### DisputeStatusBadge
Status badge component with color coding.

```tsx
<DisputeStatusBadge status={DisputeStatus.ESCALATED} />
```

**Status Colors:**
- Open: Yellow
- Under Review: Blue
- Escalated: Red
- Resolved: Green

### AttachmentUpload
File upload component for dispute attachments.

```tsx
<AttachmentUpload
  attachments={attachments}
  onChange={setAttachments}
  maxFiles={10}
/>
```

**Features:**
- Multiple file selection
- File type display
- Remove file functionality
- Max files limit
- Error handling

### DisputeListItem
Card component for dispute list display.

```tsx
<DisputeListItem dispute={dispute} />
```

**Features:**
- Status badge
- Escalated indicator
- Attachment count
- Contract ID
- Description preview

## Pages

### DisputeList
- Route: `/disputes`
- Features: List, search, filters, create button
- Access: All authenticated users

### CreateDispute
- Route: `/disputes/new`
- Features: Create dispute form with attachments
- Access: All authenticated users

### DisputeDetails
- Route: `/disputes/:id`
- Features: Full details, escalation, resolution, attachments
- Access: All authenticated users (filtered by company)

### EscalatedDisputes
- Route: `/disputes/escalated`
- Features: Government view of escalated disputes
- Access: Government role only

## API Integration

### Service (`dispute.service.ts`)
- `getDisputes(filters?)` - List disputes
- `getEscalatedDisputes()` - Get escalated disputes (Government)
- `getDisputeById(id)` - Get single dispute
- `createDispute(data)` - Create dispute
- `escalateDispute(id, data)` - Escalate to government
- `resolveDispute(id, data)` - Resolve dispute (Government)
- `addAttachments(id, data)` - Add attachments

### React Query Hooks (`useDisputes.ts`)
- `useDisputes(filters?)` - List query
- `useEscalatedDisputes()` - Escalated disputes query
- `useDispute(id)` - Single dispute query
- `useCreateDispute()` - Create mutation
- `useEscalateDispute()` - Escalate mutation
- `useResolveDispute()` - Resolve mutation
- `useAddAttachments()` - Add attachments mutation

## Usage Examples

### Dispute List

```tsx
import { DisputeList } from '@/pages/Disputes';

<ProtectedRoute>
  <MainLayout>
    <DisputeList />
  </MainLayout>
</ProtectedRoute>
```

### Create Dispute

```tsx
import { CreateDispute } from '@/pages/Disputes';

<ProtectedRoute>
  <MainLayout>
    <CreateDispute />
  </MainLayout>
</ProtectedRoute>
```

### Escalated Disputes (Government)

```tsx
import { EscalatedDisputes } from '@/pages/Disputes';

<ProtectedRoute requiredRole={Role.GOVERNMENT}>
  <MainLayout>
    <EscalatedDisputes />
  </MainLayout>
</ProtectedRoute>
```

### Using Hooks

```tsx
import { useDisputes, useEscalateDispute } from '@/hooks/useDisputes';

const { data } = useDisputes({ status: DisputeStatus.OPEN });
const escalateMutation = useEscalateDispute();

const handleEscalate = () => {
  escalateMutation.mutate({
    id: disputeId,
    data: { governmentNotes: 'Escalation notes' }
  });
};
```

## Dispute Status Workflow

1. **Open**: Initial status when dispute is created
2. **Under Review**: Dispute is being reviewed
3. **Escalated**: Escalated to government
4. **Resolved**: Resolved by government (final state)

## Dispute Types

- Quality
- Delivery
- Payment
- Contract Terms
- Service
- Other

## Escalation Flow

1. User creates dispute
2. Dispute reviewed internally
3. If unresolved, escalate to government
4. Government reviews and resolves
5. Resolution shared with parties

## Attachment Upload

### Features

- **Multiple Files**: Upload up to 10 files
- **File Types**: Supports all file types
- **Preview**: Shows file type and URL
- **Remove**: Remove files before submission
- **Validation**: Max files limit enforced

### Implementation Note

Currently uses `URL.createObjectURL` for file preview. In production, files should be uploaded to a storage service (AWS S3, Azure Blob, etc.) and the returned URLs should be used.

## Role-Based Features

### All Users
- Create disputes
- View their company's disputes
- Add attachments
- Escalate disputes

### Government
- View all disputes
- View escalated disputes
- Resolve disputes
- Add government notes

## Routes

- `GET /api/disputes` - List disputes (filtered by company, except Government)
- `GET /api/disputes/escalated` - Get escalated disputes (Government only)
- `GET /api/disputes/:id` - Get dispute by ID
- `POST /api/disputes` - Create dispute
- `POST /api/disputes/:id/escalate` - Escalate dispute
- `POST /api/disputes/:id/resolve` - Resolve dispute (Government)
- `POST /api/disputes/:id/attachments` - Add attachments

## Best Practices

1. **File Upload**: Implement proper file upload to storage service
2. **Validation**: Validate file types and sizes
3. **Status Awareness**: Disable actions based on dispute status
4. **Real-time Updates**: Invalidate queries after mutations
5. **Error Handling**: Show clear error messages
6. **Loading States**: Show loading indicators during operations

## Future Enhancements

- [ ] File upload to cloud storage (S3, Azure, etc.)
- [ ] File preview (images, PDFs)
- [ ] Dispute comments/thread
- [ ] Email notifications
- [ ] Dispute templates
- [ ] Bulk dispute operations
- [ ] Dispute analytics
- [ ] Export dispute reports
- [ ] Dispute history timeline
- [ ] Automated escalation rules
- [ ] Dispute categories
- [ ] Priority levels
- [ ] SLA tracking
- [ ] Dispute resolution templates
