import * as cron from 'node-cron';
import { metricsStore } from './metrics-store';
import { logger } from '../../utils/logger';

/**
 * Scheduler for incremental metrics precomputation
 * Runs every 15 minutes to update metrics incrementally
 */
class MetricsScheduler {
  private task: cron.ScheduledTask | null = null;
  private isRunning = false;
  private initialTimeout: NodeJS.Timeout | null = null;

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.task) {
      logger.warn('Metrics scheduler already running');
      return;
    }

    // Run every 15 minutes
    this.task = cron.schedule('*/15 * * * *', async () => {
      if (this.isRunning) {
        logger.debug('Metrics computation already in progress, skipping...');
        return;
      }

      this.isRunning = true;
      try {
        logger.info('Starting incremental metrics computation...');
        await this.computeMetrics();
        logger.info('✅ Incremental metrics computation completed');
      } catch (error) {
        logger.error('❌ Error computing incremental metrics:', error);
      } finally {
        this.isRunning = false;
      }
    });

    // Also run immediately on startup (after a delay)
    this.initialTimeout = setTimeout(async () => {
      try {
        if (!this.task) {
          // Scheduler was stopped before initial run
          return;
        }
        logger.info('Running initial metrics computation...');
        await this.computeMetrics();
        logger.info('✅ Initial metrics computation completed');
      } catch (error) {
        logger.error('❌ Error computing initial metrics:', error);
      }
    }, 30000); // Wait 30 seconds after startup

    logger.info('✅ Metrics scheduler started (runs every 15 minutes)');
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task.destroy();
      this.task = null;
      this.isRunning = false;

      // Clear initial timeout if it exists
      if (this.initialTimeout) {
        clearTimeout(this.initialTimeout);
        this.initialTimeout = null;
      }

      logger.info('✅ Metrics scheduler stopped');
    }
  }

  /**
   * Check if scheduler is running
   */
  isActive(): boolean {
    return this.task !== null;
  }

  /**
   * Compute and store metrics incrementally
   */
  private async computeMetrics(): Promise<void> {
    try {
      // Get existing metrics or start fresh
      const existingMetrics = await metricsStore.getMetrics('government');

      // Compute incremental updates
      const incremental = await metricsStore.computeIncrementalMetrics(
        'government',
        existingMetrics?.lastProcessedId
      );

      if (existingMetrics) {
        // Merge with existing
        const merged = metricsStore.mergeMetrics(existingMetrics, incremental);
        await metricsStore.setMetrics('government', merged);
      } else {
        // First time - compute full metrics
        // For now, store incremental as base (will be improved with full computation)
        await metricsStore.setMetrics('government', {
          timestamp: new Date(),
          kpis: incremental.kpis || {
            totalPurchaseRequests: 0,
            totalContracts: 0,
            totalBids: 0,
            totalPayments: 0,
            totalDisputes: 0,
            activeCompanies: 0,
            totalRFQs: 0,
            totalContractValue: 0,
            totalPaymentVolume: 0,
          },
          lastProcessedId: incremental.lastProcessedId,
        });
      }
    } catch (error) {
      logger.error('Error in metrics computation:', error);
      throw error;
    }
  }
}

export const metricsScheduler = new MetricsScheduler();
