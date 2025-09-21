import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeDiscordCode,
  getDiscordUser,
  addUserToGuild,
  updateDiscordRoles,
  calculatePlayerRoles,
  linkDiscordAccount,
} from '@/lib/discord';
import { logMutation, reportError } from '@/lib/telemetry';

export const runtime = 'nodejs';

// Handle Discord OAuth callback
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // This is the wallet address
    const error = url.searchParams.get('error');

    // Get the proper origin for redirects
    const origin = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.APP_ORIGIN || url.origin;

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

    // Exchange code for tokens
    const tokenResponse = await exchangeDiscordCode(code);

    // Get Discord user info
    const discordUser = await getDiscordUser(tokenResponse.access_token);

    // Link Discord account to wallet
    await linkDiscordAccount(wallet, discordUser);

    // Add user to Discord server (if not already a member)
    try {
      await addUserToGuild(tokenResponse.access_token, discordUser.id);
    } catch (error) {
      // User might already be in the server, that's fine
      console.log('User might already be in Discord server:', error);
    }

    // Calculate and assign roles based on game progress
    const roles = await calculatePlayerRoles(wallet);
    await updateDiscordRoles(discordUser.id, roles);

    // Log the successful link
    logMutation('discord_link', {
      wallet,
      discord_id: discordUser.id,
      discord_username: `${discordUser.username}#${discordUser.discriminator}`,
      roles_assigned: roles.length,
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