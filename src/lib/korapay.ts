import { z } from 'zod';

// Korapay API Configuration
export const KORAPAY_CONFIG = {
  baseUrl: process.env.KORAPAY_BASE_URL || 'https://api.korapay.com',
  publicKey: process.env.KORAPAY_PUBLIC_KEY || '',
  secretKey: process.env.KORAPAY_SECRET_KEY || '',
  webhookSecret: process.env.KORAPAY_WEBHOOK_SECRET || '',
};

// Korapay API Response Schemas
export const KorapayTransactionSchema = z.object({
  id: z.string(),
  reference: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.enum(['pending', 'success', 'failed', 'cancelled']),
  customer: z.object({
    name: z.string(),
    email: z.string(),
    phone: z.string().optional(),
  }),
  metadata: z.record(z.any()).optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const KorapayInitializeResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    reference: z.string(),
    checkout_url: z.string(),
    access_code: z.string(),
  }),
});

export const KorapayVerifyResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: KorapayTransactionSchema,
});

// Types
export type KorapayTransaction = z.infer<typeof KorapayTransactionSchema>;
export type KorapayInitializeResponse = z.infer<typeof KorapayInitializeResponseSchema>;
export type KorapayVerifyResponse = z.infer<typeof KorapayVerifyResponseSchema>;

// Korapay API Client
export class KorapayClient {
  private baseUrl: string;
  private publicKey: string;
  private secretKey: string;

  constructor() {
    this.baseUrl = KORAPAY_CONFIG.baseUrl;
    this.publicKey = KORAPAY_CONFIG.publicKey;
    this.secretKey = KORAPAY_CONFIG.secretKey;
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.secretKey}`,
    };

    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Korapay API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // Initialize a payment transaction
  async initializePayment(params: {
    amount: number;
    currency: string;
    reference: string;
    customer: {
      name: string;
      email: string;
      phone?: string;
    };
    callback_url: string;
    metadata?: Record<string, any>;
  }): Promise<KorapayInitializeResponse> {
    const payload = {
      amount: params.amount,
      currency: params.currency,
      reference: params.reference,
      customer: params.customer,
      callback_url: params.callback_url,
      metadata: params.metadata || {},
    };

    return this.makeRequest<KorapayInitializeResponse>(
      '/merchant/api/v1/charges/initialize',
      'POST',
      payload
    );
  }

  // Verify a payment transaction
  async verifyPayment(reference: string): Promise<KorapayVerifyResponse> {
    return this.makeRequest<KorapayVerifyResponse>(
      `/merchant/api/v1/transactions/verify/${reference}`,
      'GET'
    );
  }

  // Get transaction details
  async getTransaction(reference: string): Promise<KorapayVerifyResponse> {
    return this.makeRequest<KorapayVerifyResponse>(
      `/merchant/api/v1/transactions/${reference}`,
      'GET'
    );
  }

  // List transactions
  async listTransactions(params?: {
    page?: number;
    per_page?: number;
    status?: string;
    from?: string;
    to?: string;
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      transactions: KorapayTransaction[];
      pagination: {
        page: number;
        per_page: number;
        total: number;
        total_pages: number;
      };
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.from) queryParams.append('from', params.from);
    if (params?.to) queryParams.append('to', params.to);

    const endpoint = `/merchant/api/v1/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.makeRequest(endpoint, 'GET');
  }

  // Create a virtual account
  async createVirtualAccount(params: {
    customer: {
      name: string;
      email: string;
      phone?: string;
    };
    account_name: string;
    bank_code?: string;
    metadata?: Record<string, any>;
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      account_number: string;
      account_name: string;
      bank_name: string;
      bank_code: string;
      customer_code: string;
    };
  }> {
    return this.makeRequest(
      '/merchant/api/v1/virtual-accounts',
      'POST',
      params
    );
  }

  // Verify webhook signature
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', KORAPAY_CONFIG.webhookSecret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }
}

// Export a singleton instance
export const korapayClient = new KorapayClient();
