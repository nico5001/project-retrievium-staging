// middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const isProd = process.env.NODE_ENV === 'production';

// Adjust these if you call other domains (wallet/Supabase already included)
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.supabase.co https://*.supabase.in https://*.roninchain.com https://api.skymavis.com https://*.ingest.sentry.io https://*.ingest.us.sentry.io wss:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "object-src 'none'",
  "form-action 'self'",
].join('; ');



export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  res.headers.set('Content-Security-Policy', csp);
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Referrer-Policy', 'no-referrer');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Permissions-Policy', "camera=(), microphone=(), geolocation=()");
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  res.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  // HSTS only on HTTPS in prod
  if (isProd && req.nextUrl.protocol === 'https:') {
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  return res;
}

// Don’t run for static assets/_next
export const config = {
  matcher: ['/((?!_next/|.*\\..*).*)'],
};
