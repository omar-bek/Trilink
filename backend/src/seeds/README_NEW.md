# Database Seeding System - New Structure

## 🆕 What's New

### Enhanced Permissions
The system now includes comprehensive permissions for:
- **Payment Management**: Approve, reject, retry payments, view/manage payment schedules
- **Contract Amendments**: Create, view, approve, reject amendments
- **GPS Tracking**: Manage GPS tracking and view GPS history
- **Dispute Management**: Assign, close disputes
- **Document Management**: Upload, view, delete documents
- **Reporting**: View, generate, and export reports

### Updated Collections
All collections are now properly cleared including:
- Notifications
- Uploads
- Contract Amendments
- Audit Logs
- All existing collections

## 🚀 Usage

### Clear Database
```bash
npm run clear-db
```

This will clear ALL collections in the correct order:
1. Audit Logs
2. Notifications
3. Uploads
4. Contract Amendments
5. Disputes
6. Payments
7. Shipments
8. Contracts
9. Bids
10. RFQs
11. Purchase Requests
12. Users
13. Companies

### Seed Database
```bash
npm run seed
```

## 🔐 New Permissions by Role

### Buyer
- ✅ Approve/Reject Payments
- ✅ View Payment Schedules
- ✅ View/Upload Documents
- ✅ View Reports

### Company Manager
- ✅ All Buyer permissions
- ✅ Manage Payment Schedules
- ✅ Create/Approve Contract Amendments
- ✅ Delete Documents
- ✅ Generate Reports
- ✅ Export Data

### Supplier
- ✅ View Payment Schedules
- ✅ View/Upload Documents
- ✅ View Reports

### Logistics
- ✅ Manage GPS Tracking
- ✅ View GPS History
- ✅ View Payment Schedules
- ✅ View/Upload Documents

### Clearance
- ✅ View Payment Schedules
- ✅ View/Upload Documents
- ✅ View Reports

### Service Provider
- ✅ View Payment Schedules
- ✅ View/Upload Documents
- ✅ View Reports

### Government
- ✅ Resolve/Assign/Close Disputes
- ✅ View Payment Schedules
- ✅ Generate Reports
- ✅ Export Data

## 📊 Data Structure

The seed system creates a complete workflow with:
- Multiple companies across all types
- Users with proper role assignments
- Purchase requests with realistic data
- RFQs auto-generated from purchase requests
- Bids with AI scoring
- Contracts with payment schedules
- Shipments with GPS tracking
- Payments with milestone-based structure
- Disputes for testing escalation
- Documents and uploads
- Notifications for all events

## 🔄 Workflow

1. **Purchase Request** → Created by Buyer
2. **RFQs** → Auto-generated for each service type
3. **Bids** → Submitted by suppliers/service providers
4. **Contracts** → Created from accepted bids
5. **Shipments** → Created for active contracts
6. **Payments** → Milestone-based payments created
7. **Disputes** → Optional disputes for testing

## 📝 Notes

- All passwords: `Password123!`
- All data is realistic and workflow-ready
- Permissions are enforced at the API level
- Multi-tenant architecture ensures data isolation
