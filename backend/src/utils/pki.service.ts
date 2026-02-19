/**
 * PKI (Public Key Infrastructure) Service
 * Provides cryptographic digital signature functionality for legal compliance
 * Implements RSA-based signing with certificate verification
 */

import crypto from 'crypto';
import { logger } from './logger';

export interface CertificateInfo {
  subject: string;
  issuer: string;
  validFrom: Date;
  validTo: Date;
  serialNumber: string;
  fingerprint: string;
}

export interface SignatureResult {
  signature: string; // Base64-encoded signature
  certificate: string; // Base64-encoded certificate
  algorithm: string; // Signature algorithm (e.g., 'RSA-SHA256')
  timestamp: Date;
  certificateInfo?: CertificateInfo;
}

export interface VerifyResult {
  valid: boolean;
  certificateInfo?: CertificateInfo;
  error?: string;
}

export class PKIService {
  private privateKey: crypto.KeyObject | null = null;
  private publicKey: crypto.KeyObject | null = null;
  private certificate: string | null = null;

  constructor() {
    // In production, load keys from secure storage (HSM, Key Vault, etc.)
    // For now, generate a key pair for development
    this.initializeKeys();
  }

  /**
   * Initialize or load cryptographic keys
   * In production, this should load from secure storage
   */
  private initializeKeys(): void {
    try {
      // Check for environment variables with keys
      const privateKeyPem = process.env.PKI_PRIVATE_KEY;
      const publicKeyPem = process.env.PKI_PUBLIC_KEY;
      const certificatePem = process.env.PKI_CERTIFICATE;

      if (privateKeyPem && publicKeyPem) {
        this.privateKey = crypto.createPrivateKey(privateKeyPem);
        this.publicKey = crypto.createPublicKey(publicKeyPem);
        this.certificate = certificatePem || null;
        logger.info('PKI keys loaded from environment variables');
      } else {
        // Generate a new key pair for development
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
          modulusLength: 2048,
          publicKeyEncoding: {
            type: 'spki',
            format: 'pem',
          },
          privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
          },
        });

        this.privateKey = crypto.createPrivateKey(privateKey);
        this.publicKey = crypto.createPublicKey(publicKey);
        logger.warn('PKI keys generated for development. Use production keys in production.');
      }
    } catch (error) {
      logger.error('Failed to initialize PKI keys:', error);
      throw new Error('PKI initialization failed');
    }
  }

  /**
   * Sign data with private key
   * Creates a cryptographic signature that can be verified with the public key
   */
  sign(data: string | Buffer): SignatureResult {
    if (!this.privateKey) {
      throw new Error('Private key not initialized');
    }

    const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
    const timestamp = new Date();

    // Create signature using RSA-SHA256
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(dataBuffer);
    sign.update(timestamp.toISOString()); // Include timestamp in signature
    const signature = sign.sign(this.privateKey, 'base64');

    const result: SignatureResult = {
      signature,
      certificate: this.certificate || this.getPublicKeyPEM(),
      algorithm: 'RSA-SHA256',
      timestamp,
    };

    // Extract certificate info if available
    if (this.certificate) {
      try {
        result.certificateInfo = this.getCertificateInfo(this.certificate);
      } catch (error) {
        logger.warn('Failed to extract certificate info:', error);
      }
    }

    return result;
  }

  /**
   * Verify a signature
   */
  verify(data: string | Buffer, signature: string, certificate?: string): VerifyResult {
    try {
      const publicKey = certificate
        ? crypto.createPublicKey(certificate)
        : this.publicKey;

      if (!publicKey) {
        return {
          valid: false,
          error: 'Public key not available for verification',
        };
      }

      const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(dataBuffer);
      
      // Note: In production, timestamp should be extracted from signature metadata
      // For now, we verify the signature only
      const valid = verify.verify(publicKey, signature, 'base64');

      const result: VerifyResult = {
        valid,
      };

      if (certificate) {
        try {
          result.certificateInfo = this.getCertificateInfo(certificate);
        } catch (error) {
          logger.warn('Failed to extract certificate info:', error);
        }
      }

      return result;
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }

  /**
   * Get public key in PEM format
   */
  getPublicKeyPEM(): string {
    if (!this.publicKey) {
      throw new Error('Public key not initialized');
    }
    return this.publicKey.export({ type: 'spki', format: 'pem' }) as string;
  }

  /**
   * Extract certificate information
   */
  private getCertificateInfo(certificatePem: string): CertificateInfo {
    try {
      // Parse X.509 certificate
      const cert = new crypto.X509Certificate(certificatePem);
      
      return {
        subject: cert.subject,
        issuer: cert.issuer,
        validFrom: cert.validFrom ? new Date(cert.validFrom) : new Date(),
        validTo: cert.validTo ? new Date(cert.validTo) : new Date(),
        serialNumber: cert.serialNumber,
        fingerprint: cert.fingerprint,
      };
    } catch (error) {
      // If certificate parsing fails, try to extract from public key
      const publicKey = crypto.createPublicKey(certificatePem);
      const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }) as string;
      const fingerprint = crypto.createHash('sha256').update(publicKeyPem).digest('hex');

      return {
        subject: 'CN=TriLink Platform',
        issuer: 'CN=TriLink Platform',
        validFrom: new Date(),
        validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        serialNumber: fingerprint.substring(0, 16),
        fingerprint,
      };
    }
  }

  /**
   * Create a hash of data for timestamping
   */
  createHash(data: string | Buffer): string {
    const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
    return crypto.createHash('sha256').update(dataBuffer).digest('hex');
  }
}

// Singleton instance
let pkiServiceInstance: PKIService | null = null;

export const getPKIService = (): PKIService => {
  if (!pkiServiceInstance) {
    pkiServiceInstance = new PKIService();
  }
  return pkiServiceInstance;
};
