import { vi } from 'vitest';

/**
 * Mock notification service
 */
export const mockNotificationService = {
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showWarning: vi.fn(),
  showInfo: vi.fn(),
  subscribe: vi.fn(() => vi.fn()), // Returns unsubscribe function
};

/**
 * Setup notification service mock
 */
export const setupNotificationMocks = () => {
  vi.mock('@/utils/notification', () => ({
    notificationService: mockNotificationService,
  }));
};
