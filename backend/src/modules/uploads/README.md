# File Upload Module

Secure file upload endpoint with S3 integration, file validation, and presigned URL generation.

## Features

- ✅ Secure file upload to AWS S3
- ✅ File type validation (images, documents)
- ✅ File size limits (5MB images, 10MB documents)
- ✅ Presigned URLs for secure file access
- ✅ Company isolation and RBAC
- ✅ Support for single and multiple file uploads
- ✅ Soft delete with S3 cleanup

## Setup

### 1. Install Dependencies

```bash
npm install multer @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
npm install --save-dev @types/multer
```

### 2. Configure Environment Variables

Add to `.env`:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=trilink-uploads
```

### 3. Create S3 Bucket

```bash
# Using AWS CLI
aws s3 mb s3://trilink-uploads --region us-east-1

# Set bucket policy for private access
aws s3api put-bucket-policy --bucket trilink-uploads --policy file://bucket-policy.json
```

## API Endpoints

### Upload Single File

```http
POST /api/uploads
Content-Type: multipart/form-data
Authorization: Bearer <token>

Form Data:
- file: <file>
- category: bid_attachment | dispute_attachment | company_document | contract_document | profile_image | other
- description: (optional) File description
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "upload-id",
    "fileName": "timestamp-hash-filename.pdf",
    "originalName": "document.pdf",
    "mimeType": "application/pdf",
    "size": 1024000,
    "url": "https://s3.amazonaws.com/...?presigned-params",
    "uploadedBy": "user-id",
    "companyId": "company-id",
    "category": "bid_attachment",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Upload Multiple Files

```http
POST /api/uploads/multiple
Content-Type: multipart/form-data
Authorization: Bearer <token>

Form Data:
- files: <file1>, <file2>, ...
- category: bid_attachment
- description: (optional)
```

### Get Upload by ID

```http
GET /api/uploads/:id
Authorization: Bearer <token>
```

Returns fresh presigned URL (valid for 1 hour).

### Get Uploads by Company

```http
GET /api/uploads?category=bid_attachment
Authorization: Bearer <token>
```

### Delete Upload

```http
DELETE /api/uploads/:id
Authorization: Bearer <token>
```

## File Categories

- `bid_attachment` - Bid-related documents (PDF, DOC, DOCX, XLS, XLSX, CSV, TXT)
- `dispute_attachment` - Dispute evidence documents
- `company_document` - Company registration documents
- `contract_document` - Contract-related files
- `profile_image` - User/company profile images (JPEG, PNG, GIF, WEBP)
- `other` - Other file types

## File Size Limits

- **Images**: 5MB max
- **Documents**: 10MB max
- **Default**: 10MB max

## Allowed File Types

### Images
- JPEG, PNG, GIF, WEBP

### Documents
- PDF, DOC, DOCX, XLS, XLSX, CSV, TXT

## Security Features

1. **File Type Validation**: Only allowed MIME types accepted
2. **File Size Limits**: Enforced per category
3. **Company Isolation**: Users can only access their company's files
4. **Presigned URLs**: Files not publicly accessible, URLs expire after 1 hour
5. **RBAC**: Requires appropriate permissions
6. **S3 Private ACL**: Files stored with private access

## Usage Examples

### Frontend (React)

```typescript
import axios from 'axios';

const uploadFile = async (file: File, category: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);

  const response = await axios.post('/api/uploads', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data.data;
};
```

### cURL

```bash
curl -X POST http://localhost:3000/api/uploads \
  -H "Authorization: Bearer <token>" \
  -F "file=@document.pdf" \
  -F "category=bid_attachment" \
  -F "description=Technical specification"
```

## Error Handling

### Invalid File Type
```json
{
  "success": false,
  "error": "Invalid file type. Allowed types: application/pdf, application/msword, ..."
}
```

### File Size Exceeded
```json
{
  "success": false,
  "error": "File size exceeds limit. Maximum size: 10MB"
}
```

### S3 Not Configured
```json
{
  "success": false,
  "error": "File upload service not available"
}
```

## Database Schema

Files are stored in MongoDB `uploads` collection with:
- File metadata (name, size, type)
- S3 location (bucket, key)
- Presigned URL (regenerated on access)
- Company and user association
- Soft delete support

## Notes

- Presigned URLs expire after 1 hour
- Fresh URLs are generated on each GET request
- Files are automatically deleted from S3 when upload record is deleted
- Company isolation enforced at service layer
- Admin and Government roles can access all files
