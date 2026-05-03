/**
 * /sign-in - Sign In Page
 *
 * ArmorInnovate terminal-themed Clerk SignIn page.
 */

import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Shield, Terminal, Lock, Wifi } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to ArmorInnovate — IEC 62443 cybersecurity training platform.',
  alternates: { canonical: '/sign-in' },
  robots: { index: false, follow: true },
};

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-ai-deep flex">
      {/* Left side - Terminal-themed branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-ai-deep-2">
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

        <div className="relative z-10 flex flex-col justify-center px-14 py-16">
          {/* Brand */}
          <Link href="/" className="mb-10 inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-ai-tile bg-ai-cyber/10 border border-ai-cyber/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-ai-cyber" />
            </div>
            <span className="text-[24px] font-extrabold tracking-tight">
              <span className="text-white">Armor</span>
              <span className="text-ai-cyber">Innovate</span>
            </span>
          </Link>

          {/* Terminal window */}
          <div className="rounded-ai-card border border-ai-line-deep bg-[#0a0f1a] overflow-hidden mb-8 shadow-2xl">
            {/* Title bar */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-ai-line-deep bg-[#0d1321]">
              <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <span className="w-3 h-3 rounded-full bg-[#28c840]" />
              <span className="ml-3 text-[11px] text-ai-ink-on-deep-dim font-mono">
                armor@ics-lab:~
              </span>
            </div>
            {/* Terminal content */}
            <div className="p-5 font-mono text-[13px] leading-[1.8] text-ai-ink-on-deep-soft">
              <p>
                <span className="text-ai-cyber">$</span>{' '}
                <span className="text-ai-ink-on-deep">whoami</span>
              </p>
              <p className="text-ai-ok">iec62443-operator</p>

              <p className="mt-2">
                <span className="text-ai-cyber">$</span>{' '}
                <span className="text-ai-ink-on-deep">cat /etc/armor/status</span>
              </p>
              <p>
                <span className="text-ai-ink-on-deep-dim">[</span>
                <span className="text-ai-ok">ONLINE</span>
                <span className="text-ai-ink-on-deep-dim">]</span>{' '}
                Training platform active
              </p>
              <p>
                <span className="text-ai-ink-on-deep-dim">[</span>
                <span className="text-ai-ok">ONLINE</span>
                <span className="text-ai-ink-on-deep-dim">]</span>{' '}
                Lab simulators ready
              </p>
              <p>
                <span className="text-ai-ink-on-deep-dim">[</span>
                <span className="text-ai-warn">ALERT</span>
                <span className="text-ai-ink-on-deep-dim">]</span>{' '}
                3 new CISA ICS advisories
              </p>

              <p className="mt-2">
                <span className="text-ai-cyber">$</span>{' '}
                <span className="text-ai-ink-on-deep">armor --authenticate</span>
              </p>
              <p className="text-ai-cyber animate-pulse">▊</p>
            </div>
          </div>

          {/* Feature badges */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Terminal className="w-4 h-4 text-ai-cyber" />
              <span className="text-[13px] text-ai-ink-on-deep-soft">
                Hands-on labs — Modbus, S7comm, EtherNet/IP
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-ai-cyber" />
              <span className="text-[13px] text-ai-ink-on-deep-soft">
                IEC 62443 certification — Foundations to Expert
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Wifi className="w-4 h-4 text-ai-cyber" />
              <span className="text-[13px] text-ai-ink-on-deep-soft">
                Live vulnerability intelligence feed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Sign In Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 bg-ai-deep">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Shield className="w-6 h-6 text-ai-cyber" />
              <span className="text-[22px] font-extrabold tracking-tight">
                <span className="text-white">Armor</span>
                <span className="text-ai-cyber">Innovate</span>
              </span>
            </Link>
          </div>

          <SignIn
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'bg-ai-deep-2 border border-ai-line-deep rounded-ai-card shadow-2xl',
                headerTitle: 'text-white font-bold',
                headerSubtitle: 'text-ai-ink-on-deep-dim',
                formFieldLabel: 'text-ai-ink-on-deep-soft text-[13px]',
                formFieldInput:
                  'bg-[#0a0f1a] border-ai-line-deep text-white placeholder:text-ai-ink-on-deep-dim focus:border-ai-cyber focus:ring-ai-cyber/30 rounded-ai-tile',
                formButtonPrimary:
                  'bg-ai-cyber hover:bg-ai-cyber-glow hover:text-ai-deep text-ai-deep font-bold rounded-ai-tile transition-all',
                footerActionLink: 'text-ai-cyber hover:text-ai-cyber-glow',
                socialButtonsBlockButton:
                  'bg-[#0a0f1a] border-ai-line-deep text-ai-ink-on-deep-soft hover:bg-ai-grid hover:border-ai-cyber/30 rounded-ai-tile',
                socialButtonsBlockButtonText: 'text-ai-ink-on-deep-soft',
                dividerLine: 'bg-ai-line-deep',
                dividerText: 'text-ai-ink-on-deep-dim',
                formFieldInputShowPasswordButton: 'text-ai-ink-on-deep-dim hover:text-ai-cyber',
                identityPreviewEditButton: 'text-ai-cyber hover:text-ai-cyber-glow',
                formResendCodeLink: 'text-ai-cyber hover:text-ai-cyber-glow',
                otpCodeFieldInput: 'bg-[#0a0f1a] border-ai-line-deep text-white',
                footer: 'bg-transparent',
                footerAction: 'bg-transparent',
                footerActionText: 'text-ai-ink-on-deep-dim',
              },
            }}
          />

          <p className="mt-8 text-center text-[12px] text-ai-ink-on-deep-dim font-mono">
            Don&apos;t have an account?{' '}
            <Link href="/sign-up" className="font-bold text-ai-cyber hover:text-ai-cyber-glow transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
