import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

// Resolve referral code to wallet address
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Referral code required' }, { status: 400 });
  }

  try {
    // Check custom referral codes first
    const { data: customCode, error: customError } = await supabase
      .from('custom_referral_codes')
      .select('wallet_address')
      .eq('custom_code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (customCode) {
      // Increment usage count
      await supabase
        .from('custom_referral_codes')
        .update({ usage_count: supabase.raw('usage_count + 1') })
        .eq('custom_code', code.toUpperCase());

      return NextResponse.json({
        wallet: customCode.wallet_address,
        type: 'custom'
      });
    }

    // If not found and code is 6 characters, try wallet-based lookup
    if (code.length === 6) {
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('wallet')
        .ilike('wallet', `0x${code.toLowerCase()}%`)
        .limit(1);

      if (players && players.length > 0) {
        return NextResponse.json({
          wallet: players[0].wallet,
          type: 'wallet'
        });
      }
    }

    return NextResponse.json({ wallet: null, error: 'Referral code not found' }, { status: 404 });

  } catch (error) {
    console.error('Error resolving referral code:', error);
    return NextResponse.json({ error: 'Failed to resolve referral code' }, { status: 500 });
  }
}