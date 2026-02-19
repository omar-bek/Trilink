# Users Seed Structure - New Enhanced Version

## 🆕 What's New

### Enhanced User Structure
- **Custom Permissions**: Users can now have custom permissions beyond their role
- **Status Management**: Explicit status assignment for all users
- **Enhanced Roles**: New specialized users with specific permissions

## 📋 User Categories

### 1. Admin Users
- **admin@trilink.ae**: Full system administrator
  - Role: Admin
  - Permissions: All (ADMIN_ALL)

### 2. Government Users
- **gov@trilink.ae**: Government user with enhanced dispute resolution
  - Role: Government
  - Custom Permissions:
    - RESOLVE_DISPUTE
    - ASSIGN_DISPUTE
    - CLOSE_DISPUTE
    - GENERATE_REPORTS
    - EXPORT_DATA

- **dispute.resolver@trilink.ae**: Specialized dispute resolver
  - Role: Government
  - Custom Permissions:
    - RESOLVE_DISPUTE
    - ASSIGN_DISPUTE
    - CLOSE_DISPUTE
    - ESCALATE_DISPUTE
    - VIEW_GOVERNMENT_ANALYTICS
    - GENERATE_REPORTS
    - EXPORT_DATA

### 3. Buyer Users
- **buyer1@trilink.ae**: Buyer with payment approval
  - Custom Permissions:
    - APPROVE_PAYMENT
    - REJECT_PAYMENT
    - VIEW_PAYMENT_SCHEDULE

- **buyer2@trilink.ae**: Buyer with reporting access
  - Custom Permissions:
    - VIEW_PAYMENT_SCHEDULE
    - VIEW_REPORTS

- **senior.buyer@trilink.ae**: Senior buyer with advanced permissions
  - Custom Permissions:
    - APPROVE_PAYMENT
    - REJECT_PAYMENT
    - VIEW_PAYMENT_SCHEDULE
    - MANAGE_PAYMENT_SCHEDULE
    - CREATE_AMENDMENT
    - VIEW_AMENDMENT
    - GENERATE_REPORTS
    - EXPORT_DATA

### 4. Company Managers
All company managers have enhanced permissions:
- **manager@buyer.trilink.ae**
- **manager@supplier.trilink.ae**
- **manager@supplier2.trilink.ae**
- **manager@logistics.trilink.ae**
- **manager@clearance.trilink.ae**
- **manager@serviceprovider.trilink.ae**

Custom Permissions:
- MANAGE_PAYMENT_SCHEDULE
- CREATE_AMENDMENT
- APPROVE_AMENDMENT
- GENERATE_REPORTS
- EXPORT_DATA
- DELETE_DOCUMENT

### 5. Logistics Users
- **logistics1@trilink.ae**: GPS tracking specialist
  - Custom Permissions:
    - MANAGE_GPS_TRACKING
    - VIEW_GPS_HISTORY
    - UPDATE_GPS

- **gps.coordinator@trilink.ae**: Senior GPS coordinator
  - Custom Permissions:
    - MANAGE_GPS_TRACKING
    - VIEW_GPS_HISTORY
    - UPDATE_GPS
    - VIEW_PAYMENT_SCHEDULE
    - GENERATE_REPORTS

### 6. Supplier Users
- **doc.manager@trilink.ae**: Document management specialist
  - Custom Permissions:
    - UPLOAD_DOCUMENT
    - DELETE_DOCUMENT
    - VIEW_DOCUMENT
    - VIEW_PAYMENT_SCHEDULE
    - VIEW_REPORTS

### 7. Clearance Users
- **clearance.officer@trilink.ae**: Enhanced clearance officer
  - Custom Permissions:
    - UPDATE_SHIPMENT
    - VIEW_PAYMENT_SCHEDULE
    - UPLOAD_DOCUMENT
    - VIEW_DOCUMENT
    - VIEW_REPORTS

## 🔐 Permission Structure

### Base Role Permissions
Each role has base permissions defined in `rbac.ts`

### Custom Permissions
Users can have additional permissions beyond their role:
- Stored in `customPermissions` array
- Combined with role permissions
- Can override or extend role capabilities

## 📊 User Status

All users are created with `Status.ACTIVE` by default, but can be explicitly set:
- `ACTIVE`: User can log in and use the system
- `INACTIVE`: User account is disabled
- `PENDING`: User account awaiting activation

## 🚀 Usage

### Seed Users
```bash
npm run seed
```

This will create all users with:
- Hashed passwords (Password123!)
- Proper role assignments
- Custom permissions where applicable
- Active status

### User Login
All users can log in with:
- Email: [user-email]
- Password: `Password123!`

## 📝 Notes

- Custom permissions are additive (added to role permissions)
- Admin role always has all permissions regardless of custom permissions
- Company Managers have the most comprehensive permissions
- Specialized users have focused permission sets for their tasks
