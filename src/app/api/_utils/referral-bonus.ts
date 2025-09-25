import { supabase } from '@/lib/supabaseAdmin';
import { logMutation, reportError } from '@/lib/telemetry';

/**
 * Awards RZN bonus to referrer when their referred user earns RZN
 * @param userWallet - The wallet of the user earning RZN
 * @param rznAmount - Amount of RZN earned by the user
 * @param source - Source of the RZN earning (e.g., 'craft', 'scan', 'stabilize')
 * @returns Promise with bonus details
 */
export async function awardReferralBonus(
  userWallet: string,
  rznAmount: number,
  source: string = 'unknown'
): Promise<{
  success: boolean;
  referrerWallet?: string;
  bonusAmount?: number;
  error?: string;
}> {
  try {
    // Get user's referrer
    const { data: playerData } = await supabase
      .from('players')
      .select('referred_by')
      .eq('wallet', userWallet)
      .single();

    if (!playerData?.referred_by) {
      // User has no referrer, no bonus to award
      return { success: true };
    }

    const referrerWallet = playerData.referred_by;
    const bonusAmount = Math.ceil(rznAmount * 0.05); // 5% bonus, rounded up (minimum 1 RZN)

    if (bonusAmount <= 0) {
      return { success: true };
    }

    // Get current referrer's RZN from season_stats
    const { data: referrerStats } = await supabase
      .from('season_stats')
      .select('rzn')
      .eq('wallet', referrerWallet)
      .single();

    const currentRzn = referrerStats?.rzn || 0;
    const newRzn = currentRzn + bonusAmount;

    // Update referrer's RZN
    const { error: updateError } = await supabase
      .from('season_stats')
      .upsert({
        wallet: referrerWallet,
        rzn: newRzn,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'wallet'
      });

    if (updateError) {
      reportError(updateError, {
        context: 'referral_bonus_award',
        userWallet,
        referrerWallet,
        rznAmount,
        bonusAmount
      });
      return {
        success: false,
        error: 'Failed to update referrer RZN'
      };
    }

    // Record the referral earning in referral_earnings table
    const { error: earningsError } = await supabase
      .from('referral_earnings')
      .insert({
        amount: bonusAmount,
        source: source,
        earning_type: 'referral_bonus',
        referrer_wallet: referrerWallet,
        referee_wallet: userWallet,
        created_at: new Date().toISOString()
      });

    if (earningsError) {
      console.error('Failed to record referral earning:', earningsError);
      // Don't fail the whole operation, just log the error
      reportError(earningsError, {
        context: 'referral_earnings_record',
        userWallet,
        referrerWallet,
        bonusAmount,
        source
      });
    }

    // Update user_stats for tracking
    await supabase
      .from('user_stats')
      .upsert({
        wallet_address: userWallet,
        total_rzn_earned: rznAmount, // This should be incremented, not set
        last_login: new Date().toISOString()
      }, {
        onConflict: 'wallet_address',
        ignoreDuplicates: false
      });

    // Log the referral bonus
    logMutation('referral_bonus_awarded', {
      userWallet,
      referrerWallet,
      bonusAmount,
      source,
      originalAmount: rznAmount
    });

    return {
      success: true,
      referrerWallet,
      bonusAmount
    };

  } catch (error) {
    reportError(error, {
      context: 'referral_bonus_error',
      userWallet,
      rznAmount,
      source
    });

    return {
      success: false,
      error: 'Referral bonus system error'
    };
  }
}