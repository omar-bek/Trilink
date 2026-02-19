import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils';
import { ProtectedRoute, PublicRoute } from './ProtectedRoute';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';
import { MemoryRouter } from 'react-router-dom';

// Mock the auth store
vi.mock('@/store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

describe('ProtectedRoute', () => {
  const TestComponent = () => <div>Protected Content</div>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children when user is authenticated', () => {
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: true,
      user: {
        id: '1',
        email: 'test@example.com',
        role: Role.BUYER,
      },
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should redirect to login when user is not authenticated', () => {
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>
    );

    // Should redirect to login, so protected content should not be visible
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should redirect to unauthorized when user does not have required role', () => {
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: true,
      user: {
        id: '1',
        email: 'test@example.com',
        role: Role.BUYER,
      },
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <ProtectedRoute requiredRole={Role.ADMIN}>
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should render children when user has required role', () => {
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: true,
      user: {
        id: '1',
        email: 'admin@example.com',
        role: Role.ADMIN,
      },
    });

    render(
      <MemoryRouter>
        <ProtectedRoute requiredRole={Role.ADMIN}>
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should render children when user has one of the allowed roles', () => {
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: true,
      user: {
        id: '1',
        email: 'buyer@example.com',
        role: Role.BUYER,
      },
    });

    render(
      <MemoryRouter>
        <ProtectedRoute allowedRoles={[Role.BUYER, Role.SUPPLIER]}>
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should redirect to unauthorized when user does not have allowed role', () => {
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: true,
      user: {
        id: '1',
        email: 'logistics@example.com',
        role: Role.LOGISTICS,
      },
    });

    render(
      <MemoryRouter initialEntries={['/restricted']}>
        <ProtectedRoute allowedRoles={[Role.BUYER, Role.SUPPLIER]}>
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});

describe('PublicRoute', () => {
  const TestComponent = () => <div>Public Content</div>;

  it('should render children when user is not authenticated', () => {
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    render(
      <MemoryRouter>
        <PublicRoute>
          <TestComponent />
        </PublicRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Public Content')).toBeInTheDocument();
  });

  it('should redirect to dashboard when user is authenticated', () => {
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: true,
      user: {
        id: '1',
        email: 'test@example.com',
        role: Role.BUYER,
      },
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <PublicRoute>
          <TestComponent />
        </PublicRoute>
      </MemoryRouter>
    );

    // Should redirect to dashboard, so public content should not be visible
    expect(screen.queryByText('Public Content')).not.toBeInTheDocument();
  });
});
