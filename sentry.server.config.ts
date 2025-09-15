// sentry.server.config.ts
// Server-only Sentry init with strong privacy defaults.

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,

  // Keep performance tracing off unless you intentionally enable it.
  tracesSampleRate: 0,

  // Don't attach cookies or other PII automatically.
  sendDefaultPii: false,

  // Scrub request details before sending (good defense-in-depth).
  beforeSend(event) {
    // If you choose "no user" in lib/telemetry.ts, no user will be attached.
    // If you choose "hashed", user will be an anonymous hash.
    // We do NOT manipulate event.user here so your choice is respected.

    if (event.request) {
      // Remove potentially sensitive request bits
      delete (event.request as any).cookies;
      delete (event.request as any).headers;
      delete (event.request as any).query_string;
      delete (event.request as any).data;
    }
    return event;
  },

  // Silence noisy OTEL Postgresjs integration in dev.
  integrations(integrations) {
    return integrations.filter((i) => i.name !== 'Postgresjs');
  },

  // Turn on to see SDK logs in the server console while testing.
  debug: !!process.env.SENTRY_DEBUG,
});
