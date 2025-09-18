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
      .select('core, amplifier, catalyst, sigil, lens')
      .eq('wallet', wallet)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      core: data?.core ?? 'none',
      amplifier: data?.amplifier ?? 'none',
      catalyst: data?.catalyst ?? 'none',
      sigil: data?.sigil ?? 'none',
      lens: data?.lens ?? 'none',
    });
  } catch (e) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
}


export async function POST(req: NextRequest) {
  assertSameOrigin(req);
  try {
    const wallet = await requireWallet();
    const { slot, itemId } = await req.json();

    // Validate slot
    const validSlots = ['core', 'amplifier', 'catalyst', 'sigil', 'lens'];
    if (!validSlots.includes(slot)) {
      return NextResponse.json({ error: 'invalid_slot' }, { status: 400 });
    }

    // Validate item exists in inventory if not 'none'
    if (itemId !== 'none') {
      const { data: invData, error: invError } = await supabase
        .from('inventory')
        .select('qty')
        .eq('wallet', wallet)
        .eq('item', itemId)
        .maybeSingle();

      if (invError || !invData || invData.qty <= 0) {
        return NextResponse.json({ error: 'missing_item' }, { status: 400 });
      }
    }

    // Update equipment
    const updateData = { [slot]: itemId };
    const { data, error } = await supabase
      .from('equipment')
      .upsert({ wallet, ...updateData, updated_at: new Date().toISOString() }, { onConflict: 'wallet' })
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'equip_failed' }, { status: 500 });

    // Return full equipment state
    const equipment = {
      core: data?.core ?? 'none',
      amplifier: data?.amplifier ?? 'none',
      catalyst: data?.catalyst ?? 'none',
      sigil: data?.sigil ?? 'none',
      lens: data?.lens ?? 'none',
    };

    logMutation('equip_item', { wallet, slot, item: itemId });
    return NextResponse.json({ ok: true, equipment });
  } catch (e) {
    reportError(e, { route: 'equip_item' });
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
