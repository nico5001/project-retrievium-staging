export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { cookieName } from '@/lib/jwt';
import { assertSameOrigin } from '@/app/api/_utils';

export async function POST(req: NextRequest) {
  
  assertSameOrigin(req);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookieName, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return res;
}
