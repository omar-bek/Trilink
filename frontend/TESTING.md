# Frontend Testing Implementation

## Overview

Comprehensive testing setup using Vitest and React Testing Library for the TriLink frontend application.

## Tools

- **Vitest**: Fast unit test framework
- **React Testing Library**: React component testing utilities
- **@testing-library/jest-dom**: Custom Jest matchers for DOM
- **@testing-library/user-event**: User interaction simulation

## Setup

### Installation

```bash
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### Configuration

- **vitest.config.ts**: Vitest configuration with path aliases
- **src/test/setup.ts**: Global test setup and mocks
- **src/test/utils.tsx**: Custom render function with providers

## Test Structure

```
frontend/
├── vitest.config.ts              # Vitest configuration
├── src/
│   ├── test/
│   │   ├── setup.ts              # Test setup
│   │   ├── utils.tsx            # Test utilities
│   │   ├── mocks/
│   │   │   ├── auth.ts          # Auth mocks
│   │   │   └── handlers.ts      # API handlers
│   │   └── README.md            # Testing guide
│   ├── components/
│   │   └── **/*.test.tsx        # Component tests
│   └── pages/
│       └── **/*.test.tsx         # Page tests
```

## Test Categories

### 1. Auth Flows ✅

**File:** `src/pages/Login/Login.test.tsx`

**Tests:**
- ✅ Render login form
- ✅ Email validation
- ✅ Empty form validation
- ✅ Successful login
- ✅ Login failure error handling
- ✅ Password visibility toggle
- ✅ Loading state
- ✅ Navigation on success

**Example:**
```tsx
it('should call login function with correct credentials', async () => {
  const user = userEvent.setup();
  mockLogin.mockResolvedValue({});

  render(<Login />);
  
  await user.type(emailInput, 'test@example.com');
  await user.type(passwordInput, 'password123');
  await user.click(submitButton);

  expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
});
```

### 2. Protected Routes ✅

**File:** `src/components/ProtectedRoute/ProtectedRoute.test.tsx`

**Tests:**
- ✅ Render children when authenticated
- ✅ Redirect to login when not authenticated
- ✅ Redirect to unauthorized when role doesn't match
- ✅ Allow access with required role
- ✅ Allow access with allowed roles
- ✅ Deny access without allowed role
- ✅ Public route redirects authenticated users

**Example:**
```tsx
it('should redirect to login when user is not authenticated', () => {
  (useAuthStore as any).mockReturnValue({
    isAuthenticated: false,
    user: null,
  });

  render(
    <MemoryRouter>
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    </MemoryRouter>
  );

  expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
});
```

### 3. Forms Validation ✅

**File:** `src/pages/Profile/Profile.test.tsx`

**Tests:**
- ✅ Render profile form with user data
- ✅ Loading state
- ✅ Profile update
- ✅ Success message after update
- ✅ Password form visibility
- ✅ Password match validation
- ✅ Password minimum length validation
- ✅ Successful password change
- ✅ Account information display
- ✅ Disabled fields (email, role)

**Example:**
```tsx
it('should validate password form - passwords must match', async () => {
  const user = userEvent.setup();
  render(<Profile />);

  await user.click(changePasswordButton);
  await user.type(newPasswordInput, 'newpassword123');
  await user.type(confirmPasswordInput, 'differentpassword');
  await user.click(submitButton);

  expect(screen.getByText(/passwords must match/i)).toBeInTheDocument();
});
```

### 4. Role-Based Rendering ✅

**File:** `src/components/Layout/MainLayout.test.tsx`

**Tests:**
- ✅ Buyer-specific menu items
- ✅ Supplier-specific menu items
- ✅ Admin-specific menu items
- ✅ Government-specific menu items
- ✅ User name display
- ✅ Sidebar navigation

**Example:**
```tsx
it('should render buyer-specific menu items for buyer role', () => {
  (useAuthStore as any).mockReturnValue({
    user: { role: Role.BUYER },
    isAuthenticated: true,
  });

  render(<MainLayout><div>Test</div></MainLayout>);

  expect(screen.getByText(/purchase requests/i)).toBeInTheDocument();
});
```

## Test Utilities

### Custom Render Function

Includes all necessary providers:
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

### Mock Helpers

**Auth Store Mock:**
```tsx
vi.mock('@/store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

(useAuthStore as any).mockReturnValue({
  user: mockUser,
  isAuthenticated: true,
});
```

**React Router Mock:**
```tsx
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});
```

## Running Tests

### Commands

```bash
# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Watch Mode

Vitest runs in watch mode by default:
- Automatically reruns tests on file changes
- Press `a` to run all tests
- Press `f` to run only failed tests
- Press `q` to quit

### Coverage

Coverage reports are generated in:
- `coverage/` directory
- HTML report: `coverage/index.html`
- Text report in terminal

## Best Practices

### 1. Test Behavior, Not Implementation

✅ Good:
```tsx
it('should show error on login failure', async () => {
  mockLogin.mockRejectedValue({ message: 'Invalid credentials' });
  // ... test user interaction
  expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
});
```

❌ Bad:
```tsx
it('should call login function', () => {
  // Testing implementation details
  expect(component.login).toHaveBeenCalled();
});
```

### 2. Use Accessible Queries

✅ Good:
```tsx
screen.getByRole('button', { name: /sign in/i });
screen.getByLabelText(/email address/i);
screen.getByText(/welcome/i);
```

❌ Bad:
```tsx
screen.getByTestId('submit-button');
screen.getByClassName('btn-primary');
```

### 3. Mock External Dependencies

✅ Good:
```tsx
vi.mock('@/store/auth.store');
vi.mock('@/services/api');
```

❌ Bad:
```tsx
// Using real API calls in tests
```

### 4. Test User Interactions

✅ Good:
```tsx
const user = userEvent.setup();
await user.type(emailInput, 'test@example.com');
await user.click(submitButton);
```

❌ Bad:
```tsx
fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
```

### 5. Clean Up Between Tests

✅ Good:
```tsx
beforeEach(() => {
  vi.clearAllMocks();
});
```

## Coverage Goals

- **Components:** 80%+ coverage
- **Pages:** 70%+ coverage
- **Hooks:** 80%+ coverage
- **Utils:** 90%+ coverage

## Sample Test Files

### Auth Flow Test
- `src/pages/Login/Login.test.tsx`
- Tests login form, validation, and error handling

### Protected Route Test
- `src/components/ProtectedRoute/ProtectedRoute.test.tsx`
- Tests route protection and role-based access

### Form Validation Test
- `src/pages/Profile/Profile.test.tsx`
- Tests form validation and submission

### Role-Based Rendering Test
- `src/components/Layout/MainLayout.test.tsx`
- Tests role-based menu rendering

## Debugging Tests

### VS Code Debugging

1. Set breakpoints in test files
2. Use VS Code debugger
3. Check console output

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

### Additional Tests to Add

1. **Component Tests:**
   - [ ] KPICard component
   - [ ] StatusBadge components
   - [ ] DocumentUpload component
   - [ ] ChartPlaceholder component

2. **Page Tests:**
   - [ ] Dashboard page
   - [ ] PurchaseRequestList page
   - [ ] RFQDetails page
   - [ ] CompanySettings page

3. **Hook Tests:**
   - [ ] useProfile hook
   - [ ] useCompany hook
   - [ ] useDashboard hook
   - [ ] usePurchaseRequests hook

4. **Integration Tests:**
   - [ ] Complete user flows
   - [ ] Multi-step forms
   - [ ] Navigation flows

5. **E2E Tests (Future):**
   - [ ] Playwright or Cypress setup
   - [ ] Critical user journeys

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library User Event](https://testing-library.com/docs/user-event/intro/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
