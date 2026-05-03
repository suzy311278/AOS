/**
 * /sign-in - Sign In Page
 *
 * ArmorInnovate terminal-themed Clerk SignIn page.
 */

import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to ArmorInnovate — IEC 62443 cybersecurity training platform.',
  alternates: { canonical: '/sign-in' },
  robots: { index: false, follow: true },
};

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-ai-bg flex flex-col lg:flex-row">
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
        {/* Glow accent */}
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
              The operating system for{' '}
              <span className="text-ai-cyber">OT defenders</span>.
            </h1>
            <p className="text-[15px] text-ai-ink-on-deep-soft leading-relaxed max-w-[440px]">
              Hands-on labs, structured certification tracks, and live vulnerability intelligence — built for the engineers keeping plants running.
            </p>
          </div>

          {/* Bottom: Compact terminal accent */}
          <div className="rounded-ai-card border border-ai-line-deep bg-[#080d18] overflow-hidden shadow-2xl">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-ai-line-deep bg-black/50">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              <span className="ml-2 text-[10.5px] text-ai-ink-on-deep-dim font-mono uppercase tracking-wider">
                armor@ics-lab — secure session
              </span>
            </div>
            <div className="p-5 font-mono text-[12.5px] leading-[1.85] text-ai-ink-on-deep-soft">
              <p>
                <span className="text-ai-cyber">$</span>{' '}
                <span className="text-ai-ink-on-deep">armor status</span>
              </p>
              <p>
                <span className="text-ai-ok">●</span>{' '}
                <span className="text-ai-ink-on-deep-soft">platform</span>{' '}
                <span className="text-ai-ok">online</span>
              </p>
              <p>
                <span className="text-ai-ok">●</span>{' '}
                <span className="text-ai-ink-on-deep-soft">lab simulators</span>{' '}
                <span className="text-ai-ok">ready</span>{' '}
                <span className="text-ai-ink-on-deep-dim">(6 active)</span>
              </p>
              <p>
                <span className="text-ai-warn">●</span>{' '}
                <span className="text-ai-ink-on-deep-soft">advisories</span>{' '}
                <span className="text-ai-warn">3 new</span>
              </p>
              <p className="mt-2.5">
                <span className="text-ai-cyber">$</span>{' '}
                <span className="text-ai-ink-on-deep">authenticate</span>
                <span className="text-ai-cyber animate-pulse ml-1">▁</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side — Sign In Form (light) */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 sm:px-8 py-10 sm:py-12 bg-ai-bg">
        {/* Mobile brand header (visible only under lg) */}
        <div className="lg:hidden w-full max-w-md mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-ai-tile bg-ai-primary/10 border border-ai-primary/20 flex items-center justify-center">
              <Shield className="w-[18px] h-[18px] text-ai-primary" />
            </div>
            <span className="text-[20px] font-bold tracking-tight">
              <span className="text-ai-ink">Armor</span>
              <span className="text-ai-primary">Innovate</span>
            </span>
          </Link>
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-ai-primary mb-2">
            IEC 62443 · ICS Security
          </p>
          <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ai-ink">
            The operating system for{' '}
            <span className="text-ai-primary">OT defenders</span>.
          </h1>
        </div>

        <div className="w-full max-w-md">

          <SignIn
            appearance={{
              variables: {
                colorPrimary: '#0B1F3A',
                colorText: '#0F172A',
                colorTextSecondary: '#475569',
                colorBackground: '#FFFFFF',
                colorInputBackground: '#FFFFFF',
                colorInputText: '#0F172A',
                colorTextOnPrimaryBackground: '#FFFFFF',
                borderRadius: '0.5rem',
                fontFamily: 'inherit',
              },
              elements: {
                rootBox: 'w-full',
                card: 'bg-white border border-ai-line rounded-ai-card shadow-xl px-6 py-8 sm:px-8',
                headerTitle: 'text-ai-ink text-[22px] font-bold',
                headerSubtitle: 'text-ai-ink-soft text-[13px]',
                formFieldLabel: 'text-ai-ink text-[12.5px] font-medium',
                formFieldInput:
                  'bg-white border border-ai-line text-ai-ink placeholder:text-ai-ink-dim focus:border-ai-primary focus:ring-2 focus:ring-ai-primary/15 rounded-md transition-all',
                formButtonPrimary:
                  'bg-ai-primary hover:bg-ai-primary-hover text-white font-bold rounded-md transition-all normal-case text-[14px] py-2.5 shadow-sm',
                footerActionLink: 'text-ai-primary hover:text-ai-primary-hover font-semibold',
                socialButtonsBlockButton:
                  'bg-white border border-ai-line text-ai-ink hover:bg-ai-bg-soft hover:border-ai-line-strong rounded-md transition-all normal-case',
                socialButtonsBlockButtonText: 'text-ai-ink font-medium',
                socialButtonsProviderIcon: 'opacity-100',
                dividerLine: 'bg-ai-line',
                dividerText: 'text-ai-ink-dim text-[11px] uppercase tracking-wider',
                formFieldInputShowPasswordButton: 'text-ai-ink-dim hover:text-ai-primary',
                identityPreviewEditButton: 'text-ai-primary hover:text-ai-primary-hover',
                formResendCodeLink: 'text-ai-primary hover:text-ai-primary-hover',
                otpCodeFieldInput: 'bg-white border-ai-line text-ai-ink',
                footer: 'bg-transparent',
                footerAction: 'bg-transparent',
                footerActionText: 'text-ai-ink-soft text-[12.5px]',
                formFieldAction: 'text-ai-primary hover:text-ai-primary-hover',
              },
            }}
          />

          <p className="mt-6 text-center text-[12px] text-ai-ink-soft">
            By signing in you agree to our{' '}
            <Link href="/terms" className="text-ai-ink hover:text-ai-primary transition-colors underline underline-offset-2 decoration-ai-line">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-ai-ink hover:text-ai-primary transition-colors underline underline-offset-2 decoration-ai-line">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
