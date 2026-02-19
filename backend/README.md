# TriLink Backend

Production-ready Express.js backend built with TypeScript, MongoDB, and Mongoose.

## 🏗️ Tech Stack

- **Express.js** - Web framework
- **TypeScript** - Type-safe JavaScript
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Zod** - Schema validation
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **ts-node-dev** - Development server with hot reload

## 📁 Project Structure

```
backend/
├── src/
│   ├── app.ts              # Express app configuration
│   ├── server.ts           # Server entry point
│   ├── config/            # Configuration files
│   │   ├── env.ts        # Environment validation
│   │   └── database.ts   # MongoDB connection
│   ├── middlewares/       # Express middlewares
│   │   └── error.middleware.ts
│   └── routes/            # API routes (to be added)
├── .eslintrc.json         # ESLint configuration
├── .prettierrc.json       # Prettier configuration
├── .env.example           # Environment variables template
├── package.json           # Dependencies
└── tsconfig.json          # TypeScript configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB 6+
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

3. **Update `.env` with your configuration:**
   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/trilink
   CORS_ORIGIN=http://localhost:3000
   LOG_LEVEL=info
   ```

4. **Start MongoDB** (if not running):
   ```bash
   # Windows
   mongod
   
   # macOS/Linux
   sudo systemctl start mongod
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

6. **Test the API:**
   ```bash
   curl http://localhost:3000/health
   ```

## 📝 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run type-check` | Type check without emitting |

## 🔧 Configuration

### Environment Variables

All environment variables are validated using Zod schema. Required variables:

- `NODE_ENV` - Environment (development/production/test)
- `PORT` - Server port (default: 3000)
- `MONGODB_URI` - MongoDB connection string
- `CORS_ORIGIN` - CORS allowed origin (optional)
- `LOG_LEVEL` - Logging level (optional, default: info)

### TypeScript

TypeScript is configured with strict mode enabled. See `tsconfig.json` for details.

### ESLint & Prettier

Code quality is enforced through ESLint and Prettier:
- ESLint rules: TypeScript recommended + type checking
- Prettier: Consistent code formatting

## 🏥 Health Check

The API includes a health check endpoint:

```bash
GET /health
```

Response:
```json
{
  "success": true,
  "message": "TriLink API is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development"
}
```

## 🏛️ Architecture

The project follows a modular architecture pattern:

- **config/** - Configuration and environment setup
- **middlewares/** - Express middlewares
- **routes/** - API route handlers (to be added)
- **services/** - Business logic (to be added)
- **models/** - Database models (to be added)
- **utils/** - Utility functions (to be added)

## 🔒 Security

- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Environment validation** - Zod schema validation
- **Error handling** - Centralized error handling

## 📚 Next Steps

1. Add API routes in `src/routes/`
2. Create database models in `src/models/`
3. Implement business logic in `src/services/`
4. Add authentication middleware
5. Add request validation
6. Add logging service

## 📄 License

ISC

---

**TriLink Backend - Production Ready**
