import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseAdmin';
import { ensureProgress, requireWallet, todayYMD_UTC8, assertSameOrigin } from '@/app/api/_utils';
import { logMutation, reportError } from '@/lib/telemetry';


const COST = 12;

type ItemQty = { key: string; qty: number };
type DropResult = { rzn: number; items: ItemQty[]; seed: string };


const CORE_BONUS: Record<string, number> = {
  none: 0,
  core_common: 0.02,
  core_uncommon: 0.05,
  core_rare: 0.08,
};


import { createHash } from 'crypto';
function makeRng(seedStr: string) {
  const h = createHash('sha256').update(seedStr).digest();
  let s = (h.readUInt32BE(0) ^ h.readUInt32BE(4) ^ h.readUInt32BE(8) ^ h.readUInt32BE(12)) >>> 0 || 0x9e3779b9;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 0xffffffff; };
}
const DROP_TABLES = {
  SAFE: [
    { key: 'shard_rare',     w: 0.02, qty: [1, 1] },
    { key: 'shard_uncommon', w: 0.18, qty: [1, 1] },
    { key: 'shard_common',   w: 0.80, qty: [1, 2] },
  ],
  STANDARD: [
    { key: 'shard_rare',     w: 0.05, qty: [1, 1] },
    { key: 'shard_uncommon', w: 0.35, qty: [1, 2] },
    { key: 'shard_common',   w: 0.60, qty: [1, 3] },
  ],
  OVERCLOCK: [
    { key: 'shard_rare',     w: 0.10, qty: [1, 1] },
    { key: 'shard_uncommon', w: 0.50, qty: [1, 2] },
    { key: 'shard_common',   w: 0.40, qty: [2, 4] },
  ],
} as const;

function rollsFor(risk: 'SAFE'|'STANDARD'|'OVERCLOCK', rand: () => number) {
  if (risk === 'OVERCLOCK') return 2;
  if (risk === 'STANDARD') return rand() < 0.35 ? 2 : 1;
  return 1;
}

function resolveStabilizeDrops(
  risk: 'SAFE' | 'STANDARD' | 'OVERCLOCK',
  wallet: string,
  nth: number
): DropResult {
  const rznBase = risk === 'OVERCLOCK' ? 12 : risk === 'STANDARD' ? 8 : 6;
  const seed = `${wallet}:${risk}:${nth}`;
  const rand = makeRng(seed);

  const table = DROP_TABLES[risk];
  const rolls = rollsFor(risk, rand);

  const items: ItemQty[] = [];
  for (let i = 0; i < rolls; i++) {
    const r = rand();
    let acc = 0, pick = table[table.length - 1];
    for (const row of table) { acc += row.w; if (r <= acc) { pick = row; break; } }
    const [min, max] = pick.qty;
    const qty = min + Math.floor(rand() * (max - min + 1));
    const idx = items.findIndex(it => it.key === pick.key);
    if (idx >= 0) items[idx].qty += qty; else items.push({ key: pick.key as any, qty });
  }

  return { rzn: rznBase, items, seed };
}

export async function POST(req: NextRequest) {
  assertSameOrigin(req);
  try {
    const wallet = await requireWallet();
    const { risk = 'STANDARD' } = (await req.json().catch(() => ({}))) as { risk?: 'SAFE' | 'STANDARD' | 'OVERCLOCK' };
    const ymd = todayYMD_UTC8();

    const prog = await ensureProgress(wallet);

    if (!prog.scan_ready) return NextResponse.json({ error: 'need-scan' }, { status: 400 });
    if ((prog.energy ?? 0) < COST) return NextResponse.json({ error: 'no-energy' }, { status: 400 });

    const nth = (prog.stabilize_count ?? 0) + 1;
    const drops = resolveStabilizeDrops(risk, wallet, nth);

    
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

    
    const rznAwarded = Math.floor(drops.rzn * (1 + mult));
    const items = drops.items;

    const updates: Promise<void>[] = [];

    
    updates.push(
      (async () => {
        const { error } = await supabase
          .from('progress')
          .update(
            {
              energy: (prog.energy ?? 0) - COST,
              stabilize_count: nth,
              scan_ready: false,
              updated_at: new Date().toISOString(),
            } as any
          )
          .eq('wallet', wallet)
          .eq('ymd', ymd);
        if (error) throw new Error(error.message);
      })()
    );

    
    updates.push(
      (async () => {
        const { data: ss, error: selErr } = await supabase
          .from('season_stats')
          .select('rzn, stabilizes')
          .eq('wallet', wallet)
          .maybeSingle();
        if (selErr) throw new Error(selErr.message);

        const nextRzn = (Number(ss?.rzn) || 0) + rznAwarded;
        const nextStab = (Number(ss?.stabilizes) || 0) + 1;

        const { error: statErr } = await supabase
          .from('season_stats')
          .upsert(
            {
              wallet,
              rzn: nextRzn,
              stabilizes: nextStab,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'wallet' }
          );
        if (statErr) throw new Error(statErr.message);
      })()
    );

    
    for (const it of items) {
      updates.push(
        (async () => {
          const { error: invErr } = await supabase.rpc('inc_inventory', {
            p_wallet: wallet,
            p_item: it.key,
            p_qty: it.qty,
          });
          if (invErr) throw new Error(invErr.message);
        })()
      );
    }

    await Promise.all(updates);

    logMutation('stabilize', { wallet, risk, nth, equipped, rznAwarded });
    return NextResponse.json({ ok: true, rzn: rznAwarded, items, seed: drops.seed });
  } catch (e) {
    reportError(e, { route: 'stabilize' });
    return NextResponse.json({ error: 'stabilize-failed' }, { status: 500 });
  }
}
