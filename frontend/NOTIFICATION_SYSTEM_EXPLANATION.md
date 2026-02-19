# Notification System in Frontend - Complete Explanation

## Overview

The frontend has **two types of notification systems**:

1. **Toast/Snackbar Notifications** - Temporary popup notifications (Material-UI Snackbar)
2. **Notification Panel** - Persistent notification list with bell icon (NotificationPanel component)

---

## 1. Toast/Snackbar Notification System

### Location
- **Service**: `frontend/src/utils/notification.ts`
- **Provider**: `frontend/src/components/Notification/NotificationProvider.tsx`
- **Hook**: `frontend/src/hooks/useNotification.tsx`
- **Integration**: `frontend/src/main.tsx` (wraps entire app)

### Architecture

```
┌─────────────────────────────────────┐
│   Components/Services/Hooks         │
│   (Call notificationService)        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   notificationService (Singleton)   │
│   - showSuccess()                   │
│   - showError()                     │
│   - showWarning()                   │
│   - showInfo()                      │
└──────────────┬──────────────────────┘
               │ (Subscriber Pattern)
               ▼
┌─────────────────────────────────────┐
│   NotificationProvider               │
│   (Subscribes to service)           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   useNotification Hook               │
│   - Manages notification queue      │
│   - Handles auto-dismiss            │
│   - Renders Snackbar                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   MUI Snackbar + Alert               │
│   (Bottom-right by default)         │
└─────────────────────────────────────┘
```

### How It Works

1. **Singleton Service** (`notificationService`):
   - Global service that can be imported anywhere
   - Uses subscriber pattern to notify all listeners
   - Provides 4 methods: `showSuccess`, `showError`, `showWarning`, `showInfo`

2. **NotificationProvider**:
   - Wraps the entire app in `main.tsx`
   - Subscribes to `notificationService` events
   - Bridges the service to the React hook

3. **useNotification Hook**:
   - Manages a queue of notifications
   - Shows notifications sequentially (one at a time)
   - Auto-dismisses after duration (6s default, 8s for errors)
   - Renders Material-UI Snackbar component

### Usage Examples

```typescript
// In any component or service
import { notificationService } from '@/utils/notification';

// Success notification
notificationService.showSuccess('Payment approved successfully');

// Error notification (8 second duration)
notificationService.showError('Failed to process request');

// Warning notification
notificationService.showWarning('Please review your input');

// Info notification
notificationService.showInfo('New update available');
```

### Real Usage in Codebase

The notification service is used extensively throughout hooks:

- **`usePayments.ts`**: Shows success/error for payment operations
- **`useRFQs.ts`**: Shows notifications for RFQ create/update/delete
- **`useCompany.ts`**: Shows notifications for company operations
- **`useBids.ts`**: Shows notifications for bid operations
- **`useDisputes.ts`**: Shows notifications for dispute operations
- **`usePurchaseRequests.ts`**: Shows notifications for purchase request operations

### Default Settings

- **Position**: Bottom-right corner
- **Success Duration**: 6000ms (6 seconds)
- **Error Duration**: 8000ms (8 seconds)
- **Warning Duration**: 6000ms (6 seconds)
- **Info Duration**: 6000ms (6 seconds)
- **Variant**: Filled (Material-UI filled variant)
- **Queue**: Multiple notifications shown sequentially

---

## 2. Notification Panel Component

### Location
- **Component**: `frontend/src/components/DesignSystem/NotificationPanel/NotificationPanel.tsx`
- **Export**: `frontend/src/components/DesignSystem/index.ts`

### Purpose

A persistent notification panel that displays a list of notifications with:
- Bell icon with unread count badge
- Dropdown menu showing all notifications
- Mark as read/unread functionality
- Delete notifications
- Timestamp formatting (e.g., "5m ago", "2h ago")
- Different icons for different notification types

### Component Interface

```typescript
interface Notification {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: Date | string;
  read?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationPanelProps {
  notifications: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDelete?: (id: string) => void;
  onClearAll?: () => void;
  maxHeight?: string | number;
}
```

### Features

1. **Badge Counter**: Shows unread notification count on bell icon
2. **Visual Indicators**: 
   - Unread notifications have highlighted background
   - "New" chip for unread items
   - Different icons per type (CheckCircle, ErrorIcon, Warning, Info)
3. **Actions**:
   - Mark individual as read
   - Mark all as read
   - Delete individual notification
   - Clear all notifications
4. **Timestamp Formatting**: 
   - "Just now" (< 1 minute)
   - "5m ago" (< 1 hour)
   - "2h ago" (< 24 hours)
   - "3d ago" (< 7 days)
   - Full date (older)

### Usage

```tsx
import { NotificationPanel, Notification } from '@/components/DesignSystem';

const [notifications, setNotifications] = useState<Notification[]>([]);

<NotificationPanel
  notifications={notifications}
  onMarkAsRead={(id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }}
  onMarkAllAsRead={() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }}
  onDelete={(id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }}
  onClearAll={() => {
    setNotifications([]);
  }}
/>
```

### Current Status

The `NotificationPanel` component exists but **may not be integrated into the main layout yet**. It's available in the Design System but needs to be added to the header/navbar to be visible.

---

## Key Differences

| Feature | Toast/Snackbar | Notification Panel |
|---------|---------------|-------------------|
| **Type** | Temporary popup | Persistent list |
| **Duration** | Auto-dismisses (6-8s) | Stays until user action |
| **Location** | Bottom-right corner | Bell icon in header |
| **Use Case** | Immediate feedback | Historical notifications |
| **Queue** | Sequential display | All visible in dropdown |
| **Integration** | ✅ Fully integrated | ⚠️ Component exists, may need integration |

---

## File Structure

```
frontend/src/
├── utils/
│   └── notification.ts                    # Singleton notification service
├── hooks/
│   └── useNotification.tsx                # React hook for notification queue
├── components/
│   ├── Notification/
│   │   ├── NotificationProvider.tsx       # Provider component
│   │   ├── NotificationExamples.tsx       # Usage examples
│   │   └── README.md                      # Documentation
│   └── DesignSystem/
│       └── NotificationPanel/
│           ├── NotificationPanel.tsx      # Notification panel component
│           └── index.ts                   # Exports
└── main.tsx                               # App entry (includes NotificationProvider)
```

---

## Integration Status

### ✅ Fully Integrated
- **Toast/Snackbar System**: 
  - Service created
  - Provider wraps app in `main.tsx`
  - Used throughout hooks and components
  - Working and functional

### ⚠️ Partially Integrated
- **Notification Panel**: 
  - Component exists and is complete
  - Available in Design System exports
  - **Needs to be added to MainLayout/Header** to be visible
  - Requires backend API integration for persistent notifications

---

## Next Steps (If Needed)

To fully integrate the Notification Panel:

1. **Add to MainLayout/Header**:
   ```tsx
   import { NotificationPanel } from '@/components/DesignSystem';
   
   // In header component
   <NotificationPanel
     notifications={notifications}
     onMarkAsRead={handleMarkAsRead}
     onMarkAllAsRead={handleMarkAllAsRead}
     onDelete={handleDelete}
     onClearAll={handleClearAll}
   />
   ```

2. **Create Backend Integration**:
   - API endpoint to fetch notifications
   - WebSocket/Socket.io events for real-time notifications
   - Mark as read/delete endpoints

3. **Create Hook**:
   ```tsx
   // useNotifications.ts
   export const useNotifications = () => {
     // Fetch notifications from API
     // Handle real-time updates via socket
     // Return notifications array and handlers
   };
   ```

---

## Summary

The frontend has a **robust toast notification system** that's fully integrated and working. It uses a singleton service pattern with a React provider, allowing any component to show notifications easily.

There's also a **NotificationPanel component** ready to use, but it needs to be integrated into the layout and connected to a backend API for persistent notifications.

Both systems serve different purposes:
- **Toast notifications** = Immediate, temporary feedback
- **Notification panel** = Persistent, historical notification list
