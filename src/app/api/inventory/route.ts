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

  const { data, error } = await supabase
    .from('inventory')
    .select('item, qty')
    .eq('wallet', wallet)
    .gt('qty', 0)
    .order('item', { ascending: true });

  
  if (error) return NextResponse.json({ items: [] });

  return NextResponse.json({ items: data ?? [] });
}
