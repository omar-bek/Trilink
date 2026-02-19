import { RedisClientType } from 'redis';
import { getRedisClient, isRedisAvailable } from '../../config/redis';
import { logger } from '../../utils/logger';
import { CategoryRepository } from '../categories/repository';
import { ICategory } from '../categories/schema';
import crypto from 'crypto';

/**
 * Cache entry with validation metadata
 */
interface CacheEntry<T> {
  data: T;
  version: number;
  checksum: string; // SHA-256 hash of data
  timestamp: number;
}

/**
 * Resilient Category Cache Service
 * Implements multi-tier caching with corruption detection and fallback logic
 */
export class CategoryCacheService {
  private redis: RedisClientType | null;
  private localCache: Map<string, { data: any; expiry: number }> = new Map();
  private cacheStampedeProtection: Map<string, Promise<any>> = new Map();
  private categoryVersion: number = 1; // Increments on category changes

  constructor() {
    this.redis = getRedisClient();
  }

  /**
   * Get category tree with multi-tier caching
   */
  async getCategoryTree(): Promise<ICategory[] | null> {
    const cacheKey = 'category:tree:all';
    
    // Try Redis first
    if (await this.isRedisAvailable()) {
      try {
        const cached = await this.redis!.get(cacheKey);
        if (cached) {
          const entry: CacheEntry<ICategory[]> = JSON.parse(cached);
          
          // Validate checksum
          if (this.validateCacheEntry(entry)) {
            // Update local cache as backup
            this.localCache.set(cacheKey, {
              data: entry.data,
              expiry: Date.now() + 3600000 // 1 hour
            });
            return entry.data;
          } else {
            logger.warn('Category cache corruption detected, invalidating');
            await this.invalidateCategoryTree();
          }
        }
      } catch (error) {
        logger.warn('Redis get failed, using local cache', error);
      }
    }
    
    // Fallback to local cache
    const local = this.localCache.get(cacheKey);
    if (local && local.expiry > Date.now()) {
      return local.data;
    }
    
    // Cache stampede protection
    const inFlight = this.cacheStampedeProtection.get(cacheKey);
    if (inFlight) {
      return await inFlight;
    }
    
    // Load from database
    const loadPromise = this.loadCategoryTreeFromDatabase();
    this.cacheStampedeProtection.set(cacheKey, loadPromise);
    
    try {
      const tree = await loadPromise;
      
      // Cache in local memory
      this.localCache.set(cacheKey, {
        data: tree,
        expiry: Date.now() + 3600000 // 1 hour
      });
      
      // Cache in Redis if available
      if (await this.isRedisAvailable()) {
        try {
          const entry: CacheEntry<ICategory[]> = {
            data: tree,
            version: this.categoryVersion,
            checksum: this.computeChecksum(tree),
            timestamp: Date.now()
          };
          await this.redis!.setEx(cacheKey, 3600, JSON.stringify(entry));
        } catch (error) {
          logger.warn('Failed to cache in Redis', error);
        }
      }
      
      return tree;
    } finally {
      this.cacheStampedeProtection.delete(cacheKey);
    }
  }

  /**
   * Get company categories with caching
   */
  async getCompanyCategories(companyId: string): Promise<string[] | null> {
    const cacheKey = `company:${companyId}:categories`;
    
    if (await this.isRedisAvailable()) {
      try {
        const cached = await this.redis!.get(cacheKey);
        if (cached) {
          const entry: CacheEntry<string[]> = JSON.parse(cached);
          if (this.validateCacheEntry(entry)) {
            return entry.data;
          }
        }
      } catch (error) {
        logger.warn('Redis get failed for company categories', error);
      }
    }
    
    return null;
  }

  /**
   * Set company categories in cache
   */
  async setCompanyCategories(companyId: string, categoryIds: string[], ttl: number = 900): Promise<void> {
    const cacheKey = `company:${companyId}:categories`;
    
    if (await this.isRedisAvailable()) {
      try {
        const entry: CacheEntry<string[]> = {
          data: categoryIds,
          version: this.categoryVersion,
          checksum: this.computeChecksum(categoryIds),
          timestamp: Date.now()
        };
        await this.redis!.setEx(cacheKey, ttl, JSON.stringify(entry));
      } catch (error) {
        logger.warn('Failed to cache company categories', error);
      }
    }
  }

  /**
   * Get category descendants with caching
   */
  async getCategoryDescendants(categoryId: string): Promise<string[] | null> {
    const cacheKey = `category:${categoryId}:descendants`;
    
    if (await this.isRedisAvailable()) {
      try {
        const cached = await this.redis!.get(cacheKey);
        if (cached) {
          const entry: CacheEntry<string[]> = JSON.parse(cached);
          if (this.validateCacheEntry(entry)) {
            return entry.data;
          }
        }
      } catch (error) {
        logger.warn('Redis get failed for category descendants', error);
      }
    }
    
    return null;
  }

  /**
   * Set category descendants in cache
   */
  async setCategoryDescendants(categoryId: string, descendantIds: string[], ttl: number = 3600): Promise<void> {
    const cacheKey = `category:${categoryId}:descendants`;
    
    if (await this.isRedisAvailable()) {
      try {
        const entry: CacheEntry<string[]> = {
          data: descendantIds,
          version: this.categoryVersion,
          checksum: this.computeChecksum(descendantIds),
          timestamp: Date.now()
        };
        await this.redis!.setEx(cacheKey, ttl, JSON.stringify(entry));
      } catch (error) {
        logger.warn('Failed to cache category descendants', error);
      }
    }
  }

  /**
   * Invalidate category tree cache
   */
  async invalidateCategoryTree(): Promise<void> {
    const cacheKey = 'category:tree:all';
    
    // Invalidate Redis
    if (await this.isRedisAvailable()) {
      try {
        await this.redis!.del(cacheKey);
        // Invalidate all category-related caches
        const keys = await this.redis!.keys('category:*');
        if (keys.length > 0) {
          await this.redis!.del(keys);
        }
      } catch (error) {
        logger.warn('Failed to invalidate Redis cache', error);
      }
    }
    
    // Invalidate local cache
    this.localCache.delete(cacheKey);
    this.categoryVersion++;
  }

  /**
   * Invalidate company categories cache
   */
  async invalidateCompanyCategories(companyId: string): Promise<void> {
    const cacheKey = `company:${companyId}:categories`;
    
    if (await this.isRedisAvailable()) {
      try {
        await this.redis!.del(cacheKey);
      } catch (error) {
        logger.warn('Failed to invalidate company categories cache', error);
      }
    }
    
    this.localCache.delete(cacheKey);
  }

  /**
   * Invalidate category descendants cache
   */
  async invalidateCategoryDescendants(categoryId: string): Promise<void> {
    const cacheKey = `category:${categoryId}:descendants`;
    
    if (await this.isRedisAvailable()) {
      try {
        await this.redis!.del(cacheKey);
      } catch (error) {
        logger.warn('Failed to invalidate category descendants cache', error);
      }
    }
    
    this.localCache.delete(cacheKey);
  }

  /**
   * Invalidate matching companies cache for a category
   */
  async invalidateMatchingCompanies(categoryId: string, subCategoryId?: string): Promise<void> {
    const cacheKey = subCategoryId 
      ? `match:${categoryId}:${subCategoryId}`
      : `match:${categoryId}:none`;
    
    if (await this.isRedisAvailable()) {
      try {
        await this.redis!.del(cacheKey);
        // Also invalidate all variations
        const keys = await this.redis!.keys(`match:${categoryId}:*`);
        if (keys.length > 0) {
          await this.redis!.del(keys);
        }
      } catch (error) {
        logger.warn('Failed to invalidate matching companies cache', error);
      }
    }
    
    // Invalidate local cache
    this.localCache.delete(cacheKey);
    const localKeys = Array.from(this.localCache.keys()).filter(k => k.startsWith(`match:${categoryId}:`));
    localKeys.forEach(k => this.localCache.delete(k));
  }

  /**
   * Invalidate all matching companies caches
   */
  async invalidateAllMatchingCompanies(): Promise<void> {
    if (await this.isRedisAvailable()) {
      try {
        const keys = await this.redis!.keys('match:*');
        if (keys.length > 0) {
          await this.redis!.del(keys);
        }
      } catch (error) {
        logger.warn('Failed to invalidate all matching companies cache', error);
      }
    }
    
    // Invalidate local cache
    const localKeys = Array.from(this.localCache.keys()).filter(k => k.startsWith('match:'));
    localKeys.forEach(k => this.localCache.delete(k));
  }

  /**
   * Validate cache entry checksum and version
   */
  private validateCacheEntry<T>(entry: CacheEntry<T>): boolean {
    // Validate version
    if (entry.version !== this.categoryVersion) {
      logger.warn(`Cache version mismatch: expected ${this.categoryVersion}, got ${entry.version}`);
      return false;
    }
    
    // Validate checksum
    const computedChecksum = this.computeChecksum(entry.data);
    if (computedChecksum !== entry.checksum) {
      logger.error('Cache checksum mismatch - corruption detected');
      return false;
    }
    
    return true;
  }

  /**
   * Compute SHA-256 checksum of data
   */
  private computeChecksum(data: any): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }

  /**
   * Load category tree from database
   */
  private async loadCategoryTreeFromDatabase(): Promise<ICategory[]> {
    const repository = new CategoryRepository();
    return await repository.getCategoryTree();
  }

  /**
   * Check if Redis is available
   */
  private async isRedisAvailable(): Promise<boolean> {
    if (!this.redis || !isRedisAvailable()) {
      return false;
    }
    
    try {
      await this.redis.ping();
      return true;
    } catch {
      return false;
    }
  }
}
