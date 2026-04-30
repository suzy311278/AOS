/**
 * Nav
 *
 * Fixed top navigation bar. Two tone variants:
 * - "light" (default): pale/translucent with dark text, for light pages
 * - "dark": dark/translucent with light text, for pages that start with a
 *   dark hero
 *
 * Supports signed-in and signed-out auth state variants. Below `md`, the
 * primary nav collapses into a hamburger that opens a full-screen drawer
 * with the full site map so phone visitors don't lose the IA.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, useUser } from '@clerk/nextjs';
import { ChevronDown, Menu, X, ArrowRight } from 'lucide-react';
import { cn } from '@/components/redesign/lib/cn';
import { Logo } from '@/components/redesign/Logo';
import { TOOL_GROUPS } from '@/lib/tools-catalog';

type NavLink = {
  label: string;
  href: string;
  matchPrefix?: string;
};

const NAV_LINKS: NavLink[] = [
  { label: 'Learn', href: '/courses', matchPrefix: '/courses' },
  { label: 'Tools', href: '/tools', matchPrefix: '/tools' },
  { label: 'SustainIQ', href: '/ask', matchPrefix: '/ask' },
  { label: 'Jobs', href: '/jobs', matchPrefix: '/jobs' },
  { label: 'Services', href: '/services', matchPrefix: '/services' },
  { label: 'Pricing', href: '/pricing', matchPrefix: '/pricing' },
];

export interface NavProps {
  /** Visual tone. Use "dark" when the page hero is a dark section. */
  tone?: 'light' | 'dark';
  /** Brand link destination */
  brandHref?: string;
  className?: string;
}

export function Nav({
  tone = 'light',
  brandHref = '/',
  className,
}: NavProps) {
  const pathname = usePathname() || '';
  const { isSignedIn } = useUser();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isDark = tone === 'dark';

  // Close drawer on route change so navigation always feels clean.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Prevent body scroll while drawer is open; restore on close.
  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [drawerOpen]);

  const navBg = isDark
    ? 'bg-gt-text-dark/90 border-b border-white/5'
    : 'bg-white/90 border-b border-gt-border-light';

  const linkBase = isDark
    ? 'text-white hover:text-white/80'
    : 'text-gt-text-muted hover:text-gt-medium';
  const linkActive = isDark
    ? 'text-white border-b-2 border-white pb-1'
    : 'text-gt-medium border-b-2 border-gt-medium pb-1';
  const secondaryText = isDark
    ? 'text-white hover:text-white/80'
    : 'text-gt-text-muted hover:text-gt-medium';
  const hamburger = isDark
    ? 'text-white hover:bg-white/10'
    : 'text-gt-text hover:bg-gt-border-light/60';

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 inset-x-0 z-50 backdrop-blur-md',
          navBg,
          className,
        )}
      >
        <div className="flex justify-between items-center px-4 sm:px-8 py-4 max-w-[1280px] mx-auto">
          <Logo
            variant={isDark ? 'dark' : 'light'}
            size="sm"
            href={brandHref}
          />

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => {
              const isActive = link.matchPrefix
                ? pathname.startsWith(link.matchPrefix)
                : pathname === link.href;
              if (link.label === 'Tools') {
                return (
                  <ToolsMenu
                    key={link.href}
                    isActive={isActive}
                    linkBase={linkBase}
                    linkActive={linkActive}
                    isDark={isDark}
                  />
                );
              }
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'text-sm font-semibold transition-colors',
                    isActive ? linkActive : linkBase,
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            {/* Desktop auth */}
            <div className="hidden md:flex items-center gap-6">
              {isSignedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    className={cn(
                      'text-sm font-semibold transition-colors',
                      secondaryText,
                    )}
                  >
                    Dashboard
                  </Link>
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: cn(
                          'w-9 h-9 border transition-colors',
                          isDark
                            ? 'border-gt-mint/30 hover:border-gt-mint'
                            : 'border-gt-medium/30 hover:border-gt-medium',
                        ),
                        userButtonPopoverCard: 'shadow-xl',
                      },
                    }}
                  />
                </>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    className={cn(
                      'text-sm font-semibold transition-colors',
                      secondaryText,
                    )}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    className="bg-gt-medium text-gt-text-light px-5 py-2 rounded-lg text-sm font-semibold hover:bg-gt-dark transition-colors"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile: signed-in avatar stays visible; signed-out gets a single
                 Sign In CTA alongside the hamburger. The hamburger is
                 shrink-0 so Clerk's UserButton can never push it off-screen,
                 and the UserButton wrapper is width-constrained to the
                 avatar so the Clerk trigger cannot grow past its visual box. */}
            <div className="flex md:hidden items-center gap-3 shrink-0">
              {isSignedIn ? (
                <div className="w-8 h-8 shrink-0">
                  <UserButton
                    afterSignOutUrl="/"
                    showName={false}
                    appearance={{
                      elements: {
                        rootBox: 'w-8 h-8',
                        userButtonTrigger: 'w-8 h-8 focus:shadow-none',
                        avatarBox: cn(
                          'w-8 h-8 border transition-colors',
                          isDark
                            ? 'border-gt-mint/30'
                            : 'border-gt-medium/30',
                        ),
                      },
                    }}
                  />
                </div>
              ) : (
                <Link
                  href="/sign-in"
                  className={cn(
                    'text-sm font-semibold transition-colors shrink-0',
                    secondaryText,
                  )}
                >
                  Sign In
                </Link>
              )}

              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className={cn(
                  'p-2 rounded-lg transition-colors shrink-0',
                  hamburger,
                )}
                aria-label="Open menu"
                aria-expanded={drawerOpen}
                aria-controls="mobile-nav-drawer"
              >
                <Menu className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div
        id="mobile-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        className={cn(
          'md:hidden fixed inset-0 z-[60] transition-opacity duration-200',
          drawerOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none',
        )}
      >
        {/* Backdrop */}
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setDrawerOpen(false)}
          className="absolute inset-0 bg-gt-text-dark/60 backdrop-blur-sm"
        />

        {/* Panel */}
        <div
          className={cn(
            'absolute top-0 right-0 h-full w-[85%] max-w-sm bg-white text-gt-text shadow-gt-card-lg transition-transform duration-200 flex flex-col',
            drawerOpen ? 'translate-x-0' : 'translate-x-full',
          )}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gt-border-light">
            <Logo variant="light" size="sm" href={brandHref} />
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="p-2 rounded-lg text-gt-text hover:bg-gt-border-light/60 transition-colors"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-5 py-6">
            <ul className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => {
                const isActive = link.matchPrefix
                  ? pathname.startsWith(link.matchPrefix)
                  : pathname === link.href;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        'flex items-center justify-between py-3 px-3 rounded-lg text-base font-semibold transition-colors',
                        isActive
                          ? 'bg-gt-medium/10 text-gt-medium'
                          : 'text-gt-text hover:bg-gt-border-light/40',
                      )}
                      onClick={() => setDrawerOpen(false)}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 pt-6 border-t border-gt-border-light">
              <ul className="flex flex-col gap-1">
                <li>
                  <Link
                    href="/frameworks"
                    className="flex items-center py-3 px-3 rounded-lg text-sm font-semibold text-gt-text-muted hover:bg-gt-border-light/40 transition-colors"
                    onClick={() => setDrawerOpen(false)}
                  >
                    Frameworks
                  </Link>
                </li>
                <li>
                  <Link
                    href="/guides"
                    className="flex items-center py-3 px-3 rounded-lg text-sm font-semibold text-gt-text-muted hover:bg-gt-border-light/40 transition-colors"
                    onClick={() => setDrawerOpen(false)}
                  >
                    Guides
                  </Link>
                </li>
                <li>
                  <Link
                    href="/glossary"
                    className="flex items-center py-3 px-3 rounded-lg text-sm font-semibold text-gt-text-muted hover:bg-gt-border-light/40 transition-colors"
                    onClick={() => setDrawerOpen(false)}
                  >
                    Glossary
                  </Link>
                </li>
                {isSignedIn && (
                  <li>
                    <Link
                      href="/dashboard"
                      className="flex items-center py-3 px-3 rounded-lg text-sm font-semibold text-gt-text-muted hover:bg-gt-border-light/40 transition-colors"
                      onClick={() => setDrawerOpen(false)}
                    >
                      Dashboard
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          </nav>

          {!isSignedIn && (
            <div className="px-5 py-4 border-t border-gt-border-light">
              <Link
                href="/sign-up"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-center w-full bg-gt-medium text-gt-text-light px-5 py-3 rounded-lg text-sm font-semibold hover:bg-gt-dark transition-colors"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/**
 * Desktop Tools mega-menu.
 *
 * Hover, focus, or click the trigger to reveal a panel with the four
 * JTBD groups and one-click deep links to every live tool. The label
 * itself still navigates to /tools (the hub) for users who want the
 * full grouped view; the chevron / panel exposes direct access.
 *
 * Close triggers: mouse leaves the wrapper, Escape key, click outside
 * the wrapper. Announces via aria-expanded / aria-haspopup="menu".
 */
function ToolsMenu({
  isActive,
  linkBase,
  linkActive,
  isDark,
}: {
  isActive: boolean;
  linkBase: string;
  linkActive: string;
  isDark: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  // Focus management: open when any descendant gains focus, close when
  // focus leaves the wrapper entirely.
  const handleFocus = () => setOpen(true);
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!wrapperRef.current) return;
    if (!wrapperRef.current.contains(e.relatedTarget as Node | null)) {
      setOpen(false);
    }
  };

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <div className="flex items-center gap-1">
        <Link
          href="/tools"
          className={cn(
            'text-sm font-semibold transition-colors',
            isActive ? linkActive : linkBase,
          )}
        >
          Tools
        </Link>
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="Open Tools menu"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'p-0.5 rounded transition-colors',
            isDark ? 'text-white/70 hover:text-white' : 'text-gt-text-dim hover:text-gt-medium',
          )}
        >
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 transition-transform',
              open ? 'rotate-180' : 'rotate-0',
            )}
            strokeWidth={2.5}
          />
        </button>
      </div>

      {/* Invisible bridge so the cursor can travel from trigger to panel
           without the panel closing. */}
      <div
        aria-hidden
        className={cn(
          'absolute left-0 right-0 top-full h-3',
          open ? 'block' : 'hidden',
        )}
      />

      <div
        role="menu"
        aria-label="Tools"
        className={cn(
          'absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[720px] max-w-[92vw] rounded-2xl bg-white shadow-gt-card-lg ring-1 ring-black/5 overflow-hidden transition-all duration-150 origin-top',
          open
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-[0.98] pointer-events-none',
        )}
      >
        <div className="grid grid-cols-2 gap-0">
          {TOOL_GROUPS.map((group, idx) => (
            <div
              key={group.id}
              className={cn(
                'p-5',
                idx % 2 === 0 ? 'border-r border-gt-border-light/70' : '',
                idx < TOOL_GROUPS.length - 2
                  ? 'border-b border-gt-border-light/70'
                  : '',
              )}
            >
              <div className="h-px w-6 bg-gt-leaf/70 mb-2.5" aria-hidden />
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] font-mono text-gt-medium">
                {group.eyebrow}
              </div>
              <ul className="mt-3 space-y-1">
                {group.tools.map((t) => {
                  const Icon = t.icon;
                  if (t.href) {
                    return (
                      <li key={t.id}>
                        <Link
                          href={t.href}
                          role="menuitem"
                          className="group flex items-start gap-3 rounded-lg px-2.5 py-2 hover:bg-gt-pale transition-colors"
                        >
                          <div className="h-7 w-7 rounded-md bg-gt-medium/10 flex items-center justify-center shrink-0 mt-0.5">
                            <Icon
                              className="h-3.5 w-3.5 text-gt-medium"
                              aria-hidden
                              strokeWidth={2}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-gt-text flex items-center gap-1.5">
                              {t.title}
                              <ArrowRight
                                className="h-3 w-3 text-gt-medium opacity-0 -translate-x-0.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
                                aria-hidden
                              />
                            </div>
                            <p className="text-[12px] text-gt-text-muted leading-snug line-clamp-2">
                              {shortDescription(t.description)}
                            </p>
                          </div>
                        </Link>
                      </li>
                    );
                  }
                  return (
                    <li key={t.id}>
                      <div
                        role="menuitem"
                        aria-disabled="true"
                        className="flex items-start gap-3 rounded-lg px-2.5 py-2 opacity-60 cursor-default"
                      >
                        <div className="h-7 w-7 rounded-md bg-gt-border-light flex items-center justify-center shrink-0 mt-0.5">
                          <Icon
                            className="h-3.5 w-3.5 text-gt-text-dim"
                            aria-hidden
                            strokeWidth={2}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gt-text-muted flex items-center gap-2">
                            {t.title}
                            <span className="text-[9px] font-bold uppercase tracking-[0.18em] px-1.5 py-0.5 rounded-full bg-gt-border-light text-gt-text-dim">
                              Soon
                            </span>
                          </div>
                          <p className="text-[12px] text-gt-text-dim leading-snug line-clamp-2">
                            {shortDescription(t.description)}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-gt-border-light/70 bg-gt-pale flex items-center justify-between">
          <span className="text-[11px] text-gt-text-dim">
            Pick the group that matches the job in front of you.
          </span>
          <Link
            href="/tools"
            role="menuitem"
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-gt-medium hover:gap-1.5 transition-all"
          >
            Browse all tools
            <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Strip the marketing tail from a tool description so the menu stays
 * scannable. Takes the first sentence (up to the first period) or
 * truncates if no period appears in the first ~90 chars.
 */
function shortDescription(raw: string): string {
  const firstSentenceEnd = raw.indexOf('. ');
  if (firstSentenceEnd > 0 && firstSentenceEnd < 120) {
    return raw.slice(0, firstSentenceEnd + 1);
  }
  if (raw.length > 100) return raw.slice(0, 97).trimEnd() + '…';
  return raw;
}
