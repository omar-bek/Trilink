# Testing Quick Start Guide

## Quick Commands

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## Test Template

### Hook Test Template
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useMyHook } from '../useMyHook';
import { myService } from '@/services/my.service';
import { mockNotificationService } from '@/test/mocks/notification';

vi.mock('@/services/my.service');
vi.mock('@/utils/notification', () => ({
  notificationService: mockNotificationService,
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useMyHook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should work correctly', async () => {
    vi.mocked(myService.getData).mockResolvedValue({ success: true, data: [] });

    const { result } = renderHook(() => useMyHook(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
```

### Component Test Template
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils/render';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Service Test Template
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { myService } from '../my.service';
import api from '../api';
import { createMockResponse } from '@/test/mocks/api';

vi.mock('../api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

describe('myService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch data', async () => {
    const mockData = createMockResponse({ id: '1' });
    vi.mocked(api.get).mockResolvedValue({ data: mockData });

    const result = await myService.getData();

    expect(api.get).toHaveBeenCalledWith('/api/data');
    expect(result).toEqual(mockData);
  });
});
```

## Common Patterns

### Mock Auth Store
```typescript
import { useAuthStore } from '@/store/auth.store';
import { mockAuthStore } from '@/test/mocks/auth';

vi.mock('@/store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

// In test
(useAuthStore as any).mockReturnValue(mockAuthStore({
  user: { id: '1', role: Role.BUYER },
  isAuthenticated: true,
}));
```

### Mock API Response
```typescript
import { createMockResponse, createMockPaginatedResponse } from '@/test/mocks/api';

const mockData = createMockResponse({ id: '1', name: 'Test' });
const paginatedData = createMockPaginatedResponse([item1, item2], 1, 20, 50);
```

### Test User Interactions
```typescript
import userEvent from '@testing-library/user-event';

const user = userEvent.setup();
await user.click(screen.getByRole('button'));
await user.type(screen.getByLabelText(/email/i), 'test@example.com');
```

### Test Async Operations
```typescript
import { waitFor } from '@testing-library/react';

await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

## File Locations

- **Hook Tests**: `src/hooks/__tests__/*.test.ts`
- **Service Tests**: `src/services/__tests__/*.test.ts`
- **Component Tests**: `src/components/**/__tests__/*.test.tsx`
- **Page Tests**: `src/pages/**/__tests__/*.test.tsx`
- **E2E Tests**: `e2e/tests/*.spec.ts`

## Need Help?

- See `TESTING_STRATEGY.md` for comprehensive guide
- See `src/test/README.md` for test utilities
- Check existing tests for examples
