/**
 * RedesignFooter
 *
 * Five-column footer with a centered Courses spotlight, tuned for a
 * premium editorial feel:
 *   - Thin green divider marks above each column header
 *   - Mono uppercase headers with wider letter-spacing
 *   - Subtle hover underline for links
 *   - Live status dot in the brand column
 *   - "Browse all courses" rendered as a green CTA with an arrow
 */

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/components/redesign/lib/cn';
import { Logo } from '@/components/redesign/Logo';

// A footer entry is either a real destination (href + optional badge) or a
// placeholder with no href. Placeholder entries render as non-clickable
// labels with a "Soon" badge so the footer never redirects visitors to
// pages that don't cover what the label promises.
type FooterLink = { label: string; href?: string; badge?: string };

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

const PLATFORM_COLUMN: FooterColumn = {
  title: 'Platform',
  links: [
    { label: 'Knowledge Base', href: '/knowledge' },
    { label: 'Hands-on Labs', href: '/labs' },
    { label: 'Certification', href: '/certification' },
    { label: 'Threat Intel', href: '/intel' },
    { label: 'Jobs Board', href: '/jobs' },
  ],
};

const TRAINING_COLUMN: FooterColumn = {
  title: 'Training',
  links: [
    { label: 'IEC 62443 Fundamentals', href: '/courses' },
    { label: 'OT Pentesting', href: '/labs' },
    { label: 'Modbus & S7comm', href: '/labs' },
    { label: 'SCADA Defense', href: '/labs' },
    { label: 'ICS-CERT Advisories', href: '/intel' },
  ],
};

const RESOURCES_COLUMN: FooterColumn = {
  title: 'Resources',
  links: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Documentation', href: '/docs', badge: 'Soon' },
    { label: 'Changelog', badge: 'Soon' },
  ],
};

const COMPANY_COLUMN: FooterColumn = {
  title: 'Company',
  links: [
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
  ],
};

export interface RedesignFooterProps {
  className?: string;
}

export function RedesignFooter({ className }: RedesignFooterProps) {
  return (
    <footer
      className={cn(
        'relative bg-gt-text-dark text-gt-text-light border-t border-gt-medium/20 pt-20 pb-10',
        className
      )}
    >
      {/* Very subtle radial glow for premium depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(600px 200px at 50% 0%, rgba(34, 211, 238, 0.06), transparent 70%)',
        }}
      />

      <div className="relative max-w-[1280px] mx-auto px-8">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-10 md:gap-8 mb-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3">
            <Logo variant="dark" size="lg" href="/" />
            <p className="mt-4 text-sm text-white/60 leading-relaxed max-w-xs">
              The professional operating system for ICS / OT security.
              Learn the standard. Harden the plant. Defend the mission.
            </p>
          </div>

          {/* Platform */}
          <FooterColumnBlock
            column={PLATFORM_COLUMN}
            className="col-span-1 md:col-span-2"
          />

          {/* Training (center spotlight) */}
          <FooterColumnBlock
            column={TRAINING_COLUMN}
            className="col-span-2 md:col-span-3"
            trailing={
              <Link
                href="/labs"
                className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors group"
              >
                Explore all labs
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            }
          />

          {/* Resources */}
          <FooterColumnBlock
            column={RESOURCES_COLUMN}
            className="col-span-1 md:col-span-2"
          />

          {/* Company */}
          <FooterColumnBlock
            column={COMPANY_COLUMN}
            className="col-span-2 md:col-span-2"
          />
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <p
            className="text-[11px] text-white/45 tracking-wider"
            style={{ fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace' }}
          >
            © 2025 ARMORINNOVATE · BUILT FOR OT DEFENDERS
          </p>
          <p
            className="text-[11px] text-white/45 tracking-wider flex items-center gap-3"
            style={{ fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace' }}
          >
            <span>SECURE BY DEFAULT</span>
            <span className="w-1 h-1 rounded-full bg-cyan-400/60" aria-hidden />
            <span>DEFEND WHAT MATTERS</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumnBlock({
  column,
  className,
  trailing,
}: {
  column: FooterColumn;
  className?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className={className}>
      {/* Thin cyan mark above the header */}
      <div className="h-px w-8 bg-cyan-400/60 mb-4" aria-hidden />
      <h3
        className="text-[11px] font-bold uppercase text-cyan-400 mb-5"
        style={{
          letterSpacing: '0.22em',
          fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
        }}
      >
        {column.title}
      </h3>
      <ul className="space-y-3">
        {column.links.map((link) => (
          <li key={link.label}>
            {link.href ? (
              <Link
                href={link.href}
                className="group inline-flex items-center gap-2 text-sm text-white/75 hover:text-white transition-colors"
              >
                <span className="border-b border-transparent group-hover:border-white/40 transition-colors">
                  {link.label}
                </span>
                {link.badge && <Badge>{link.badge}</Badge>}
              </Link>
            ) : (
              // Non-clickable placeholder. We'd rather show "Soon" honestly
              // than route to a page that doesn't cover what the label
              // promises.
              <span
                className="inline-flex items-center gap-2 text-sm text-white/40 cursor-default"
                aria-disabled="true"
              >
                <span>{link.label}</span>
                {link.badge && <Badge>{link.badge}</Badge>}
              </span>
            )}
          </li>
        ))}
      </ul>
      {trailing}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/10"
      style={{ letterSpacing: '0.15em' }}
    >
      {children}
    </span>
  );
}
