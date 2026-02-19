# TriLink Platform - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Setup Environment Variables
Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/trilink
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-min-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=http://localhost:3001
LOG_LEVEL=info
```

### Step 3: Start MongoDB
Make sure MongoDB is running on `localhost:27017`

### Step 4: Seed Database
```bash
npm run seed
```

This creates:
- 6 sample companies (Buyer, Supplier, Logistics, Clearance, Service Provider, Government)
- 6 sample users (one for each role)
- All passwords: `Password123!`

### Step 5: Start Development Server
```bash
npm run dev
```

Server will start on `http://localhost:3000`

## 📝 Test the API

### 1. Login as Buyer
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "buyer@uae.gov.ae",
    "password": "Password123!"
  }'
```

Save the `accessToken` from the response.

### 2. Create a Purchase Request
```bash
curl -X POST http://localhost:3000/api/purchase-requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "title": "Office Equipment",
    "description": "Procurement of office equipment",
    "items": [{
      "name": "Desktop Computers",
      "quantity": 50,
      "unit": "units",
      "specifications": "Intel i7, 16GB RAM"
    }],
    "budget": 150000,
    "currency": "AED",
    "deliveryLocation": {
      "address": "Government Building",
      "city": "Abu Dhabi",
      "state": "Abu Dhabi",
      "country": "UAE",
      "zipCode": "00000"
    },
    "requiredDeliveryDate": "2024-12-31"
  }'
```

### 3. Approve Purchase Request (Auto-generates RFQs)
```bash
curl -X POST http://localhost:3000/api/purchase-requests/PURCHASE_REQUEST_ID/approve \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Login as Supplier and View Available RFQs
```bash
# Login as supplier
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "supplier@techsupplies.ae",
    "password": "Password123!"
  }'

# Get available RFQs
curl -X GET "http://localhost:3000/api/rfqs/available?targetCompanyType=Supplier" \
  -H "Authorization: Bearer SUPPLIER_ACCESS_TOKEN"
```

### 5. Submit a Bid
```bash
curl -X POST http://localhost:3000/api/bids \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SUPPLIER_ACCESS_TOKEN" \
  -d '{
    "rfqId": "RFQ_ID_HERE",
    "price": 140000,
    "currency": "AED",
    "terms": "30 days payment terms",
    "deliveryTime": 45,
    "deliveryDate": "2024-12-15"
  }'
```

## 🔑 Sample User Credentials

After running `npm run seed`, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@trilink.ae | Password123! |
| Buyer | buyer@uae.gov.ae | Password123! |
| Supplier | supplier@techsupplies.ae | Password123! |
| Logistics | logistics@fastlogistics.ae | Password123! |
| Clearance | clearance@clearance.ae | Password123! |
| Government | government@uae.gov.ae | Password123! |

## 📚 Next Steps

1. Read the [README.md](README.md) for full documentation
2. Check [API_EXAMPLES.md](API_EXAMPLES.md) for detailed API examples
3. Explore the codebase - each module follows the same structure:
   - `schema.ts` - MongoDB schema
   - `types.ts` - TypeScript types
   - `repository.ts` - Data access layer
   - `service.ts` - Business logic
   - `controller.ts` - HTTP handlers
   - `routes.ts` - Express routes

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod` or `brew services start mongodb-community`
- Check `MONGODB_URI` in `.env` file

### Port Already in Use
- Change `PORT` in `.env` file
- Or kill the process using port 3000

### Authentication Errors
- Make sure you're using the correct `accessToken` (not `refreshToken`)
- Tokens expire after 15 minutes - use refresh endpoint to get new token

### Permission Errors
- Check user role has required permissions (see `src/config/rbac.ts`)
- Ensure user belongs to correct company

## 📞 Support

For issues or questions, refer to the main [README.md](README.md) documentation.
