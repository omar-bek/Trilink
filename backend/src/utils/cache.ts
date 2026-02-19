import { getRedisClient, isRedisAvailable } from '../config/redis';
import { logger } from './logger';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

/**
 * Cache service using Redis
 * Falls back to no-op if Redis is not available
 */
export class CacheService {
  private prefix: string;

  constructor(prefix: string = 'trilink') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!isRedisAvailable()) {
      return null;
    }

    try {
      const client = getRedisClient();
      if (!client) return null;

      const value = await client.get(this.getKey(key));
      if (!value) return null;

      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    if (!isRedisAvailable()) {
      return false;
    }

    try {
      const client = getRedisClient();
      if (!client) return false;

      const serialized = JSON.stringify(value);
      if (ttl) {
        await client.setEx(this.getKey(key), ttl, serialized);
      } else {
        await client.set(this.getKey(key), serialized);
      }
      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    if (!isRedisAvailable()) {
      return false;
    }

    try {
      const client = getRedisClient();
      if (!client) return false;

      await client.del(this.getKey(key));
      return true;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!isRedisAvailable()) {
      return 0;
    }

    try {
      const client = getRedisClient();
      if (!client) return 0;

      const keys = await client.keys(this.getKey(pattern));
      if (keys.length === 0) return 0;

      return await client.del(keys);
    } catch (error) {
      logger.error(`Cache deletePattern error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Get or set value with cache
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    await this.set(key, value, ttl);
    return value;
  }
}

export const cacheService = new CacheService();
