import { NextRequest, NextResponse } from 'next/server';
import { requireWallet } from '@/app/api/_utils';
import { supabase } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

// Get Discord link status for current user
export async function GET(req: NextRequest) {
  try {
    const wallet = await requireWallet();

    // Get Discord link for this wallet
    const { data: discordLink } = await supabase
      .from('discord_links')
      .select('discord_id, discord_username, discord_discriminator, discord_avatar, discord_global_name')
      .eq('wallet', wallet)
      .maybeSingle();

    return NextResponse.json({
      linked: !!discordLink,
      discord_link: discordLink,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
}