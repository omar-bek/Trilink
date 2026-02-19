# Layout & Navigation System

## Overview

The TriLink frontend includes a comprehensive layout and navigation system with role-based menu items, responsive design, and breadcrumbs.

## Components

### MainLayout

The main application layout component (`src/components/Layout/MainLayout.tsx`) provides:

- **Sidebar Navigation**: Collapsible menu with role-based filtering
- **Top App Bar**: Header with page title, notifications, and user menu
- **Responsive Design**: Mobile-friendly drawer that slides in on small screens
- **Breadcrumbs**: Automatic breadcrumb navigation
- **User Profile**: Sidebar footer with user info

### Features

#### 1. Sidebar Navigation

- Role-based menu filtering
- Expandable/collapsible menu groups
- Active route highlighting
- Nested menu items support
- Badge support for notifications

#### 2. Top App Bar

- Page title display
- Mobile menu toggle
- Notifications icon
- User profile menu
- Responsive behavior

#### 3. Breadcrumbs

- Automatic breadcrumb generation from route
- Clickable navigation
- Hidden on home page

#### 4. Navigation Guards

- Route-level access control
- Role-based route protection
- Integration with navigation config

## Navigation Configuration

Navigation items are configured in `src/config/navigation.ts`:

```typescript
export interface NavigationItem {
  id: string;
  label: string;
  icon: ReactNode;
  path: string;
  roles?: Role[]; // Optional: restricts access
  badge?: number; // Optional: notification badge
  children?: NavigationItem[]; // Optional: nested items
  divider?: boolean; // Optional: add divider before
}
```

### Role-Based Access

- If `roles` is undefined, all authenticated users can access
- Admin role can access all items
- Other roles see only items they're allowed to access

### Menu Structure

The navigation includes:

1. **Dashboard** - All roles
2. **Procurement**
   - Purchase Requests (Buyer, Admin, Government)
   - RFQs (All roles)
   - Bids (Buyer, Supplier, Logistics, etc.)
   - Contracts (Buyer, Supplier, Admin, Government)
3. **Logistics**
   - Shipments (Logistics, Buyer, Supplier, Clearance, Admin, Government)
   - GPS Tracking (Logistics, Buyer, Admin)
4. **Payments** - All roles
5. **Disputes** - All roles
6. **Analytics**
   - General Analytics (Buyer, Admin)
   - Government Analytics (Government, Admin)
7. **Administration** (Admin only)
   - Users
   - Companies

## Usage

### Basic Layout

```tsx
import { MainLayout } from '@/components/Layout/MainLayout';

<ProtectedRoute>
  <MainLayout>
    <YourPage />
  </MainLayout>
</ProtectedRoute>
```

### With Navigation Guard

```tsx
import { MainLayout } from '@/components/Layout/MainLayout';
import { NavigationGuard } from '@/components/NavigationGuards/NavigationGuards';
import { Role } from '@/types';

<ProtectedRoute>
  <MainLayout>
    <NavigationGuard requiredRole={Role.ADMIN}>
      <AdminPage />
    </NavigationGuard>
  </MainLayout>
</ProtectedRoute>
```

### Check Route Access

```tsx
import { useCanAccessRoute } from '@/components/NavigationGuards/NavigationGuards';

const canAccess = useCanAccessRoute('/admin/users');
if (canAccess) {
  // Show admin link
}
```

## Responsive Behavior

### Desktop (≥960px)
- Permanent sidebar drawer (280px width)
- Top app bar offset by sidebar width
- Full navigation visible

### Mobile (<960px)
- Hidden sidebar by default
- Hamburger menu in top bar
- Temporary drawer slides in from left
- Drawer closes on navigation

## Customization

### Adding Navigation Items

Edit `src/config/navigation.ts`:

```typescript
{
  id: 'new-feature',
  label: 'New Feature',
  icon: <NewIcon />,
  path: '/new-feature',
  roles: [Role.BUYER, Role.ADMIN], // Optional
}
```

### Customizing Layout

The MainLayout component accepts standard React children. You can wrap pages with additional components:

```tsx
<MainLayout>
  <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
    <YourContent />
  </Box>
</MainLayout>
```

### Styling

The layout uses Material-UI theme. Customize via theme configuration:

```typescript
// src/theme/theme.ts
export const theme = createTheme({
  // Your theme config
});
```

## Role-Based Menu Filtering

The navigation system automatically filters menu items based on user role:

1. **Admin**: Sees all menu items
2. **Other Roles**: See only items where:
   - No `roles` specified (available to all)
   - Their role is in the `roles` array

### Example

```typescript
// Available to all authenticated users
{ label: 'Dashboard', path: '/dashboard' }

// Available only to Buyer and Admin
{ 
  label: 'Purchase Requests', 
  path: '/purchase-requests',
  roles: [Role.BUYER, Role.ADMIN]
}
```

## Breadcrumbs

Breadcrumbs are automatically generated from the current route:

- Home → Current Page
- Clickable navigation
- Hidden on dashboard/home

### Custom Breadcrumbs

Override by importing and using the Breadcrumbs component directly:

```tsx
import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs';

<Breadcrumbs />
```

## Navigation Guards

Navigation guards provide additional route protection:

### NavigationGuard Component

```tsx
<NavigationGuard requiredRole={Role.ADMIN}>
  <AdminContent />
</NavigationGuard>
```

### useCanAccessRoute Hook

```tsx
const canAccess = useCanAccessRoute('/admin/users');
```

## Best Practices

1. **Always use MainLayout** for authenticated pages
2. **Use ProtectedRoute** for route-level auth checks
3. **Use NavigationGuard** for component-level role checks
4. **Define navigation items** in `navigation.ts` config
5. **Test responsive behavior** on mobile devices
6. **Keep menu structure** organized and logical

## Accessibility

- Keyboard navigation support
- ARIA labels on interactive elements
- Focus management
- Screen reader friendly

## Performance

- Navigation items memoized based on user role
- Lazy loading for nested routes
- Optimized re-renders

## Future Enhancements

- [ ] Search functionality in navigation
- [ ] Recent pages/bookmarks
- [ ] Customizable menu order
- [ ] Menu item pinning
- [ ] Keyboard shortcuts
- [ ] Menu item badges/notifications
