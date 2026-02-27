/**
 * Token Blacklist Service
 * Implements JWT token revocation using Redis
 * Critical for security: allows immediate token invalidation
 */

import { createClient, RedisClientType } from 'redis';
import { config } from '../config/env';
import { logger } from './logger';
import { decodeToken } from './jwt';
import crypto from 'crypto';

export class TokenBlacklistService {
  private redis: RedisClientType | null = null;
  private readonly PREFIX = 'blacklist:token:';
  private readonly REFRESH_PREFIX = 'blacklist:refresh:';
  private readonly USER_PREFIX = 'blacklist:user:';
  private isConnected = false;
  private connectionPromise: Promise<void> | null = null;
  private redisUnavailable = false; // Circuit breaker flag
  private lastConnectionAttempt = 0;
  private readonly CONNECTION_RETRY_DELAY = 60000; // Retry after 60 seconds
  private connectionErrorCount = 0;
  private readonly MAX_CONNECTION_ERRORS = 3; // Stop retrying after 3 consecutive failures
  private lastErrorLogTime = 0;
  private readonly ERROR_LOG_THROTTLE = 30000; // Only log errors once per 30 seconds

  constructor() {
    // Initialize connection lazily
  }

  /**
   * Initialize Redis connection
   */
  private async initializeRedis(): Promise<void> {
    // Circuit breaker: Don't retry if Redis is marked as unavailable
    if (this.redisUnavailable) {
      const now = Date.now();
      // Only retry after a delay
      if (now - this.lastConnectionAttempt < this.CONNECTION_RETRY_DELAY) {
        return;
      }
      // Reset circuit breaker for retry
      this.redisUnavailable = false;
      this.connectionErrorCount = 0;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.lastConnectionAttempt = Date.now();
    this.connectionPromise = (async () => {
      try {
        // Close existing connection if any
        if (this.redis) {
          try {
            await this.redis.quit();
          } catch {
            // Ignore errors when closing
          }
        }

        this.redis = createClient({
          url: config.redis.url,
          socket: {
            reconnectStrategy: (retries) => {
              if (retries > 3) {
                // Stop reconnecting after 3 attempts
                this.redisUnavailable = true;
                this.connectionErrorCount++;
                const now = Date.now();
                if (now - this.lastErrorLogTime > this.ERROR_LOG_THROTTLE) {
                  logger.warn('Redis reconnection failed after 3 attempts. Token blacklisting disabled until Redis is available.');
                  this.lastErrorLogTime = now;
                }
                return new Error('Redis connection failed');
              }
              const delay = Math.min(retries * 100, 1000);
              return delay;
            },
          },
        });

        this.redis.on('error', (_err) => {
          // Throttle error logging
          const now = Date.now();
          if (now - this.lastErrorLogTime > this.ERROR_LOG_THROTTLE) {
            logger.warn('Redis connection error. Token blacklisting may be unavailable.');
            this.lastErrorLogTime = now;
          }
          this.isConnected = false;
        });

        this.redis.on('connect', () => {
          logger.info('Redis connected for token blacklisting');
          this.isConnected = true;
          this.redisUnavailable = false;
          this.connectionErrorCount = 0;
        });

        this.redis.on('ready', () => {
          logger.info('Redis ready for token blacklisting');
          this.isConnected = true;
          this.redisUnavailable = false;
          this.connectionErrorCount = 0;
        });

        await this.redis.connect();
      } catch (error) {
        this.connectionErrorCount++;
        const now = Date.now();
        if (now - this.lastErrorLogTime > this.ERROR_LOG_THROTTLE) {
          logger.warn('Failed to initialize Redis. Token blacklisting disabled. The application will continue without Redis.');
          this.lastErrorLogTime = now;
        }
        
        this.isConnected = false;
        this.connectionPromise = null;
        
        // Activate circuit breaker after max errors
        if (this.connectionErrorCount >= this.MAX_CONNECTION_ERRORS) {
          this.redisUnavailable = true;
        }
      }
    })();

    return this.connectionPromise;
  }

  /**
   * Ensure Redis connection
   */
  private async ensureConnection(): Promise<void> {
    // Don't attempt connection if circuit breaker is active
    if (this.redisUnavailable) {
      return;
    }

    // If already connected, return immediately
    if (this.redis && this.isConnected && this.redis.isOpen) {
      return;
    }

    // Only attempt connection if not already attempting
    if (!this.connectionPromise) {
      await this.initializeRedis();
    } else {
      // Wait for existing connection attempt
      try {
        await this.connectionPromise;
      } catch {
        // Ignore connection errors, handled in initializeRedis
      }
    }
  }

  /**
   * Blacklist an access token
   * @param token - JWT access token
   * @param expirySeconds - Token expiry time in seconds (default: 15 minutes = 900)
   */
  async blacklistToken(token: string, expirySeconds: number = 900): Promise<void> {
    // Silently skip if Redis is unavailable
    if (this.redisUnavailable || !this.redis) {
      return;
    }

    try {
      if (!this.isConnected || !this.redis.isOpen) {
        await this.ensureConnection();
      }

      if (!this.redis || !this.redis.isOpen) {
        return;
      }

      const decoded = decodeToken(token);
      if (!decoded) {
        throw new Error('Invalid token');
      }

      // Use token hash as ID
      const tokenId = this.getTokenId(token);
      const key = `${this.PREFIX}${tokenId}`;

      // Store token with TTL matching its expiry
      await this.redis.setEx(key, expirySeconds, '1');
    } catch (error) {
      // Don't throw - allow request to continue even if blacklisting fails
      // This ensures availability over perfect security
    }
  }

  /**
   * Blacklist a refresh token
   * @param token - JWT refresh token
   * @param expirySeconds - Token expiry time in seconds (default: 7 days = 604800)
   */
  async blacklistRefreshToken(token: string, expirySeconds: number = 604800): Promise<void> {
    // Silently skip if Redis is unavailable
    if (this.redisUnavailable || !this.redis) {
      return;
    }

    try {
      if (!this.isConnected || !this.redis.isOpen) {
        await this.ensureConnection();
      }

      if (!this.redis || !this.redis.isOpen) {
        return;
      }

      const tokenId = this.getTokenId(token);
      const key = `${this.REFRESH_PREFIX}${tokenId}`;

      await this.redis.setEx(key, expirySeconds, '1');
    } catch (error) {
      // Don't throw - allow request to continue
    }
  }

  /**
   * Check if token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    // If Redis is unavailable, fail open (allow token) for availability
    if (this.redisUnavailable || !this.redis) {
      return false;
    }

    try {
      // Only attempt connection if not unavailable
      if (!this.isConnected || !this.redis.isOpen) {
        await this.ensureConnection();
      }

      if (!this.redis || !this.redis.isOpen) {
        return false;
      }

      const tokenId = this.getTokenId(token);
      const key = `${this.PREFIX}${tokenId}`;
      const result = await this.redis.get(key);
      return result === '1';
    } catch (error) {
      // Fail open for availability - don't block requests if Redis is down
      return false;
    }
  }

  /**
   * Check if refresh token is blacklisted
   */
  async isRefreshTokenBlacklisted(token: string): Promise<boolean> {
    // If Redis is unavailable, fail open (allow token) for availability
    if (this.redisUnavailable || !this.redis) {
      return false;
    }

    try {
      if (!this.isConnected || !this.redis.isOpen) {
        await this.ensureConnection();
      }

      if (!this.redis || !this.redis.isOpen) {
        return false;
      }

      const tokenId = this.getTokenId(token);
      const key = `${this.REFRESH_PREFIX}${tokenId}`;
      const result = await this.redis.get(key);
      return result === '1';
    } catch (error) {
      // Fail open for availability
      return false;
    }
  }

  /**
   * Blacklist all tokens for a user (e.g., on password change, account lock)
   * Uses a user-specific blacklist pattern
   */
  async blacklistAllUserTokens(userId: string, expirySeconds: number = 604800): Promise<void> {
    // Silently skip if Redis is unavailable
    if (this.redisUnavailable || !this.redis) {
      return;
    }

    try {
      if (!this.isConnected || !this.redis.isOpen) {
        await this.ensureConnection();
      }

      if (!this.redis || !this.redis.isOpen) {
        return;
      }

      const key = `${this.USER_PREFIX}${userId}`;
      await this.redis.setEx(key, expirySeconds, Date.now().toString());
    } catch (error) {
      // Don't throw - allow request to continue
    }
  }

  /**
   * Check if user's tokens are globally blacklisted
   */
  async isUserBlacklisted(userId: string): Promise<boolean> {
    // If Redis is unavailable, fail open (allow user) for availability
    if (this.redisUnavailable || !this.redis) {
      return false;
    }

    try {
      if (!this.isConnected || !this.redis.isOpen) {
        await this.ensureConnection();
      }

      if (!this.redis || !this.redis.isOpen) {
        return false;
      }

      const key = `${this.USER_PREFIX}${userId}`;
      const result = await this.redis.get(key);
      return result !== null;
    } catch (error) {
      // Fail open for availability
      return false;
    }
  }

  /**
   * Generate token ID (hash of token for storage)
   */
  private getTokenId(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.isConnected = false;
    }
  }
}

// Singleton instance
let blacklistServiceInstance: TokenBlacklistService | null = null;

export const getTokenBlacklistService = (): TokenBlacklistService => {
  if (!blacklistServiceInstance) {
    blacklistServiceInstance = new TokenBlacklistService();
  }
  return blacklistServiceInstance;
};
