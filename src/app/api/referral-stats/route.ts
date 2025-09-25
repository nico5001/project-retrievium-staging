import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseAdmin';
import { requireWallet } from '@/app/api/_utils';
import { reportError } from '@/lib/telemetry';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const wallet = await requireWallet();

    // Get total referrals count from players table (where referred_by = wallet)
    // Use ilike for case-insensitive comparison
    const { data: totalReferrals, error: totalError } = await supabase
      .from('players')
      .select('wallet', { count: 'exact' })
      .ilike('referred_by', wallet);

    if (totalError) {
      reportError(totalError, { route: 'referral_stats_total' });
    }

    // Get active referrals this week (users who have been active in last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    let activeThisWeek = 0;

    if (totalReferrals && totalReferrals.length > 0) {
      const refereeWallets = totalReferrals.map(r => r.wallet);
      const { data: activeUsers, error: activeUsersError } = await supabase
        .from('user_stats')
        .select('wallet_address')
        .in('wallet_address', refereeWallets)
        .gte('last_login', weekAgo);

      if (!activeUsersError) {
        activeThisWeek = activeUsers?.length || 0;
      }
    }

    // Get total RZN earned from referrals
    const { data: totalEarnings, error: earningsError } = await supabase
      .from('referral_earnings')
      .select('amount')
      .ilike('referrer_wallet', wallet);

    if (earningsError) {
      reportError(earningsError, { route: 'referral_stats_earnings' });
    }

    const totalRznEarned = totalEarnings?.reduce((sum, earning) => sum + earning.amount, 0) || 0;

    // Get today's 5% share (earnings from today)
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const { data: todayEarnings, error: todayError } = await supabase
      .from('referral_earnings')
      .select('amount')
      .ilike('referrer_wallet', wallet)
      .gte('created_at', today);

    const todayRznEarned = todayEarnings?.reduce((sum, earning) => sum + earning.amount, 0) || 0;

    // Get recent earnings for display (last 10)
    const { data: recentEarnings, error: recentError } = await supabase
      .from('referral_earnings')
      .select('amount, source, referee_wallet, created_at')
      .ilike('referrer_wallet', wallet)
      .order('created_at', { ascending: false })
      .limit(10);

    const recentEarningsFormatted = recentEarnings?.map(earning => ({
      wallet: earning.referee_wallet,
      amount: earning.amount,
      source: earning.source,
      timestamp: new Date(earning.created_at),
      type: 'revenue_share' as const
    })) || [];

    return NextResponse.json({
      totalReferrals: totalReferrals?.length || 0,
      activeThisWeek,
      totalRznEarned,
      todayRznEarned,
      recentEarnings: recentEarningsFormatted
    });

  } catch (error) {
    reportError(error, { route: 'referral_stats' });
    return NextResponse.json({
      error: 'Failed to fetch referral statistics',
      totalReferrals: 0,
      activeThisWeek: 0,
      totalRznEarned: 0,
      todayRznEarned: 0,
      recentEarnings: []
    }, { status: 500 });
  }
}