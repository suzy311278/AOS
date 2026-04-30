'use client';

/**
 * App Router global error boundary.
 *
 * Catches errors that bubble past every other boundary, including
 * root-layout errors. Reports to Sentry on mount, then shows the
 * Next.js default error page. Must stay `use client`.
 */

import * as Sentry from '@sentry/nextjs';
import NextError from 'next/error';
import { useEffect } from 'react';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
