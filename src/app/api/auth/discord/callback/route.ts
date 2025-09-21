import { NextRequest, NextResponse } from 'next/server';
import { logMutation, reportError } from '@/lib/telemetry';
import { supabase } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

// Handle Discord OAuth callback
export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  // Get the proper origin for redirects (define outside try block)
  const origin = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.APP_ORIGIN || url.origin;

  try {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // This is the wallet address
    const error = url.searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/play?discord_error=${encodeURIComponent(error)}`, origin)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/play?discord_error=missing_params', origin)
      );
    }

    const wallet = state; // Wallet address from state

    // Exchange code for tokens using simple fetch
    const tokenResponse = await fetch('https://discord.com/api/v10/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/api/auth/discord/callback',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange Discord code');
    }

    const tokens = await tokenResponse.json();

    // Get Discord user info
    const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch Discord user');
    }

    const discordUser = await userResponse.json();

    // Link Discord account to wallet in database
    await supabase
      .from('discord_links')
      .upsert({
        wallet,
        discord_id: discordUser.id,
        discord_username: discordUser.username,
        discord_discriminator: discordUser.discriminator,
        discord_avatar: discordUser.avatar,
        discord_global_name: discordUser.global_name,
        linked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'wallet' });

    // Log the successful link
    logMutation('discord_link', {
      wallet,
      discord_id: discordUser.id,
      discord_username: `${discordUser.username}#${discordUser.discriminator}`,
    });

    // Redirect back to game with success message
    return NextResponse.redirect(
      new URL('/play?discord_success=linked', origin)
    );
  } catch (error) {
    reportError(error, { route: 'discord_callback' });
    return NextResponse.redirect(
      new URL('/play?discord_error=callback_failed', origin)
    );
  }
}