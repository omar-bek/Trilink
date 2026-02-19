# Profile & Company Settings Implementation

## Overview

Comprehensive Profile and Company Settings pages with user profile editing, company information viewing, document uploads, and read-only access for non-admin users.

## Features

### ✅ User Profile Edit
- Personal information editing (firstName, lastName, phone)
- Email display (read-only, cannot be changed)
- Role display (read-only)
- Account information display
- Change password functionality
- Form validation with React Hook Form and Yup
- Success/error messages

### ✅ Company Info View
- Company details display
- Registration number (read-only)
- Company type (read-only)
- Address information
- Status badge with color coding
- Registration date and last updated date
- Read-only mode for non-admin users
- Edit mode for admin users

### ✅ Document Uploads
- Document upload component
- Support for multiple document types
- Document list display
- Download functionality
- Delete functionality (admin only)
- File type detection
- Upload progress indicator

### ✅ Read-Only for Non-Admin
- Company settings read-only for non-admin users
- Profile editing available to all authenticated users
- Document upload restricted to admin users
- Clear visual indicators for read-only fields

## Components

### DocumentUpload
Document upload component for company documents.

```tsx
<DocumentUpload
  documents={company.documents}
  onUpload={handleUpload}
  onDelete={handleDelete}
  readOnly={!isAdmin}
  loading={isUploading}
/>
```

**Props:**
- `documents: CompanyDocument[]` - List of documents
- `onUpload: (file: File, type: string) => Promise<void>` - Upload handler
- `onDelete?: (documentId: string) => void` - Delete handler (optional)
- `readOnly?: boolean` - Read-only mode
- `loading?: boolean` - Loading state

## Pages

### Profile (`/profile`)
- Route: `/profile`
- Features: Edit personal information, change password
- Access: All authenticated users

**Sections:**
1. **Personal Information**
   - First Name (editable)
   - Last Name (editable)
   - Email (read-only)
   - Phone (editable)
   - Role (read-only)

2. **Account Information**
   - Status
   - Member Since
   - Last Login

3. **Change Password**
   - Current Password
   - New Password
   - Confirm Password
   - Collapsible form

### CompanySettings (`/settings/company`)
- Route: `/settings/company`
- Features: View/edit company information, manage documents
- Access: All authenticated users (read-only for non-admin)

**Sections:**
1. **Company Information**
   - Company Name (editable for admin)
   - Registration Number (read-only)
   - Company Type (read-only)
   - Email (editable for admin)
   - Phone (editable for admin)
   - Address (editable for admin)

2. **Company Status**
   - Status badge
   - Registration date
   - Last updated date

3. **Company Documents**
   - Document list
   - Upload functionality (admin only)
   - Download functionality
   - Delete functionality (admin only)

## API Integration

### User Service (`user.service.ts`)
- `getCurrentUser(userId)` - Get user profile
- `updateProfile(userId, data)` - Update user profile
- `changePassword(userId, data)` - Change password

### Company Service (`company.service.ts`)
- `getCompanyById(companyId)` - Get company information
- `updateCompany(companyId, data)` - Update company (admin only)
- `addDocument(companyId, document)` - Add document (admin only)

### React Query Hooks

#### useProfile
```tsx
const { data, isLoading } = useProfile(userId);
```

#### useUpdateProfile
```tsx
const updateProfile = useUpdateProfile();
await updateProfile.mutateAsync({ userId, data });
```

#### useChangePassword
```tsx
const changePassword = useChangePassword();
await changePassword.mutateAsync({ userId, data });
```

#### useCompany
```tsx
const { data, isLoading } = useCompany(companyId);
```

#### useUpdateCompany
```tsx
const updateCompany = useUpdateCompany();
await updateCompany.mutateAsync({ companyId, data });
```

#### useAddCompanyDocument
```tsx
const addDocument = useAddCompanyDocument();
await addDocument.mutateAsync({ companyId, document });
```

## Form Validation

### Profile Form
- First Name: Optional
- Last Name: Optional
- Phone: Optional

### Password Form
- Current Password: Required
- New Password: Required, minimum 8 characters
- Confirm Password: Required, must match new password

### Company Form
- Name: Optional
- Email: Optional, must be valid email
- Phone: Optional
- Address fields: All optional

## Role-Based Access

### All Users
- View own profile
- Edit own profile (firstName, lastName, phone)
- Change own password
- View company information

### Admin Users
- All user capabilities
- Edit company information
- Upload company documents
- Delete company documents

### Non-Admin Users
- View company information (read-only)
- Cannot edit company information
- Cannot upload documents
- Cannot delete documents

## Routes

- `GET /api/users/:id` - Get user profile
- `PATCH /api/users/:id` - Update user profile
- `POST /api/users/:id/change-password` - Change password (placeholder)
- `GET /api/companies/:id` - Get company information
- `PATCH /api/companies/:id` - Update company (admin only)
- `POST /api/companies/:id/documents` - Add document (admin only)

## Usage Examples

### Profile Page

```tsx
import { Profile } from '@/pages/Profile';

<ProtectedRoute>
  <MainLayout>
    <Profile />
  </MainLayout>
</ProtectedRoute>
```

### Company Settings Page

```tsx
import { CompanySettings } from '@/pages/Profile';

<ProtectedRoute>
  <MainLayout>
    <CompanySettings />
  </MainLayout>
</ProtectedRoute>
```

### Document Upload

```tsx
const handleUpload = async (file: File, type: string) => {
  // Upload file to storage service
  const url = await uploadToStorage(file);
  
  // Add document to company
  await addDocument.mutateAsync({
    companyId,
    document: { type, url },
  });
};
```

## Status Badges

Company status badges with color coding:
- **Approved**: Green (success)
- **Pending**: Yellow (warning)
- **Rejected**: Red (error)
- **Other**: Gray (default)

## Document Types

Supported document types:
- License
- Certificate
- Registration
- Tax Document
- Other

## File Upload

### Supported Formats
- PDF (.pdf)
- Word Documents (.doc, .docx)
- Images (.jpg, .jpeg, .png)

### Upload Flow
1. User selects file
2. File type is detected
3. Document type is inferred from filename
4. File is uploaded to storage (placeholder implementation)
5. Document URL is added to company
6. Company data is refreshed

## Best Practices

1. **Read-Only Mode**: Clear visual indicators for read-only fields
2. **Form Validation**: Client-side validation with Yup
3. **Error Handling**: Clear error messages for failed operations
4. **Success Feedback**: Success messages for completed operations
5. **Loading States**: Loading indicators during async operations
6. **Auto-Refresh**: Company data refreshes after updates
7. **Access Control**: Role-based access enforcement
8. **Password Security**: Password change requires current password
9. **Document Management**: Secure document upload and download
10. **User Experience**: Intuitive forms and clear navigation

## Future Enhancements

- [ ] Real file upload to storage service (AWS S3, Azure Blob, etc.)
- [ ] Image preview for uploaded documents
- [ ] Document type validation
- [ ] File size limits
- [ ] Bulk document upload
- [ ] Document versioning
- [ ] Two-factor authentication
- [ ] Profile picture upload
- [ ] Email verification
- [ ] Phone verification
- [ ] Activity log for profile changes
- [ ] Export profile data
- [ ] Account deletion
- [ ] Notification preferences
