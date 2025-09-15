import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseAdmin';              
import { ensureProgress, requireWallet, todayYMD_UTC8 } from '@/app/api/_utils';


const SHOP_ITEMS = [
  {
    id: 'gtd_whitelist',
    name: 'GTD Whitelist',
    description:
      'Guaranteed allocation spot for the main launch. Premium access with confirmed participation rights.',
    price: 2500,
    type: 'GTD',
    maxQuantity: 100,             
    available: true,
  },
  {
    id: 'fcfs_whitelist',
    name: 'FCFS Whitelist',
    description:
      'First Come First Serve whitelist spot. Early access opportunity with limited availability.',
    price: 1000,
    type: 'FCFS_WL',
    maxQuantity: 500,              
    available: true,
  },
] as const;

type CatalogItem = (typeof SHOP_ITEMS)[number];

function itemById(id: string): CatalogItem | undefined {
  return SHOP_ITEMS.find(i => i.id === id);
}

export async function GET() {
  
  let wallet: string | null = null;
  try {
    wallet = await requireWallet();
  } catch {
    wallet = null;
  }

  
  async function soldCount(itemId: string) {
    const { count } = await supabase
      .from('shop_purchases')
      .select('*', { head: true, count: 'exact' })
      .eq('item_id', itemId);
    return count ?? 0;
  }

  const soldMap: Record<string, number> = {};
  await Promise.all(
    SHOP_ITEMS.map(async (it) => {
      soldMap[it.id] = await soldCount(it.id);
    })
  );

  
  let purchasedIds = new Set<string>();
  if (wallet) {
    const { data } = await supabase
      .from('shop_purchases')
      .select('item_id')
      .eq('wallet', wallet);
    if (data) purchasedIds = new Set(data.map(r => r.item_id));
  }

  
  let userBalance: number | null = null;
  if (wallet) {
    const prog = await ensureProgress(wallet);
    userBalance = prog.rzn ?? 0;
  }

  const items = SHOP_ITEMS.map((it) => {
    const sold = soldMap[it.id] || 0;
    const stillAvailable =
      it.available && (it.maxQuantity ? sold < it.maxQuantity : true);
    return {
      ...it,
      soldCount: sold,
      available: stillAvailable,
      purchased: wallet ? purchasedIds.has(it.id) : false,
    };
  });

  return NextResponse.json({
    items,
    userBalance,
    wallet,
  });
}
