/**
 * Error Page
 *
 * Displayed when a runtime error occurs within /redesign.
 */

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Home, RefreshCw, AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#fafbfa] flex items-center justify-center px-8 pt-20">
      <div className="text-center max-w-lg">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" strokeWidth={1.5} />
        </div>

        <h1 className="text-[28px] font-extrabold text-gt-text mb-4">
          Something went wrong
        </h1>

        <p className="text-[15px] text-gt-text-muted mb-8">
          We encountered an unexpected error. This has been logged and we'll look into it.
          Please try again or return to the homepage.
        </p>

        {error.digest && (
          <p
            className="text-[11px] text-gt-text-muted mb-6 px-4 py-2 bg-gray-100 rounded-lg inline-block"
            style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
          >
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gt-medium text-white text-[14px] font-bold rounded-lg hover:bg-gt-dark transition-colors"
          >
            <RefreshCw className="w-4 h-4" strokeWidth={2} />
            Try Again
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 border border-[#e5e7e5] text-gt-text text-[14px] font-semibold rounded-lg hover:bg-white transition-colors"
          >
            <Home className="w-4 h-4" strokeWidth={2} />
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
