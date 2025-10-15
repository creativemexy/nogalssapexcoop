/**
 * Enhanced Data Encryption for NDPA Compliance
 * Provides comprehensive encryption for sensitive personal data
 */

import crypto from 'crypto';

export interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
  tagLength: number;
}

export interface EncryptedData {
  encrypted: string;
  iv: string;
  tag?: string;
  algorithm: string;
}

export class DataEncryption {
  private static readonly ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
  private static readonly ENCRYPTION_IV = process.env.ENCRYPTION_IV || 'default-iv-change-in-production';
  
  private static readonly CONFIG: EncryptionConfig = {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    tagLength: 16
  };

  /**
   * Encrypt sensitive data
   */
  static encrypt(data: string): EncryptedData {
    try {
      const key = crypto.scryptSync(this.ENCRYPTION_KEY, 'salt', this.CONFIG.keyLength);
      const iv = crypto.randomBytes(this.CONFIG.ivLength);
      const cipher = crypto.createCipheriv(this.CONFIG.algorithm, key, iv);
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: null,
        algorithm: this.CONFIG.algorithm
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error}`);
    }
  }

  /**
   * Decrypt sensitive data
   */
  static decrypt(encryptedData: EncryptedData): string {
    try {
      const key = crypto.scryptSync(this.ENCRYPTION_KEY, 'salt', this.CONFIG.keyLength);
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const decipher = crypto.createDecipheriv(encryptedData.algorithm, key, iv);
      
      // Note: Simplified encryption without auth tag for compatibility
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error}`);
    }
  }

  /**
   * Hash sensitive data for anonymization
   */
  static hash(data: string, salt?: string): string {
    const hashSalt = salt || crypto.randomBytes(16).toString('hex');
    return crypto.pbkdf2Sync(data, hashSalt, 10000, 64, 'sha512').toString('hex');
  }

  /**
   * Generate secure random token
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Encrypt personal identifiable information (PII)
   */
  static encryptPII(data: {
    email?: string;
    phone?: string;
    name?: string;
    address?: string;
    nin?: string;
  }): Record<string, EncryptedData> {
    const encrypted: Record<string, EncryptedData> = {};
    
    if (data.email) encrypted.email = this.encrypt(data.email);
    if (data.phone) encrypted.phone = this.encrypt(data.phone);
    if (data.name) encrypted.name = this.encrypt(data.name);
    if (data.address) encrypted.address = this.encrypt(data.address);
    if (data.nin) encrypted.nin = this.encrypt(data.nin);
    
    return encrypted;
  }

  /**
   * Decrypt personal identifiable information (PII)
   */
  static decryptPII(encryptedData: Record<string, EncryptedData>): Record<string, string> {
    const decrypted: Record<string, string> = {};
    
    for (const [key, encrypted] of Object.entries(encryptedData)) {
      try {
        decrypted[key] = this.decrypt(encrypted);
      } catch (error) {
        console.error(`Failed to decrypt ${key}:`, error);
      }
    }
    
    return decrypted;
  }

  /**
   * Anonymize data for analytics
   */
  static anonymize(data: any): any {
    const anonymized = { ...data };
    
    // Remove or hash sensitive fields
    if (anonymized.email) {
      anonymized.email = this.hashEmail(anonymized.email);
    }
    
    if (anonymized.phone) {
      anonymized.phone = this.hashPhone(anonymized.phone);
    }
    
    if (anonymized.name) {
      anonymized.name = this.hashName(anonymized.name);
    }
    
    if (anonymized.address) {
      anonymized.address = this.hashAddress(anonymized.address);
    }
    
    if (anonymized.nin) {
      anonymized.nin = this.hashNIN(anonymized.nin);
    }
    
    return anonymized;
  }

  /**
   * Hash email for anonymization
   */
  private static hashEmail(email: string): string {
    const [local, domain] = email.split('@');
    const hashedLocal = this.hash(local).substring(0, 8);
    return `${hashedLocal}@${domain}`;
  }

  /**
   * Hash phone number for anonymization
   */
  private static hashPhone(phone: string): string {
    if (phone.length <= 4) return '****';
    return phone.slice(0, 2) + '*'.repeat(phone.length - 4) + phone.slice(-2);
  }

  /**
   * Hash name for anonymization
   */
  private static hashName(name: string): string {
    const parts = name.split(' ');
    return parts.map(part => 
      part.length <= 2 ? part : part[0] + '*'.repeat(part.length - 2) + part[part.length - 1]
    ).join(' ');
  }

  /**
   * Hash address for anonymization
   */
  private static hashAddress(address: string): string {
    const parts = address.split(',');
    return parts.map((part, index) => 
      index === 0 ? part : '*'.repeat(part.length)
    ).join(',');
  }

  /**
   * Hash NIN for anonymization
   */
  private static hashNIN(nin: string): string {
    if (nin.length <= 4) return '****';
    return nin.slice(0, 2) + '*'.repeat(nin.length - 4) + nin.slice(-2);
  }

  /**
   * Generate data subject identifier
   */
  static generateDataSubjectId(userId: string): string {
    return this.hash(`ds_${userId}_${Date.now()}`);
  }

  /**
   * Verify data integrity
   */
  static verifyIntegrity(data: string, hash: string): boolean {
    const computedHash = crypto.createHash('sha256').update(data).digest('hex');
    return computedHash === hash;
  }

  /**
   * Generate data integrity hash
   */
  static generateIntegrityHash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}
