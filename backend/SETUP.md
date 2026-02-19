# TriLink Platform - Complete Setup Guide

## 📋 Prerequisites

Before starting, ensure you have:

- **Node.js** 18+ installed ([Download](https://nodejs.org/))
- **MongoDB** 6+ installed and running ([Download](https://www.mongodb.com/try/download/community))
- **npm** or **yarn** package manager
- **Git** (optional, for version control)

## 🚀 Step-by-Step Setup

### Step 1: Navigate to Backend Directory

```bash
cd backend
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Express.js
- MongoDB/Mongoose
- JWT authentication
- Socket.io
- Winston logger
- Zod validation
- And more...

### Step 3: Configure Environment Variables

1. Copy the environment template:
```bash
# Windows PowerShell
Copy-Item env.example.txt .env

# Linux/macOS
cp env.example.txt .env
```

2. Open `.env` file and update the following (at minimum):
```env
# Change these to secure random strings (min 32 characters)
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-min-32-chars

# Update MongoDB URI if different
MONGODB_URI=mongodb://localhost:27017/trilink
```

### Step 4: Start MongoDB

**Windows:**
```bash
# Option 1: If installed as service
net start MongoDB

# Option 2: Run directly
mongod --dbpath "C:\data\db"
```

**macOS:**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

Verify MongoDB is running:
```bash
mongosh
# Should connect successfully
```

### Step 5: Seed the Database

This creates sample companies and users for testing:

```bash
npm run seed
```

Expected output:
```
✅ Seed completed successfully!
📋 Sample Users Created:
Admin: admin@trilink.ae / Password123!
Buyer: buyer@uae.gov.ae / Password123!
Supplier: supplier@techsupplies.ae / Password123!
Logistics: logistics@fastlogistics.ae / Password123!
Clearance: clearance@clearance.ae / Password123!
Government: government@uae.gov.ae / Password123!
```

### Step 6: Start Development Server

```bash
npm run dev
```

Expected output:
```
🚀 TriLink Platform API server running on port 3000
📊 Environment: development
🔗 API Base URL: http://localhost:3000/api
```

### Step 7: Verify Installation

Open your browser or use curl:

```bash
# Health check
curl http://localhost:3000/api/health

# Expected response:
{
  "success": true,
  "message": "TriLink Platform API is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🧪 Test the API

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
    "title": "Office Equipment Procurement",
    "description": "Procurement of office equipment",
    "items": [{
      "name": "Desktop Computers",
      "quantity": 50,
      "unit": "units",
      "specifications": "Intel i7, 16GB RAM, 512GB SSD"
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

## 📁 Project Structure

```
backend/
├── src/
│   ├── app.ts              # Express app setup
│   ├── server.ts           # Server entry point
│   ├── routes.ts           # API routes
│   ├── config/            # Configuration
│   ├── middlewares/        # Express middlewares
│   ├── modules/           # Feature modules
│   ├── utils/            # Utilities
│   ├── socket/           # Socket.io setup
│   └── scripts/          # Database scripts
├── package.json
├── tsconfig.json
└── .env                  # Environment variables (create this)
```

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm run seed` | Seed database with sample data |
| `npm run clear` | Clear all database data |
| `npm test` | Run tests (when implemented) |

## 🔑 Default Credentials

After running `npm run seed`:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@trilink.ae | Password123! |
| Buyer | buyer@uae.gov.ae | Password123! |
| Supplier | supplier@techsupplies.ae | Password123! |
| Logistics | logistics@fastlogistics.ae | Password123! |
| Clearance | clearance@clearance.ae | Password123! |
| Government | government@uae.gov.ae | Password123! |

## 🐛 Troubleshooting

### MongoDB Connection Error

**Error:** `MongoDB connection error`

**Solutions:**
1. Verify MongoDB is running:
   ```bash
   mongosh
   ```
2. Check MongoDB URI in `.env` file
3. Ensure MongoDB is accessible on the specified port (default: 27017)

### Port Already in Use

**Error:** `Port 3000 is already in use`

**Solutions:**
1. Change PORT in `.env` file:
   ```env
   PORT=3001
   ```
2. Or kill the process using port 3000:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   
   # Linux/macOS
   lsof -ti:3000 | xargs kill
   ```

### Module Not Found Errors

**Error:** `Cannot find module '...'`

**Solution:**
```bash
npm install
```

### TypeScript Compilation Errors

**Error:** Type errors during build

**Solutions:**
1. Ensure all dependencies are installed
2. Check `tsconfig.json` configuration
3. Verify Node.js version (18+)

### Authentication Errors

**Error:** `Invalid or expired token`

**Solutions:**
1. Ensure you're using `accessToken` (not `refreshToken`)
2. Tokens expire after 15 minutes - use refresh endpoint
3. Check JWT_SECRET in `.env` matches the one used to generate token

### Permission Errors

**Error:** `Insufficient permissions`

**Solutions:**
1. Check user role has required permissions (see `src/config/rbac.ts`)
2. Ensure user belongs to correct company
3. Verify company isolation middleware is working

## 📚 Next Steps

1. **Read Documentation:**
   - [README.md](README.md) - Full documentation
   - [API_EXAMPLES.md](API_EXAMPLES.md) - API usage examples
   - [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - Architecture details

2. **Explore the Code:**
   - Start with `src/server.ts` - Entry point
   - Check `src/routes.ts` - API endpoints
   - Review modules in `src/modules/` - Feature implementations

3. **Test the Workflow:**
   - Create Purchase Request → Approve → View RFQs → Submit Bid → Create Contract → Track Shipment

4. **Customize:**
   - Update RBAC permissions in `src/config/rbac.ts`
   - Modify business logic in service files
   - Add new modules following the same pattern

## 🔒 Security Checklist

Before deploying to production:

- [ ] Change all default passwords
- [ ] Update JWT secrets to strong random strings
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper CORS origins
- [ ] Set up HTTPS/TLS
- [ ] Configure MongoDB authentication
- [ ] Set up proper logging and monitoring
- [ ] Review rate limiting settings
- [ ] Enable MongoDB backups
- [ ] Set up environment-specific configs

## 📞 Support

For issues or questions:
1. Check the [README.md](README.md)
2. Review [API_EXAMPLES.md](API_EXAMPLES.md)
3. Check error logs in `logs/` directory
4. Verify environment variables in `.env`

---

**TriLink Platform - Version 2.0**
