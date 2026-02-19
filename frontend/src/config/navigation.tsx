import { ReactNode } from 'react';
import {
  Dashboard as DashboardIcon,
  ShoppingCart as ShoppingCartIcon,
  Assignment as AssignmentIcon,
  Gavel as GavelIcon,
  LocalShipping as LocalShippingIcon,
  Payment as PaymentIcon,
  AccountBalance as AccountBalanceIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  GpsFixed as GpsFixedIcon,
} from '@mui/icons-material';
import { Role } from '@/types';

export interface NavigationItem {
  id: string;
  label: string;
  icon: ReactNode;
  path: string;
  roles?: Role[]; // If undefined, all authenticated users can access
  badge?: number;
  children?: NavigationItem[];
  divider?: boolean; // Add divider before this item
}

/**
 * Navigation configuration with role-based access
 * Admin can access all items
 */
export const navigationConfig: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
    // All roles can access dashboard
  },
  {
    id: 'divider-1',
    divider: true,
    label: '',
    icon: null,
    path: '',
  },
  {
    id: 'procurement',
    label: 'Procurement',
    icon: <ShoppingCartIcon />,
    path: '/purchase-requests',
    roles: [Role.BUYER, Role.COMPANY_MANAGER, Role.SUPPLIER, Role.ADMIN, Role.GOVERNMENT],
    children: [
      {
        id: 'purchase-requests',
        label: 'Purchase Requests',
        icon: <ShoppingCartIcon />,
        path: '/purchase-requests',
        roles: [Role.BUYER, Role.COMPANY_MANAGER, Role.ADMIN, Role.GOVERNMENT],
      },
      {
        id: 'rfqs',
        label: 'RFQs',
        icon: <AssignmentIcon />,
        path: '/rfqs',
        roles: [Role.BUYER, Role.COMPANY_MANAGER, Role.SUPPLIER, Role.LOGISTICS, Role.CLEARANCE, Role.SERVICE_PROVIDER, Role.ADMIN, Role.GOVERNMENT],
      },
      {
        id: 'bids',
        label: 'Bids',
        icon: <GavelIcon />,
        path: '/bids',
        roles: [Role.BUYER, Role.COMPANY_MANAGER, Role.SUPPLIER, Role.LOGISTICS, Role.CLEARANCE, Role.SERVICE_PROVIDER, Role.ADMIN],
      },
      {
        id: 'contracts',
        label: 'Contracts',
        icon: <AccountBalanceIcon />,
        path: '/contracts',
        roles: [Role.BUYER, Role.COMPANY_MANAGER, Role.SUPPLIER, Role.LOGISTICS, Role.CLEARANCE, Role.SERVICE_PROVIDER, Role.ADMIN, Role.GOVERNMENT],
      },
    ],
  },
  {
    id: 'clearance',
    label: 'Customs Clearance',
    icon: <GavelIcon />,
    path: '/clearance',
    roles: [Role.CLEARANCE, Role.ADMIN],
    children: [
      {
        id: 'clearance-dashboard',
        label: 'Clearance Dashboard',
        icon: <AssessmentIcon />,
        path: '/clearance',
        roles: [Role.CLEARANCE, Role.ADMIN],
      },
      {
        id: 'clearance-rfqs',
        label: 'Available RFQs',
        icon: <AssignmentIcon />,
        path: '/rfqs',
        roles: [Role.CLEARANCE, Role.ADMIN],
      },
      {
        id: 'clearance-bids',
        label: 'My Bids',
        icon: <GavelIcon />,
        path: '/bids',
        roles: [Role.CLEARANCE, Role.ADMIN],
      },
      {
        id: 'clearance-contracts',
        label: 'Contracts',
        icon: <AccountBalanceIcon />,
        path: '/contracts',
        roles: [Role.CLEARANCE, Role.ADMIN],
      },
      {
        id: 'clearance-shipments',
        label: 'Shipments in Clearance',
        icon: <LocalShippingIcon />,
        path: '/shipments',
        roles: [Role.CLEARANCE, Role.ADMIN],
      },
      {
        id: 'clearance-payments',
        label: 'Payments',
        icon: <PaymentIcon />,
        path: '/payments',
        roles: [Role.CLEARANCE, Role.ADMIN],
      },
    ],
  },
  {
    id: 'logistics',
    label: 'Logistics',
    icon: <LocalShippingIcon />,
    path: '/shipments',
    roles: [Role.LOGISTICS, Role.BUYER, Role.COMPANY_MANAGER, Role.SUPPLIER, Role.CLEARANCE, Role.ADMIN, Role.GOVERNMENT],
    children: [
      {
        id: 'logistics-dashboard',
        label: 'Dashboard',
        icon: <DashboardIcon />,
        path: '/logistics/dashboard',
        roles: [Role.LOGISTICS, Role.ADMIN],
      },
      {
        id: 'logistics-rfqs',
        label: 'Available RFQs',
        icon: <AssignmentIcon />,
        path: '/rfqs',
        roles: [Role.LOGISTICS, Role.ADMIN],
      },
      {
        id: 'logistics-bids',
        label: 'My Bids',
        icon: <GavelIcon />,
        path: '/bids',
        roles: [Role.LOGISTICS, Role.ADMIN],
      },
      {
        id: 'logistics-contracts',
        label: 'Contracts',
        icon: <AccountBalanceIcon />,
        path: '/contracts',
        roles: [Role.LOGISTICS, Role.ADMIN],
      },
      {
        id: 'shipments',
        label: 'Shipments',
        icon: <LocalShippingIcon />,
        path: '/shipments',
        roles: [Role.LOGISTICS, Role.BUYER, Role.COMPANY_MANAGER, Role.SUPPLIER, Role.CLEARANCE, Role.ADMIN, Role.GOVERNMENT],
      },
      {
        id: 'tracking',
        label: 'GPS Tracking',
        icon: <GpsFixedIcon />,
        path: '/tracking',
        roles: [Role.LOGISTICS, Role.BUYER, Role.COMPANY_MANAGER, Role.ADMIN],
      },
      {
        id: 'logistics-payments',
        label: 'Payments',
        icon: <PaymentIcon />,
        path: '/payments',
        roles: [Role.LOGISTICS, Role.ADMIN],
      },
    ],
  },
  {
    id: 'service-provider',
    label: 'Service Provider',
    icon: <BusinessIcon />,
    path: '/service-provider',
    roles: [Role.SERVICE_PROVIDER, Role.ADMIN],
    children: [
      {
        id: 'service-provider-rfqs',
        label: 'Available RFQs',
        icon: <AssignmentIcon />,
        path: '/rfqs',
        roles: [Role.SERVICE_PROVIDER, Role.ADMIN],
      },
      {
        id: 'service-provider-bids',
        label: 'My Bids',
        icon: <GavelIcon />,
        path: '/bids',
        roles: [Role.SERVICE_PROVIDER, Role.ADMIN],
      },
      {
        id: 'service-provider-contracts',
        label: 'Contracts',
        icon: <AccountBalanceIcon />,
        path: '/contracts',
        roles: [Role.SERVICE_PROVIDER, Role.ADMIN],
      },
      {
        id: 'service-provider-payments',
        label: 'Payments',
        icon: <PaymentIcon />,
        path: '/payments',
        roles: [Role.SERVICE_PROVIDER, Role.ADMIN],
      },
      {
        id: 'service-provider-disputes',
        label: 'Disputes',
        icon: <GavelIcon />,
        path: '/disputes',
        roles: [Role.SERVICE_PROVIDER, Role.ADMIN],
      },
    ],
  },
  {
    id: 'payments',
    label: 'Payments',
    icon: <PaymentIcon />,
    path: '/payments',
    // All roles can view payments
  },
  {
    id: 'disputes',
    label: 'Disputes',
    icon: <GavelIcon />,
    path: '/disputes',
    // All roles can view disputes
  },
  {
    id: 'divider-2',
    divider: true,
    label: '',
    icon: null,
    path: '',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <AssessmentIcon />,
    path: '/analytics',
    roles: [Role.BUYER, Role.COMPANY_MANAGER, Role.ADMIN, Role.GOVERNMENT],
    children: [
      {
        id: 'analytics-general',
        label: 'General Analytics',
        icon: <AssessmentIcon />,
        path: '/analytics',
        roles: [Role.BUYER, Role.COMPANY_MANAGER, Role.ADMIN],
      },
      {
        id: 'analytics-government',
        label: 'Government Analytics',
        icon: <AccountBalanceIcon />,
        path: '/analytics/government',
        roles: [Role.GOVERNMENT, Role.ADMIN],
      },
    ],
  },
  {
    id: 'divider-3',
    divider: true,
    label: '',
    icon: null,
    path: '',
    roles: [Role.ADMIN, Role.COMPANY_MANAGER],
  },
  {
    id: 'admin',
    label: 'Administration',
    icon: <PeopleIcon />,
    path: '/admin',
    roles: [Role.ADMIN, Role.COMPANY_MANAGER],
    children: [
      {
        id: 'admin-dashboard',
        label: 'Dashboard',
        icon: <DashboardIcon />,
        path: '/admin/dashboard',
        roles: [Role.ADMIN],
      },
      {
        id: 'users',
        label: 'Users',
        icon: <PeopleIcon />,
        path: '/admin/users',
        roles: [Role.ADMIN, Role.COMPANY_MANAGER],
      },
      {
        id: 'companies',
        label: 'Companies',
        icon: <BusinessIcon />,
        path: '/admin/companies',
        roles: [Role.ADMIN],
      },
      {
        id: 'categories',
        label: 'Categories',
        icon: <AssessmentIcon />,
        path: '/admin/categories',
        roles: [Role.ADMIN],
      },
      {
        id: 'audit-logs',
        label: 'Audit Logs',
        icon: <AssessmentIcon />,
        path: '/admin/audit-logs',
        roles: [Role.ADMIN],
      },
      {
        id: 'settings',
        label: 'System Settings',
        icon: <SettingsIcon />,
        path: '/admin/settings',
        roles: [Role.ADMIN],
      },
    ],
  },
];

/**
 * Get navigation items filtered by user role
 */
export const getNavigationItems = (userRole: Role): NavigationItem[] => {
  const filterItems = (items: NavigationItem[]): NavigationItem[] => {
    return items
      .filter((item) => {
        // Admin can see everything
        if (userRole === Role.ADMIN) return true;
        
        // If item has no roles specified, all authenticated users can access
        if (!item.roles) return true;
        
        // Check if user role is in allowed roles
        return item.roles.includes(userRole);
      })
      .map((item) => {
        // Filter children recursively
        if (item.children) {
          return {
            ...item,
            children: filterItems(item.children),
          };
        }
        return item;
      })
      .filter((item) => {
        // Remove items with no children if they had children originally
        if (item.children && item.children.length === 0 && navigationConfig.find((n) => n.id === item.id)?.children) {
          return false;
        }
        return true;
      });
  };

  return filterItems(navigationConfig);
};

/**
 * Find navigation item by path
 */
export const findNavigationItemByPath = (path: string): NavigationItem | null => {
  const search = (items: NavigationItem[]): NavigationItem | null => {
    for (const item of items) {
      if (item.path === path || path.startsWith(item.path + '/')) {
        return item;
      }
      if (item.children) {
        const found = search(item.children);
        if (found) return found;
      }
    }
    return null;
  };

  return search(navigationConfig);
};

/**
 * Get breadcrumb path for a route
 */
export const getBreadcrumbs = (pathname: string): Array<{ label: string; path: string }> => {
  const breadcrumbs: Array<{ label: string; path: string }> = [
    { label: 'Home', path: '/dashboard' },
  ];

  // Split path and find matching navigation items
  const pathParts = pathname.split('/').filter(Boolean);
  let currentPath = '';

  for (const part of pathParts) {
    currentPath += `/${part}`;
    const item = findNavigationItemByPath(currentPath);
    if (item && item.label) {
      breadcrumbs.push({ label: item.label, path: currentPath });
    }
  }

  return breadcrumbs;
};
