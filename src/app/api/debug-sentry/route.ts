
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export async function GET() {
  Sentry.captureMessage('debug_message from /api/debug-sentry');
  Sentry.captureException(new Error('debug_error from /api/debug-sentry'));
  await Sentry.flush(3000);
  return NextResponse.json({ ok: true });
}
