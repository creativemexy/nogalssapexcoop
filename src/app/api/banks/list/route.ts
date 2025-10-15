import { NextRequest, NextResponse } from 'next/server';

// Nigerian banks list
const NIGERIAN_BANKS = [
  { id: '1', name: 'Access Bank', code: '044' },
  { id: '2', name: 'Citibank Nigeria', code: '023' },
  { id: '3', name: 'Diamond Bank', code: '063' },
  { id: '4', name: 'Ecobank Nigeria', code: '050' },
  { id: '5', name: 'Fidelity Bank', code: '070' },
  { id: '6', name: 'First Bank of Nigeria', code: '011' },
  { id: '7', name: 'First City Monument Bank', code: '214' },
  { id: '8', name: 'Guaranty Trust Bank', code: '058' },
  { id: '9', name: 'Heritage Bank', code: '030' },
  { id: '10', name: 'Keystone Bank', code: '082' },
  { id: '11', name: 'Kuda Bank', code: '50211' },
  { id: '12', name: 'Opay', code: '100022' },
  { id: '13', name: 'PalmPay', code: '100033' },
  { id: '14', name: 'Polaris Bank', code: '076' },
  { id: '15', name: 'Providus Bank', code: '101' },
  { id: '16', name: 'Stanbic IBTC Bank', code: '221' },
  { id: '17', name: 'Standard Chartered Bank', code: '068' },
  { id: '18', name: 'Sterling Bank', code: '232' },
  { id: '19', name: 'Suntrust Bank', code: '100' },
  { id: '20', name: 'Union Bank of Nigeria', code: '032' },
  { id: '21', name: 'United Bank for Africa', code: '033' },
  { id: '22', name: 'Unity Bank', code: '215' },
  { id: '23', name: 'VFD Microfinance Bank', code: '566' },
  { id: '24', name: 'Wema Bank', code: '035' },
  { id: '25', name: 'Zenith Bank', code: '057' },
  { id: '26', name: 'Jaiz Bank', code: '301' },
  { id: '27', name: 'Lagos Building Investment Company', code: '90052' },
  { id: '28', name: 'Parallex Bank', code: '104' },
  { id: '29', name: 'Premium Trust Bank', code: '105' },
  { id: '30', name: 'Taj Bank', code: '302' },
  { id: '31', name: 'Tangerine Money', code: '51269' },
  { id: '32', name: 'VFD Bank', code: '566' },
  { id: '33', name: 'Visa', code: '100001' },
  { id: '34', name: 'Vult', code: '100034' },
  { id: '35', name: 'Yobe Microfinance Bank', code: '057' },
  { id: '36', name: 'Zenith Bank', code: '057' },
  { id: '37', name: '9 Payment Service Bank', code: '100039' },
  { id: '38', name: 'Aella Credit', code: '100040' },
  { id: '39', name: 'Aella Credit', code: '100040' },
  { id: '40', name: 'Aella Credit', code: '100040' },
  { id: '41', name: 'Aella Credit', code: '100040' },
  { id: '42', name: 'Aella Credit', code: '100040' },
  { id: '43', name: 'Aella Credit', code: '100040' },
  { id: '44', name: 'Aella Credit', code: '100040' },
  { id: '45', name: 'Aella Credit', code: '100040' },
  { id: '46', name: 'Aella Credit', code: '100040' },
  { id: '47', name: 'Aella Credit', code: '100040' },
  { id: '48', name: 'Aella Credit', code: '100040' },
  { id: '49', name: 'Aella Credit', code: '100040' },
  { id: '50', name: 'Aella Credit', code: '100040' },
];

export async function GET(request: NextRequest) {
  try {
    // Sort banks alphabetically by name
    const sortedBanks = NIGERIAN_BANKS.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      success: true,
      banks: sortedBanks,
      total: sortedBanks.length
    });
  } catch (error) {
    console.error('Error fetching banks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch banks' },
      { status: 500 }
    );
  }
}