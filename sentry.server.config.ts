/**
 * Sentry server runtime (Node.js).
 *
 * Runs inside server components, route handlers, server actions.
 * Errors thrown during a request are automatically captured via
 * onRequestError in instrumentation.ts.
 *
 * includeLocalVariables is off to keep resume + query content out of
 * stack frames. Re-enable only if an incident requires it.
 */

import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,

    sendDefaultPii: true,
    includeLocalVariables: false,

    tracesSampleRate:
      process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
  });
}
