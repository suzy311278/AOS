/**
 * Sentry client runtime (browser).
 *
 * Captures unhandled errors, React render crashes, navigation
 * transition problems, and ships error-session replays with all text
 * masked and media blocked so user queries, resumes, and SustainIQ
 * responses stay out of the replay payload.
 *
 * DSN is read from NEXT_PUBLIC_SENTRY_DSN. If unset, Sentry is a
 * no-op and the site works normally.
 */

import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment:
      process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,

    sendDefaultPii: true,

    tracesSampleRate:
      process.env.NODE_ENV === 'development' ? 1.0 : 0.1,

    // 10% of all sessions, 100% of sessions that hit an error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    ignoreErrors: [
      'ResizeObserver loop',
      'Non-Error promise rejection captured',
    ],
  });
}

// App Router navigation tracing hook. Required for client-side spans
// to appear alongside server spans in the same trace.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
