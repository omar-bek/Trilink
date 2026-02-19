# Password Reset Implementation

This document describes the password reset functionality implemented for the TriLink Platform.

## Overview

The password reset feature allows users to securely reset their passwords via email. The implementation uses JWT-based tokens with expiration, secure password hashing, and email notifications.

## Features

- ✅ **Forgot Password**: Request password reset via email
- ✅ **Reset Password**: Reset password using secure token
- ✅ **JWT-based Tokens**: Secure token generation and validation
- ✅ **Token Expiration**: 1-hour expiration for security
- ✅ **Email Notifications**: HTML email templates with reset links
- ✅ **Security Best Practices**: 
  - Email enumeration prevention
  - Password strength validation
  - Rate limiting
  - Secure password hashing (bcrypt)

## API Endpoints

### POST /api/auth/forgot-password

Request a password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "If an account exists with this email, a password reset link has been sent."
  },
  "requestId": "..."
}
```

**Security Note:** Always returns success to prevent email enumeration attacks.

### POST /api/auth/reset-password

Reset password using token from email.

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "password": "NewSecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Password has been reset successfully."
  },
  "requestId": "..."
}
```

## Implementation Details

### Token Generation

Password reset tokens are JWT tokens with:
- **Type**: `password-reset` (to distinguish from other tokens)
- **Expiration**: 1 hour
- **Payload**: Contains `userId`, `email`, and `type`

```typescript
generatePasswordResetToken(userId: string, email: string): string
```

### Token Verification

Tokens are verified with:
- Signature validation
- Expiration check
- Type validation (`password-reset`)
- Email matching (extra security layer)

```typescript
verifyPasswordResetToken(token: string): PasswordResetPayload
```

### Email Template

The password reset email includes:
- Personalized greeting (if user name available)
- Reset button with link
- Plain text link as fallback
- Expiration notice (1 hour)
- Security notice

The reset URL format:
```
{FRONTEND_URL}/reset-password?token={resetToken}
```

### Security Features

1. **Email Enumeration Prevention**
   - Always returns success for forgot-password requests
   - Doesn't reveal if email exists in system

2. **Token Security**
   - Short expiration (1 hour)
   - Type-specific tokens
   - Email verification in token payload

3. **Password Validation**
   - Minimum 8 characters
   - Secure bcrypt hashing (12 rounds)

4. **Rate Limiting**
   - Both endpoints are rate-limited
   - Prevents abuse and brute-force attacks

5. **Account Status Check**
   - Only active accounts can reset passwords
   - Inactive accounts are silently ignored

## File Structure

```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── controller.ts      # Added forgotPassword, resetPassword methods
│   │   │   ├── routes.ts          # Added routes with validation
│   │   │   ├── service.ts          # Added forgotPassword, resetPassword logic
│   │   │   └── types.ts           # Added ForgotPasswordDto, ResetPasswordDto
│   │   └── users/
│   │       ├── repository.ts       # Added updatePassword method
│   │       └── service.ts          # Added updatePassword method
│   └── utils/
│       ├── jwt.ts                  # Added password reset token functions
│       └── email-templates.ts      # Password reset email templates
└── openapi.yaml                    # Updated with new endpoints
```

## Environment Variables

Required environment variables (already configured):

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars

# Email Configuration
SENDGRID_API_KEY=your-sendgrid-api-key  # OR use SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend URL (for reset links)
FRONTEND_URL=http://localhost:3001
```

## Usage Flow

1. **User requests password reset**
   ```
   POST /api/auth/forgot-password
   { "email": "user@example.com" }
   ```

2. **System sends email**
   - Generates JWT reset token
   - Sends email with reset link
   - Token expires in 1 hour

3. **User clicks reset link**
   - Frontend extracts token from URL
   - User enters new password

4. **User submits reset**
   ```
   POST /api/auth/reset-password
   {
     "token": "...",
     "password": "NewSecurePass123!"
   }
   ```

5. **System validates and updates**
   - Verifies token (signature, expiration, type)
   - Validates password strength
   - Updates password with bcrypt hash
   - Returns success

## Error Handling

### Invalid Token
- **Status**: 400 Bad Request
- **Message**: "Invalid or expired reset token"

### User Not Found
- **Status**: 404 Not Found
- **Message**: "User not found"

### Inactive Account
- **Status**: 403 Forbidden
- **Message**: "Account is not active"

### Weak Password
- **Status**: 400 Bad Request
- **Message**: "Password must be at least 8 characters long"

### Rate Limit Exceeded
- **Status**: 429 Too Many Requests
- **Message**: Rate limit error

## Testing

### Manual Testing

1. **Test forgot password:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com"}'
   ```

2. **Check email** for reset link (or check logs if using Ethereal)

3. **Test reset password:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/reset-password \
     -H "Content-Type: application/json" \
     -d '{"token": "YOUR_TOKEN_HERE", "password": "NewPass123!"}'
   ```

### Integration Testing

Consider adding tests for:
- Token generation and validation
- Email sending (mock email service)
- Password update functionality
- Error scenarios (expired token, invalid token, etc.)

## Security Considerations

1. **Token Storage**: Tokens are not stored in database - they're self-contained JWTs
2. **Token Reuse**: Each reset request generates a new token (old tokens become invalid)
3. **Email Security**: Reset links should only be sent to verified email addresses
4. **HTTPS**: Always use HTTPS in production for reset links
5. **Token Expiration**: Short expiration (1 hour) limits attack window
6. **Rate Limiting**: Prevents abuse and brute-force attempts

## Future Enhancements

Potential improvements:
- [ ] Token blacklisting (if token reuse prevention needed)
- [ ] Password history (prevent reusing recent passwords)
- [ ] Password strength meter
- [ ] Two-factor authentication for password reset
- [ ] Reset link click tracking
- [ ] Multiple reset attempts logging

## Related Documentation

- [Email Notification System](./EMAIL_NOTIFICATIONS.md)
- [Authentication Guide](./README.md)
- [OpenAPI Specification](./openapi.yaml)
