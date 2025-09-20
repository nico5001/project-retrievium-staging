import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { cookieName, readJWT } from '@/lib/jwt';
import { supabase } from '@/lib/supabaseAdmin';


export function todayYMD_UTC8(): string {
  // Get current time in UTC+8 (Asia/Singapore timezone)
  const now = new Date();
  const utc8String = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' });
  return utc8String; // Returns YYYY-MM-DD format
}


export async function requireWallet(): Promise<string> {
  const token = cookies().get(cookieName)?.value;
  const sub = await readJWT(token);
  if (!sub) throw new Response('unauthorized', { status: 401 });
  return sub as string;
}


export function clientKey(req: NextRequest): string {
  const xf = req.headers.get('x-forwarded-for') || '';
  const ip = xf.split(',')[0].trim();
  const host = req.headers.get('x-real-ip') || (req as any).ip || '';
  return ip || host || 'unknown';
}


export async function rateLimit(scope: string, key: string, limit: number, windowSeconds: number) {
  try {
    const { data, error } = await supabase.rpc('rate_limit_hit', {
      p_scope: scope,
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      
      return { allowed: true, remaining: limit, reset_at: new Date(Date.now() + windowSeconds * 1000).toISOString() };
    }
    const row = Array.isArray(data) ? data[0] : data;
    return row as { allowed: boolean; remaining: number; reset_at: string };
  } catch {
    
    return { allowed: true, remaining: limit, reset_at: new Date(Date.now() + windowSeconds * 1000).toISOString() };
  }
}


export async function ensureProgress(wallet: string) {
  const ymd = todayYMD_UTC8();

  // Check if progress exists for today
  const { data: existing } = await supabase
    .from('progress')
    .select('*')
    .eq('wallet', wallet)
    .eq('ymd', ymd)
    .maybeSingle();

  // If progress exists for today, return it
  if (existing) return existing;

  // If no progress for today, create new record with fresh energy
  const base = {
    wallet,
    ymd,
    energy: 100, // Reset energy to 100 for new day
    rzn: 0,
    scans_done: 0,
    stabilize_count: 0,
    crafts_done: 0, // Daily crafting counter
    scan_ready: false,
  };

  // Insert new progress record for today
  await supabase
    .from('progress')
    .upsert(base, { onConflict: 'wallet,ymd' });

  // Return the new progress record
  const { data } = await supabase
    .from('progress')
    .select('*')
    .eq('wallet', wallet)
    .eq('ymd', ymd)
    .maybeSingle();

  return data ?? base;
}


export function assertSameOrigin(req: NextRequest) {
  const csv = process.env.APP_ORIGINS || process.env.APP_ORIGIN || '';
  if (!csv) return; 

  const allowed = csv
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const origin = req.headers.get('origin') || '';
  const host = req.headers.get('host') || '';

  
  if (origin) {
    if (allowed.includes(origin)) return;
  } else {
   
    const ok = allowed.some(a => {
      try { return new URL(a).host === host; } catch { return a === host; }
    });
    if (ok) return;
  }

  throw new Response('forbidden', { status: 403 });
}
