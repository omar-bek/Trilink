# Database Seeding System

Complete database seeding system for TriLink Platform with realistic, workflow-ready data.

## 📁 Structure

```
src/seeds/
├── index.ts              # Main orchestrator
├── clear-db.ts          # Database clearing utility
├── companies.seed.ts    # Company data
├── users.seed.ts        # User accounts
├── purchase-requests.seed.ts  # Purchase requests
├── rfqs.seed.ts         # RFQs (auto-generated)
├── bids.seed.ts         # Bids (one per RFQ)
├── contracts.seed.ts    # Contracts (from accepted bids)
├── shipments.seed.ts    # Shipments with GPS tracking
├── payments.seed.ts     # Milestone-based payments
└── disputes.seed.ts     # Disputes (optional)
```

## 🚀 Usage

### Clear Database
```bash
npm run clear-db
```

### Seed Database
```bash
npm run seed
```

### Full Reset
```bash
npm run clear-db && npm run seed
```

## 👥 Seeded Accounts

All accounts use password: `Password123!`

| Role | Email | Company |
|------|-------|---------|
| Admin | admin@trilink.ae | - |
| Government | gov@trilink.ae | - |
| Buyer | buyer@buyer.com | Emirates Buyer LLC |
| Supplier | supplier@supplier.com | Gulf Supplier FZCO |
| Logistics | logistics@logistics.com | UAE Logistics LLC |
| Clearance | clearance@clearance.com | Dubai Clearance Services |
| Service Provider | service@service.com | Gulf Inspection Services |

## 🔄 Workflow

The seed system creates a complete procurement workflow:

1. **Purchase Request** (submitted)
   - Created by Buyer
   - 3 items: Desktop Computers, Printers, Furniture
   - Budget: 250,000 AED

2. **RFQs** (open)
   - Auto-generated for Supplier, Logistics, Clearance, Service Provider
   - Budget allocated: 60%, 15%, 10%, 15%

3. **Bids** (submitted → accepted)
   - One bid per RFQ
   - AI scores: 8.5, 9.0, 8.8, 9.2
   - All bids accepted

4. **Contract** (active)
   - Auto-generated from accepted bids
   - All parties signed
   - Total value: 240,000 AED
   - Payment schedule: 30% advance, 40% delivery, 30% final

5. **Shipment** (in_transit)
   - Linked to contract
   - GPS tracking history
   - Status progression: in_production → ready_for_pickup → in_transit

6. **Payments** (mixed statuses)
   - Advance Payment: COMPLETED
   - Delivery Payment: APPROVED
   - Final Payment: PENDING_APPROVAL

7. **Dispute** (under_review)
   - Quality dispute from Buyer against Supplier
   - Includes attachments

## ✅ Features

- **Idempotent**: Safe to run multiple times
- **Workflow-ready**: Complete end-to-end procurement flow
- **Realistic data**: Coherent, linked entities
- **RBAC compliant**: Respects role-based access control
- **Company isolation**: Proper multi-tenant data
- **Status transitions**: Valid lifecycle states

## 📝 Notes

- All passwords are hashed using bcrypt
- Companies are pre-approved (status: APPROVED)
- Bids are automatically accepted for contract generation
- Contract signatures are mocked (for demo purposes)
- GPS coordinates are realistic UAE locations
- Payment amounts are calculated proportionally per party
