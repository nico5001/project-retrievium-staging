export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data, error } = await supabase.from('players').select('*').limit(1);
  return NextResponse.json({
    ok: !error,
    rows: data?.length ?? 0,
    error: error?.message ?? null,
  });
}
