import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface CACCompanyData {
  companyName: string;
  rcNumber: string;
  companyType: string;
  registrationDate: string;
  status: string;
  address: string;
  state: string;
  lga: string;
  businessActivities: string[];
  directors: Array<{
    name: string;
    position: string;
    nationality: string;
  }>;
  shareholders: Array<{
    name: string;
    shares: number;
    percentage: number;
  }>;
  authorizedCapital: number;
  issuedCapital: number;
  paidUpCapital: number;
}

interface KorapayCACResponse {
  status: boolean;
  message: string;
  data: {
    reference: string;
    id: string;
    id_type: string;
    name: string;
    email: string;
    phone_number: string;
    search_business_name: string | null;
    former_name: string | null;
    brand_name: string | null;
    registration_number: string;
    registry_number: string;
    vat_number: string;
    registration_date: string;
    registration_submission_date: string;
    date_dissolved: string | null;
    tin: string;
    jtb_tin: string | null;
    tax_office: string | null;
    website_email: string | null;
    type_of_entity: string;
    activity: string;
    address: string;
    state: string;
    lga: string;
    city: string;
    branch_address: string;
    head_office_address: string | null;
    objectives: string;
    company_status: string;
    last_updated_at: string;
    share_capital_in_words: string;
    paid_share_capital: string;
    subscribed_share_capital: string;
    shares_value: string;
    activity_description: string;
    shares_issued: string;
    parent_country: string | null;
    company_contact_persons: Array<{
      contacts: {
        email: string[];
        phone: string[];
      };
      name: string;
    }>;
    country: string;
    key_personnel: Array<{
      name: string;
      designation: string;
      is_corporate: boolean | null;
      appointed_on: string | null;
      resigned_on: string | null;
      shares_type: string | null;
      shares_value: string | null;
      shares_count: string | null;
      occupation: string | null;
      nationality: string | null;
      birth_year: number | null;
      birth_month: number | null;
      birth_date: number | null;
      date_of_birth: string | null;
      gender: string;
      address: string;
      country_of_residence: string;
      number: string | null;
      is_foreign: string;
      document_type: string;
      document_issued_by: string | null;
      document_issued_on: string | null;
      document_number: string;
      email: string;
      phone_number: string;
      status: string;
      companies: any[];
    }>;
    activities: any[];
    legal_entity_identifier_register: any[];
    central_index_key_register: any[];
    filings: Array<{
      date: string;
      name: string;
      type: string;
      status: string | null;
      type_code: string | null;
    }>;
    affiliates: Array<{
      name: string;
      brand_name: string | null;
      short_name: string | null;
      company_number: string;
      country: string;
    }>;
    search_term: string;
    requested_by: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rcNumber, companyName } = await request.json();

    if (!rcNumber && !companyName) {
      return NextResponse.json(
        { error: 'RC Number or Company Name is required' },
        { status: 400 }
      );
    }

    // Validate RC number format if provided
    if (rcNumber) {
      const numericPart = rcNumber.replace(/[^0-9]/g, '');
      if (numericPart.length < 6) {
        return NextResponse.json(
          { error: 'RC Number must contain at least 6 numeric characters' },
          { status: 400 }
        );
      }
    }

    // Check if Korapay CAC API is configured
    const korapaySecretKey = process.env.KORAPAY_SECRET_KEY;
    const korapayBaseUrl = process.env.KORAPAY_BASE_URL || 'https://api.korapay.com';

    if (!korapaySecretKey) {
      return NextResponse.json(
        { error: 'Korapay CAC API not configured. Please add KORAPAY_SECRET_KEY to environment variables.' },
        { status: 500 }
      );
    }

    try {
      // Validate and format the RC number
      let searchId = rcNumber || companyName;
      let registrationType = 'RC'; // Default registration type
      
      // Extract numeric part from RC number (e.g., "RC00000011" -> "00000011")
      if (rcNumber) {
        searchId = rcNumber.replace(/[^0-9]/g, '');
        if (!searchId) {
          throw new Error('Invalid RC number format. Must contain numeric characters.');
        }
      }

      console.log('🔍 Searching CAC with ID:', searchId, 'Type:', registrationType);

      // Call Korapay CAC verification API
      const requestBody = {
        id: searchId, // CAC expects numeric 'id' field
        registration_type: registrationType, // Required field
        verification_consent: true // Required field for CAC verification
      };

      console.log('📤 Request body:', requestBody);

      const response = await fetch(`${korapayBaseUrl}/merchant/api/v1/identities/ng/cac`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${korapaySecretKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        let errorMessage = `Korapay API error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage += ` - ${errorData.message || errorData.error || 'Unknown error'}`;
          console.log('❌ Error details:', errorData);
        } catch (e) {
          const errorText = await response.text();
          errorMessage += ` - ${errorText}`;
          console.log('❌ Error text:', errorText);
        }
        throw new Error(errorMessage);
      }

      const korapayResponse: KorapayCACResponse = await response.json();
      
      console.log('✅ Korapay response received:', {
        status: korapayResponse.status,
        message: korapayResponse.message,
        hasData: !!korapayResponse.data,
        companyName: korapayResponse.data?.name
      });

      if (!korapayResponse.status) {
        return NextResponse.json(
          { error: korapayResponse.message || 'Company not found in CAC database' },
          { status: 404 }
        );
      }

      if (!korapayResponse.data) {
        return NextResponse.json(
          { error: 'No company data returned from CAC verification' },
          { status: 404 }
        );
      }

      // Transform Korapay response to our format
      const cacData: CACCompanyData = {
        companyName: korapayResponse.data.name,
        rcNumber: korapayResponse.data.registration_number,
        companyType: korapayResponse.data.type_of_entity,
        registrationDate: korapayResponse.data.registration_date.split('T')[0], // Extract date part
        status: korapayResponse.data.company_status,
        address: korapayResponse.data.address,
        state: korapayResponse.data.state,
        lga: korapayResponse.data.lga,
        businessActivities: [korapayResponse.data.activity, korapayResponse.data.activity_description].filter(Boolean),
        directors: korapayResponse.data.key_personnel
          .filter(person => person.designation === 'DIRECTOR')
          .map(person => ({
            name: person.name,
            position: person.designation,
            nationality: person.nationality || 'Nigerian'
          })),
        shareholders: korapayResponse.data.key_personnel
          .filter(person => person.designation === 'SHAREHOLDER')
          .map(person => ({
            name: person.name,
            shares: parseInt(person.shares_count || '0'),
            percentage: person.shares_count ? (parseInt(person.shares_count) / parseInt(korapayResponse.data.shares_issued)) * 100 : 0
          })),
        authorizedCapital: parseInt(korapayResponse.data.subscribed_share_capital || '0'),
        issuedCapital: parseInt(korapayResponse.data.shares_issued || '0'),
        paidUpCapital: parseInt(korapayResponse.data.paid_share_capital || '0')
      };

      return NextResponse.json({
        success: true,
        data: cacData,
        provider: 'korapay'
      });

    } catch (apiError: any) {
      console.error('Korapay CAC API error:', apiError);
      
      return NextResponse.json(
        { error: `CAC verification failed: ${apiError.message}` },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('CAC search error:', error);
    return NextResponse.json(
      { error: 'Failed to search CAC database' },
      { status: 500 }
    );
  }
}

