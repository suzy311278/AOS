/**
 * /sign-up - Sign Up Page
 *
 * ArmorInnovate terminal-themed Clerk SignUp page.
 */

import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create your ArmorInnovate account — IEC 62443 cybersecurity training platform.',
  alternates: { canonical: '/sign-up' },
  robots: { index: false, follow: true },
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-ai-deep flex flex-col lg:flex-row">
      {/* Left side — Terminal-themed branding (desktop) */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-1/2 relative overflow-hidden bg-ai-deep-2">
        {/* Scan-line overlay */}
        <div
          className="pointer-events-none absolute inset-0 z-20"
          aria-hidden
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(6,182,212,0.03) 2px, rgba(6,182,212,0.03) 4px)',
          }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          aria-hidden
          style={{
            backgroundImage:
              'linear-gradient(rgba(6,182,212,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* Glow */}
        <div
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-ai-cyber/[0.06] blur-3xl"
          aria-hidden
        />
        <div
          className="absolute -bottom-40 right-0 w-[400px] h-[400px] rounded-full bg-ai-primary/[0.08] blur-3xl"
          aria-hidden
        />

        <div className="relative z-10 flex flex-col justify-between px-12 xl:px-16 py-16 w-full max-w-[600px] mx-auto">
          {/* Top: Brand */}
          <Link href="/" className="inline-flex items-center gap-3 self-start group">
            <div className="w-9 h-9 rounded-ai-tile bg-ai-cyber/10 border border-ai-cyber/30 flex items-center justify-center group-hover:border-ai-cyber transition-colors">
              <Shield className="w-[18px] h-[18px] text-ai-cyber" />
            </div>
            <span className="text-[20px] font-bold tracking-tight">
              <span className="text-white">Armor</span>
              <span className="text-ai-cyber">Innovate</span>
            </span>
          </Link>

          {/* Middle: Headline + value prop */}
          <div className="my-12">
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-ai-cyber mb-5">
              IEC 62443 · ICS Security Training
            </p>
            <h1 className="text-[36px] xl:text-[42px] font-bold leading-[1.1] tracking-tight text-white mb-5">
              Start your{' '}
              <span className="text-ai-cyber">OT defender</span>{' '}
              journey.
            </h1>
            <p className="text-[15px] text-ai-ink-on-deep-soft leading-relaxed max-w-[440px]">
              Five specialist tracks. Hands-on labs. Live CISA intelligence. Built for the engineers keeping plants running.
            </p>
          </div>

          {/* Bottom: Compact track list */}
          <div className="rounded-ai-card border border-ai-line-deep bg-[#080d18] overflow-hidden shadow-2xl">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-ai-line-deep bg-black/50">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              <span className="ml-2 text-[10.5px] text-ai-ink-on-deep-dim font-mono uppercase tracking-wider">
                certification tracks
              </span>
            </div>
            <div className="p-5 font-mono text-[12.5px] leading-[1.85] text-ai-ink-on-deep-soft">
              <p>
                <span className="text-ai-ink-on-deep-dim">01</span>{' '}
                <span className="text-ai-ink-on-deep">Foundations</span>
              </p>
              <p>
                <span className="text-ai-ink-on-deep-dim">02</span>{' '}
                <span className="text-ai-ink-on-deep">Risk Assessment</span>
              </p>
              <p>
                <span className="text-ai-ink-on-deep-dim">03</span>{' '}
                <span className="text-ai-ink-on-deep">Design</span>
              </p>
              <p>
                <span className="text-ai-ink-on-deep-dim">04</span>{' '}
                <span className="text-ai-ink-on-deep">Maintenance</span>
              </p>
              <p>
                <span className="text-ai-ink-on-deep-dim">05</span>{' '}
                <span className="text-ai-warn">Expert Capstone</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side — Sign Up Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 sm:px-8 py-10 sm:py-12 bg-ai-deep">
        {/* Mobile brand header (visible only under lg) */}
        <div className="lg:hidden w-full max-w-md mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-ai-tile bg-ai-cyber/10 border border-ai-cyber/30 flex items-center justify-center">
              <Shield className="w-[18px] h-[18px] text-ai-cyber" />
            </div>
            <span className="text-[20px] font-bold tracking-tight">
              <span className="text-white">Armor</span>
              <span className="text-ai-cyber">Innovate</span>
            </span>
          </Link>
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-ai-cyber mb-2">
            IEC 62443 · ICS Security
          </p>
          <h1 className="text-[26px] font-bold leading-tight tracking-tight text-white">
            Start your{' '}
            <span className="text-ai-cyber">OT defender</span>{' '}
            journey.
          </h1>
        </div>

        <div className="w-full max-w-md">

          <SignUp
            appearance={{
              variables: {
                colorPrimary: '#06B6D4',
                colorBackground: '#0F172A',
                colorText: '#E2E8F0',
                colorInputBackground: '#080d18',
                colorInputText: '#FFFFFF',
                colorTextSecondary: '#94A3B8',
                colorTextOnPrimaryBackground: '#0B1F3A',
                borderRadius: '0.5rem',
                fontFamily: 'inherit',
              },
              elements: {
                rootBox: 'w-full',
                card: 'bg-ai-deep-2 border border-ai-line-deep rounded-ai-card shadow-2xl px-6 py-8 sm:px-8',
                headerTitle: 'text-white text-[22px] font-bold',
                headerSubtitle: 'text-ai-ink-on-deep-dim text-[13px]',
                formFieldLabel: 'text-ai-ink-on-deep-soft text-[12.5px] font-medium',
                formFieldInput:
                  'bg-[#080d18] border border-ai-line-deep text-white placeholder:text-ai-ink-on-deep-dim focus:border-ai-cyber focus:ring-2 focus:ring-ai-cyber/20 rounded-md transition-all',
                formButtonPrimary:
                  'bg-ai-cyber hover:bg-ai-cyber-glow text-ai-deep font-bold rounded-md transition-all normal-case text-[14px] py-2.5 shadow-lg shadow-ai-cyber/20',
                footerActionLink: 'text-ai-cyber hover:text-ai-cyber-glow font-semibold',
                socialButtonsBlockButton:
                  'bg-[#080d18] border border-ai-line-deep text-ai-ink-on-deep-soft hover:bg-ai-grid hover:border-ai-cyber/40 rounded-md transition-all normal-case',
                socialButtonsBlockButtonText: 'text-ai-ink-on-deep-soft font-medium',
                dividerLine: 'bg-ai-line-deep',
                dividerText: 'text-ai-ink-on-deep-dim text-[11px] uppercase tracking-wider',
                formFieldInputShowPasswordButton: 'text-ai-ink-on-deep-dim hover:text-ai-cyber',
                identityPreviewEditButton: 'text-ai-cyber hover:text-ai-cyber-glow',
                formResendCodeLink: 'text-ai-cyber hover:text-ai-cyber-glow',
                otpCodeFieldInput: 'bg-[#080d18] border-ai-line-deep text-white',
                footer: 'bg-transparent',
                footerAction: 'bg-transparent',
                footerActionText: 'text-ai-ink-on-deep-dim text-[12.5px]',
                formFieldAction: 'text-ai-cyber hover:text-ai-cyber-glow',
              },
            }}
          />

          <p className="mt-6 text-center text-[12px] text-ai-ink-on-deep-dim">
            By creating an account you agree to our{' '}
            <Link href="/terms" className="text-ai-ink-on-deep-soft hover:text-ai-cyber transition-colors underline underline-offset-2 decoration-ai-line-deep">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-ai-ink-on-deep-soft hover:text-ai-cyber transition-colors underline underline-offset-2 decoration-ai-line-deep">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
