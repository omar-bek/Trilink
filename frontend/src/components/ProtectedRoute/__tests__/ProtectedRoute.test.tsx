import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/render';
import { ProtectedRoute, PublicRoute } from '../ProtectedRoute';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';
import { MemoryRouter } from 'react-router-dom';

// Mock the auth store
vi.mock('@/store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

const TestComponent = () => <div>Protected Content</div>;
const PublicComponent = () => <div>Public Content</div>;

describe('ProtectedRoute', () => {
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
      isInitialized: true,
      waitForInitialization: vi.fn().mockResolvedValue(undefined),
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

  it('should show loading screen during initialization', () => {
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: false,
      user: null,
      isInitialized: false,
      waitForInitialization: vi.fn().mockResolvedValue(undefined),
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText(/Initializing authentication/i)).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should redirect to login when user is not authenticated', async () => {
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: false,
      user: null,
      isInitialized: true,
      waitForInitialization: vi.fn().mockResolvedValue(undefined),
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  it('should redirect to unauthorized when user does not have required role', async () => {
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: true,
      user: {
        id: '1',
        email: 'test@example.com',
        role: Role.BUYER,
      },
      isInitialized: true,
      waitForInitialization: vi.fn().mockResolvedValue(undefined),
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <ProtectedRoute requiredRole={Role.ADMIN}>
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  it('should render children when user has required role', () => {
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: true,
      user: {
        id: '1',
        email: 'admin@example.com',
        role: Role.ADMIN,
      },
      isInitialized: true,
      waitForInitialization: vi.fn().mockResolvedValue(undefined),
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
      isInitialized: true,
      waitForInitialization: vi.fn().mockResolvedValue(undefined),
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

  it('should redirect when user does not have allowed role', async () => {
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: true,
      user: {
        id: '1',
        email: 'logistics@example.com',
        role: Role.LOGISTICS,
      },
      isInitialized: true,
      waitForInitialization: vi.fn().mockResolvedValue(undefined),
    });

    render(
      <MemoryRouter initialEntries={['/restricted']}>
        <ProtectedRoute allowedRoles={[Role.BUYER, Role.SUPPLIER]}>
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  it('should allow ADMIN to access any route', () => {
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: true,
      user: {
        id: '1',
        email: 'admin@example.com',
        role: Role.ADMIN,
      },
      isInitialized: true,
      waitForInitialization: vi.fn().mockResolvedValue(undefined),
    });

    render(
      <MemoryRouter>
        <ProtectedRoute requiredRole={Role.BUYER}>
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});

describe('PublicRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children when user is not authenticated', () => {
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: false,
      user: null,
      isInitialized: true,
      waitForInitialization: vi.fn().mockResolvedValue(undefined),
    });

    render(
      <MemoryRouter>
        <PublicRoute>
          <PublicComponent />
        </PublicRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Public Content')).toBeInTheDocument();
  });

  it('should redirect to dashboard when user is authenticated', async () => {
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: true,
      user: {
        id: '1',
        email: 'test@example.com',
        role: Role.BUYER,
      },
      isInitialized: true,
      waitForInitialization: vi.fn().mockResolvedValue(undefined),
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <PublicRoute>
          <PublicComponent />
        </PublicRoute>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Public Content')).not.toBeInTheDocument();
    });
  });
});
