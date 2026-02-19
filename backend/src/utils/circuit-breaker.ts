import { logger } from './logger';

/**
 * Circuit Breaker State
 */
type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * Circuit Breaker Configuration
 */
interface CircuitBreakerConfig {
  failureThreshold: number;      // Number of failures before opening
  resetTimeout: number;          // Time in ms before attempting reset
  monitoringWindow: number;      // Time window for failure tracking
}

/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by stopping requests when service is failing
 */
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: CircuitState = 'closed';
  private config: CircuitBreakerConfig;
  private successCount: number = 0; // For half-open state

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: config.failureThreshold || 5,
      resetTimeout: config.resetTimeout || 60000, // 1 minute
      monitoringWindow: config.monitoringWindow || 60000, // 1 minute
    };
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === 'open') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure > this.config.resetTimeout) {
        // Try to reset - move to half-open
        this.state = 'half-open';
        this.successCount = 0;
        logger.info('Circuit breaker: Moving to half-open state');
      } else {
        throw new Error('Circuit breaker is open - service unavailable');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful operation
   */
  private onSuccess(): void {
    this.failures = 0;
    
    if (this.state === 'half-open') {
      this.successCount++;
      // If we get 2 successful requests in half-open, close the circuit
      if (this.successCount >= 2) {
        this.state = 'closed';
        this.successCount = 0;
        logger.info('Circuit breaker: Closed - service recovered');
      }
    } else {
      this.state = 'closed';
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.state === 'half-open') {
      // Any failure in half-open opens the circuit immediately
      this.state = 'open';
      this.successCount = 0;
      logger.warn('Circuit breaker: Opened - service still failing');
    } else if (this.failures >= this.config.failureThreshold) {
      this.state = 'open';
      logger.error(`Circuit breaker: Opened after ${this.failures} failures`);
    }
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get failure count
   */
  getFailureCount(): number {
    return this.failures;
  }

  /**
   * Manually reset circuit breaker
   */
  reset(): void {
    this.state = 'closed';
    this.failures = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    logger.info('Circuit breaker: Manually reset');
  }
}

/**
 * Retry with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff: 1s, 2s, 4s, etc.
      const delay = baseDelay * Math.pow(2, attempt);
      logger.warn(`Operation failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Retry failed');
}
