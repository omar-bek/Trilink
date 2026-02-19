import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import { usePurchaseRequests, useCreatePurchaseRequest, useUpdatePurchaseRequest } from '../usePurchaseRequests';
import { purchaseRequestService } from '@/services/purchase-request.service';
import { notificationService } from '@/utils/notification';
import { mockNotificationService } from '@/test/mocks/notification';
import { createMockResponse, createMockPaginatedResponse } from '@/test/mocks/api';
import { PurchaseRequestStatus } from '@/types/purchase-request';

// Mock services
vi.mock('@/services/purchase-request.service');
vi.mock('@/utils/notification', () => ({
  notificationService: mockNotificationService,
}));

const mockPurchaseRequest = {
  _id: 'pr-1',
  title: 'Test Purchase Request',
  description: 'Test Description',
  status: PurchaseRequestStatus.DRAFT,
  buyerId: 'buyer-1',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };

  return Wrapper;
};

describe('usePurchaseRequests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('usePurchaseRequests (query)', () => {
    it('should fetch purchase requests successfully', async () => {
      const mockData = createMockPaginatedResponse([mockPurchaseRequest]);
      vi.mocked(purchaseRequestService.getPurchaseRequests).mockResolvedValue(mockData);

      const { result } = renderHook(() => usePurchaseRequests(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(purchaseRequestService.getPurchaseRequests).toHaveBeenCalledWith(undefined, undefined);
    });

    it('should fetch purchase requests with filters', async () => {
      const filters = { status: PurchaseRequestStatus.DRAFT };
      const mockData = createMockPaginatedResponse([mockPurchaseRequest]);
      vi.mocked(purchaseRequestService.getPurchaseRequests).mockResolvedValue(mockData);

      const { result } = renderHook(() => usePurchaseRequests(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(purchaseRequestService.getPurchaseRequests).toHaveBeenCalledWith(filters, undefined);
    });

    it('should handle error when fetching purchase requests', async () => {
      const error = new Error('Failed to fetch');
      vi.mocked(purchaseRequestService.getPurchaseRequests).mockRejectedValue(error);

      const { result } = renderHook(() => usePurchaseRequests(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useCreatePurchaseRequest (mutation)', () => {
    it('should create purchase request successfully', async () => {
      const newPR = { title: 'New PR', description: 'New Description' };
      const mockData = createMockResponse({ ...mockPurchaseRequest, ...newPR });
      vi.mocked(purchaseRequestService.createPurchaseRequest).mockResolvedValue(mockData);

      const { result } = renderHook(() => useCreatePurchaseRequest(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync(newPR);

      expect(purchaseRequestService.createPurchaseRequest).toHaveBeenCalledWith(newPR);
      expect(mockNotificationService.showSuccess).toHaveBeenCalledWith(
        'Purchase request created successfully'
      );
    });

    it('should show error notification on failure', async () => {
      const error: any = {
        response: {
          data: {
            message: 'Failed to create purchase request',
          },
        },
      };
      vi.mocked(purchaseRequestService.createPurchaseRequest).mockRejectedValue(error);

      const { result } = renderHook(() => useCreatePurchaseRequest(), {
        wrapper: createWrapper(),
      });

      try {
        await result.current.mutateAsync({ title: 'Test', description: 'Test' });
      } catch (e) {
        // Expected to throw
      }

      await waitFor(() => {
        expect(mockNotificationService.showError).toHaveBeenCalledWith('Failed to create purchase request');
      });
    });
  });

  describe('useUpdatePurchaseRequest (mutation)', () => {
    it('should update purchase request successfully', async () => {
      const updates = { title: 'Updated Title' };
      const mockData = createMockResponse({ ...mockPurchaseRequest, ...updates });
      vi.mocked(purchaseRequestService.updatePurchaseRequest).mockResolvedValue(mockData);

      const { result } = renderHook(() => useUpdatePurchaseRequest(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({ id: 'pr-1', data: updates });

      expect(purchaseRequestService.updatePurchaseRequest).toHaveBeenCalledWith('pr-1', updates);
      expect(mockNotificationService.showSuccess).toHaveBeenCalledWith(
        'Purchase request updated successfully'
      );
    });
  });
});
