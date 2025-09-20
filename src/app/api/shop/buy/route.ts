import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseAdmin';
import { ensureProgress, requireWallet, todayYMD_UTC8, assertSameOrigin } from '@/app/api/_utils';
import { logMutation, reportError } from '@/lib/telemetry';

// Discord webhook function for whitelist purchase announcements
async function sendWhitelistAnnouncement(wallet: string, item: typeof CATALOG[ItemId], itemId: ItemId) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  // Get Discord username if linked
  const { data: discordLink } = await supabase
    .from('discord_links')
    .select('discord_username')
    .eq('wallet', wallet)
    .maybeSingle();

  const username = discordLink?.discord_username || `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;

  // Get remaining quantity
  const { count: remainingCount } = await supabase
    .from('shop_purchases')
    .select('*', { head: true, count: 'exact' })
    .eq('item_id', itemId);

  const remaining = (item.maxQuantity || 0) - (remainingCount || 0);

  const embed = {
    title: `🎫 ${item.name} Purchased!`,
    description: `**${username}** just secured a spot on the ${item.name}! 🚀`,
    color: item.type === 'GTD' ? 0xFFD700 : 0x00D4AA,
    fields: [
      { name: '💰 Price Paid', value: `${item.price.toLocaleString()} RZN`, inline: true },
      { name: '📊 Remaining', value: `${remaining}/${item.maxQuantity}`, inline: true },
      { name: '🎯 Type', value: item.type === 'GTD' ? 'Guaranteed' : 'First Come First Serve', inline: true }
    ],
    timestamp: new Date().toISOString(),
    footer: { text: 'Retrievium Neural Laboratory • Secure your spot now!' }
  };

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [embed]
    })
  });
}

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
    let body: { id?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, message: 'Bad JSON' }, { status: 400 });
    }

    const itemId = (body.id || '') as ItemId;
    const item = CATALOG[itemId];
    if (!item) {
      return NextResponse.json({ success: false, message: 'Invalid item ID' }, { status: 400 });
    }

    // Allow multiple purchases of whitelist items - no duplicate check needed

    // Check availability
    if (item.maxQuantity) {
      const { count } = await supabase
        .from('shop_purchases')
        .select('*', { head: true, count: 'exact' })
        .eq('item_id', itemId);

      if ((count ?? 0) >= item.maxQuantity) {
        return NextResponse.json({ success: false, message: 'This item is sold out' }, { status: 409 });
      }
    }

    // Check balance
    const prog = await ensureProgress(wallet);
    const currentRzn = prog.rzn ?? 0;

    if (currentRzn < item.price) {
      return NextResponse.json({
        success: false,
        message: `Insufficient RZN. Need ${item.price - currentRzn} more.`,
        newBalance: currentRzn,
      }, { status: 400 });
    }

    // Create purchase record
    const { error: insErr } = await supabase
      .from('shop_purchases')
      .insert({
        wallet,
        item_id: itemId,
        item_name: item.name,
        price_paid: item.price,
        purchased_at: new Date().toISOString(),
      });

    if (insErr) {
      return NextResponse.json({ success: false, message: insErr.message }, { status: 409 });
    }

    // Update progress table (daily RZN)
    const { data: updProg, error: updErr } = await supabase
      .from('progress')
      .update({
        rzn: currentRzn - item.price,
        updated_at: new Date().toISOString()
      })
      .eq('wallet', wallet)
      .eq('ymd', ymd)
      .gte('rzn', item.price)
      .select('rzn')
      .maybeSingle();

    if (updErr || !updProg) {
      // Rollback purchase
      await supabase.from('shop_purchases').delete().eq('wallet', wallet).eq('item_id', itemId);
      return NextResponse.json({
        success: false,
        message: updErr?.message || 'Balance changed; purchase cancelled',
      }, { status: 409 });
    }

    // Update season stats (total RZN)
    await supabase
      .from('season_stats')
      .update({ rzn: currentRzn - item.price })
      .eq('wallet', wallet);

    // Send Discord webhook for whitelist purchases
    try {
      await sendWhitelistAnnouncement(wallet, item, itemId);
    } catch (webhookError) {
      console.error('Webhook failed but purchase succeeded:', webhookError);
    }

    logMutation('shop_purchase', { wallet, itemId, price: item.price, newBalance: updProg.rzn });

    return NextResponse.json({
      success: true,
      message: `Successfully purchased ${item.name}!`,
      newBalance: updProg.rzn,
      item: { id: itemId, name: item.name, type: item.type },
    });

  } catch (e) {
    reportError(e, { route: 'shop_buy', wallet });
    return NextResponse.json({ success: false, message: 'internal' }, { status: 500 });
  }
}