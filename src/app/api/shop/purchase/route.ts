import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseAdmin';
import { ensureProgress, requireWallet, todayYMD_UTC8, assertSameOrigin } from '@/app/api/_utils';
import { logMutation, reportError } from '@/lib/telemetry';

const CATALOG = {
  gtd_whitelist: { price: 2500, name: 'GTD Whitelist', type: 'GTD', maxQuantity: 100 },
  fcfs_whitelist: { price: 1000, name: 'FCFS Whitelist', type: 'FCFS_WL', maxQuantity: 500 },
} as const;

type ItemId = keyof typeof CATALOG;

export async function POST(req: NextRequest) {
  assertSameOrigin(req);
  const wallet = await requireWallet();
  const ymd = todayYMD_UTC8();

  try {
    let body: { itemId?: string };
    try { body = await req.json(); }
    catch { return NextResponse.json({ success: false, message: 'Bad JSON' }, { status: 400 }); }

    const itemId = (body.itemId || '') as ItemId;
    const item = CATALOG[itemId];
    if (!item) return NextResponse.json({ success: false, message: 'Invalid item ID' }, { status: 400 });

    
    const { data: existing } = await supabase
      .from('shop_purchases')
      .select('id')
      .eq('wallet', wallet)
      .eq('item_id', itemId)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ success: false, message: 'You already own this item' }, { status: 409 });
    }

    
    if (item.maxQuantity) {
      const { count } = await supabase
        .from('shop_purchases')
        .select('*', { head: true, count: 'exact' })
        .eq('item_id', itemId);
      if ((count ?? 0) >= item.maxQuantity) {
        return NextResponse.json({ success: false, message: 'This item is sold out' }, { status: 409 });
      }
    }

    
    const prog = await ensureProgress(wallet);
    const currentRzn = prog.rzn ?? 0;
    if (currentRzn < item.price) {
      return NextResponse.json({
        success: false,
        message: `Insufficient RZN. Need ${item.price - currentRzn} more.`,
        newBalance: currentRzn,
      }, { status: 400 });
    }

    
    const { error: insErr } = await supabase
      .from('shop_purchases')
      .insert({
        wallet,
        item_id: itemId,
        item_name: item.name,
        price_paid: item.price,
        purchased_at: new Date().toISOString(),
      } as any);
    if (insErr) {
      return NextResponse.json({ success: false, message: insErr.message }, { status: 409 });
    }

    
    const { data: updProg, error: updErr } = await supabase
      .from('progress')
      .update({ rzn: (currentRzn - item.price), updated_at: new Date().toISOString() } as any)
      .eq('wallet', wallet)
      .eq('ymd', ymd)
      .gte('rzn', item.price)
      .select('rzn')
      .maybeSingle();

    if (updErr || !updProg) {
      await supabase.from('shop_purchases').delete().eq('wallet', wallet).eq('item_id', itemId);
      return NextResponse.json({
        success: false,
        message: updErr?.message || 'Balance changed; purchase cancelled',
      }, { status: 409 });
    }

  
    await supabase
      .from('season_stats')
      .upsert({ wallet, rzn: (prog.rzn ?? 0) - item.price }, { onConflict: 'wallet' });

    await supabase
      .from('season_stats')
      .update({ purchases: (prog.purchases ?? 0) + 1 } as any)
      .eq('wallet', wallet);

    logMutation('shop_purchase', { wallet, itemId, price: item.price, newBalance: updProg.rzn });
    return NextResponse.json({
      success: true,
      message: `Successfully purchased ${item.name}!`,
      newBalance: updProg.rzn,
      item: { id: itemId, name: item.name, type: item.type },
    });
  } catch (e) {
    reportError(e, { route: 'shop_purchase', wallet });
    return NextResponse.json({ success: false, message: 'internal' }, { status: 500 });
  }
}
