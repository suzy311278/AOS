/**
 * 404 Not Found Page
 *
 * Displayed when a route doesn't exist. Uses history.back() in a button,
 * so the whole page must be a client component.
 */

'use client';

import Link from 'next/link';
import { Home, Search, ArrowLeft } from 'lucide-react';
import { Nav } from '@/components/Nav';
import { RedesignFooter } from '@/components/redesign';

export default function NotFound() {
  return (
    <>
      <Nav />
      <main className="min-h-[80vh] bg-[#fafbfa] flex items-center justify-center px-8 pt-20">
        <div className="text-center max-w-lg">
          <p
            className="text-[120px] font-extrabold text-gt-leaf/20 leading-none"
            style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
          >
            404
          </p>

          <h1 className="text-[28px] font-extrabold text-gt-text mt-4 mb-4">
            Page not found
          </h1>

          <p className="text-[15px] text-gt-text-muted mb-8">
            The page you're looking for doesn't exist or has been moved.
            Let's get you back on track.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gt-medium text-white text-[14px] font-bold rounded-lg hover:bg-gt-dark transition-colors"
            >
              <Home className="w-4 h-4" strokeWidth={2} />
              Go to Homepage
            </Link>

            <Link
              href="/courses"
              className="inline-flex items-center gap-2 px-6 py-3 border border-[#e5e7e5] text-gt-text text-[14px] font-semibold rounded-lg hover:bg-white transition-colors"
            >
              <Search className="w-4 h-4" strokeWidth={2} />
              Browse Courses
            </Link>
          </div>

          <button
            onClick={() => history.back()}
            className="mt-6 inline-flex items-center gap-1 text-[13px] text-gt-text-muted hover:text-gt-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
            Go back
          </button>
        </div>
      </main>
      <RedesignFooter />
    </>
  );
}
