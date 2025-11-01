import { z } from 'zod';

// Korapay Identity API Configuration
export const KORAPAY_IDENTITY_CONFIG = {
  baseUrl: process.env.KORAPAY_BASE_URL || 'https://api.korapay.com',
  publicKey: process.env.KORAPAY_PUBLIC_KEY || '',
  secretKey: process.env.KORAPAY_SECRET_KEY || '',
};

// NIN Lookup Response Schema
export const NINLookupResponseSchema = z.object({
  status: z.boolean(),
  message: z.string(),
  data: z.object({
    reference: z.string(),
    id: z.string(),
    id_type: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    middle_name: z.string().optional(),
    date_of_birth: z.string(),
    phone_number: z.string().optional(),
    address: z.object({
      town: z.string().optional(),
      lga: z.string().optional(),
      state: z.string().optional(),
      street: z.string().optional(),
    }).optional(),
    email: z.string().optional(),
    birth_state: z.string().optional(),
    birth_lga: z.string().optional(),
    birth_country: z.string().optional(),
    next_of_kin_state: z.string().optional(),
    religion: z.string().optional(),
    gender: z.string(),
    image: z.string().optional(),
    signature: z.string().optional(),
    requested_by: z.string().optional(),
  }),
});

// Mono NIN Lookup Response Schema (alternative)
export const MonoNINLookupResponseSchema = z.object({
  status: z.string(),
  data: z.object({
    nin: z.string(),
    firstname: z.string(),
    lastname: z.string(),
    middlename: z.string().optional(),
    dateOfBirth: z.string(),
    gender: z.string(),
    phoneNumber: z.string().optional(),
    address: z.string().optional(),
    state: z.string().optional(),
    lga: z.string().optional(),
    photo: z.string().optional(),
  }),
});

// Types
export type NINLookupResponse = z.infer<typeof NINLookupResponseSchema>;
export type MonoNINLookupResponse = z.infer<typeof MonoNINLookupResponseSchema>;

// Korapay Identity Service
export class KorapayIdentityService {
  private baseUrl: string;
  private secretKey: string;

  constructor() {
    this.baseUrl = KORAPAY_IDENTITY_CONFIG.baseUrl;
    this.secretKey = KORAPAY_IDENTITY_CONFIG.secretKey;
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    data?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.secretKey}`,
    };

    console.log('🌐 Making request to:', url);
    console.log('📤 Request data:', data);
    console.log('🔑 Using secret key:', this.secretKey ? 'Present' : 'Missing');

    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`Korapay Identity API Error: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log('✅ API Response:', responseData);
    return responseData;
  }

  // NIN Lookup using Korapay Identity API
  async lookupNIN(nin: string): Promise<NINLookupResponse> {
    try {
      console.log('🔍 Looking up NIN with Korapay Identity API:', nin);
      
      
      // Use the correct Korapay endpoint
      const response = await this.makeRequest<NINLookupResponse>(
        '/merchant/api/v1/identities/ng/nin',
        'POST',
        { 
          id: nin, // Korapay expects 'id' field, not 'nin'
          verification_consent: true // Required field for NIN verification
        }
      );

      console.log('✅ NIN lookup successful:', response.data.first_name, response.data.last_name);
      return response;

    } catch (error: any) {
      console.error('❌ Korapay NIN lookup failed:', error);
      throw new Error(`NIN lookup failed: ${error.message}`);
    }
  }

  // Validate NIN format
  validateNIN(nin: string): boolean {
    // Nigerian NIN is 11 digits
    return /^\d{11}$/.test(nin);
  }

  // Format NIN lookup data for member registration
  formatNINDataForRegistration(ninData: NINLookupResponse['data']) {
    return {
      nin: ninData.id, // Korapay returns 'id' field
      firstName: ninData.first_name,
      lastName: ninData.last_name,
      middleName: ninData.middle_name || '',
      dateOfBirth: ninData.date_of_birth,
      gender: ninData.gender,
      phoneNumber: ninData.phone_number || '',
      email: ninData.email || '', // Add email field
      address: ninData.address?.street || '',
      city: ninData.address?.town || '', // Map town to city
      state: ninData.address?.state || '',
      lga: ninData.address?.lga || '',
      photo: ninData.image || '',
      signature: ninData.signature || '', // Add signature field
      verificationStatus: 'verified',
      verificationLevel: 'standard',
    };
  }

  // CAC Lookup method
  async lookupCAC(rcNumber: string, registrationType: string = 'RC'): Promise<CACLookupResponse> {
    try {
      console.log('🔍 Looking up CAC with Korapay Identity API:', rcNumber, 'Type:', registrationType);

      // Extract numeric part from RC number (e.g., "RC00000011" -> "00000011")
      const numericId = rcNumber.replace(/[^0-9]/g, '');
      
      if (!numericId) {
        throw new Error('Invalid RC number format. Must contain numeric characters.');
      }

      const response = await this.makeRequest<CACLookupResponse>(
        '/merchant/api/v1/identities/ng/cac',
        'POST',
        {
          id: numericId, // CAC expects numeric 'id' field
          registration_type: registrationType, // Use the selected registration type
          verification_consent: true // Required field for CAC verification
        }
      );

      console.log('✅ CAC lookup successful:', response.data.name);
      return response;

    } catch (error: any) {
      console.error('❌ Korapay CAC lookup failed:', error);
      throw new Error(`CAC lookup failed: ${error.message}`);
    }
  }

  // Format CAC data for registration form
  formatCACDataForRegistration(cacData: CACLookupResponse['data']) {
    return {
      cooperativeName: cacData.name || '', // Use 'name' instead of 'company_name'
      cooperativeRegNo: cacData.registration_number || '', // Use 'registration_number' instead of 'rc_number'
      address: cacData.address || '',
      city: cacData.city || '',
      state: cacData.state || '',
      lga: cacData.lga || '',
      phone: cacData.phone_number || '',
      cooperativeEmail: cacData.email || '',
      verificationStatus: 'verified',
      verificationLevel: 'standard',
    };
  }
}

// Mono NIN Lookup Service (Alternative)
export class MonoNINLookupService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.MONO_API_KEY || '';
    this.baseUrl = process.env.MONO_BASE_URL || 'https://api.mono.co';
  }

  async lookupNIN(nin: string): Promise<MonoNINLookupResponse> {
    try {
      console.log('🔍 Looking up NIN with Mono API:', nin);
      
      
      const response = await fetch(`${this.baseUrl}/v1/identities/ng/nin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ nin }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Mono API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Mono NIN lookup successful:', data.data?.firstname, data.data?.lastname);
      return data;

    } catch (error: any) {
      console.error('❌ Mono NIN lookup failed:', error);
      throw new Error(`Mono NIN lookup failed: ${error.message}`);
    }
  }

  // Format Mono NIN lookup data for member registration
  formatNINDataForRegistration(ninData: MonoNINLookupResponse['data']) {
    return {
      nin: ninData.nin,
      firstName: ninData.firstname,
      lastName: ninData.lastname,
      middleName: ninData.middlename || '',
      dateOfBirth: ninData.dateOfBirth,
      gender: ninData.gender,
      phoneNumber: ninData.phoneNumber || '',
      address: ninData.address || '',
      state: ninData.state || '',
      lga: ninData.lga || '',
      photo: ninData.photo || '',
      verificationStatus: 'verified', // Mono doesn't provide status
      verificationLevel: 'standard',
    };
  }
}

// CAC Lookup Response Schema
export const CACLookupResponseSchema = z.object({
  status: z.boolean(),
  message: z.string(),
  data: z.object({
    reference: z.string().optional(),
    id: z.string().optional(),
    id_type: z.string().optional(),
    name: z.string(), // Company name
    email: z.string().optional(),
    phone_number: z.string().optional(),
    registration_number: z.string(), // RC number
    registry_number: z.string().optional(),
    vat_number: z.string().optional(),
    registration_date: z.string().optional(),
    type_of_entity: z.string().optional(),
    activity: z.string().optional(),
    address: z.string().optional(),
    state: z.string().optional(),
    lga: z.string().optional(),
    city: z.string().optional(),
    branch_address: z.string().optional(),
    company_status: z.string().optional(),
    tin: z.string().optional(),
    requested_by: z.string().optional(),
  }),
});

export type CACLookupResponse = z.infer<typeof CACLookupResponseSchema>;

// Export singleton instances
export const korapayIdentityService = new KorapayIdentityService();
export const monoNINLookupService = new MonoNINLookupService();
