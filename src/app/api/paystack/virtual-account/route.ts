import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email, firstName, lastName, phone, reference } = await req.json();
    if (!email || !firstName || !lastName || !phone || !reference) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackKey) {
      return NextResponse.json({ error: 'Paystack secret key not set' }, { status: 500 });
    }
    const res = await fetch('https://api.paystack.co/dedicated_account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${paystackKey}`,
      },
      body: JSON.stringify({
        customer: {
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
        },
        preferred_bank: 'wema-bank', // or let Paystack pick
        reference,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.message || 'Paystack error' }, { status: res.status });
    }
    // Return the virtual account info
    return NextResponse.json({
      accountName: data.data.account_name,
      accountNumber: data.data.account_number,
      bank: data.data.bank,
      provider: data.data.provider,
      raw: data.data,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 