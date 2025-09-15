// src/lib/telemetry.ts
// Minimal helpers to send contextual events/errors to Sentry
// with privacy controls for the "user" field.

import * as Sentry from '@sentry/nextjs';
import { createHash } from 'crypto';

type Ctx = Record<string, unknown>;

/** Set how user identity is handled in Sentry events. */
const USER_ID_MODE: 'none' | 'hashed' = 'hashed';

/** Build an anonymous id from a wallet string (12-char sha256 prefix). */
function anonIdFromWallet(wallet: string) {
  return createHash('sha256').update(wallet.toLowerCase()).digest('hex').slice(0, 12);
}

/** Attach user to scope according to USER_ID_MODE. */
function attachUser(scope: Sentry.Scope, ctx: Ctx = {}) {
  const wallet =
    (ctx as any)?.wallet ||
    (ctx as any)?.address ||
    undefined;

  if (!wallet || typeof wallet !== 'string') return;

  if (USER_ID_MODE === 'hashed') {
    scope.setUser({ id: anonIdFromWallet(wallet) });
  }
  // if 'none', do not set any user
}

/** Remove sensitive keys and keep values serializable/small. */
function sanitizeCtx(ctx: Ctx = {}) {
  const out: Record<string, { value: unknown }> = {};
  for (const [k, v] of Object.entries(ctx)) {
    // never send secrets
    if (/sig|cookie|token|secret|password|authorization/i.test(k)) continue;

    let val: unknown = v;
    try {
      if (typeof val === 'string' && val.length > 256) {
        val = `${val.slice(0, 256)}…`;
      } else if (val && typeof val === 'object') {
        val = JSON.parse(JSON.stringify(val));
      }
    } catch {
      val = String(val);
    }
    out[k] = { value: val };
  }
  return out;
}

/** Log a non-error event (e.g., successful mutation). */
export function logMutation(event: string, ctx: Ctx = {}) {
  Sentry.withScope((scope) => {
    attachUser(scope, ctx);
    const sc = sanitizeCtx(ctx);
    for (const [k, v] of Object.entries(sc)) scope.setContext(k, v);
    scope.setLevel('info');
    Sentry.captureMessage(event);
  });
}

/** Report an error with context. */
export function reportError(err: unknown, ctx: Ctx = {}) {
  Sentry.withScope((scope) => {
    attachUser(scope, ctx);
    const sc = sanitizeCtx(ctx);
    for (const [k, v] of Object.entries(sc)) scope.setContext(k, v);
    Sentry.captureException(err instanceof Error ? err : new Error(String(err)));
  });
}

/** Optional wrapper to auto-log success and report errors. */
export async function withSentry<T>(name: string, ctx: Ctx, fn: () => Promise<T>): Promise<T> {
  try {
    const result = await fn();
    logMutation(name, ctx);
    return result;
  } catch (e) {
    reportError(e, { ...ctx, op: name });
    throw e;
  }
}

/** Optional: call before returning an error in serverless to flush events. */
export function flushSentry(timeoutMs = 2000) {
  return Sentry.flush(timeoutMs);
}
