import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseAdmin';
import { requireWallet } from '@/app/api/_utils';

export async function GET(req: NextRequest) {
  let wallet: string;
  try {
    
    wallet = await (requireWallet as any)(req);
  } catch {
    
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  // Get regular inventory items
  const { data: inventoryData, error } = await supabase
    .from('inventory')
    .select('item, qty')
    .eq('wallet', wallet)
    .gt('qty', 0)
    .order('item', { ascending: true });

  // Get purchased whitelist items and count them
  const { data: purchaseData } = await supabase
    .from('shop_purchases')
    .select('item_name, item_id')
    .eq('wallet', wallet);

  const items = [...(inventoryData ?? [])];

  // Add whitelist purchases to inventory (count duplicates)
  if (purchaseData) {
    const purchaseCounts: Record<string, number> = {};

    purchaseData.forEach(purchase => {
      purchaseCounts[purchase.item_name] = (purchaseCounts[purchase.item_name] || 0) + 1;
    });

    Object.entries(purchaseCounts).forEach(([itemName, count]) => {
      items.push({
        item: itemName,
        qty: count,
      });
    });
  }

  // Sort by item name
  items.sort((a, b) => a.item.localeCompare(b.item));

  if (error) return NextResponse.json({ items: [] });

  return NextResponse.json({ items });
}
