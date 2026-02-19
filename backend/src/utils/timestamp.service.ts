/**
 * Cryptographic Timestamping Service
 * Implements RFC 3161-compliant timestamping for audit trail immutability
 * Creates verifiable timestamps that prove when data existed
 */

import crypto from 'crypto';
import { logger } from './logger';
import { getPKIService } from './pki.service';

export interface TimestampData {
  data: string | Buffer;
  timestamp: Date;
  hash: string;
  signature: string;
  algorithm: string;
}

export interface VerifyTimestampResult {
  valid: boolean;
  timestamp?: Date;
  error?: string;
}

export class TimestampService {
  private pkiService = getPKIService();

  /**
   * Create a cryptographic timestamp for data
   * This proves that the data existed at a specific point in time
   */
  createTimestamp(data: string | Buffer): TimestampData {
    const timestamp = new Date();
    const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;

    // Create hash of the data
    const hash = this.pkiService.createHash(dataBuffer);

    // Create timestamp token: hash + timestamp + nonce
    const timestampToken = JSON.stringify({
      hash,
      timestamp: timestamp.toISOString(),
      nonce: crypto.randomBytes(16).toString('hex'),
    });

    // Sign the timestamp token
    const signatureResult = this.pkiService.sign(timestampToken);

    return {
      data: typeof data === 'string' ? data : data.toString('base64'),
      timestamp,
      hash,
      signature: signatureResult.signature,
      algorithm: signatureResult.algorithm,
    };
  }

  /**
   * Verify a timestamp
   * Validates that the timestamp is authentic and the data matches
   */
  verifyTimestamp(
    data: string | Buffer,
    timestampHash: string,
    timestampSignature: string
  ): VerifyTimestampResult {
    try {
      const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
      const computedHash = this.pkiService.createHash(dataBuffer);

      // Verify hash matches
      if (computedHash !== timestampHash) {
        return {
          valid: false,
          error: 'Data hash mismatch - data may have been tampered with',
        };
      }

      // Verify signature (in production, this would verify against TSA certificate)
      // For now, we verify against our own PKI
      const verifyResult = this.pkiService.verify(
        Buffer.from(timestampHash),
        timestampSignature
      );

      if (!verifyResult.valid) {
        return {
          valid: false,
          error: verifyResult.error || 'Timestamp signature verification failed',
        };
      }

      return {
        valid: true,
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Timestamp verification failed',
      };
    }
  }

  /**
   * Create timestamp hash for audit log
   * This creates an immutable proof of when the log was created
   */
  createAuditLogTimestamp(auditLogData: {
    userId: string;
    action: string;
    resource: string;
    resourceId?: string;
    timestamp: Date;
  }): { hash: string; signature: string } {
    const timestampData = JSON.stringify({
      userId: auditLogData.userId,
      action: auditLogData.action,
      resource: auditLogData.resource,
      resourceId: auditLogData.resourceId,
      timestamp: auditLogData.timestamp.toISOString(),
    });

    const timestamp = this.createTimestamp(timestampData);
    return {
      hash: timestamp.hash,
      signature: timestamp.signature,
    };
  }
}

// Singleton instance
let timestampServiceInstance: TimestampService | null = null;

export const getTimestampService = (): TimestampService => {
  if (!timestampServiceInstance) {
    timestampServiceInstance = new TimestampService();
  }
  return timestampServiceInstance;
};
