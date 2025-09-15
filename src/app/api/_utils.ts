import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { cookieName, readJWT } from '@/lib/jwt';
import { supabase } from '@/lib/supabaseAdmin';


export function todayYMD_UTC8(): string {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  const utc8 = new Date(utcMs + 8 * 3600 * 1000);
  return utc8.toISOString().slice(0, 10);
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

 
  const { data: existing } = await supabase
    .from('progress')
    .select('*')
    .eq('wallet', wallet)
    .eq('ymd', ymd)
    .maybeSingle();
  if (existing) return existing;

  const base = {
    wallet,
    ymd,
    energy: 100,
    rzn: 0,
    scans_done: 0,
    stabilize_count: 0,
    scan_ready: false,
  };

  
  await supabase
    .from('progress')
    .upsert(base, { onConflict: 'wallet,ymd' });

  
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
