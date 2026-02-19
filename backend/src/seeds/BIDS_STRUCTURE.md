# Bids Seed Structure - New Enhanced Version

## 🆕 What's New

### Enhanced Bid Structure with Payment Schedule
- **Payment Schedule**: Each bid now includes a detailed payment schedule
- **Structured Milestones**: Payment milestones with amounts, percentages, and due dates
- **Type-Specific Schedules**: Different payment schedules for each RFQ type
- **Validation**: Automatic verification that payment schedules total 100%

## 📋 Payment Schedule by RFQ Type

### 1. Supplier Bids
**Payment Schedule**: 3 milestones
- **Advance Payment** (30%)
  - Due: 7 days from contract signing
  - Description: Payment upon contract signing
  
- **Delivery Payment** (40%)
  - Due: 7 days before delivery date
  - Description: Payment upon delivery confirmation
  
- **Final Payment** (30%)
  - Due: 14 days after delivery
  - Description: Payment after inspection and acceptance

### 2. Logistics Bids
**Payment Schedule**: 2 milestones
- **Advance Payment** (50%)
  - Due: 7 days from contract signing
  - Description: Payment upon contract signing
  
- **Delivery Payment** (50%)
  - Due: On delivery date
  - Description: Payment upon successful delivery

### 3. Clearance Bids
**Payment Schedule**: 1 milestone
- **Completion Payment** (100%)
  - Due: 3 days after completion
  - Description: Full payment upon clearance completion

### 4. Service Provider Bids
**Payment Schedule**: 2 milestones
- **Advance Payment** (40%)
  - Due: 7 days from contract signing
  - Description: Payment upon contract signing
  
- **Completion Payment** (60%)
  - Due: 7 days after completion
  - Description: Payment upon service completion and acceptance

## 📊 Payment Schedule Structure

Each payment schedule item includes:
- **milestone**: Name of the payment milestone (required)
- **amount**: Payment amount in currency (calculated)
- **percentage**: Payment percentage (0-100)
- **dueDate**: When payment is due (calculated based on delivery date)
- **description**: Additional description of the payment milestone

## 🔄 Integration with Contracts

When a bid is accepted and a contract is created:
- The payment schedule from the bid can be used to create the contract's payment schedule
- Payment amounts are automatically calculated based on percentages
- Due dates are set relative to delivery dates

## ✅ Validation

The seed process automatically:
- Verifies that payment schedule percentages total 100%
- Calculates payment amounts based on bid price
- Sets realistic due dates based on delivery timelines
- Warns if payment schedule doesn't total 100%

## 🚀 Usage

### Seed Bids
```bash
npm run seed
```

This will create bids with:
- Proper payment schedules for each RFQ type
- Calculated amounts and percentages
- Realistic due dates
- Validation warnings if needed

## 📝 Example Output

```
💰 Seeding Bids...
  ✓ Created SUPPLIER Bid for Desktop Computers: 42500 AED (3 payment milestones)
  ✓ Created LOGISTICS Bid for Desktop Computers: 12500 AED (2 payment milestones)
  ✓ Created CLEARANCE Bid for Desktop Computers: 10000 AED (1 payment milestones)
  ✓ Created SERVICE_PROVIDER Bid for Desktop Computers: 12500 AED (2 payment milestones)
✅ Seeded 4 bids across 1 Purchase Requests
```

## 🔗 Related Files

- `bids.seed.ts`: Main seed file with payment schedule logic
- `bids/schema.ts`: Bid schema with paymentSchedule field
- `contracts.seed.ts`: Uses bid payment schedules for contract creation
