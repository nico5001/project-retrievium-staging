import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseAdmin';

export async function GET() {
  const { data, error } = await supabase
    .from('season_stats')
    .select('wallet, rzn, scans, stabilizes, crafts')
    .order('rzn', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const response = NextResponse.json({ rows: data ?? [] });
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  return response;
}
