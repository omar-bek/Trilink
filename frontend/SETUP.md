# TriLink Frontend Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure Environment**
   - The `.env` file is already created with default values
   - Update if your backend runs on a different port or URL

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   - Frontend will run on `http://localhost:3001`
   - Backend should be running on `http://localhost:3000`

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ErrorBoundary/  # Error handling
│   │   ├── Layout/          # App layout & navigation
│   │   ├── LoadingSkeleton/ # Loading states
│   │   └── ProtectedRoute/  # Route guards
│   ├── config/              # Configuration
│   │   └── env.ts          # Environment variables
│   ├── pages/               # Page components
│   │   ├── Dashboard/      # Dashboard page
│   │   ├── Login/          # Login page
│   │   └── Unauthorized/   # 403 page
│   ├── router/             # Routing setup
│   │   └── AppRouter.tsx   # Main router
│   ├── services/           # API services
│   │   ├── api.ts         # Axios instance
│   │   └── auth.service.ts # Auth API calls
│   ├── store/              # Zustand stores
│   │   └── auth.store.ts   # Auth state
│   ├── theme/              # MUI theme
│   │   └── theme.ts       # Theme config
│   ├── types/              # TypeScript types
│   │   └── index.ts       # Type definitions
│   ├── utils/              # Utility functions
│   │   └── index.ts       # Helper functions
│   └── main.tsx           # Entry point
├── public/                 # Static assets
├── .env                   # Environment variables
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
└── vite.config.ts         # Vite config
```

## Key Features

### Authentication
- JWT-based authentication with access & refresh tokens
- Automatic token refresh on 401 errors
- Persistent auth state using Zustand + localStorage
- Protected routes with role-based access control

### State Management
- **Zustand**: Global client state (auth, UI state)
- **React Query**: Server state (API data, caching, refetching)

### Routing
- React Router v6
- Protected routes (`/dashboard`, etc.)
- Public routes (`/login`)
- Role-based route protection

### UI Components
- Material UI (MUI) components
- Custom theme with TriLink branding
- Responsive layout with drawer navigation
- Loading skeletons
- Error boundary

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:3000/api` |
| `VITE_APP_NAME` | Application name | `TriLink` |
| `VITE_APP_VERSION` | Application version | `1.0.0` |

## Adding New Features

### Adding a New Page

1. Create page component in `src/pages/YourPage/YourPage.tsx`
2. Export from `src/pages/index.ts`
3. Add route in `src/router/AppRouter.tsx`:
   ```tsx
   <Route
     path="/your-page"
     element={
       <ProtectedRoute>
         <AppLayout>
           <YourPage />
         </AppLayout>
       </ProtectedRoute>
     }
   />
   ```
4. Add navigation item in `src/components/Layout/AppLayout.tsx` if needed

### Adding a New API Service

1. Create service file in `src/services/your-service.ts`
2. Use the `api` instance from `src/services/api.ts`
3. Add types in `src/types/index.ts`
4. Use React Query hooks in components:
   ```tsx
   import { useQuery } from '@tanstack/react-query';
   import { yourService } from '@/services/your-service';
   
   const { data, isLoading } = useQuery({
     queryKey: ['your-data'],
     queryFn: () => yourService.getData(),
   });
   ```

### Adding a New Store (Zustand)

1. Create store file in `src/store/your-store.ts`
2. Use Zustand's `create` function
3. Export hooks for components:
   ```tsx
   export const useYourStore = create<YourStoreState>((set) => ({
     // state and actions
   }));
   ```

## Troubleshooting

### Port Already in Use
If port 3001 is in use, update `vite.config.ts`:
```ts
server: {
  port: 3002, // Change to available port
}
```

### API Connection Issues
1. Ensure backend is running on `http://localhost:3000`
2. Check CORS settings in backend
3. Verify `VITE_API_BASE_URL` in `.env`

### Type Errors
Run TypeScript check:
```bash
npx tsc --noEmit
```

## Production Build

1. Build the app:
   ```bash
   npm run build
   ```

2. Preview the build:
   ```bash
   npm run preview
   ```

3. Deploy the `dist/` folder to your hosting service

## Next Steps

- [ ] Add more pages (Purchase Requests, RFQs, etc.)
- [ ] Implement data fetching with React Query
- [ ] Add form validation (React Hook Form + Zod)
- [ ] Add unit tests (Vitest + React Testing Library)
- [ ] Add E2E tests (Playwright/Cypress)
- [ ] Set up CI/CD pipeline
