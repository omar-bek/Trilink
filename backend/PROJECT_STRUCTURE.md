# TriLink Platform - Project Structure

## 📁 Complete Directory Structure

```
backend/
├── src/
│   ├── app.ts                    # Express app configuration
│   ├── server.ts                 # Server entry point
│   ├── routes.ts                 # Main API routes
│   │
│   ├── config/                   # Configuration files
│   │   ├── env.ts               # Environment variables
│   │   ├── database.ts          # MongoDB connection
│   │   └── rbac.ts              # Role-Based Access Control
│   │
│   ├── middlewares/              # Express middlewares
│   │   ├── auth.middleware.ts   # JWT authentication
│   │   ├── rbac.middleware.ts   # Permission checking
│   │   ├── ownership.middleware.ts # Company isolation
│   │   ├── rateLimit.middleware.ts # Rate limiting
│   │   └── error.middleware.ts   # Error handling
│   │
│   ├── utils/                    # Utility functions
│   │   ├── jwt.ts               # JWT token management
│   │   ├── logger.ts            # Winston logger
│   │   └── requestId.ts         # Request ID generation
│   │
│   ├── socket/                   # Socket.io configuration
│   │   └── socket.ts            # Real-time shipment tracking
│   │
│   ├── types/                    # TypeScript types
│   │   └── common.ts            # Common types
│   │
│   ├── scripts/                  # Utility scripts
│   │   ├── seed.ts              # Database seeding
│   │   └── clear.ts             # Database cleanup
│   │
│   └── modules/                  # Feature modules
│       ├── auth/                 # Authentication
│       │   ├── controller.ts
│       │   ├── service.ts
│       │   ├── routes.ts
│       │   └── types.ts
│       │
│       ├── users/                # User management
│       │   ├── schema.ts         # MongoDB schema
│       │   ├── types.ts          # TypeScript types
│       │   ├── repository.ts    # Data access layer
│       │   ├── service.ts        # Business logic
│       │   ├── controller.ts    # HTTP handlers
│       │   └── routes.ts         # Express routes
│       │
│       ├── companies/            # Company management
│       │   ├── schema.ts
│       │   ├── types.ts
│       │   ├── repository.ts
│       │   ├── service.ts
│       │   ├── controller.ts
│       │   └── routes.ts
│       │
│       ├── purchase-requests/    # Purchase requests
│       │   ├── schema.ts
│       │   ├── types.ts
│       │   ├── repository.ts
│       │   ├── service.ts
│       │   ├── controller.ts
│       │   └── routes.ts
│       │
│       ├── rfqs/                 # Request for Quotations
│       │   ├── schema.ts
│       │   ├── types.ts
│       │   ├── repository.ts
│       │   ├── service.ts
│       │   ├── controller.ts
│       │   └── routes.ts
│       │
│       ├── bids/                 # Bids & AI scoring
│       │   ├── schema.ts
│       │   ├── types.ts
│       │   ├── repository.ts
│       │   ├── service.ts
│       │   ├── ai-scoring.service.ts # AI scoring stub
│       │   ├── controller.ts
│       │   └── routes.ts
│       │
│       ├── contracts/            # Contracts & signatures
│       │   ├── schema.ts
│       │   ├── types.ts
│       │   ├── repository.ts
│       │   ├── service.ts
│       │   ├── controller.ts
│       │   └── routes.ts
│       │
│       ├── shipments/            # Shipment tracking
│       │   ├── schema.ts
│       │   ├── types.ts
│       │   ├── repository.ts
│       │   ├── service.ts
│       │   ├── controller.ts
│       │   └── routes.ts
│       │
│       ├── payments/             # Payment processing
│       │   ├── schema.ts
│       │   ├── types.ts
│       │   ├── repository.ts
│       │   ├── service.ts
│       │   ├── controller.ts
│       │   └── routes.ts
│       │
│       ├── disputes/             # Dispute management
│       │   ├── schema.ts
│       │   ├── types.ts
│       │   ├── repository.ts
│       │   ├── service.ts
│       │   ├── controller.ts
│       │   └── routes.ts
│       │
│       └── analytics/            # Analytics & reporting
│           ├── service.ts
│           ├── controller.ts
│           └── routes.ts
│
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript configuration
├── .gitignore                    # Git ignore rules
├── env.example.txt               # Environment variables template
├── README.md                     # Main documentation
├── API_EXAMPLES.md               # API usage examples
├── QUICKSTART.md                 # Quick start guide
└── PROJECT_STRUCTURE.md          # This file
```

## 🏗️ Architecture Pattern

Each module follows the same structure:

1. **schema.ts** - MongoDB/Mongoose schema definition
2. **types.ts** - TypeScript interfaces and DTOs
3. **repository.ts** - Data access layer (database operations)
4. **service.ts** - Business logic layer
5. **controller.ts** - HTTP request handlers
6. **routes.ts** - Express route definitions with validation

## 🔄 Data Flow

```
HTTP Request
    ↓
routes.ts (Validation + RBAC)
    ↓
controller.ts (Request handling)
    ↓
service.ts (Business logic)
    ↓
repository.ts (Database operations)
    ↓
MongoDB
```

## 📦 Key Files

### Entry Points
- `src/server.ts` - Application entry point, starts HTTP server and Socket.io
- `src/app.ts` - Express app configuration and middleware setup
- `src/routes.ts` - Main API route aggregator

### Configuration
- `src/config/env.ts` - Environment variable management
- `src/config/database.ts` - MongoDB connection
- `src/config/rbac.ts` - Role and permission definitions

### Core Utilities
- `src/utils/jwt.ts` - JWT token generation and verification
- `src/utils/logger.ts` - Winston logger configuration
- `src/utils/requestId.ts` - Request ID middleware

### Real-Time
- `src/socket/socket.ts` - Socket.io configuration for shipment tracking

## 🎯 Module Responsibilities

### Auth Module
- User registration
- Login/logout
- Token refresh
- Password hashing

### Users Module
- User CRUD operations
- Role management
- Company association

### Companies Module
- Company registration
- Multi-tenant isolation
- Company documents

### Purchase Requests Module
- Create procurement requests
- Auto-generate RFQs
- Status management

### RFQs Module
- RFQ creation
- Auto-generation for all provider types
- Deadline management

### Bids Module
- Bid submission
- AI scoring (stub)
- Bid evaluation

### Contracts Module
- Multi-party contract creation
- Digital signatures
- Payment schedule management

### Shipments Module
- Shipment creation
- Real-time GPS tracking (Socket.io)
- Status updates

### Payments Module
- Payment creation
- Milestone tracking
- Payment processing

### Disputes Module
- Dispute creation
- Government escalation
- Resolution tracking

### Analytics Module
- Government analytics
- Company analytics
- KPI aggregation

## 🔐 Security Layers

1. **Authentication** - JWT tokens (auth.middleware.ts)
2. **Authorization** - RBAC (rbac.middleware.ts)
3. **Ownership** - Company isolation (ownership.middleware.ts)
4. **Rate Limiting** - Request throttling (rateLimit.middleware.ts)
5. **Validation** - Input validation (Zod schemas in routes.ts)
6. **Error Handling** - Centralized error handling (error.middleware.ts)

## 📊 Database Models

All models include:
- `createdAt` / `updatedAt` - Timestamps
- `deletedAt` - Soft delete support
- `companyId` - Multi-tenant isolation
- Status enums - Workflow management

## 🚀 Scripts

- `npm run dev` - Development server with hot reload
- `npm run build` - TypeScript compilation
- `npm start` - Production server
- `npm run seed` - Database seeding
- `npm run clear` - Database cleanup
