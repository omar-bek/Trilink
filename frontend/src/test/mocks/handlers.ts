import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Mock API handlers using MSW (Mock Service Worker)
// Note: MSW needs to be installed separately if you want to use it
// For now, we'll use vi.mock in individual test files

export const handlers = [
  // Auth endpoints
  http.post('/api/auth/login', () => {
    return HttpResponse.json({
      success: true,
      data: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'Buyer',
          companyId: 'company-1',
          status: 'active',
        },
      },
    });
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true });
  }),
];

export const server = setupServer(...handlers);
