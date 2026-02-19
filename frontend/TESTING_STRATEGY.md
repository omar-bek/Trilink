# Frontend Testing Strategy

## Overview

This document outlines the comprehensive testing strategy for the TriLink frontend application, targeting **minimum 70% code coverage** across all test categories.

## Test Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── **/__tests__/
│   │       └── *.test.tsx          # Component tests
│   ├── hooks/
│   │   └── __tests__/
│   │       └── *.test.ts           # Hook tests
│   ├── services/
│   │   └── __tests__/
│   │       └── *.test.ts           # Service tests
│   ├── pages/
│   │   └── **/__tests__/
│   │       └── *.test.tsx          # Page tests
│   └── test/
│       ├── setup.ts                # Test setup
│       ├── mocks/                  # Mock utilities
│       │   ├── api.ts
│       │   ├── auth.ts
│       │   ├── reactQuery.ts
│       │   └── notification.ts
│       └── utils/
│           └── render.tsx          # Enhanced render utilities
└── e2e/                            # E2E tests (Playwright/Cypress)
    └── tests/
        └── *.spec.ts
```

## Test Categories

### 1. Unit Tests for Hooks

**Target Coverage: 80%+**

#### What to Test:
- Query hooks (data fetching)
- Mutation hooks (create, update, delete)
- Custom hooks (useDebounce, usePagination, etc.)
- Error handling
- Success callbacks
- Query invalidation

#### Example Files:
- `src/hooks/__tests__/usePurchaseRequests.test.ts`
- `src/hooks/__tests__/useRFQs.test.ts`
- `src/hooks/__tests__/useBids.test.ts`

#### Key Test Cases:
```typescript
describe('usePurchaseRequests', () => {
  it('should fetch purchase requests successfully');
  it('should handle error when fetching fails');
  it('should refetch on query invalidation');
  it('should show success notification on create');
  it('should show error notification on failure');
});
```

### 2. API Services & Interceptors

**Target Coverage: 75%+**

#### What to Test:
- Service methods (get, post, put, delete)
- Request parameter building
- Response handling
- Error handling
- Request interceptors (auth token injection)
- Response interceptors (401, 403, error handling)

#### Example Files:
- `src/services/__tests__/rfq.service.test.ts`
- `src/services/__tests__/api.interceptors.test.ts`

#### Key Test Cases:
```typescript
describe('rfqService', () => {
  it('should build correct query parameters');
  it('should handle pagination parameters');
  it('should handle filters correctly');
});

describe('API Interceptors', () => {
  it('should add Authorization header when token exists');
  it('should refresh token on 401 error');
  it('should redirect on 403 error');
  it('should handle network errors');
});
```

### 3. RBAC & ProtectedRoute Tests

**Target Coverage: 90%+**

#### What to Test:
- Authentication checks
- Role-based access control
- Route protection
- Redirects (login, unauthorized)
- Loading states during initialization
- Admin access to all routes

#### Example Files:
- `src/components/ProtectedRoute/__tests__/ProtectedRoute.test.tsx`

#### Key Test Cases:
```typescript
describe('ProtectedRoute', () => {
  it('should render children when authenticated');
  it('should redirect to login when not authenticated');
  it('should check required role');
  it('should check allowed roles');
  it('should allow ADMIN to access any route');
});
```

### 4. ErrorBoundary Tests

**Target Coverage: 85%+**

#### What to Test:
- Error catching
- Error display
- Error reporting to Sentry
- Reset functionality
- Custom fallback support
- Error details display

#### Example Files:
- `src/components/ErrorBoundary/__tests__/ErrorBoundary.test.tsx`

#### Key Test Cases:
```typescript
describe('ErrorBoundary', () => {
  it('should catch and display errors');
  it('should report errors to Sentry');
  it('should allow error recovery');
  it('should show error details in dev mode');
});
```

### 5. Component Tests

**Target Coverage: 70%+**

#### What to Test:
- Rendering
- User interactions
- Form validation
- State management
- Props handling
- Conditional rendering

#### Example Files:
- `src/components/Layout/__tests__/MainLayout.test.tsx`
- `src/pages/Login/__tests__/Login.test.tsx`

### 6. E2E Tests (Critical Flows)

**Target Coverage: Critical paths only**

#### What to Test:
- User authentication flow
- Purchase request creation flow
- RFQ bidding flow
- Payment approval flow
- Navigation between pages

#### Tools:
- **Playwright** (recommended) or **Cypress**
- Test against staging environment

## Running Tests

### Unit Tests
```bash
# Run all tests
npm run test

# Run in watch mode
npm run test:watch

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Run once (CI mode)
npm run test:run

# CI with coverage
npm run test:ci
```

### E2E Tests
```bash
# Playwright
npx playwright test

# Cypress
npx cypress run
```

## Coverage Goals

| Category | Target Coverage |
|----------|----------------|
| Hooks | 80%+ |
| Services | 75%+ |
| Components | 70%+ |
| Pages | 70%+ |
| Utils | 90%+ |
| **Overall** | **70%+** |

## Test Utilities

### Enhanced Render Function
```typescript
import { render } from '@/test/utils/render';

// With custom options
render(<Component />, {
  initialEntries: ['/custom-path'],
  queryClient: customQueryClient,
  withRouter: true,
  withNotifications: true,
});
```

### Mock Helpers
```typescript
import { createMockResponse, createMockPaginatedResponse } from '@/test/mocks/api';
import { mockAuthStore } from '@/test/mocks/auth';
import { mockNotificationService } from '@/test/mocks/notification';
```

## Best Practices

1. **Test Behavior, Not Implementation**
   - Focus on what users see and do
   - Avoid testing internal implementation details

2. **Use Accessible Queries**
   - Prefer `getByRole`, `getByLabelText`, `getByText`
   - Avoid `getByTestId` unless necessary

3. **Mock External Dependencies**
   - Mock API calls
   - Mock router navigation
   - Mock store hooks
   - Mock notification service

4. **Test Error States**
   - Test error messages
   - Test loading states
   - Test empty states

5. **Clean Up**
   - Use `beforeEach` and `afterEach`
   - Reset mocks between tests
   - Clear query cache

6. **Test User Interactions**
   - Use `userEvent` for interactions
   - Test form submissions
   - Test navigation

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run tests
  run: npm run test:ci

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## Debugging Tests

### VS Code Debugger
1. Set breakpoints in test files
2. Use VS Code debugger with Vitest configuration
3. Check console output for detailed errors

### Common Issues

1. **"Cannot find module"**
   - Check path aliases in `vitest.config.ts`
   - Verify imports use `@/` prefix

2. **"useAuthStore is not a function"**
   - Ensure mocks are set up correctly
   - Check mock return values

3. **"Element not found"**
   - Use `screen.debug()` to see rendered output
   - Check if element is conditionally rendered
   - Verify async operations are awaited

## Next Steps

1. ✅ Enhanced test utilities created
2. ✅ Sample hook tests created
3. ✅ Sample service tests created
4. ✅ Enhanced ProtectedRoute tests
5. ✅ ErrorBoundary tests created
6. ⏳ Set up E2E testing framework
7. ⏳ Add more component tests
8. ⏳ Achieve 70%+ coverage

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library User Event](https://testing-library.com/docs/user-event/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [Cypress Documentation](https://docs.cypress.io/)
