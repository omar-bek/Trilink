# File Upload Setup Guide

## Quick Start

### 1. Install Required Packages

```bash
cd backend
npm install multer @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
npm install --save-dev @types/multer
```

### 2. Configure AWS S3

#### Option A: AWS Credentials File

Create `~/.aws/credentials`:

```ini
[default]
aws_access_key_id = YOUR_ACCESS_KEY_ID
aws_secret_access_key = YOUR_SECRET_ACCESS_KEY
```

#### Option B: Environment Variables

Add to `.env`:

```env
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=trilink-uploads
```

### 3. Create S3 Bucket

```bash
# Using AWS CLI
aws s3 mb s3://trilink-uploads --region us-east-1

# Or via AWS Console
# 1. Go to S3 Console
# 2. Create bucket: trilink-uploads
# 3. Region: us-east-1
# 4. Block all public access: Yes
# 5. Enable versioning (optional)
```

### 4. Set Bucket Policy (Optional)

Create `bucket-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyPublicAccess",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::trilink-uploads/*",
      "Condition": {
        "StringNotEquals": {
          "aws:Referer": "https://yourdomain.com"
        }
      }
    }
  ]
}
```

Apply policy:
```bash
aws s3api put-bucket-policy --bucket trilink-uploads --policy file://bucket-policy.json
```

### 5. Test Upload

```bash
curl -X POST http://localhost:3000/api/uploads \
  -H "Authorization: Bearer <your-token>" \
  -F "file=@test.pdf" \
  -F "category=bid_attachment"
```

## Development Mode (Local Storage Alternative)

For development without S3, you can modify `s3.service.ts` to use local storage:

```typescript
// Temporary local storage implementation
import fs from 'fs';
import path from 'path';

export class S3Service {
  async uploadFile(file: Express.Multer.File, category: string, companyId: string, userId: string) {
    const uploadDir = path.join(process.cwd(), 'uploads', category, companyId);
    await fs.promises.mkdir(uploadDir, { recursive: true });
    
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(uploadDir, fileName);
    
    await fs.promises.writeFile(filePath, file.buffer);
    
    return {
      key: `${category}/${companyId}/${fileName}`,
      bucket: 'local',
    };
  }
  
  async getPresignedUrl(key: string) {
    return `/uploads/${key}`;
  }
}
```

## Production Checklist

- [ ] S3 bucket created and configured
- [ ] IAM user with S3 permissions created
- [ ] Environment variables set in production
- [ ] Bucket versioning enabled (optional)
- [ ] Lifecycle policy configured (optional, for old file cleanup)
- [ ] CloudFront CDN configured (optional, for faster access)
- [ ] CORS configured if needed
- [ ] Monitoring and alerts set up

## Troubleshooting

### Error: "S3 bucket not configured"
- Check environment variables are set
- Verify AWS credentials are correct
- Ensure bucket name matches exactly

### Error: "Access Denied"
- Check IAM user has `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` permissions
- Verify bucket policy allows your IAM user

### Files not accessible
- Presigned URLs expire after 1 hour
- Generate fresh URL via GET /api/uploads/:id
- Check S3 bucket region matches configuration
