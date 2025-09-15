import { NextResponse } from 'next/server';
import { requireWallet, todayYMD_UTC8 } from '../_utils'; // adjust path if needed
import { supabase } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

type Recipe = {
  requires: Record<string, number>;
  grants: string;
  rzn: number; // bonus RZN
};

const RECIPES: Record<string, Recipe> = {
  REC_EAR_SIGIL_C: { requires: { RUNE_A: 2, RUNE_B: 1, CAT_X: 1 }, grants: 'EMB_EAR_SIGIL_C', rzn: 10 },
  REC_EAR_SIGIL_R: { requires: { RUNE_C: 2, RUNE_D: 1, CAT_Y: 1 }, grants: 'EMB_EAR_SIGIL_R', rzn: 12 },
  REC_IRIS_LENS_E: { requires: { RUNE_D: 2, RUNE_E: 1, CAT_Z: 1 }, grants: 'EMB_IRIS_LENS_E', rzn: 14 },
};

export async function POST(req: Request) {
  const wallet = await requireWallet();
  const body = await req.json().catch(() => ({}));
  const key = String(body?.key || '');
  const recipe = RECIPES[key as keyof typeof RECIPES];
  if (!recipe) return NextResponse.json({ error: 'bad-recipe' }, { status: 400 });

  const ymd = todayYMD_UTC8();

  // 1) Read inventory rows for the required inputs
  const reqKeys = Object.keys(recipe.requires);
  const { data: invRows, error: invErr } = await supabase
    .from('inventory')
    .select('item, qty')
    .eq('wallet', wallet)
    .in('item', reqKeys);

  if (invErr) return NextResponse.json({ error: invErr.message }, { status: 500 });

  const invMap = new Map<string, number>((invRows || []).map((r: any) => [r.item, r.qty]));
  for (const [it, need] of Object.entries(recipe.requires)) {
    if ((invMap.get(it) ?? 0) < need) {
      return NextResponse.json({ error: 'Missing Materials' }, { status: 400 });
    }
  }

  
  const { data: progRow, error: progErr } = await supabase
    .from('progress')
    .select('rzn')
    .eq('wallet', wallet)
    .eq('ymd', ymd)
    .maybeSingle();

  if (progErr) return NextResponse.json({ error: progErr.message }, { status: 500 });
  const currRzn = Number(progRow?.rzn ?? 0);

  const { data: statsRow, error: statsErr } = await supabase
    .from('season_stats')
    .select('crafts')
    .eq('wallet', wallet)
    .maybeSingle();

  if (statsErr) return NextResponse.json({ error: statsErr.message }, { status: 500 });
  const nextCrafts = Number(statsRow?.crafts ?? 0) + 1;

  
  const updates: Promise<void>[] = [];

  // Deduct inputs
  for (const [it, need] of Object.entries(recipe.requires)) {
    updates.push(
      (async () => {
        const { error } = await supabase.rpc('inc_inventory', {
          p_wallet: wallet,
          p_item: it,
          p_qty: -need,
        });
        if (error) throw new Error(error.message);
      })()
    );
  }

  // Grant output
  updates.push(
    (async () => {
      const { error } = await supabase.rpc('inc_inventory', {
        p_wallet: wallet,
        p_item: recipe.grants,
        p_qty: 1,
      });
      if (error) throw new Error(error.message);
    })()
  );

  // Increment RZN
  updates.push(
    (async () => {
      const { error } = await supabase
        .from('progress')
        .update({ rzn: currRzn + recipe.rzn, updated_at: new Date().toISOString() })
        .eq('wallet', wallet)
        .eq('ymd', ymd);
      if (error) throw new Error(error.message);
    })()
  );

  // Increment crafts (season total)
  updates.push(
    (async () => {
      const { error } = await supabase
        .from('season_stats')
        .upsert({ wallet, crafts: nextCrafts, updated_at: new Date().toISOString() }, { onConflict: 'wallet' });
      if (error) throw new Error(error.message);
    })()
  );

  try {
    await Promise.all(updates);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'craft-failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, rzn: recipe.rzn });
}
