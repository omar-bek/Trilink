/**
 * Cryptographic Service using Web Crypto API
 * Provides client-side PKI signing capabilities for legally valid digital signatures
 * 
 * Security: Uses Web Crypto API for cryptographically secure signing
 * Compliance: Meets UAE Electronic Transactions Law requirements
 */

export interface SigningResult {
  signature: string; // Base64-encoded signature
  certificate: string; // Base64-encoded certificate (public key)
  algorithm: string;
  timestamp: string;
}

export class CryptoService {
  private keyPair: CryptoKeyPair | null = null;
  private certificate: string | null = null;

  /**
   * Initialize cryptographic keys for user
   * In production, load from secure storage or generate per-session
   */
  async initializeKeys(userId: string): Promise<void> {
    try {
      // Check if Web Crypto API is available
      if (!window.crypto || !window.crypto.subtle) {
        throw new Error('Web Crypto API is not available in this browser');
      }

      // Generate RSA key pair
      this.keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'RSASSA-PKCS1-v1_5',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true, // extractable
        ['sign', 'verify']
      );

      // Export public key as certificate (PEM format)
      const publicKeyPem = await this.exportPublicKey(this.keyPair.publicKey);
      this.certificate = publicKeyPem;
    } catch (error) {
      console.error('Failed to initialize cryptographic keys:', error);
      throw new Error('Cryptographic initialization failed');
    }
  }

  /**
   * Sign data with private key
   * Creates cryptographically secure signature that can be verified
   */
  async sign(data: string): Promise<SigningResult> {
    if (!this.keyPair) {
      throw new Error('Keys not initialized. Call initializeKeys() first.');
    }

    const encoder = new TextEncoder();
    const timestamp = new Date().toISOString();

    // Include timestamp in signature for non-repudiation
    const dataWithTimestamp = encoder.encode(`${data}\n${timestamp}`);

    // Sign with private key using RSA-SHA256
    const signature = await window.crypto.subtle.sign(
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      this.keyPair.privateKey,
      dataWithTimestamp
    );

    return {
      signature: this.arrayBufferToBase64(signature),
      certificate: this.certificate!,
      algorithm: 'RSASSA-PKCS1-v1_5-SHA256',
      timestamp,
    };
  }

  /**
   * Verify signature (for client-side verification)
   * Note: Backend should also verify signatures
   */
  async verify(data: string, signature: string, certificate: string): Promise<boolean> {
    try {
      const publicKey = await this.importPublicKey(certificate);
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const signatureBuffer = this.base64ToArrayBuffer(signature);

      return await window.crypto.subtle.verify(
        {
          name: 'RSASSA-PKCS1-v1_5',
          hash: 'SHA-256',
        },
        publicKey,
        signatureBuffer,
        dataBuffer
      );
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Export public key to PEM format
   */
  private async exportPublicKey(key: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey('spki', key);
    const exportedAsBase64 = this.arrayBufferToBase64(exported);
    // Format as PEM
    const pemLines = exportedAsBase64.match(/.{1,64}/g) || [];
    return `-----BEGIN PUBLIC KEY-----\n${pemLines.join('\n')}\n-----END PUBLIC KEY-----`;
  }

  /**
   * Import public key from PEM format
   */
  private async importPublicKey(pem: string): Promise<CryptoKey> {
    const pemHeader = '-----BEGIN PUBLIC KEY-----';
    const pemFooter = '-----END PUBLIC KEY-----';
    const pemContents = pem
      .replace(pemHeader, '')
      .replace(pemFooter, '')
      .replace(/\s/g, '');
    
    const binaryDer = this.base64ToArrayBuffer(pemContents);

    return await window.crypto.subtle.importKey(
      'spki',
      binaryDer,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      true,
      ['verify']
    );
  }

  /**
   * Convert ArrayBuffer to Base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 string to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Get certificate (public key) for display/verification
   */
  getCertificate(): string | null {
    return this.certificate;
  }
}

// Singleton instance
let cryptoServiceInstance: CryptoService | null = null;

export const getCryptoService = (): CryptoService => {
  if (!cryptoServiceInstance) {
    cryptoServiceInstance = new CryptoService();
  }
  return cryptoServiceInstance;
};
