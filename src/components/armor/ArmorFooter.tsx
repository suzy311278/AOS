/**
 * ArmorFooter — minimal mono footer.
 *
 * Conventions:
 *  - All linked paths must NOT be in robots.txt Disallow.
 *  - No marketing fluff; this is an OT-security tool's footer.
 */

import Link from 'next/link';
import { IconShield } from './ScadaIcons';

const COLS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: 'Platform',
    links: [
      { label: 'Knowledge Base',  href: '/knowledge' },
      { label: 'Lab Environment', href: '/labs' },
      { label: 'Certification',   href: '/certification' },
      { label: 'Vuln Intelligence', href: '/intel' },
    ],
  },
  {
    heading: 'Standards',
    links: [
      { label: 'IEC 62443-1-1', href: '/knowledge/iec-62443-foundations' },
      { label: 'IEC 62443-3-2', href: '/knowledge/iec-62443-risk-assessment' },
      { label: 'IEC 62443-3-3', href: '/knowledge/iec-62443-design' },
      { label: 'NIST SP 800-82', href: '/knowledge/nist-800-82' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About',     href: '/about' },
      { label: 'Contact',   href: '/contact' },
      { label: 'Pricing',   href: '/pricing' },
      { label: 'Disclaimer', href: '/disclaimer' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms',   href: '/terms' },
      { label: 'Fair Use', href: '/fair-use' },
    ],
  },
];

export function ArmorFooter() {
  return (
    <footer className="border-t border-ai-line bg-ai-bg-soft">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand col */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 font-ai-mono font-bold text-ai-ink">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-ai-tile bg-ai-primary/10 text-ai-primary ring-1 ring-ai-primary/30" aria-hidden>
                <IconShield className="h-3.5 w-3.5" />
              </span>
              <span>ArmorInnovate<span className="text-ai-accent">.OS</span></span>
            </div>
            <p className="mt-3 text-xs text-ai-ink-soft leading-relaxed max-w-[18rem]">
              The operating system for ICS / SCADA security. IEC 62443 certification,
              ICS pentesting, and OT defense — in one disciplined platform.
            </p>
            <div className="mt-4 flex items-center gap-2 text-[10px] font-ai-mono uppercase tracking-ai-eyebrow text-ai-ink-dim">
              <span className="ai-led ai-led--ok" aria-hidden />
              <span>SYSTEMS NOMINAL</span>
            </div>
          </div>

          {COLS.map((col) => (
            <div key={col.heading}>
              <h4 className="text-[10px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-ink-dim">
                {col.heading}
              </h4>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-[13px] text-ai-ink-soft hover:text-ai-primary transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-ai-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] font-ai-mono text-ai-ink-dim">
          <span>© {new Date().getFullYear()} ArmorInnovate Systems · Built for OT defenders</span>
          <span className="uppercase tracking-ai-eyebrow">v0.1.0 · Phase 0 — Foundation</span>
        </div>
      </div>
    </footer>
  );
}
