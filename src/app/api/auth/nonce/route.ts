export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseAdmin';
import { assertSameOrigin } from '@/app/api/_utils';

function makeNonce() {
  return 'retrievium-' + Math.random().toString(36).slice(2, 10);
}

async function issueNonce() {
  const nonce = makeNonce();
  const expiresAt = new Date(Date.now() + 10 * 60_000); // 10 minutes

  const { error } = await supabase
    .from('auth_nonces')
    .insert({ nonce, expires_at: expiresAt.toISOString() });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const res = NextResponse.json({ message: `Sign this message to login: ${nonce}` });
  res.cookies.set('auth_nonce', nonce, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 10,
  });
  return res;
}

export async function POST(req: NextRequest) {
  
  assertSameOrigin(req);
  try {
    return await issueNonce();
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'nonce-failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  
  assertSameOrigin(req);
  try {
    return await issueNonce();
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'nonce-failed' }, { status: 500 });
  }
}
