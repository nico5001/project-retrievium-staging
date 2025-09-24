import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

// Get custom referral code for a wallet
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get('wallet');

  if (!wallet) {
    return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('custom_referral_codes')
      .select('custom_code')
      .ilike('wallet_address', wallet) // Case-insensitive match
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    return NextResponse.json({
      customCode: data?.custom_code || null,
      hasCustomCode: !!data?.custom_code
    });

  } catch (error) {
    console.error('Error fetching custom referral code:', error);
    return NextResponse.json({ error: 'Failed to fetch custom code' }, { status: 500 });
  }
}

// Create or update custom referral code (admin only)
export async function POST(req: NextRequest) {
  try {
    const { wallet, customCode } = await req.json();

    if (!wallet || !customCode) {
      return NextResponse.json({
        error: 'Wallet address and custom code required'
      }, { status: 400 });
    }

    // Validate custom code format (alphanumeric, 3-20 chars)
    if (!/^[A-Za-z0-9]{3,20}$/.test(customCode)) {
      return NextResponse.json({
        error: 'Custom code must be 3-20 alphanumeric characters'
      }, { status: 400 });
    }

    // Check if custom code is already taken
    const { data: existing } = await supabase
      .from('custom_referral_codes')
      .select('wallet_address')
      .eq('custom_code', customCode.toUpperCase())
      .single();

    if (existing && existing.wallet_address !== wallet) {
      return NextResponse.json({
        error: 'Custom code already taken'
      }, { status: 409 });
    }

    // Upsert the custom code
    const { error } = await supabase
      .from('custom_referral_codes')
      .upsert({
        wallet_address: wallet,
        custom_code: customCode.toUpperCase(),
        is_active: true
      }, {
        onConflict: 'wallet_address'
      });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      customCode: customCode.toUpperCase(),
      message: 'Custom referral code set successfully'
    });

  } catch (error) {
    console.error('Error setting custom referral code:', error);
    return NextResponse.json({ error: 'Failed to set custom code' }, { status: 500 });
  }
}