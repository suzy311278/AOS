/**
 * ArmorNav — top navigation for the ArmorInnovate landing.
 *
 * IA: Knowledge Base · Lab Environment · Certification Path · Vulnerability Intelligence
 * Style: white surface, mono eyebrow, blue active underline, square corners.
 * Auth state: pulls from Clerk if available, otherwise renders Sign In.
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, useUser } from '@clerk/nextjs';
import { Menu, X, Briefcase } from 'lucide-react';
import { cn } from './lib/cn';
import { IconShield, IconTerminal, IconNetwork, IconVuln } from './ScadaIcons';

const NAV_LINKS: {
  label: string;
  href: string;
  matchPrefix: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { label: 'Knowledge Base',           href: '/knowledge',     matchPrefix: '/knowledge',     Icon: IconShield },
  { label: 'Lab Environment',          href: '/labs',          matchPrefix: '/labs',          Icon: IconTerminal },
  { label: 'Certification Path',       href: '/certification', matchPrefix: '/certification', Icon: IconNetwork },
  { label: 'Vulnerability Intelligence', href: '/intel',       matchPrefix: '/intel',         Icon: IconVuln },
  { label: 'Jobs',                        href: '/jobs',        matchPrefix: '/jobs',          Icon: Briefcase },
];

export interface ArmorNavProps {
  tone?: 'light' | 'deep';
  className?: string;
}

export function ArmorNav({ tone = 'light', className }: ArmorNavProps) {
  const pathname = usePathname() || '';
  const { isSignedIn } = useUser();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isDeep = tone === 'deep';

  useEffect(() => setDrawerOpen(false), [pathname]);
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [drawerOpen]);

  const surface = isDeep
    ? 'bg-ai-deep/85 border-b border-ai-line-deep'
    : 'bg-ai-bg/90 border-b border-ai-line';

  const linkBase = isDeep
    ? 'text-ai-ink-on-deep-soft hover:text-ai-ink-on-deep'
    : 'text-ai-ink-soft hover:text-ai-primary';

  const linkActive = isDeep
    ? 'text-ai-cyber-glow border-b-2 border-ai-cyber pb-1'
    : 'text-ai-primary border-b-2 border-ai-primary pb-1';

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 inset-x-0 z-50 backdrop-blur-md',
          surface,
          className,
        )}
      >
        <div className="flex items-center justify-between gap-4 px-4 sm:px-8 py-3.5 max-w-[1280px] mx-auto">
          {/* Brand */}
          <Link
            href="/"
            className={cn(
              'flex items-center gap-2.5 font-ai-mono font-bold tracking-ai-mono',
              isDeep ? 'text-ai-ink-on-deep' : 'text-ai-ink',
            )}
            aria-label="ArmorInnovate home"
          >
            <span
              className={cn(
                'inline-flex items-center justify-center h-7 w-7 rounded-ai-tile',
                isDeep
                  ? 'bg-ai-cyber/15 text-ai-cyber-glow ring-1 ring-ai-cyber/40'
                  : 'bg-ai-primary/10 text-ai-primary ring-1 ring-ai-primary/30',
              )}
              aria-hidden
            >
              <IconShield className="h-4 w-4" />
            </span>
            <span className="text-[15px] tracking-tight">
              ArmorInnovate<span className={isDeep ? 'text-ai-cyber-glow' : 'text-ai-accent'}>.OS</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-7">
            {NAV_LINKS.map((link) => {
              const isActive = pathname.startsWith(link.matchPrefix);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'group flex items-center gap-2 text-[13px] font-semibold transition-colors',
                    isActive ? linkActive : linkBase,
                  )}
                >
                  <link.Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="hidden md:flex items-center gap-5">
              {isSignedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    className={cn('text-[13px] font-semibold transition-colors', linkBase)}
                  >
                    Dashboard
                  </Link>
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: cn(
                          'w-8 h-8 border transition-colors',
                          isDeep
                            ? 'border-ai-cyber/30 hover:border-ai-cyber'
                            : 'border-ai-primary/30 hover:border-ai-primary',
                        ),
                      },
                    }}
                  />
                </>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    className={cn('text-[13px] font-semibold transition-colors', linkBase)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-ai-tile text-[12.5px] font-bold font-ai-mono uppercase tracking-ai-mono transition-colors',
                      isDeep
                        ? 'bg-ai-cyber text-ai-deep hover:bg-ai-cyber-glow'
                        : 'bg-ai-primary text-white hover:bg-ai-primary-hover',
                    )}
                  >
                    Get Access
                  </Link>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className={cn(
                'lg:hidden p-2 rounded-ai-tile transition-colors shrink-0',
                isDeep
                  ? 'text-ai-ink-on-deep hover:bg-white/5'
                  : 'text-ai-ink hover:bg-ai-bg-mute',
              )}
              aria-label="Open menu"
              aria-expanded={drawerOpen}
              aria-controls="armor-mobile-drawer"
            >
              <Menu className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div
        id="armor-mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="ArmorInnovate navigation"
        className={cn(
          'lg:hidden fixed inset-0 z-[60] transition-opacity duration-200',
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
      >
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setDrawerOpen(false)}
          className="absolute inset-0 bg-ai-deep/70 backdrop-blur-sm"
        />
        <div
          className={cn(
            'absolute top-0 right-0 h-full w-[88%] max-w-sm bg-ai-bg text-ai-ink shadow-ai-card-deep transition-transform duration-200 flex flex-col',
            drawerOpen ? 'translate-x-0' : 'translate-x-full',
          )}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-ai-line">
            <span className="font-ai-mono font-bold text-ai-ink">
              ArmorInnovate<span className="text-ai-accent">.OS</span>
            </span>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="p-2 rounded-ai-tile text-ai-ink hover:bg-ai-bg-mute transition-colors"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="flex flex-col gap-0.5">
              {NAV_LINKS.map((link) => {
                const isActive = pathname.startsWith(link.matchPrefix);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setDrawerOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-3 rounded-ai-tile text-[14px] font-semibold transition-colors',
                        isActive
                          ? 'bg-ai-accent-soft text-ai-primary'
                          : 'text-ai-ink hover:bg-ai-bg-mute',
                      )}
                    >
                      <link.Icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          {!isSignedIn && (
            <div className="px-5 py-4 border-t border-ai-line">
              <Link
                href="/sign-up"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-center w-full bg-ai-primary text-white px-4 py-3 rounded-ai-tile text-[13px] font-bold font-ai-mono uppercase tracking-ai-mono hover:bg-ai-primary-hover transition-colors"
              >
                Get Access
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
