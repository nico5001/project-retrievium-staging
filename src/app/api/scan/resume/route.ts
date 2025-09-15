
import { NextResponse } from 'next/server';
import { requireWallet, todayYMD_UTC8 } from '@/app/api/_utils';
import { supabase } from '@/lib/supabaseAdmin';

export async function GET() {
  const wallet = await requireWallet();           
  const ymd = todayYMD_UTC8();

  const { data, error } = await supabase
    .from('scan_runs')
    .select('id, seed, status, created_at')
    .eq('wallet', wallet)
    .eq('ymd', ymd)
    .eq('status', 'pending')                      
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data?.[0]) return NextResponse.json({ error: 'no-pending' }, { status: 404 });

  return NextResponse.json({ runId: data[0].id, seed: data[0].seed });
}
