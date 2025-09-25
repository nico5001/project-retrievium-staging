import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseAdmin';
import { requireWallet, assertSameOrigin } from '@/app/api/_utils';
import { logMutation, reportError } from '@/lib/telemetry';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  assertSameOrigin(req);

  let wallet: string | undefined;
  let referralCode: string | undefined;

  try {
    wallet = await requireWallet();
    const body = await req.json();
    referralCode = body.referralCode;

    if (!referralCode || typeof referralCode !== 'string') {
      return NextResponse.json({ error: 'referral_code_required' }, { status: 400 });
    }

    const code = referralCode.toUpperCase().trim();

    // Check if user already has a referrer
    const { data: existingPlayer, error: playerError } = await supabase
      .from('players')
      .select('referred_by')
      .eq('wallet', wallet)
      .single();

    if (playerError) {
      console.error('Error checking existing player:', playerError);
      return NextResponse.json({
        error: 'database_error',
        message: 'Failed to check player status'
      }, { status: 500 });
    }

    if (existingPlayer?.referred_by) {
      return NextResponse.json({
        error: 'already_referred',
        message: 'You already have a referrer assigned'
      }, { status: 400 });
    }

    // Resolve the referral code to get the referrer's wallet
    let referrerWallet = null;

    // First try to find a custom referral code
    const { data: customCode, error: customCodeError } = await supabase
      .from('custom_referral_codes')
      .select('wallet_address')
      .eq('custom_code', code)
      .maybeSingle();

    if (customCode) {
      referrerWallet = customCode.wallet_address;
    } else {
      // Try to find by wallet-based code (first 6 characters after 0x)
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('wallet')
        .ilike('wallet', `0x${code.toLowerCase()}%`);

      if (playersError) {
        console.error('Error checking wallet-based codes:', playersError);
        return NextResponse.json({
          error: 'database_error',
          message: 'Failed to resolve referral code'
        }, { status: 500 });
      }

      if (players && players.length > 0) {
        referrerWallet = players[0].wallet;
      }
    }

    if (!referrerWallet) {
      return NextResponse.json({
        error: 'invalid_referral_code',
        message: 'Referral code not found'
      }, { status: 404 });
    }

    // Can't refer yourself
    if (referrerWallet === wallet) {
      return NextResponse.json({
        error: 'self_referral',
        message: 'You cannot refer yourself'
      }, { status: 400 });
    }

    // Update the player's referred_by field
    const { error: updateError } = await supabase
      .from('players')
      .update({
        referred_by: referrerWallet
      })
      .eq('wallet', wallet);

    if (updateError) {
      reportError(updateError, { route: 'apply_referral_code', wallet, referralCode: code });
      return NextResponse.json({
        error: 'database_error',
        message: 'Failed to apply referral code'
      }, { status: 500 });
    }

    // Also insert into referrals table for tracking and visibility
    const { error: referralTableError } = await supabase
      .from('referrals')
      .insert({
        referral_code: code,
        referrer_wallet: referrerWallet,
        referee_wallet: wallet,
        is_active: true
      });

    if (referralTableError) {
      // Log the error but don't fail the request since the main referral is already applied
      reportError(referralTableError, {
        route: 'apply_referral_code_referrals_table',
        wallet,
        referrerWallet,
        referralCode: code
      });
    }

    // Initialize user stats if they don't exist
    const { error: statsError } = await supabase
      .from('user_stats')
      .upsert({
        wallet_address: wallet,
        total_scans: 0,
        total_crafts: 0,
        total_stabilizes: 0,
        total_rzn_earned: 0,
        current_streak: 0,
        longest_streak: 0,
        referrals_made: 0,
        social_shares: 0,
        energy_spent: 0,
        dailySharesCompleted: 0,
        lastDailyShare: null,
        last_login: new Date().toISOString()
      }, {
        onConflict: 'wallet_address'
      });

    // Log the referral application
    logMutation('apply_referral_code', {
      wallet,
      referrerWallet,
      referralCode: code
    });

    return NextResponse.json({
      success: true,
      referrerWallet,
      message: 'Referral code applied successfully! Your referrer will now earn bonuses from your activity.'
    });

  } catch (error) {
    console.error('Apply referral code error:', error);
    reportError(error, { route: 'apply_referral_code', wallet, referralCode });
    return NextResponse.json({
      error: 'server_error',
      message: 'An error occurred while applying the referral code'
    }, { status: 500 });
  }
}