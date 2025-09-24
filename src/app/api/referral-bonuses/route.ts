import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseAdmin';
import { requireWallet, assertSameOrigin } from '@/app/api/_utils';
import { logMutation, reportError } from '@/lib/telemetry';
import { ProgressiveReferralService, PROGRESSIVE_REFERRAL_BONUSES } from '@/lib/progressiveReferrals';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const wallet = await requireWallet();

    // Get user's referral status
    const { data: referralData } = await supabase
      .from('players')
      .select('wallet, referred_by, created_at')
      .eq('wallet', wallet)
      .single();

    if (!referralData?.referred_by) {
      return NextResponse.json({
        isReferred: false,
        bonuses: [],
        message: 'User was not referred by anyone'
      });
    }

    // Get user's current stats
    const { data: statsData } = await supabase
      .from('user_stats')
      .select('total_scans, total_crafts, total_stabilizes, total_rzn_earned, last_login')
      .eq('wallet_address', wallet)
      .single();

    // Get unlocked bonuses
    const { data: unlockedBonuses } = await supabase
      .from('referral_bonuses')
      .select('bonus_id, unlocked_at')
      .eq('wallet_address', wallet);

    const currentBonuses = unlockedBonuses?.map(b => b.bonus_id) || [];

    // Check for newly unlocked bonuses
    const userStats = {
      totalScans: statsData?.total_scans || 0,
      totalCrafts: statsData?.total_crafts || 0,
      totalStabilizes: statsData?.total_stabilizes || 0,
      totalRznEarned: statsData?.total_rzn_earned || 0,
      joinedAt: new Date(referralData.created_at),
      lastLogin: new Date(statsData?.last_login || referralData.created_at)
    };

    const newlyUnlocked = await ProgressiveReferralService.checkProgressiveBonuses(
      wallet,
      userStats,
      currentBonuses
    );

    // Get bonus details with unlock status
    const bonusDetails = Object.values(PROGRESSIVE_REFERRAL_BONUSES).map(bonus => ({
      ...bonus,
      unlocked: currentBonuses.includes(bonus.id),
      newlyUnlocked: newlyUnlocked.includes(bonus.id),
      unlockedAt: unlockedBonuses?.find(b => b.bonus_id === bonus.id)?.unlocked_at
    }));

    const nextBonus = ProgressiveReferralService.getNextBonusToUnlock(currentBonuses);

    return NextResponse.json({
      isReferred: true,
      referredBy: referralData.referred_by,
      joinedAt: referralData.created_at,
      bonuses: bonusDetails,
      newlyUnlocked,
      nextBonus,
      totalPotential: ProgressiveReferralService.getTotalPotentialBonus()
    });

  } catch (e) {
    reportError(e, { route: 'referral_bonuses_get' });
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  assertSameOrigin(req);
  try {
    const wallet = await requireWallet();
    const { action, bonusId } = await req.json();

    if (action === 'unlock') {
      // Validate bonus exists
      if (!PROGRESSIVE_REFERRAL_BONUSES[bonusId]) {
        return NextResponse.json({ error: 'invalid_bonus' }, { status: 400 });
      }

      // Check if already unlocked
      const { data: existing } = await supabase
        .from('referral_bonuses')
        .select('*')
        .eq('wallet_address', wallet)
        .eq('bonus_id', bonusId)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ error: 'already_unlocked' }, { status: 400 });
      }

      // Get user stats to validate unlock
      const { data: referralData } = await supabase
        .from('players')
        .select('referred_by, created_at')
        .eq('wallet', wallet)
        .single();

      if (!referralData?.referred_by) {
        return NextResponse.json({ error: 'not_referred' }, { status: 400 });
      }

      const { data: statsData } = await supabase
        .from('user_stats')
        .select('*')
        .eq('wallet_address', wallet)
        .single();

      const userStats = {
        totalScans: statsData?.total_scans || 0,
        totalCrafts: statsData?.total_crafts || 0,
        totalStabilizes: statsData?.total_stabilizes || 0,
        totalRznEarned: statsData?.total_rzn_earned || 0,
        joinedAt: new Date(referralData.created_at),
        lastLogin: new Date(statsData?.last_login || referralData.created_at)
      };

      // Get current unlocked bonuses
      const { data: currentBonuses } = await supabase
        .from('referral_bonuses')
        .select('bonus_id')
        .eq('wallet_address', wallet);

      const unlockedIds = currentBonuses?.map(b => b.bonus_id) || [];

      // Check if this bonus should be unlocked
      const newlyUnlocked = await ProgressiveReferralService.checkProgressiveBonuses(
        wallet,
        userStats,
        unlockedIds
      );

      if (!newlyUnlocked.includes(bonusId)) {
        return NextResponse.json({ error: 'bonus_not_ready' }, { status: 400 });
      }

      const bonus = PROGRESSIVE_REFERRAL_BONUSES[bonusId];
      const updates: Promise<void>[] = [];

      // Record the bonus unlock
      updates.push(
        (async () => {
          const { error } = await supabase
            .from('referral_bonuses')
            .insert({
              wallet_address: wallet,
              bonus_id: bonusId,
              unlocked_at: new Date().toISOString(),
              reward_rzn: bonus.reward.rzn || 0,
              reward_energy: 0  // Energy rewards removed
            });
          if (error) throw new Error(error.message);
        })()
      );

      // Grant RZN reward
      if (bonus.reward.rzn && bonus.reward.rzn > 0) {
        updates.push(
          (async () => {
            // Get current RZN from season_stats
            const { data: currentSeasonStats } = await supabase
              .from('season_stats')
              .select('rzn')
              .eq('wallet', wallet)
              .single();

            const currentRzn = currentSeasonStats?.rzn || 0;
            const newRzn = currentRzn + bonus.reward.rzn!;

            const { error } = await supabase
              .from('season_stats')
              .upsert(
                {
                  wallet,
                  rzn: newRzn,
                  updated_at: new Date().toISOString()
                },
                { onConflict: 'wallet' }
              );
            if (error) throw new Error(error.message);
          })()
        );
      }

      // Energy rewards removed for simplicity - only RZN and items are granted

      // Grant item rewards
      if (bonus.reward.items) {
        for (const item of bonus.reward.items) {
          updates.push(
            (async () => {
              const { error } = await supabase.rpc('inc_inventory', {
                p_wallet: wallet,
                p_item: item.item,
                p_qty: item.qty
              });
              if (error) throw new Error(error.message);
            })()
          );
        }
      }

      await Promise.all(updates);

      logMutation('unlock_referral_bonus', {
        wallet,
        bonusId,
        reward: bonus.reward
      });

      return NextResponse.json({
        success: true,
        bonus,
        message: `Unlocked ${bonus.name}! Earned ${bonus.reward.rzn || 0} RZN`
      });

    }

    return NextResponse.json({ error: 'invalid_action' }, { status: 400 });

  } catch (e) {
    reportError(e, { route: 'referral_bonuses_post' });
    return NextResponse.json({ error: 'operation_failed' }, { status: 500 });
  }
}