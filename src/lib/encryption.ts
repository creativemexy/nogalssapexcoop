import CryptoJS from 'crypto-js';
import { getSecurityConfig } from '@/lib/env';

// Get validated encryption configuration
const { encryptionKey, encryptionIV } = getSecurityConfig();

// Ensure encryption key is 32 characters
const getEncryptionKey = (): string => {
  if (encryptionKey.length < 32) {
    return encryptionKey.padEnd(32, '0');
  }
  return encryptionKey.substring(0, 32);
};

// Ensure IV is 16 characters
const getEncryptionIV = (): string => {
  if (encryptionIV.length < 16) {
    return encryptionIV.padEnd(16, '0');
  }
  return encryptionIV.substring(0, 16);
};

// Encrypt sensitive data
export function encryptData(data: string): string {
  try {
    const key = getEncryptionKey();
    const iv = getEncryptionIV();
    
    const encrypted = CryptoJS.AES.encrypt(data, key, {
      iv: CryptoJS.enc.Utf8.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    return encrypted.toString();
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

// Decrypt sensitive data
export function decryptData(encryptedData: string): string {
  try {
    const key = getEncryptionKey();
    const iv = getEncryptionIV();
    
    const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
      iv: CryptoJS.enc.Utf8.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

// Hash sensitive data (one-way)
export function hashData(data: string): string {
  return CryptoJS.SHA256(data).toString();
}

// Encrypt PII fields
export function encryptPII(userData: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string;
}): {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string;
} {
  const encrypted: any = {};
  
  if (userData.firstName) encrypted.firstName = encryptData(userData.firstName);
  if (userData.lastName) encrypted.lastName = encryptData(userData.lastName);
  if (userData.email) encrypted.email = encryptData(userData.email);
  if (userData.phoneNumber) encrypted.phoneNumber = encryptData(userData.phoneNumber);
  if (userData.address) encrypted.address = encryptData(userData.address);
  if (userData.dateOfBirth) encrypted.dateOfBirth = encryptData(userData.dateOfBirth);
  
  return encrypted;
}

// Decrypt PII fields
export function decryptPII(encryptedData: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string;
}): {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string;
} {
  const decrypted: any = {};
  
  if (encryptedData.firstName) decrypted.firstName = decryptData(encryptedData.firstName);
  if (encryptedData.lastName) decrypted.lastName = decryptData(encryptedData.lastName);
  if (encryptedData.email) decrypted.email = decryptData(encryptedData.email);
  if (encryptedData.phoneNumber) decrypted.phoneNumber = decryptData(encryptedData.phoneNumber);
  if (encryptedData.address) decrypted.address = decryptData(encryptedData.address);
  if (encryptedData.dateOfBirth) decrypted.dateOfBirth = decryptData(encryptedData.dateOfBirth);
  
  return decrypted;
}

// Encrypt financial data
export function encryptFinancialData(financialData: {
  amount?: number;
  accountNumber?: string;
  bankCode?: string;
  reference?: string;
  description?: string;
}): {
  amount?: number; // Keep amount as number for calculations
  accountNumber?: string;
  bankCode?: string;
  reference?: string;
  description?: string;
} {
  const encrypted: any = { ...financialData };
  
  if (financialData.accountNumber) encrypted.accountNumber = encryptData(financialData.accountNumber);
  if (financialData.bankCode) encrypted.bankCode = encryptData(financialData.bankCode);
  if (financialData.reference) encrypted.reference = encryptData(financialData.reference);
  if (financialData.description) encrypted.description = encryptData(financialData.description);
  
  return encrypted;
}

// Decrypt financial data
export function decryptFinancialData(encryptedData: {
  amount?: number;
  accountNumber?: string;
  bankCode?: string;
  reference?: string;
  description?: string;
}): {
  amount?: number;
  accountNumber?: string;
  bankCode?: string;
  reference?: string;
  description?: string;
} {
  const decrypted: any = { ...encryptedData };
  
  if (encryptedData.accountNumber) decrypted.accountNumber = decryptData(encryptedData.accountNumber);
  if (encryptedData.bankCode) decrypted.bankCode = decryptData(encryptedData.bankCode);
  if (encryptedData.reference) decrypted.reference = decryptData(encryptedData.reference);
  if (encryptedData.description) decrypted.description = decryptData(encryptedData.description);
  
  return decrypted;
}

// Encrypt loan data
export function encryptLoanData(loanData: {
  purpose?: string;
  collateral?: string;
  guarantorName?: string;
  guarantorPhone?: string;
  guarantorAddress?: string;
}): {
  purpose?: string;
  collateral?: string;
  guarantorName?: string;
  guarantorPhone?: string;
  guarantorAddress?: string;
} {
  const encrypted: any = {};
  
  if (loanData.purpose) encrypted.purpose = encryptData(loanData.purpose);
  if (loanData.collateral) encrypted.collateral = encryptData(loanData.collateral);
  if (loanData.guarantorName) encrypted.guarantorName = encryptData(loanData.guarantorName);
  if (loanData.guarantorPhone) encrypted.guarantorPhone = encryptData(loanData.guarantorPhone);
  if (loanData.guarantorAddress) encrypted.guarantorAddress = encryptData(loanData.guarantorAddress);
  
  return encrypted;
}

// Decrypt loan data
export function decryptLoanData(encryptedData: {
  purpose?: string;
  collateral?: string;
  guarantorName?: string;
  guarantorPhone?: string;
  guarantorAddress?: string;
}): {
  purpose?: string;
  collateral?: string;
  guarantorName?: string;
  guarantorPhone?: string;
  guarantorAddress?: string;
} {
  const decrypted: any = {};
  
  if (encryptedData.purpose) decrypted.purpose = decryptData(encryptedData.purpose);
  if (encryptedData.collateral) decrypted.collateral = decryptData(encryptedData.collateral);
  if (encryptedData.guarantorName) decrypted.guarantorName = decryptData(encryptedData.guarantorName);
  if (encryptedData.guarantorPhone) decrypted.guarantorPhone = decryptData(encryptedData.guarantorPhone);
  if (encryptedData.guarantorAddress) decrypted.guarantorAddress = decryptData(encryptedData.guarantorAddress);
  
  return decrypted;
}

// Generate secure random string
export function generateSecureRandom(length: number = 32): string {
  return CryptoJS.lib.WordArray.random(length).toString();
}

// Hash password with salt
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const saltToUse = salt || generateSecureRandom(16);
  const hash = CryptoJS.PBKDF2(password, saltToUse, {
    keySize: 256 / 32,
    iterations: 10000
  }).toString();
  
  return { hash, salt: saltToUse };
}

// Verify password
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const testHash = CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: 10000
  }).toString();
  
  return testHash === hash;
}
