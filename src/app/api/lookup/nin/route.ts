import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { nin } = await req.json();
    if (!nin) {
      return NextResponse.json({ error: 'NIN is required' }, { status: 400 });
    }
    const monoKey = process.env.MONO_NIN;
    if (!monoKey) {
      return NextResponse.json({ error: 'Mono secret key not set' }, { status: 500 });
    }
    const res = await fetch('https://api.withmono.com/v3/lookup/nin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'mono-sec-key': monoKey,
      },
      body: JSON.stringify({ nin }),
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.message || 'NIN lookup failed' }, { status: res.status });
    }
    // Assume Mono returns { name, date_of_birth, ... }
    return NextResponse.json({
      name: data.name,
      dateOfBirth: data.date_of_birth,
      raw: data,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 