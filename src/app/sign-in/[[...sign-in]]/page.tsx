/**
 * /sign-in - Sign In Page
 *
 * Clerk SignIn component with Greentryst branding and rotating taglines.
 */

import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Greentryst account.',
  alternates: { canonical: '/sign-in' },
  robots: { index: false, follow: true },
};

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#fafbfa] flex">
      {/* Left side - Branding with Rotating Taglines */}
      <div className="hidden lg:flex lg:w-1/2 bg-gt-text-dark relative overflow-hidden">
        <div
          className="gt-ambient-glow-dark absolute -top-20 left-1/4 w-[600px] h-[600px] rounded-full"
          aria-hidden
        />
        <div
          className="gt-ambient-glow-dark absolute -bottom-40 right-0 w-[500px] h-[500px] rounded-full opacity-70"
          aria-hidden
        />
        <div
          className="gt-dot-grid absolute inset-0 opacity-40 pointer-events-none"
          aria-hidden
        />

        <div className="relative z-10 flex flex-col justify-center px-16">
          {/* Brand Logo - Dark background variant */}
          <Link href="/" className="mb-8">
            <span className="text-[28px] font-extrabold tracking-tight">
              <span className="text-white">Green</span><span className="text-gt-leaf">tryst</span>
            </span>
          </Link>

          {/* Rotating Taglines */}
          <div
            className="relative h-[32px] mb-6 overflow-hidden"
            aria-label="Rotating taglines"
          >
            <span className="absolute inset-0 text-[18px] font-semibold text-gt-leaf gt-headline-rotate gt-headline-1">
              Learn any framework.
            </span>
            <span className="absolute inset-0 text-[18px] font-semibold text-gt-leaf gt-headline-rotate gt-headline-2">
              Find any answer.
            </span>
            <span className="absolute inset-0 text-[18px] font-semibold text-gt-leaf gt-headline-rotate gt-headline-3">
              Run any calculation.
            </span>
            <span className="absolute inset-0 text-[18px] font-semibold text-gt-leaf gt-headline-rotate gt-headline-4">
              Land your next role.
            </span>
          </div>

          <h1 className="text-[36px] font-extrabold text-white leading-tight mb-6">
            The professional home
            <br />
            for sustainability.
          </h1>

          <p className="text-[16px] text-white/60 leading-relaxed max-w-md">
            Learn new domains, verify answers with sourced citations, execute work with professional tools, and advance your career.
          </p>
        </div>
      </div>

      {/* Right side - Sign In Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">
        <div className="w-full max-w-md">
          {/* Brand Logo - Light background variant (mobile) */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/">
              <span className="text-[24px] font-extrabold tracking-tight">
                <span className="text-gt-text">Green</span><span className="text-gt-medium">tryst</span>
              </span>
            </Link>
          </div>

          <SignIn
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'shadow-none border border-[#e5e7e5] rounded-xl',
                headerTitle: 'text-gt-text font-bold',
                headerSubtitle: 'text-gt-text-muted',
                formButtonPrimary: 'bg-gt-medium hover:bg-gt-dark',
                footerActionLink: 'text-gt-medium hover:text-gt-dark',
              },
            }}
          />

          <p className="mt-8 text-center text-[12px] text-gt-text-muted">
            Don't have an account?{' '}
            <Link href="/sign-up" className="font-semibold text-gt-medium hover:text-gt-dark">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
