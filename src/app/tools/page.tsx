/**
 * Tools hub index. Grouped by job-to-be-done so a practitioner landing
 * here sees what to open first instead of a flat wall of cards. Same
 * tiles as before; the only change is the IA around them.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Nav } from '@/components/Nav';
import {
  RedesignFooter,
  LightSection,
  CategoryLabel,
  SectionHeading,
} from '@/components/redesign';
import { TOOL_GROUPS, type ToolCard, type ToolGroup } from '@/lib/tools-catalog';

export const metadata: Metadata = {
  title: 'Tools',
  description:
    'Practitioner tools for sustainability reporting. Emission Factors, Carbon Market Intelligence, Supplier SBTi Tracker, Prompt Library, and more.',
  alternates: { canonical: '/tools' },
  openGraph: {
    type: 'website',
    url: '/tools',
    title: 'Tools',
    description:
      'Practitioner tools for sustainability reporting, built on verified data.',
  },
  robots: { index: true, follow: true },
};

export default function ToolsHubPage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen bg-gt-pale text-gt-text">
        <LightSection padding="lg" variant="pale">
          <div className="max-w-3xl">
            <CategoryLabel>Tools</CategoryLabel>
            <SectionHeading size="hero" as="h1" className="mt-3">
              Tools for sustainability practitioners
            </SectionHeading>
            <p className="mt-4 text-lg text-gt-text-muted">
              Greentryst tools share one backbone: every number carries a
              source, a vintage, and a one-click citation. Pick the group
              that matches the job in front of you.
            </p>
          </div>

          <div className="mt-14 space-y-16">
            {TOOL_GROUPS.map((group) => (
              <ToolGroupBlock key={group.id} group={group} />
            ))}
          </div>
        </LightSection>
      </main>
      <RedesignFooter />
    </>
  );
}

function ToolGroupBlock({ group }: { group: ToolGroup }) {
  return (
    <section aria-labelledby={`group-${group.id}`}>
      {/* Thin leaf-green mark above the header, mirrors the footer rhythm */}
      <div className="h-px w-10 bg-gt-leaf/70 mb-4" aria-hidden />
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.22em] font-mono text-gt-medium">
          {group.eyebrow}
        </span>
        <h2
          id={`group-${group.id}`}
          className="text-[22px] sm:text-[26px] font-bold tracking-gt-tight text-gt-text max-w-2xl"
        >
          {group.title}
        </h2>
        <p className="text-sm text-gt-text-muted max-w-2xl">{group.intent}</p>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {group.tools.map((t) => (
          <ToolCardView key={t.id} tool={t} />
        ))}
      </div>
    </section>
  );
}

function ToolCardView({ tool }: { tool: ToolCard }) {
  const Icon = tool.icon;
  const inner = (
    <div className="group rounded-2xl bg-white border border-gt-border-light shadow-gt-card p-6 h-full flex flex-col">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gt-medium/10 flex items-center justify-center">
          <Icon
            className="h-5 w-5 text-gt-medium"
            aria-hidden
            strokeWidth={2}
          />
        </div>
        {tool.status === 'soon' && (
          <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-gt-text-dim">
            Coming soon
          </span>
        )}
      </div>
      <h3 className="mt-4 text-xl font-bold tracking-gt-tight text-gt-text">
        {tool.title}
      </h3>
      <p className="mt-2 text-sm text-gt-text-muted flex-1">
        {tool.description}
      </p>
      <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-gt-medium group-hover:gap-2.5 transition-all">
        {tool.cta}
        {tool.status === 'live' && <ArrowRight className="h-4 w-4" aria-hidden />}
      </div>
    </div>
  );
  if (tool.href) {
    return (
      <Link href={tool.href} className="block">
        {inner}
      </Link>
    );
  }
  return <div className="opacity-80">{inner}</div>;
}
