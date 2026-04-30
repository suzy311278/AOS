/**
 * Next.js instrumentation hook.
 *
 * Called once per runtime start. Loads the right Sentry config for
 * the runtime, and wires onRequestError so every unhandled server
 * request error is captured. Requires @sentry/nextjs >= 8.28.0.
 */

import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
