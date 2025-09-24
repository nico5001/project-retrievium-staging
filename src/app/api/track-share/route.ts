import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseAdmin';
import { requireWallet, todayYMD_UTC8, assertSameOrigin } from '@/app/api/_utils';
import { logMutation, reportError } from '@/lib/telemetry';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  assertSameOrigin(req);
  try {
    const wallet = await requireWallet();
    const ymd = todayYMD_UTC8();

    // Get or create today's progress
    const { data: progress } = await supabase
      .from('progress')
      .select('daily_shares')
      .eq('wallet', wallet)
      .eq('ymd', ymd)
      .maybeSingle();

    // Check if already shared today
    if ((progress?.daily_shares ?? 0) >= 1) {
      return NextResponse.json({
        success: false,
        message: 'Already shared today!'
      });
    }

    // Update daily shares count
    const { error } = await supabase
      .from('progress')
      .upsert(
        {
          wallet,
          ymd,
          daily_shares: 1,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'wallet,ymd'
        }
      );

    if (error) {
      throw new Error(error.message);
    }

    logMutation('track_daily_share', { wallet, ymd });

    return NextResponse.json({
      success: true,
      message: 'X share tracked! Daily quest progress updated.'
    });

  } catch (e) {
    reportError(e, { route: 'track_share' });
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
}