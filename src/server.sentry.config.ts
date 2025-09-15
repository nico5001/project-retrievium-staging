// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: "https://62660b6aa9df5a113da8ccf65ce31938@o4510010277101568.ingest.us.sentry.io/4510019065085952",
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  integrations(integrations) {
    return integrations.filter(i => i.name !== 'Postgresjs');
  },
});
