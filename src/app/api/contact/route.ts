
import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { name, email, message, turnstileToken } = data;

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (!turnstileToken) {
      return NextResponse.json({ error: 'Verification required' }, { status: 400 });
    }

    if (!process.env.TURNSTILE_SECRET_KEY) {
      console.error('Missing TURNSTILE_SECRET_KEY');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: turnstileToken,
      }),
    });

    const verifyData = await verifyRes.json();
    if (!verifyData?.success) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
    }

    const { error: insertError } = await supabaseAdmin
      .from('contact_messages')
      .insert([
        {
          name,
          email,
          message,
        },
      ]);

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to store message' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Message received' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to submit message' }, { status: 500 });
  }
}
