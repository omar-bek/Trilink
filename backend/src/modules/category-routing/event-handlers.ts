import { categoryEventEmitter, CategoryEvent } from './events';
import { CategoryCacheService } from './cache.service';
import { logger } from '../../utils/logger';
import { CategoryRoutingQueueService } from './queue.service';
import { PurchaseRequestRepository } from '../purchase-requests/repository';

/**
 * Category Routing Event Handlers
 * Handles all category-related events for routing and cache invalidation
 */
export class CategoryRoutingEventHandlers {
  private cacheService: CategoryCacheService;
  private queueService: CategoryRoutingQueueService;
  private prRepository: PurchaseRequestRepository;

  constructor() {
    this.cacheService = new CategoryCacheService();
    this.queueService = new CategoryRoutingQueueService();
    this.prRepository = new PurchaseRequestRepository();
    this.setupHandlers();
  }

  /**
   * Setup all event handlers
   */
  private setupHandlers(): void {
    // Category events
    categoryEventEmitter.on(CategoryEvent.CATEGORY_CREATED, this.handleCategoryCreated.bind(this));
    categoryEventEmitter.on(CategoryEvent.CATEGORY_UPDATED, this.handleCategoryUpdated.bind(this));
    categoryEventEmitter.on(CategoryEvent.CATEGORY_DEACTIVATED, this.handleCategoryDeactivated.bind(this));
    categoryEventEmitter.on(CategoryEvent.CATEGORY_DELETED, this.handleCategoryDeleted.bind(this));
    categoryEventEmitter.on(CategoryEvent.CATEGORY_HIERARCHY_CHANGED, this.handleCategoryHierarchyChanged.bind(this));

    // Company category events
    categoryEventEmitter.on(CategoryEvent.COMPANY_CATEGORY_ADDED, this.handleCompanyCategoryAdded.bind(this));
    categoryEventEmitter.on(CategoryEvent.COMPANY_CATEGORY_REMOVED, this.handleCompanyCategoryRemoved.bind(this));
    categoryEventEmitter.on(CategoryEvent.COMPANY_STATUS_CHANGED, this.handleCompanyStatusChanged.bind(this));

    // Purchase request events
    categoryEventEmitter.on(CategoryEvent.PR_APPROVED, this.handlePRApproved.bind(this));
    categoryEventEmitter.on(CategoryEvent.PR_CATEGORY_CHANGED, this.handlePRCategoryChanged.bind(this));

    logger.info('Category routing event handlers initialized');
  }

  /**
   * Handle category created event
   */
  private async handleCategoryCreated(categoryId: string): Promise<void> {
    logger.info(`Category created: ${categoryId}`);
    // Invalidate category tree cache
    await this.cacheService.invalidateCategoryTree();
  }

  /**
   * Handle category updated event
   */
  private async handleCategoryUpdated(categoryId: string): Promise<void> {
    logger.info(`Category updated: ${categoryId}`);
    // Invalidate category tree and related caches
    await this.cacheService.invalidateCategoryTree();
  }

  /**
   * Handle category deactivated event
   */
  private async handleCategoryDeactivated(categoryId: string): Promise<void> {
    logger.warn(`Category deactivated: ${categoryId}`);
    // Invalidate all category-related caches
    await this.cacheService.invalidateCategoryTree();
    await this.cacheService.invalidateCategoryDescendants(categoryId);
    
    // Note: Existing PRs with this category should use snapshot-based routing
    // This is handled at PR access time (see canCompanyViewPurchaseRequest)
  }

  /**
   * Handle category deleted event
   */
  private async handleCategoryDeleted(categoryId: string): Promise<void> {
    logger.warn(`Category deleted: ${categoryId}`);
    // Invalidate all category-related caches
    await this.cacheService.invalidateCategoryTree();
    await this.cacheService.invalidateCategoryDescendants(categoryId);
  }

  /**
   * Handle category hierarchy changed event
   */
  private async handleCategoryHierarchyChanged(payload: any): Promise<void> {
    logger.info(`Category hierarchy changed: ${payload.categoryId}`);
    // Invalidate category tree and descendant caches
    await this.cacheService.invalidateCategoryTree();
  }

  /**
   * Handle company category added event
   */
  private async handleCompanyCategoryAdded(payload: { companyId: string; categoryId: string }): Promise<void> {
    logger.info(`Company ${payload.companyId} added category ${payload.categoryId}`);
    // Invalidate company's category cache
    await this.cacheService.invalidateCompanyCategories(payload.companyId);
    // Invalidate matching results for this category
    await this.cacheService.invalidateMatchingCompanies(payload.categoryId);
    
    // Note: Could trigger recalculation of PR access for this company
    // This would be handled by a background job if needed
  }

  /**
   * Handle company category removed event
   */
  private async handleCompanyCategoryRemoved(payload: { companyId: string; categoryId: string }): Promise<void> {
    logger.info(`Company ${payload.companyId} removed category ${payload.categoryId}`);
    // Invalidate company's category cache
    await this.cacheService.invalidateCompanyCategories(payload.companyId);
    // Invalidate matching results for this category
    await this.cacheService.invalidateMatchingCompanies(payload.categoryId);
  }

  /**
   * Handle company status changed event
   */
  private async handleCompanyStatusChanged(payload: { companyId: string; oldStatus: string; newStatus: string }): Promise<void> {
    logger.info(`Company ${payload.companyId} status changed: ${payload.oldStatus} → ${payload.newStatus}`);
    // If company was approved → pending, invalidate matching caches
    // If company was pending → approved, could trigger PR access recalculation
    if (payload.newStatus === 'approved' || payload.oldStatus === 'approved') {
      // Invalidate company's category cache to force re-matching
      await this.cacheService.invalidateCompanyCategories(payload.companyId);
      // Invalidate all matching results (company status affects routing)
      await this.cacheService.invalidateAllMatchingCompanies();
    }
  }

  /**
   * Handle PR approved event
   */
  private async handlePRApproved(payload: any): Promise<void> {
    logger.info(`PR ${payload.prId} approved, ${payload.matchedCompanyIds.length} companies matched`);
    // Routing is already queued in the service
    // This handler can be used for additional processing (notifications, etc.)
  }

  /**
   * Handle PR category changed event
   */
  private async handlePRCategoryChanged(payload: any): Promise<void> {
    logger.info(`PR ${payload.prId} category changed`);
    // Re-queue routing for this PR
    await this.queueService.queuePRRouting(payload.prId);
  }
}

/**
 * Initialize event handlers (call this in server startup)
 */
export function initializeCategoryRoutingEventHandlers(): void {
  new CategoryRoutingEventHandlers();
}
