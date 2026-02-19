/**
 * Query Key Factory
 * 
 * Centralized query key management for React Query
 * Provides type-safe, consistent query keys across the application
 * 
 * Benefits:
 * - Type safety with TypeScript
 * - Consistent key structure
 * - Easy invalidation patterns
 * - Prevents stale data issues
 * - Single source of truth for query keys
 */

import { PaginationParams } from '@/utils/pagination';
import { BidFilters } from '@/types/bid';
import { PurchaseRequestFilters } from '@/types/purchase-request';
import { RFQFilters } from '@/types/rfq';
import { ContractFilters } from '@/types/contract';
import { DisputeFilters } from '@/types/dispute';
import { PaymentFilters } from '@/types/payment';
import { ShipmentFilters } from '@/types/shipment';
import { Role } from '@/types';

/**
 * Base query key factory structure
 * All query keys follow the pattern: [entity, ...params]
 */
export const queryKeys = {
  // ==================== AUTH & PROFILE ====================
  auth: {
    all: ['auth'] as const,
    profile: (userId: string) => ['auth', 'profile', userId] as const,
    currentUser: () => ['auth', 'currentUser'] as const,
  },

  // ==================== DASHBOARD ====================
  dashboard: {
    all: ['dashboard'] as const,
    data: (role?: Role) => ['dashboard', 'data', role] as const,
    recentActivity: () => ['dashboard', 'recentActivity'] as const,
    criticalAlerts: (role?: Role) => ['dashboard', 'criticalAlerts', role] as const,
  },

  // ==================== PURCHASE REQUESTS ====================
  purchaseRequests: {
    all: ['purchaseRequests'] as const,
    lists: () => ['purchaseRequests', 'list'] as const,
    list: (filters?: PurchaseRequestFilters, pagination?: PaginationParams) =>
      ['purchaseRequests', 'list', filters, pagination] as const,
    details: () => ['purchaseRequests', 'detail'] as const,
    detail: (id: string) => ['purchaseRequests', 'detail', id] as const,
  },

  // ==================== RFQs ====================
  rfqs: {
    all: ['rfqs'] as const,
    lists: () => ['rfqs', 'list'] as const,
    list: (filters?: RFQFilters, pagination?: PaginationParams, role?: Role) =>
      ['rfqs', 'list', filters, pagination, role] as const,
    details: () => ['rfqs', 'detail'] as const,
    detail: (id: string) => ['rfqs', 'detail', id] as const,
    byPurchaseRequest: (purchaseRequestId: string) =>
      ['rfqs', 'byPurchaseRequest', purchaseRequestId] as const,
    bidsCompare: (rfqId: string) => ['rfqs', 'bidsCompare', rfqId] as const,
  },

  // ==================== BIDS ====================
  bids: {
    all: ['bids'] as const,
    lists: () => ['bids', 'list'] as const,
    list: (filters?: BidFilters, pagination?: PaginationParams) =>
      ['bids', 'list', filters, pagination] as const,
    details: () => ['bids', 'detail'] as const,
    detail: (id: string) => ['bids', 'detail', id] as const,
    byRFQ: (rfqId: string, filters?: { status?: string }) =>
      ['bids', 'byRFQ', rfqId, filters] as const,
  },

  // ==================== CONTRACTS ====================
  contracts: {
    all: ['contracts'] as const,
    lists: () => ['contracts', 'list'] as const,
    list: (filters?: ContractFilters, pagination?: PaginationParams) =>
      ['contracts', 'list', filters, pagination] as const,
    details: () => ['contracts', 'detail'] as const,
    detail: (id: string) => ['contracts', 'detail', id] as const,
  },

  // ==================== SHIPMENTS ====================
  shipments: {
    all: ['shipments'] as const,
    lists: () => ['shipments', 'list'] as const,
    list: (filters?: ShipmentFilters, pagination?: PaginationParams) =>
      ['shipments', 'list', filters, pagination] as const,
    details: () => ['shipments', 'detail'] as const,
    detail: (id: string) => ['shipments', 'detail', id] as const,
  },

  // ==================== PAYMENTS ====================
  payments: {
    all: ['payments'] as const,
    lists: () => ['payments', 'list'] as const,
    list: (filters?: PaymentFilters, pagination?: PaginationParams) =>
      ['payments', 'list', filters, pagination] as const,
    details: () => ['payments', 'detail'] as const,
    detail: (id: string) => ['payments', 'detail', id] as const,
    milestones: (contractId?: string) =>
      ['payments', 'milestones', contractId] as const,
  },

  // ==================== DISPUTES ====================
  disputes: {
    all: ['disputes'] as const,
    lists: () => ['disputes', 'list'] as const,
    list: (filters?: DisputeFilters, pagination?: PaginationParams) =>
      ['disputes', 'list', filters, pagination] as const,
    details: () => ['disputes', 'detail'] as const,
    detail: (id: string) => ['disputes', 'detail', id] as const,
    escalated: () => ['disputes', 'escalated'] as const,
  },

  // ==================== COMPANY ====================
  company: {
    all: ['company'] as const,
    lists: () => ['company', 'list'] as const,
    list: (filters?: { type?: string; status?: string }) =>
      ['company', 'list', filters] as const,
    details: () => ['company', 'detail'] as const,
    detail: (companyId: string) => ['company', 'detail', companyId] as const,
  },
  companies: {
    all: ['companies'] as const,
    lists: () => ['companies', 'list'] as const,
    list: (filters?: { type?: string; status?: string }) =>
      ['companies', 'list', filters] as const,
    details: () => ['companies', 'detail'] as const,
    detail: (id: string) => ['companies', 'detail', id] as const,
  },

  // ==================== ANALYTICS ====================
  analytics: {
    all: ['analytics'] as const,
    government: (filters?: any) => ['analytics', 'government', filters] as const,
    company: (filters?: any) => ['analytics', 'company', filters] as const,
  },

  // ==================== NOTIFICATIONS ====================
  notifications: {
    all: ['notifications'] as const,
    lists: () => ['notifications', 'list'] as const,
    list: (options?: { read?: boolean; limit?: number }) =>
      ['notifications', 'list', options] as const,
    unreadCount: () => ['notifications', 'unreadCount'] as const,
  },
} as const;

/**
 * Helper function to invalidate all queries for an entity
 * Useful for mutations that affect multiple queries
 */
export const invalidateEntityQueries = (queryClient: any, entity: keyof typeof queryKeys) => {
  queryClient.invalidateQueries({ queryKey: queryKeys[entity].all });
};

/**
 * Helper function to invalidate list queries for an entity
 * Useful when creating/updating/deleting items
 */
export const invalidateListQueries = (queryClient: any, entity: keyof typeof queryKeys) => {
  const entityKeys = queryKeys[entity];
  if ('lists' in entityKeys) {
    queryClient.invalidateQueries({ queryKey: entityKeys.lists() });
  }
};

/**
 * Helper function to invalidate detail queries for an entity
 * Useful when updating a specific item
 */
export const invalidateDetailQuery = (
  queryClient: any,
  entity: keyof typeof queryKeys,
  id: string
) => {
  const entityKeys = queryKeys[entity];
  if ('detail' in entityKeys && typeof entityKeys.detail === 'function') {
    queryClient.invalidateQueries({ queryKey: entityKeys.detail(id) });
  }
};
