import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseAdmin';
import { requireWallet, ensureProgress, todayYMD_UTC8, assertSameOrigin } from '@/app/api/_utils';
import { logMutation, reportError } from '@/lib/telemetry';

const COST_RZN = 5;
const GAIN_ENERGY = 10;

export async function POST(req: NextRequest) {
  assertSameOrigin(req);
  try {
    const wallet = await requireWallet();
    const ymd = todayYMD_UTC8();
    const prog = await ensureProgress(wallet);

    const { data: ss, error: sErr } = await supabase
      .from('season_stats')
      .select('rzn')
      .eq('wallet', wallet)
      .maybeSingle();
    if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });

    const bal = Number(ss?.rzn ?? 0);
    if (bal < COST_RZN) return NextResponse.json({ error: 'no-rzn' }, { status: 400 });

    const res = await Promise.all([
      supabase.from('season_stats').update({ rzn: bal - COST_RZN, updated_at: new Date().toISOString() }).eq('wallet', wallet),
      supabase
        .from('progress')
        .update({ energy: (prog.energy ?? 0) + GAIN_ENERGY, updated_at: new Date().toISOString() } as any)
        .eq('wallet', wallet)
        .eq('ymd', ymd),
    ]);
    for (const r of res as any[]) if (r.error) return NextResponse.json({ error: r.error.message }, { status: 500 });

    const newEnergy = (prog.energy ?? 0) + GAIN_ENERGY;
    const newRzn = bal - COST_RZN;

    logMutation('refuel', { wallet, costRzn: COST_RZN, gainEnergy: GAIN_ENERGY, newEnergy, newRzn });
    return NextResponse.json({ ok: true, rzn: newRzn, energy: newEnergy });
  } catch (e) {
    reportError(e, { route: 'refuel' });
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
