# Global Notification System

A centralized notification system using Material-UI Snackbar for consistent user feedback across the application.

## Features

- ✅ **Centralized Provider** - Single notification provider for the entire app
- ✅ **Queue Support** - Multiple notifications are queued and shown sequentially
- ✅ **Type Safety** - Full TypeScript support
- ✅ **Four Severity Levels** - Success, Error, Warning, Info
- ✅ **Customizable** - Configurable duration, position, and actions
- ✅ **Auto-dismiss** - Notifications automatically close after a set duration
- ✅ **Click to Dismiss** - Users can manually close notifications

## Setup

The `NotificationProvider` is already integrated in `main.tsx`. No additional setup required.

## Usage

### Basic Usage

```tsx
import { notificationService } from '@/utils/notification';

// Success notification
notificationService.showSuccess('Operation completed successfully');

// Error notification (longer duration: 8 seconds)
notificationService.showError('Failed to process request');

// Warning notification
notificationService.showWarning('Please review your input');

// Info notification
notificationService.showInfo('New update available');
```

### In React Hooks (Mutations)

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/utils/notification';
import { itemService } from '@/services/item.service';

export const useCreateItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateItemDto) => itemService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      notificationService.showSuccess('Item created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create item';
      notificationService.showError(message);
    },
  });
};
```

### In API Interceptors

```tsx
import api from './api';
import { notificationService } from '@/utils/notification';

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      notificationService.showError('Session expired. Please login again.');
    } else if (error.response?.status >= 500) {
      notificationService.showError('Server error. Please try again later.');
    }
    return Promise.reject(error);
  }
);
```

### Custom Duration

```tsx
// Show error for longer duration
notificationService.showError('Critical error', { duration: 10000 });

// Show success for shorter duration
notificationService.showSuccess('Saved', { duration: 3000 });
```

### Custom Position

```tsx
import { SnackbarOrigin } from '@mui/material';

// Top-left position
notificationService.showInfo('Notification', {
  anchorOrigin: { vertical: 'top', horizontal: 'left' }
});

// Bottom-center position
notificationService.showSuccess('Saved', {
  anchorOrigin: { vertical: 'bottom', horizontal: 'center' }
});
```

## API Reference

### `notificationService`

#### Methods

- **`showSuccess(message: string, options?: NotificationOptions)`**
  - Shows a success notification
  - Default duration: 6000ms

- **`showError(message: string, options?: NotificationOptions)`**
  - Shows an error notification
  - Default duration: 8000ms (longer for errors)

- **`showWarning(message: string, options?: NotificationOptions)`**
  - Shows a warning notification
  - Default duration: 6000ms

- **`showInfo(message: string, options?: NotificationOptions)`**
  - Shows an info notification
  - Default duration: 6000ms

#### `NotificationOptions`

```typescript
interface NotificationOptions {
  severity?: AlertColor;           // Override severity (usually not needed)
  duration?: number;                // Duration in milliseconds
  anchorOrigin?: SnackbarOrigin;    // Position on screen
  action?: React.ReactNode;         // Custom action button
}
```

## Default Behavior

- **Position**: Bottom-right (`{ vertical: 'bottom', horizontal: 'right' }`)
- **Success Duration**: 6000ms (6 seconds)
- **Error Duration**: 8000ms (8 seconds)
- **Warning Duration**: 6000ms (6 seconds)
- **Info Duration**: 6000ms (6 seconds)
- **Variant**: Filled (Material-UI filled variant)
- **Queue**: Multiple notifications are queued and shown sequentially

## Best Practices

1. **Use appropriate severity levels**
   - `success` - For successful operations
   - `error` - For errors that need attention
   - `warning` - For warnings that don't block the user
   - `info` - For informational messages

2. **Keep messages concise**
   - Users should quickly understand what happened
   - Avoid technical jargon when possible

3. **Provide actionable error messages**
   - Instead of "Error occurred", use "Failed to save. Please try again."
   - Include next steps when appropriate

4. **Don't overuse notifications**
   - Not every action needs a notification
   - Use for important feedback only

5. **Use consistent messaging**
   - Follow a consistent pattern across the app
   - Example: "X created successfully", "X updated successfully"

## Examples

See `NotificationExamples.tsx` for complete usage examples.

## Architecture

```
┌─────────────────────────────────────┐
│   Components/Services/Hooks         │
│   (Call notificationService)        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   notificationService (Singleton)   │
│   (Publishes to subscribers)        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   NotificationProvider               │
│   (Subscribes to service)           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   useNotification Hook               │
│   (Manages queue & UI state)        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   MUI Snackbar + Alert               │
│   (Renders notification)             │
└─────────────────────────────────────┘
```

## Migration from Console.log

All hooks have been migrated from `console.log` to `notificationService`. The old pattern:

```tsx
// ❌ Old way
const showNotification = (message: string, type: 'success' | 'error') => {
  console.log(`[${type.toUpperCase()}] ${message}`);
};
```

Has been replaced with:

```tsx
// ✅ New way
import { notificationService } from '@/utils/notification';

notificationService.showSuccess('Operation completed');
notificationService.showError('Operation failed');
```
