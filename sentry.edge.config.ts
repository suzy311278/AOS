/**
 * Sentry edge runtime.
 *
 * Runs inside edge middleware and edge route handlers.
 */

import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,

    sendDefaultPii: true,

    tracesSampleRate:
      process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
  });
}
