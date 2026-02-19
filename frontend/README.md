# TriLink Frontend

Production-ready React frontend for the TriLink Digital Trade & Procurement Platform.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Material UI (MUI)** - Component library
- **React Router** - Routing
- **Zustand** - Global state management
- **React Query** - Server state management
- **Axios** - HTTP client

## Features

- ✅ Clean, scalable folder structure
- ✅ Environment configuration
- ✅ Global MUI theme
- ✅ Layout system with navigation
- ✅ Protected routes with role-based access
- ✅ Error boundary
- ✅ Loading skeletons
- ✅ JWT authentication with token refresh
- ✅ Responsive design

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable components
│   │   ├── ErrorBoundary/  # Error boundary component
│   │   ├── Layout/          # App layout and navigation
│   │   ├── LoadingSkeleton/ # Loading states
│   │   └── ProtectedRoute/ # Route protection
│   ├── config/              # Configuration files
│   ├── pages/               # Page components
│   │   ├── Dashboard/
│   │   └── Login/
│   ├── router/              # Router setup
│   ├── services/            # API services
│   ├── store/               # Zustand stores
│   ├── theme/               # MUI theme configuration
│   ├── types/               # TypeScript types
│   └── main.tsx             # Entry point
├── .env                     # Environment variables
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running on `http://localhost:3000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
# Copy .env.example to .env (already done)
# Edit .env if needed
```

3. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3001`

### Build for Production

```bash
npm run build
```

The production build will be in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

## Environment Variables

- `VITE_API_BASE_URL` - Backend API base URL (default: `http://localhost:3000/api`)
- `VITE_APP_NAME` - Application name
- `VITE_APP_VERSION` - Application version

## Authentication

The app uses JWT authentication with access and refresh tokens:
- Tokens are stored in localStorage
- Automatic token refresh on 401 errors
- Protected routes redirect to login if not authenticated

## Default Credentials

After seeding the backend database:
- **Admin**: admin@trilink.ae / Password123!
- **Buyer**: buyer@uae.gov.ae / Password123!
- **Supplier**: supplier@techsupplies.ae / Password123!

## Development

### Adding New Pages

1. Create page component in `src/pages/`
2. Add route in `src/router/AppRouter.tsx`
3. Add navigation item in `src/components/Layout/AppLayout.tsx` if needed

### Adding New API Services

1. Create service file in `src/services/`
2. Use the `api` instance from `src/services/api.ts`
3. Add types in `src/types/`

### State Management

- **Zustand**: For global client state (auth, UI state)
- **React Query**: For server state (API data, caching)

## License

MIT
