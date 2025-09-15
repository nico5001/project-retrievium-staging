export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseAdmin';
import { ensureProgress, requireWallet, todayYMD_UTC8, assertSameOrigin } from '@/app/api/_utils';
import { logMutation, reportError } from '@/lib/telemetry';

const SCAN_COST = 8;

export async function POST(req: NextRequest) {
  assertSameOrigin(req);
  try {
    const wallet = await requireWallet();
    const ymd = todayYMD_UTC8();

    
    const { data: last } = await supabase
      .from('scan_runs')
      .select('created_at')
      .eq('wallet', wallet)
      .order('created_at', { ascending: false })
      .limit(1);

    if (last?.[0] && Date.now() - new Date(last[0].created_at as any).getTime() < 3000) {
      return NextResponse.json({ error: 'too-fast' }, { status: 429 });
    }

    
    const { data: pending, error: pendErr } = await supabase
      .from('scan_runs')
      .select('id')
      .eq('wallet', wallet)
      .eq('ymd', ymd)
      .eq('status', 'pending');

    if (pendErr) return NextResponse.json({ error: pendErr.message }, { status: 500 });
    if (pending && pending.length > 0) {
      return NextResponse.json({ error: 'pending-scan' }, { status: 400 });
    }

    
    const prog = await ensureProgress(wallet);
    if ((prog.energy ?? 0) < SCAN_COST) {
      return NextResponse.json({ error: 'no-energy' }, { status: 400 });
    }

    
    const runId = crypto.randomUUID();
    const seed = `${ymd}:${wallet}:${runId}`;

    const { error: insErr } = await supabase
      .from('scan_runs')
      .insert({ id: runId, wallet, ymd, seed, status: 'pending' });

    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  
    const { error: updErr } = await supabase
      .from('progress')
      .update({
        energy: (prog.energy ?? 0) - SCAN_COST,
        scans_done: (prog.scans_done ?? 0) + 1,
        scan_ready: false,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('wallet', wallet)
      .eq('ymd', ymd);

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    logMutation('scan_start', { wallet, runId, ymd });
    return NextResponse.json({ runId, seed });
  } catch (e) {
    reportError(e, { route: 'scan_start' });
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
