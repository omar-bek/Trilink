# File Upload Implementation Summary

## Files Created

1. **types.ts** - TypeScript interfaces and enums
2. **schema.ts** - MongoDB schema for upload records
3. **s3.service.ts** - AWS S3 integration service
4. **repository.ts** - Database operations
5. **service.ts** - Business logic layer
6. **controller.ts** - Express route handlers
7. **multer.config.ts** - Multer middleware configuration
8. **routes.ts** - Express routes with validation
9. **README.md** - Module documentation

## Key Features Implemented

### Security
- ✅ File type validation (MIME type checking)
- ✅ File size limits (5MB images, 10MB documents)
- ✅ Company isolation (users can only access their company's files)
- ✅ RBAC integration (requires permissions)
- ✅ Presigned URLs (files not publicly accessible)
- ✅ Private S3 ACL (files stored securely)

### Functionality
- ✅ Single file upload
- ✅ Multiple file upload
- ✅ File retrieval with fresh presigned URLs
- ✅ File deletion (soft delete + S3 cleanup)
- ✅ File categorization (bid_attachment, dispute_attachment, etc.)
- ✅ Company-scoped file listing

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/uploads` | Upload single file |
| POST | `/api/uploads/multiple` | Upload multiple files |
| GET | `/api/uploads/:id` | Get file by ID (with fresh URL) |
| GET | `/api/uploads` | List company files (optional category filter) |
| DELETE | `/api/uploads/:id` | Delete file |

## Integration Points

### Routes Integration
- Added to `backend/src/routes.ts`
- Route prefix: `/api/uploads`

### Configuration
- Added AWS S3 config to `backend/src/config/env.ts`
- Environment variables: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET`

### Dependencies
- `multer` - File upload middleware
- `@aws-sdk/client-s3` - AWS S3 client
- `@aws-sdk/s3-request-presigner` - Presigned URL generation

## Usage Example

### Backend Controller Usage

```typescript
// In bid controller, when creating bid with attachment
const fileUpload = await uploadService.uploadFile(
  req.file,
  FileCategory.BID_ATTACHMENT,
  req.user.userId,
  req.user.companyId
);

// Store file ID in bid
const bid = await bidService.createBid({
  ...bidData,
  attachments: [{ type: 'document', url: fileUpload.url, uploadId: fileUpload.id }]
});
```

### Frontend Usage

```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('category', 'bid_attachment');

const response = await api.post('/uploads', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

const upload = response.data.data;
// Use upload.url for file access (valid for 1 hour)
```

## File Storage Structure

S3 bucket structure:
```
uploads/
  ├── bid_attachment/
  │   └── {companyId}/
  │       └── {timestamp}-{hash}-{filename}
  ├── dispute_attachment/
  │   └── {companyId}/
  │       └── {timestamp}-{hash}-{filename}
  └── profile_image/
      └── {companyId}/
          └── {timestamp}-{hash}-{filename}
```

## Security Considerations

1. **File Type Validation**: Only whitelisted MIME types accepted
2. **File Size Limits**: Enforced per category
3. **Company Isolation**: Enforced at service layer
4. **Presigned URLs**: Expire after 1 hour, regenerated on access
5. **Private Storage**: Files not publicly accessible
6. **Input Sanitization**: Filenames sanitized before storage

## Next Steps

1. Install dependencies: `npm install`
2. Configure AWS credentials
3. Create S3 bucket
4. Set environment variables
5. Test upload endpoint
6. Integrate with bid/dispute/contract modules

## Testing

```bash
# Test single file upload
curl -X POST http://localhost:3000/api/uploads \
  -H "Authorization: Bearer <token>" \
  -F "file=@test.pdf" \
  -F "category=bid_attachment"

# Test multiple files
curl -X POST http://localhost:3000/api/uploads/multiple \
  -H "Authorization: Bearer <token>" \
  -F "files=@file1.pdf" \
  -F "files=@file2.pdf" \
  -F "category=bid_attachment"

# Get file
curl http://localhost:3000/api/uploads/{id} \
  -H "Authorization: Bearer <token>"

# Delete file
curl -X DELETE http://localhost:3000/api/uploads/{id} \
  -H "Authorization: Bearer <token>"
```
