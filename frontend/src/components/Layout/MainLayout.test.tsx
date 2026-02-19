import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils';
import { MainLayout } from './MainLayout';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';
import { MemoryRouter } from 'react-router-dom';

// Mock the auth store
vi.mock('@/store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

// Mock navigation config
vi.mock('@/config/navigation', () => ({
  getNavigationItems: vi.fn((role: string) => {
    const items: any[] = [
      { label: 'Dashboard', path: '/dashboard', icon: null },
    ];
    
    if (role === 'Buyer' || role === 'Admin') {
      items.push({ label: 'Purchase Requests', path: '/purchase-requests', icon: null });
    }
    
    if (role === 'Supplier' || role === 'Admin') {
      items.push({ label: 'Bids', path: '/bids', icon: null });
    }
    
    if (role === 'Government' || role === 'Admin') {
      items.push({ label: 'Analytics', path: '/analytics/government', icon: null });
    }
    
    return items;
  }),
}));

describe('MainLayout - Role-based Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render buyer-specific menu items for buyer role', () => {
    (useAuthStore as any).mockReturnValue({
      user: {
        id: '1',
        email: 'buyer@example.com',
        firstName: 'Buyer',
        lastName: 'User',
        role: Role.BUYER,
        companyId: 'company-1',
      },
      isAuthenticated: true,
    });

    render(
      <MemoryRouter>
        <MainLayout>
          <div>Test Content</div>
        </MainLayout>
      </MemoryRouter>
    );

    // Buyer should see Purchase Requests
    expect(screen.getByText(/purchase requests/i)).toBeInTheDocument();
  });

  it('should render supplier-specific menu items for supplier role', () => {
    (useAuthStore as any).mockReturnValue({
      user: {
        id: '2',
        email: 'supplier@example.com',
        firstName: 'Supplier',
        lastName: 'User',
        role: Role.SUPPLIER,
        companyId: 'company-2',
      },
      isAuthenticated: true,
    });

    render(
      <MemoryRouter>
        <MainLayout>
          <div>Test Content</div>
        </MainLayout>
      </MemoryRouter>
    );

    // Supplier should see Bids
    expect(screen.getByText(/bids/i)).toBeInTheDocument();
  });

  it('should render admin-specific menu items for admin role', () => {
    (useAuthStore as any).mockReturnValue({
      user: {
        id: '3',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: Role.ADMIN,
        companyId: 'company-3',
      },
      isAuthenticated: true,
    });

    render(
      <MemoryRouter>
        <MainLayout>
          <div>Test Content</div>
        </MainLayout>
      </MemoryRouter>
    );

    // Admin should see all menu items
    expect(screen.getByText(/purchase requests/i)).toBeInTheDocument();
    expect(screen.getByText(/rfqs/i)).toBeInTheDocument();
  });

  it('should render government-specific menu items for government role', () => {
    (useAuthStore as any).mockReturnValue({
      user: {
        id: '4',
        email: 'gov@example.com',
        firstName: 'Government',
        lastName: 'User',
        role: Role.GOVERNMENT,
        companyId: 'company-4',
      },
      isAuthenticated: true,
    });

    render(
      <MemoryRouter>
        <MainLayout>
          <div>Test Content</div>
        </MainLayout>
      </MemoryRouter>
    );

    // Government should see Analytics
    expect(screen.getByText(/analytics/i)).toBeInTheDocument();
  });

  it('should display user name in top bar', () => {
    (useAuthStore as any).mockReturnValue({
      user: {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: Role.BUYER,
        companyId: 'company-1',
      },
      isAuthenticated: true,
    });

    render(
      <MemoryRouter>
        <MainLayout>
          <div>Test Content</div>
        </MainLayout>
      </MemoryRouter>
    );

    expect(screen.getByText(/test user/i)).toBeInTheDocument();
  });

  it('should render sidebar navigation', () => {
    (useAuthStore as any).mockReturnValue({
      user: {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: Role.BUYER,
        companyId: 'company-1',
      },
      isAuthenticated: true,
    });

    render(
      <MemoryRouter>
        <MainLayout>
          <div>Test Content</div>
        </MainLayout>
      </MemoryRouter>
    );

    // Should have navigation items
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });
});
