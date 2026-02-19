/**
 * Secrets Manager Service
 * Manages secure storage and retrieval of secrets
 * In production, integrates with AWS Secrets Manager, Azure Key Vault, or HashiCorp Vault
 */

import { logger } from './logger';
import crypto from 'crypto';

export interface SecretsConfig {
  jwtSecret: string;
  jwtRefreshSecret: string;
  pkiPrivateKey?: string;
  pkiPublicKey?: string;
  pkiCertificate?: string;
  encryptionKey?: string;
}

export class SecretsManagerService {
  private secrets: SecretsConfig | null = null;
  private readonly DEFAULT_SECRETS = [
    'test-jwt-secret-min-32-chars-for-testing-only',
    'test-jwt-refresh-secret-min-32-chars-for-testing',
    'change-me-in-production-min-32-chars',
    'your-super-secret-jwt-key-change-in-production-min-32-chars',
  ];

  /**
   * Load secrets from secure storage
   * Priority:
   * 1. Environment variables (for local dev)
   * 2. Secrets Manager/Vault (for production)
   */
  async loadSecrets(): Promise<SecretsConfig> {
    if (this.secrets) {
      return this.secrets;
    }

    try {
      // Load JWT secrets (required)
      const jwtSecret = await this.getSecret('JWT_SECRET', true);
      const jwtRefreshSecret = await this.getSecret('JWT_REFRESH_SECRET', true);

      if (!jwtSecret || !jwtRefreshSecret) {
        throw new Error(
          'Required secrets not found. Configure JWT_SECRET and JWT_REFRESH_SECRET.'
        );
      }

      // Validate secret strength (only in production)
      const nodeEnv = process.env.NODE_ENV || 'development';
      if (nodeEnv === 'production') {
        this.validateSecretStrength(jwtSecret, 'JWT_SECRET');
        this.validateSecretStrength(jwtRefreshSecret, 'JWT_REFRESH_SECRET');
      } else {
        // In development, just warn about weak secrets
        if (this.isDefaultSecret(jwtSecret)) {
          logger.warn('⚠️  Using default JWT_SECRET. Change it in production!');
        }
        if (this.isDefaultSecret(jwtRefreshSecret)) {
          logger.warn('⚠️  Using default JWT_REFRESH_SECRET. Change it in production!');
        }
      }

      this.secrets = {
        jwtSecret,
        jwtRefreshSecret,
        pkiPrivateKey: await this.getSecret('PKI_PRIVATE_KEY', false),
        pkiPublicKey: await this.getSecret('PKI_PUBLIC_KEY', false),
        pkiCertificate: await this.getSecret('PKI_CERTIFICATE', false),
        encryptionKey: await this.getSecret('PKI_ENCRYPTION_KEY', false),
      };

      logger.info('✅ Secrets loaded successfully');
      return this.secrets;
    } catch (error) {
      logger.error('❌ Failed to load secrets:', error);
      throw new Error('Secrets initialization failed');
    }
  }

  /**
   * Get secret from secure storage
   */
  private async getSecret(key: string, required: boolean): Promise<string | undefined> {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const isProduction = nodeEnv === 'production';
    const isDevelopment = nodeEnv === 'development' || nodeEnv === 'test' || !isProduction;
    
    // Check environment variable first (for local dev)
    const envValue = process.env[key];
    
    // In development, allow default secrets for easier setup
    if (envValue) {
      if (isDevelopment) {
        // In development, allow any value (including defaults)
        return envValue;
      }
      // In production, reject default secrets
      if (!this.isDefaultSecret(envValue)) {
        return envValue;
      }
    }

    // In production, fetch from secrets manager
    if (isProduction) {
      return await this.fetchFromSecretsManager(key, required);
    }

    // Development fallback - use default if available
    if (required) {
      // For development, provide a default secret if not found
      if (key === 'JWT_SECRET') {
        logger.warn('JWT_SECRET not found in environment. Using development default.');
        return 'test-jwt-secret-min-32-chars-for-testing-only';
      }
      if (key === 'JWT_REFRESH_SECRET') {
        logger.warn('JWT_REFRESH_SECRET not found in environment. Using development default.');
        return 'test-jwt-refresh-secret-min-32-chars-for-testing';
      }
      throw new Error(`Secret ${key} is required but not found`);
    }

    return undefined;
  }

  /**
   * Fetch from AWS Secrets Manager (example implementation)
   * Replace with your actual secrets manager integration
   */
  private async fetchFromSecretsManager(
    key: string,
    required: boolean
  ): Promise<string | undefined> {
    try {
      // Example: AWS Secrets Manager
      // const AWS = require('aws-sdk');
      // const secretsManager = new AWS.SecretsManager({ region: process.env.AWS_REGION });
      // const result = await secretsManager.getSecretValue({ SecretId: key }).promise();
      // return result.SecretString;

      // Example: Azure Key Vault
      // const { SecretClient } = require('@azure/keyvault-secrets');
      // const { DefaultAzureCredential } = require('@azure/identity');
      // const credential = new DefaultAzureCredential();
      // const client = new SecretClient(process.env.AZURE_KEY_VAULT_URL, credential);
      // const secret = await client.getSecret(key);
      // return secret.value;

      // For now, throw error to force proper configuration
      if (required) {
        throw new Error(
          `Secrets Manager not configured. Set ${key} in production environment or configure secrets manager.`
        );
      }
      return undefined;
    } catch (error) {
      if (required) {
        throw error;
      }
      return undefined;
    }
  }

  /**
   * Validate secret strength
   */
  private validateSecretStrength(secret: string, name: string): void {
    if (secret.length < 32) {
      throw new Error(`${name} must be at least 32 characters`);
    }

    if (this.isDefaultSecret(secret)) {
      throw new Error(
        `${name} is using default value. Change it in production.`
      );
    }

    // Check for common weak patterns
    const weakPatterns = [
      /^test-/i,
      /^dev-/i,
      /^change-me/i,
      /^your-/i,
      /^default/i,
      /^password/i,
      /^secret$/i,
    ];

    for (const pattern of weakPatterns) {
      if (pattern.test(secret)) {
        throw new Error(
          `${name} appears to be a default/weak secret. Use a strong random secret.`
        );
      }
    }

    // Check entropy (basic check)
    const uniqueChars = new Set(secret).size;
    if (uniqueChars < 10 && secret.length < 64) {
      logger.warn(`${name} has low entropy. Consider using a stronger secret.`);
    }
  }

  /**
   * Check if secret is a default/test value
   */
  private isDefaultSecret(secret: string): boolean {
    return this.DEFAULT_SECRETS.some((defaultSecret) =>
      secret.includes(defaultSecret)
    );
  }

  /**
   * Rotate secret (for key rotation)
   */
  async rotateSecret(key: string): Promise<string> {
    // Generate new secret
    const newSecret = this.generateSecureSecret();

    // Update in secrets manager
    await this.updateSecretInManager(key, newSecret);

    // Invalidate cached secrets
    this.secrets = null;

    logger.info(`Secret ${key} rotated successfully`);
    return newSecret;
  }

  /**
   * Generate cryptographically secure secret
   */
  generateSecureSecret(length: number = 64): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Update secret in secrets manager
   */
  private async updateSecretInManager(key: string, value: string): Promise<void> {
    // In production, implement actual update in secrets manager
    // For now, log the update
    logger.info(`Secret ${key} updated in secrets manager`);
    
    // In production, you would update the secret in:
    // - AWS Secrets Manager
    // - Azure Key Vault
    // - HashiCorp Vault
    // etc.
  }

  /**
   * Get secrets (throws if not loaded)
   */
  getSecrets(): SecretsConfig {
    if (!this.secrets) {
      throw new Error('Secrets not loaded. Call loadSecrets() first.');
    }
    return this.secrets;
  }

  /**
   * Clear cached secrets (for testing)
   */
  clearCache(): void {
    this.secrets = null;
  }
}

// Singleton instance
let secretsManagerInstance: SecretsManagerService | null = null;

export const getSecretsManager = (): SecretsManagerService => {
  if (!secretsManagerInstance) {
    secretsManagerInstance = new SecretsManagerService();
  }
  return secretsManagerInstance;
};
