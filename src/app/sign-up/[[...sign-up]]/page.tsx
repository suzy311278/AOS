/**
 * /sign-up - Sign Up Page
 *
 * Clerk SignUp component with Greentryst branding.
 */

import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create your Greentryst account and start learning.',
  alternates: { canonical: '/sign-up' },
  robots: { index: false, follow: true },
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#fafbfa] flex">
      {/* Left side - Branding */}
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
            Start your journey
            <br />
            in sustainability.
          </h1>

          <p className="text-[16px] text-white/60 leading-relaxed max-w-md mb-10">
            Join thousands of professionals building expertise in climate, ESG, carbon markets, and sustainable finance.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-gt-leaf/20 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-gt-leaf" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-[14px] text-white/80">Free access to foundational courses</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-gt-leaf/20 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-gt-leaf" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-[14px] text-white/80">5 SustainIQ queries per day</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-gt-leaf/20 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-gt-leaf" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-[14px] text-white/80">Career directory access</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Sign Up Form */}
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

          <SignUp
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
            Already have an account?{' '}
            <Link href="/sign-in" className="font-semibold text-gt-medium hover:text-gt-dark">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
