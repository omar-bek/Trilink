import { vi } from 'vitest';
import { Role } from '@/types';

export const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: Role.BUYER,
  companyId: 'company-1',
  status: 'active',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

export const mockAdminUser = {
  ...mockUser,
  id: 'admin-1',
  email: 'admin@example.com',
  role: Role.ADMIN,
};

export const mockSupplierUser = {
  ...mockUser,
  id: 'supplier-1',
  email: 'supplier@example.com',
  role: Role.SUPPLIER,
};

export const mockAuthStore = (overrides = {}) => {
  const defaultStore = {
    user: mockUser,
    accessToken: 'mock-access-token',
    isAuthenticated: true,
    isInitialized: true,
    login: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    initializeAuth: vi.fn().mockResolvedValue(undefined),
    waitForInitialization: vi.fn().mockResolvedValue(undefined),
    setAccessToken: vi.fn(),
    clearAuth: vi.fn(),
  };

  return { ...defaultStore, ...overrides };
};

export const createMockAuthStore = (overrides = {}) => {
  const store = mockAuthStore(overrides);
  return {
    useAuthStore: vi.fn(() => store),
    getState: vi.fn(() => store),
    subscribe: vi.fn(() => vi.fn()), // Returns unsubscribe function
    ...store,
  };
};
