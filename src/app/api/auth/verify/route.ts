export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseAdmin';
import { makeJWT, cookieName } from '@/lib/jwt';
import { recoverAddress, hashMessage, type Address, type Hex } from 'viem';
import { assertSameOrigin } from '@/app/api/_utils';
import { logMutation, reportError } from '@/lib/telemetry';

function to0x(addr: string): Address {
  const a = (addr || '').trim().toLowerCase();
  return (a.startsWith('ronin:') ? ('0x' + a.slice(6)) : a) as Address;
}

export async function POST(req: NextRequest) {
  assertSameOrigin(req);

  try {
    // 1) Inputs
    let body: any = {};
    try { body = await req.json(); } catch {
      return NextResponse.json({ error: 'bad_json' }, { status: 400 });
    }
    const sigIn = String(body.signature || '');
    const signature = sigIn as Hex;
    if (!/^0x[0-9a-fA-F]+$/.test(signature)) {
      return NextResponse.json({ error: 'bad_signature' }, { status: 400 });
    }

    // 2) Nonce from cookie
    const nonce = req.cookies.get('auth_nonce')?.value || '';
    if (!nonce) return NextResponse.json({ error: 'no_nonce' }, { status: 400 });

    const { data: nrec, error: nerr } = await supabase
      .from('auth_nonces')
      .select('nonce, expires_at, used')
      .eq('nonce', nonce)
      .maybeSingle();

    if (nerr)   return NextResponse.json({ error: nerr.message }, { status: 500 });
    if (!nrec)  return NextResponse.json({ error: 'nonce_not_found' }, { status: 400 });
    if (nrec.used) return NextResponse.json({ error: 'nonce_used' }, { status: 400 });
    if (new Date(nrec.expires_at) < new Date()) {
      return NextResponse.json({ error: 'nonce_expired' }, { status: 400 });
    }

    // 3) Verify signature
    const message = `Sign this message to login: ${nonce}`;
    let recovered: Address;
    try {
      recovered = await recoverAddress({ hash: hashMessage(message), signature });
    } catch {
      return NextResponse.json({ error: 'verify_failed' }, { status: 401 });
    }
    const wallet = to0x(recovered);

    // 4) Mark nonce used + upsert player
    const display = `${wallet.slice(0, 6)}…${wallet.slice(-4)}`;
    const nowIso = new Date().toISOString();

    const [{ error: upErr }, { error: useErr }] = await Promise.all([
      supabase.from('players')
        .upsert({ wallet, display, last_seen: nowIso }, { onConflict: 'wallet' }),
      supabase.from('auth_nonces')
        .update({ used: true, used_at: nowIso })
        .eq('nonce', nonce),
    ]);
    if (upErr || useErr) {
      return NextResponse.json({ error: (upErr || useErr)!.message }, { status: 500 });
    }

    // 5) Issue session cookie, log success
    const token = await makeJWT(wallet);
    const res = NextResponse.json({ ok: true, wallet });

    res.cookies.set(cookieName, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 14,
    });
    res.cookies.set('auth_nonce', '', { path: '/', maxAge: 0 });

    logMutation('login_verify', { wallet });
    return res;
  } catch (e) {
    reportError(e, { route: 'login_verify' });
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
