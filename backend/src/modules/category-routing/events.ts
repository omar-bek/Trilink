import { EventEmitter } from 'events';

/**
 * Category-related events
 */
export enum CategoryEvent {
  CATEGORY_CREATED = 'category.created',
  CATEGORY_UPDATED = 'category.updated',
  CATEGORY_DEACTIVATED = 'category.deactivated',
  CATEGORY_DELETED = 'category.deleted',
  CATEGORY_HIERARCHY_CHANGED = 'category.hierarchy.changed',
  COMPANY_CATEGORY_ADDED = 'company.category.added',
  COMPANY_CATEGORY_REMOVED = 'company.category.removed',
  COMPANY_STATUS_CHANGED = 'company.status.changed',
  PR_APPROVED = 'purchase_request.approved',
  PR_CATEGORY_CHANGED = 'purchase_request.category.changed',
}

/**
 * Event payload interfaces
 */
export interface CategoryCreatedPayload {
  categoryId: string;
  categoryName: string;
  parentId?: string;
}

export interface CategoryDeactivatedPayload {
  categoryId: string;
  categoryName: string;
  affectedPRs: number;
}

export interface CompanyCategoryAddedPayload {
  companyId: string;
  categoryId: string;
  categoryName: string;
}

export interface CompanyCategoryRemovedPayload {
  companyId: string;
  categoryId: string;
  categoryName: string;
}

export interface CompanyStatusChangedPayload {
  companyId: string;
  oldStatus: string;
  newStatus: string;
}

export interface PRApprovedPayload {
  prId: string;
  categoryId: string;
  subCategoryId?: string;
  matchedCompanyIds: string[];
}

/**
 * Global event emitter for category routing
 */
export const categoryEventEmitter = new EventEmitter();

// Set max listeners to prevent memory leaks
categoryEventEmitter.setMaxListeners(50);

/**
 * CategoryRoutingEventEmitter - Alias for easier imports
 */
export const CategoryRoutingEventEmitter = categoryEventEmitter;
