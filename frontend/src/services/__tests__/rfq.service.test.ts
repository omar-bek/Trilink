import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rfqService } from '../rfq.service';
import api from '../api';
import { createMockResponse, createMockPaginatedResponse } from '@/test/mocks/api';
import { RFQStatus, RFQType } from '@/types/rfq';
import { Role } from '@/types';

// Mock API
vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockRFQ = {
  _id: 'rfq-1',
  purchaseRequestId: 'pr-1',
  companyId: 'company-1',
  type: RFQType.SUPPLIER,
  targetRole: Role.SUPPLIER,
  title: 'Test RFQ',
  description: 'Test Description',
  status: RFQStatus.OPEN,
  budget: 10000,
  currency: 'AED',
  deadline: '2024-12-31T00:00:00Z',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  items: [],
  deliveryLocation: {
    address: '123 Main St',
    city: 'Dubai',
    state: 'Dubai',
    country: 'UAE',
    zipCode: '00000',
  },
  requiredDeliveryDate: '2024-12-31T00:00:00Z',
  anonymousBuyer: false,
};

describe('rfqService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getRFQs', () => {
    it('should fetch RFQs without filters', async () => {
      const mockData = createMockResponse([mockRFQ]);
      vi.mocked(api.get).mockResolvedValue({ data: mockData });

      const result = await rfqService.getRFQs();

      expect(api.get).toHaveBeenCalledWith('/rfqs?');
      expect(result).toEqual(mockData);
    });

    it('should fetch RFQs with filters', async () => {
      const filters = {
        status: RFQStatus.OPEN,
        type: RFQType.SUPPLIER,
        search: 'test',
      };
      const mockData = createMockPaginatedResponse([mockRFQ]);
      vi.mocked(api.get).mockResolvedValue({ data: mockData });

      const result = await rfqService.getRFQs(filters, { page: 1, limit: 20 });

      expect(api.get).toHaveBeenCalledWith(
        '/rfqs?status=open&type=Supplier&search=test&page=1&limit=20'
      );
      expect(result).toEqual(mockData);
    });

    it('should handle pagination parameters', async () => {
      const mockData = createMockPaginatedResponse([mockRFQ], 2, 10, 25);
      vi.mocked(api.get).mockResolvedValue({ data: mockData });

      const result = await rfqService.getRFQs(undefined, {
        page: 2,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(api.get).toHaveBeenCalledWith(
        '/rfqs?page=2&limit=10&sortBy=createdAt&sortOrder=desc'
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getAvailableRFQs', () => {
    it('should fetch available RFQs with filters', async () => {
      const filters = { targetRole: Role.SUPPLIER };
      const mockData = createMockPaginatedResponse([mockRFQ]);
      vi.mocked(api.get).mockResolvedValue({ data: mockData });

      const result = await rfqService.getAvailableRFQs(filters);

      expect(api.get).toHaveBeenCalledWith('/rfqs/available?targetRole=Supplier');
      expect(result).toEqual(mockData);
    });
  });

  describe('getRFQById', () => {
    it('should fetch RFQ by ID', async () => {
      const mockData = createMockResponse(mockRFQ);
      vi.mocked(api.get).mockResolvedValue({ data: mockData });

      const result = await rfqService.getRFQById('rfq-1');

      expect(api.get).toHaveBeenCalledWith('/rfqs/rfq-1');
      expect(result).toEqual(mockData);
    });
  });

  describe('getRFQsByPurchaseRequest', () => {
    it('should fetch RFQs by purchase request ID', async () => {
      const mockData = createMockResponse([mockRFQ]);
      vi.mocked(api.get).mockResolvedValue({ data: mockData });

      const result = await rfqService.getRFQsByPurchaseRequest('pr-1');

      expect(api.get).toHaveBeenCalledWith('/rfqs/purchase-request/pr-1');
      expect(result).toEqual(mockData);
    });
  });
});
