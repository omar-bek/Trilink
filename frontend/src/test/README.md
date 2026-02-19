# Testing Guide

This directory contains test utilities, mocks, and sample test cases for the TriLink frontend.

## Setup

Tests are configured using Vitest and React Testing Library.

### Running Tests

```bash
# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Structure

```
src/
├── test/
│   ├── setup.ts          # Test setup and global mocks
│   ├── utils.tsx         # Custom render function with providers
│   └── mocks/
│       ├── auth.ts        # Auth-related mocks
│       └── handlers.ts    # API mock handlers
├── components/
│   └── **/*.test.tsx     # Component tests
└── pages/
    └── **/*.test.tsx      # Page tests
```

## Test Utilities

### Custom Render Function

The `render` function from `@/test/utils` includes all necessary providers:
- QueryClientProvider (React Query)
- ThemeProvider (MUI)
- BrowserRouter (React Router)

```tsx
import { render, screen } from '@/test/utils';

test('example', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### Mocking Auth Store

```tsx
import { useAuthStore } from '@/store/auth.store';

vi.mock('@/store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

// In test
(useAuthStore as any).mockReturnValue({
  user: mockUser,
  isAuthenticated: true,
});
```

## Test Categories

### 1. Auth Flows

Tests for authentication-related functionality:
- Login form validation
- Login success/failure
- Logout functionality
- Token refresh

**Example:** `src/pages/Login/Login.test.tsx`

### 2. Protected Routes

Tests for route protection:
- Authentication checks
- Role-based access control
- Redirects

**Example:** `src/components/ProtectedRoute/ProtectedRoute.test.tsx`

### 3. Forms Validation

Tests for form validation:
- Required fields
- Email validation
- Password strength
- Field-specific validation

**Example:** `src/pages/Profile/Profile.test.tsx`

### 4. Role-Based Rendering

Tests for role-based UI rendering:
- Menu items visibility
- Component rendering based on role
- Permission checks

**Example:** `src/components/Layout/MainLayout.test.tsx`

## Writing Tests

### Component Test Example

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Form Test Example

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('should validate email', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'invalid-email');
    await user.tab();
    
    expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
  });
});
```

### Async Test Example

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';
import { DataComponent } from './DataComponent';

describe('DataComponent', () => {
  it('should load data', async () => {
    render(<DataComponent />);
    
    await waitFor(() => {
      expect(screen.getByText('Loaded')).toBeInTheDocument();
    });
  });
});
```

## Best Practices

1. **Test Behavior, Not Implementation**
   - Test what users see and do
   - Avoid testing internal implementation details

2. **Use Accessible Queries**
   - Prefer `getByRole`, `getByLabelText`, `getByText`
   - Avoid `getByTestId` unless necessary

3. **Mock External Dependencies**
   - Mock API calls
   - Mock router navigation
   - Mock store hooks

4. **Clean Up**
   - Use `beforeEach` and `afterEach` for setup/teardown
   - Reset mocks between tests

5. **Test User Interactions**
   - Use `userEvent` for user interactions
   - Test form submissions
   - Test navigation

6. **Test Error States**
   - Test error messages
   - Test loading states
   - Test empty states

## Coverage Goals

- **Components:** 80%+ coverage
- **Pages:** 70%+ coverage
- **Hooks:** 80%+ coverage
- **Utils:** 90%+ coverage

## Debugging Tests

### Run Single Test File

```bash
npm run test src/pages/Login/Login.test.tsx
```

### Debug in VS Code

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

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library User Event](https://testing-library.com/docs/user-event/intro/)
