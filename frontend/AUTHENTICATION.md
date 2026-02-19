# Authentication Implementation Guide

## Overview

The TriLink frontend implements a complete authentication system with JWT tokens, automatic token refresh, protected routes, and role-based access control.

## Architecture

### Components

1. **Auth Store (Zustand)** - `src/store/auth.store.ts`
   - Manages authentication state
   - Persists to localStorage
   - Provides login, logout, register methods

2. **API Service** - `src/services/api.ts`
   - Axios instance with interceptors
   - Automatic token injection
   - Automatic token refresh on 401 errors

3. **Protected Routes** - `src/components/ProtectedRoute/ProtectedRoute.tsx`
   - Route guards for authentication
   - Role-based access control
   - Loading states

4. **Login Page** - `src/pages/Login/Login.tsx`
   - Form validation
   - Error handling
   - Redirect after login

5. **Auth Hook** - `src/hooks/useAuth.ts`
   - Helper functions for role checking
   - Convenience methods for common auth operations

## Features

### ✅ JWT Token Handling

- Access tokens stored in Zustand store and localStorage
- Refresh tokens for automatic renewal
- Tokens automatically added to API requests
- Secure token storage

### ✅ Automatic Token Refresh

When a 401 error occurs:
1. Interceptor catches the error
2. Attempts to refresh using refresh token
3. Updates store and localStorage with new tokens
4. Retries original request
5. If refresh fails, clears auth and redirects to login

### ✅ Protected Routes

```tsx
<ProtectedRoute requiredRole={Role.ADMIN}>
  <AdminPage />
</ProtectedRoute>
```

Supports:
- Single role: `requiredRole={Role.ADMIN}`
- Multiple roles: `requiredRole={[Role.ADMIN, Role.BUYER]}`
- Allowed roles: `allowedRoles={[Role.BUYER, Role.SUPPLIER]}`

### ✅ Role-Based Navigation

Navigation items filtered by role:
- Admin sees everything
- Other roles see only allowed items
- Dynamic menu based on user role

## Usage Examples

### Login

```tsx
import { useAuthStore } from '@/store/auth.store';

const { login } = useAuthStore();

try {
  await login(email, password);
  navigate('/dashboard');
} catch (error) {
  // Handle error
}
```

### Check Authentication

```tsx
import { useAuthStore } from '@/store/auth.store';

const { isAuthenticated, user } = useAuthStore();

if (isAuthenticated) {
  // User is logged in
}
```

### Check Role

```tsx
import { useAuth } from '@/hooks/useAuth';

const { hasRole, isAdmin, canAccess } = useAuth();

if (isAdmin()) {
  // User is admin
}

if (hasRole(Role.BUYER)) {
  // User is buyer
}

if (canAccess([Role.BUYER, Role.SUPPLIER])) {
  // User can access
}
```

### Protected Route

```tsx
import { ProtectedRoute } from '@/components/ProtectedRoute/ProtectedRoute';
import { Role } from '@/types';

<ProtectedRoute requiredRole={Role.ADMIN}>
  <AdminDashboard />
</ProtectedRoute>
```

### Logout

```tsx
import { useAuthStore } from '@/store/auth.store';

const { logout } = useAuthStore();

const handleLogout = async () => {
  await logout();
  navigate('/login');
};
```

## Roles

Matching backend RBAC system:

- `Role.ADMIN` - Full access
- `Role.BUYER` - Purchase requests, RFQs, contracts
- `Role.SUPPLIER` - RFQs, bids, contracts
- `Role.LOGISTICS` - Shipments, GPS tracking
- `Role.CLEARANCE` - Customs clearance
- `Role.SERVICE_PROVIDER` - Service offerings
- `Role.GOVERNMENT` - Analytics, oversight

## Token Flow

1. **Login**: User submits credentials → API returns access + refresh tokens
2. **Storage**: Tokens stored in Zustand store and localStorage
3. **Requests**: Access token added to Authorization header
4. **Refresh**: On 401, refresh token used to get new access token
5. **Logout**: Tokens cleared from store and localStorage

## Security Considerations

- ✅ Tokens stored securely in localStorage (consider httpOnly cookies for production)
- ✅ Automatic token refresh prevents session interruption
- ✅ Failed refresh triggers logout
- ✅ Protected routes prevent unauthorized access
- ✅ Role-based access control at route level
- ✅ API interceptors handle token management automatically

## Error Handling

- Login errors displayed to user
- Token refresh failures trigger logout
- Network errors handled gracefully
- 401 errors trigger automatic refresh attempt

## Testing

To test authentication:

1. **Login**: Use credentials from backend seed
   - Admin: `admin@trilink.ae` / `Password123!`
   - Buyer: `buyer@uae.gov.ae` / `Password123!`

2. **Token Refresh**: 
   - Login and wait for access token to expire
   - Make API request → should auto-refresh

3. **Protected Routes**:
   - Try accessing `/dashboard` without login → redirects to `/login`
   - Login → can access dashboard

4. **Role-Based Access**:
   - Login as buyer → see buyer-accessible routes
   - Login as admin → see all routes

## Future Enhancements

- [ ] Remember me functionality
- [ ] Two-factor authentication
- [ ] Session timeout warnings
- [ ] Multiple device management
- [ ] Password reset flow
- [ ] Email verification
