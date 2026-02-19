/**
 * Cache Service for Offline/Degraded Mode
 * 
 * Provides local storage caching for critical data when API is unavailable.
 * Implements TTL (Time To Live) and automatic cleanup.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  key: string;
}

class CacheService {
  private prefix = 'trilink_cache_';
  private maxAge = 24 * 60 * 60 * 1000; // 24 hours default

  /**
   * Store data in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttl || this.maxAge,
        key,
      };

      const storageKey = `${this.prefix}${key}`;
      localStorage.setItem(storageKey, JSON.stringify(entry));
    } catch (error) {
      // Handle quota exceeded or other storage errors
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        // Clear old entries and retry
        this.cleanup();
        try {
          const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl: ttl || this.maxAge,
            key,
          };
          localStorage.setItem(`${this.prefix}${key}`, JSON.stringify(entry));
        } catch (retryError) {
          console.warn('Cache storage failed after cleanup:', retryError);
        }
      } else {
        console.warn('Cache storage error:', error);
      }
    }
  }

  /**
   * Retrieve data from cache
   */
  get<T>(key: string): T | null {
    try {
      const storageKey = `${this.prefix}${key}`;
      const item = localStorage.getItem(storageKey);
      
      if (!item) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(item);
      
      // Check if entry is expired
      const age = Date.now() - entry.timestamp;
      if (age > entry.ttl) {
        // Entry expired, remove it
        this.remove(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn('Cache retrieval error:', error);
      return null;
    }
  }

  /**
   * Check if cache entry exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Remove specific cache entry
   */
  remove(key: string): void {
    try {
      const storageKey = `${this.prefix}${key}`;
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Cache removal error:', error);
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): void {
    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();
      
      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const entry: CacheEntry<any> = JSON.parse(item);
              const age = now - entry.timestamp;
              
              if (age > entry.ttl) {
                localStorage.removeItem(key);
              }
            }
          } catch (error) {
            // Invalid entry, remove it
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('Cache cleanup error:', error);
    }
  }

  /**
   * Get all cache keys
   */
  getKeys(): string[] {
    try {
      const keys = Object.keys(localStorage);
      return keys
        .filter((key) => key.startsWith(this.prefix))
        .map((key) => key.replace(this.prefix, ''));
    } catch (error) {
      console.warn('Cache keys retrieval error:', error);
      return [];
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalEntries: number;
    totalSize: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    try {
      const keys = this.getKeys();
      let totalSize = 0;
      let oldestTimestamp: number | null = null;
      let newestTimestamp: number | null = null;

      keys.forEach((key) => {
        const storageKey = `${this.prefix}${key}`;
        const item = localStorage.getItem(storageKey);
        if (item) {
          totalSize += item.length;
          try {
            const entry: CacheEntry<any> = JSON.parse(item);
            if (oldestTimestamp === null || entry.timestamp < oldestTimestamp) {
              oldestTimestamp = entry.timestamp;
            }
            if (newestTimestamp === null || entry.timestamp > newestTimestamp) {
              newestTimestamp = entry.timestamp;
            }
          } catch (error) {
            // Skip invalid entries
          }
        }
      });

      return {
        totalEntries: keys.length,
        totalSize,
        oldestEntry: oldestTimestamp,
        newestEntry: newestTimestamp,
      };
    } catch (error) {
      console.warn('Cache stats error:', error);
      return {
        totalEntries: 0,
        totalSize: 0,
        oldestEntry: null,
        newestEntry: null,
      };
    }
  }
}

export const cacheService = new CacheService();

// Cleanup on service initialization
if (typeof window !== 'undefined') {
  cacheService.cleanup();
  
  // Periodic cleanup every hour
  setInterval(() => {
    cacheService.cleanup();
  }, 60 * 60 * 1000);
}
