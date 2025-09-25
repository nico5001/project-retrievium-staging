import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseAdmin';
import { ensureProgress, requireWallet, todayYMD_UTC8, assertSameOrigin } from '@/app/api/_utils';
import { logMutation, reportError } from '@/lib/telemetry';
import { awardReferralBonus } from '../../_utils/referral-bonus';

const BASE = 3;

// Equip multipliers
const CORE_BONUS: Record<string, number> = {
  none: 0,
  core_common: 0.02,
  core_uncommon: 0.05,
  core_rare: 0.08,
};

export async function POST(req: NextRequest) {
  assertSameOrigin(req);

  try {
    const wallet = await requireWallet();
    const { runId, score } = await req.json();
    const ymd = todayYMD_UTC8();

    // Validate run
    const { data: run, error: runErr } = await supabase
      .from('scan_runs')
      .select('*')
      .eq('id', runId)
      .maybeSingle();

    if (runErr) return NextResponse.json({ error: runErr.message }, { status: 500 });
    if (!run || run.wallet !== wallet || run.status !== 'pending') {
      return NextResponse.json({ error: 'bad-run' }, { status: 400 });
    }

    // Compute base reward from score
    const prog = await ensureProgress(wallet);
    let bonus = 0;
    if (score >= 0.9) bonus = 2;
    else if (score >= 0.75) bonus = 1;
    const baseAdd = BASE + bonus;

    
    let equipped: string = 'none';
    const { data: eq } = await supabase
      .from('equipment')
      .select('core')
      .eq('wallet', wallet)
      .maybeSingle();
    if (eq?.core && eq.core !== 'none') {
      const { data: inv } = await supabase
        .from('inventory')
        .select('qty')
        .eq('wallet', wallet)
        .eq('item', eq.core)
        .maybeSingle();
      if (inv && Number(inv.qty) > 0) equipped = eq.core;
    }
    const mult = CORE_BONUS[equipped] ?? 0;

    // Apply multiplier and round down to keep integers
    const add = Math.floor(baseAdd * (1 + mult));

    const updates: Promise<void>[] = [];

    // 1) mark run completed
    updates.push(
      (async () => {
        const { error } = await supabase
          .from('scan_runs')
          .update({ status: 'completed', score })
          .eq('id', runId);
        if (error) throw new Error(error.message);
      })()
    );

    // 2) add RZN to progress and set scan_ready
    updates.push(
      (async () => {
        const { error } = await supabase
          .from('progress')
          .update({
            rzn: (prog.rzn ?? 0) + add,
            scan_ready: true,
            updated_at: new Date().toISOString(),
          } as any)
          .eq('wallet', wallet)
          .eq('ymd', ymd);
        if (error) throw new Error(error.message);
      })()
    );

    // 3) season_stats
    const { data: ss, error: ssErr } = await supabase
      .from('season_stats')
      .select('scans, rzn')
      .eq('wallet', wallet)
      .maybeSingle();
    if (ssErr) return NextResponse.json({ error: ssErr.message }, { status: 500 });

    updates.push(
      (async () => {
        const { error } = await supabase
          .from('season_stats')
          .upsert(
            {
              wallet,
              scans: (ss?.scans ?? 0) + 1,
              rzn: (ss?.rzn ?? 0) + add,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'wallet' }
          );
        if (error) throw new Error(error.message);
      })()
    );

    await Promise.all(updates);

    // Award referral bonus if user has a referrer
    try {
      await awardReferralBonus(wallet, add, 'scan');
    } catch (bonusError) {
      console.error('Referral bonus failed but scan succeeded:', bonusError);
    }

    logMutation('scan_complete', { wallet, runId, score, equipped, rznAdded: add });
    return NextResponse.json({ ok: true, rznAdded: add });
  } catch (e) {
    let runId: string | undefined;
    try { ({ runId } = await req.clone().json()); } catch {}
    reportError(e, { route: 'scan_complete', runId });
    return NextResponse.json({ error: 'update-failed' }, { status: 500 });
  }
}
