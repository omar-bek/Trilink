import { getRedisClient, isRedisAvailable } from '../../config/redis';
import { logger } from '../../utils/logger';
import { CategoryEvent, PRApprovedPayload, categoryEventEmitter } from './events';
import { CategoryRoutingService } from './service';
import { PurchaseRequestRepository } from '../purchase-requests/repository';

/**
 * Queue Service for Async Category Routing
 * Processes category routing tasks asynchronously using Redis queue
 */
export class CategoryRoutingQueueService {
  private routingService: CategoryRoutingService;
  private prRepository: PurchaseRequestRepository;
  private isProcessing: boolean = false;

  constructor() {
    this.routingService = new CategoryRoutingService();
    this.prRepository = new PurchaseRequestRepository();
  }

  /**
   * Initialize queue processing
   */
  async initialize(): Promise<void> {
    if (!isRedisAvailable()) {
      logger.warn('Redis not available, queue processing disabled');
      return;
    }

    // Start processing queue
    this.startProcessing();
    logger.info('Category routing queue service initialized');
  }

  /**
   * Add PR routing job to queue
   */
  async queuePRRouting(prId: string): Promise<void> {
    if (!isRedisAvailable()) {
      // Fallback to synchronous processing
      logger.warn('Redis not available, processing PR routing synchronously');
      await this.processPRRouting(prId);
      return;
    }

    try {
      const redis = getRedisClient();
      if (!redis) {
        throw new Error('Redis client not available');
      }

      // Add to queue (using Redis list as simple queue)
      await redis.lPush('category:routing:queue', prId);
      logger.info(`Queued PR routing for PR ${prId}`);
    } catch (error) {
      logger.error('Failed to queue PR routing', error);
      // Fallback to synchronous processing
      await this.processPRRouting(prId);
    }
  }

  /**
   * Start processing queue
   */
  private async startProcessing(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    this.processQueue();
  }

  /**
   * Process queue items
   */
  private async processQueue(): Promise<void> {
    while (this.isProcessing) {
      try {
        if (!isRedisAvailable()) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }

        const redis = getRedisClient();
        if (!redis) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }

        // Pop from queue (blocking with timeout)
        const result = await redis.brPop(
          'category:routing:queue',
          5
        );

        if (result && result.element) {
          await this.processPRRouting(result.element);
        }
      } catch (error) {
        logger.error('Error processing queue', error);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  /**
   * Process PR routing (snapshot and notify)
   */
  private async processPRRouting(prId: string): Promise<void> {
    try {
      const pr = await this.prRepository.findById(prId);
      if (!pr) {
        logger.warn(`PR ${prId} not found for routing`);
        return;
      }

      // Get matching companies
      const matchedCompanies = await this.routingService.findMatchingCompanies(
        pr.categoryId.toString(),
        pr.subCategoryId?.toString()
      );

      // Snapshot routing (if snapshot field exists)
      const matchedCompanyIds = matchedCompanies.map(m => m.companyId);
      
      // Update PR with routing snapshot (if schema supports it)
      // This would require schema update - for now, just log
      logger.info(`PR ${prId} routing: ${matchedCompanyIds.length} companies matched`);

      // Emit event for notification service
      const payload: PRApprovedPayload = {
        prId,
        categoryId: pr.categoryId.toString(),
        subCategoryId: pr.subCategoryId?.toString(),
        matchedCompanyIds
      };

      // Emit event for other services (notifications, etc.)
      categoryEventEmitter.emit(CategoryEvent.PR_APPROVED, payload);
      logger.info(`PR ${prId} routing processed, ${matchedCompanyIds.length} companies matched`);
    } catch (error) {
      logger.error(`Failed to process PR routing for ${prId}`, error);
      throw error;
    }
  }

  /**
   * Stop processing queue
   */
  stopProcessing(): void {
    this.isProcessing = false;
    logger.info('Category routing queue processing stopped');
  }
}
