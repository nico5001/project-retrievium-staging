export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseAdmin';
import { assertSameOrigin, requireWallet } from '@/app/api/_utils';
import { logMutation, reportError } from '@/lib/telemetry';


export async function GET() {
  try {
    const wallet = await requireWallet();
    const { data, error } = await supabase
      .from('equipment')
      .select('core')
      .eq('wallet', wallet)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ core: data?.core ?? 'none' });
  } catch (e) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
}


export async function POST(req: NextRequest) {
  assertSameOrigin(req);
  try {
    const wallet = await requireWallet();
    const { coreId } = await req.json();

    const { data, error } = await supabase.rpc('equip_core', {
      p_wallet: wallet,
      p_core: String(coreId || 'none'),
    });
    if (error) {
      const msg = String(error.message || '').toLowerCase();
      if (msg.includes('invalid_core')) return NextResponse.json({ error: 'invalid_core' }, { status: 400 });
      if (msg.includes('missing_item')) return NextResponse.json({ error: 'missing_item' }, { status: 400 });
      return NextResponse.json({ error: 'equip_failed' }, { status: 500 });
    }

    const row = Array.isArray(data) ? data[0] : data;
    logMutation('equip_core', { wallet, core: row?.core ?? 'none' });
    return NextResponse.json({ ok: true, core: row?.core ?? 'none' });
  } catch (e) {
    reportError(e, { route: 'equip_core' });
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
