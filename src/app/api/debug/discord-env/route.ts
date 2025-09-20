import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Debug endpoint to check Discord environment variables
export async function GET() {
  const discordEnv = {
    CLIENT_ID: process.env.DISCORD_CLIENT_ID ? 'SET' : 'MISSING',
    CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET ? 'SET' : 'MISSING',
    BOT_TOKEN: process.env.DISCORD_BOT_TOKEN ? 'SET' : 'MISSING',
    GUILD_ID: process.env.DISCORD_GUILD_ID ? 'SET' : 'MISSING',
    REDIRECT_URI: process.env.DISCORD_REDIRECT_URI ? 'SET' : 'MISSING',
    WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL ? 'SET' : 'MISSING',
    // Show actual values for debugging (remove in production)
    CLIENT_ID_VALUE: process.env.DISCORD_CLIENT_ID || 'undefined',
    REDIRECT_URI_VALUE: process.env.DISCORD_REDIRECT_URI || 'undefined',
  };

  return NextResponse.json(discordEnv);
}