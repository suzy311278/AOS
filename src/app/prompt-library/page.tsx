/**
 * Prompt Library index — browsable directory of every sustainability
 * prompt the team has authored. Free to browse; copying raw prompts is
 * anonymous; only the personalisation form on each detail page is gated.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { loadAllPrompts } from '@/lib/prompt-library/loader';
import { Nav } from '@/components/Nav';
import {
  RedesignFooter,
  LightSection,
  CategoryLabel,
  SectionHeading,
} from '@/components/redesign';

export const metadata: Metadata = {
  title: 'Sustainability Prompt Library',
  description:
    'Free, detailed prompts for drafting ESG reports, CDP responses, DJSI CSA answers, BRSR indicators. Professional voice, no AI tells, every prompt reviewed by a practitioner.',
  alternates: { canonical: '/prompt-library' },
  openGraph: {
    type: 'website',
    url: '/prompt-library',
    title: 'Sustainability Prompt Library',
    description:
      'Detailed, practitioner-reviewed prompts for ESG, CDP, DJSI, and BRSR work. Free to copy.',
  },
  robots: { index: true, follow: true },
};

export default function PromptLibraryIndex() {
  const prompts = loadAllPrompts();

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-gt-pale text-gt-text">
        <LightSection padding="lg" variant="pale">
          <div className="max-w-3xl">
            <CategoryLabel>Prompt library</CategoryLabel>
            <SectionHeading size="hero" as="h1" className="mt-3">
              Prompts that do the work
            </SectionHeading>
            <p className="mt-4 text-lg text-gt-text-muted">
              Detailed, opinionated prompts for the writing that eats a
              sustainability practitioner&apos;s afternoon: ESG report sections,
              CDP responses, DJSI / S&amp;P CSA answers, BRSR indicators. Each
              prompt is reviewed by a practitioner and tuned to the voice that
              scorers, regulators, and audit committees actually accept. Free
              to copy. Sign in to personalise with your company context.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {prompts.map((p) => (
              <Link
                key={p.slug}
                href={`/prompt-library/${p.slug}`}
                className="block group rounded-2xl bg-white border border-gt-border-light shadow-gt-card p-6 h-full transition-all hover:shadow-lg hover:border-gt-medium/30"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#e6f3f1] flex items-center justify-center shrink-0">
                    <Sparkles
                      className="h-5 w-5 text-[#005c55]"
                      aria-hidden
                      strokeWidth={2}
                    />
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-gt-text-dim">
                    {p.framework}
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-bold tracking-gt-tight text-gt-text">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm text-gt-text-muted">
                  {p.short_description}
                </p>
                <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#005c55] group-hover:gap-2.5 transition-all">
                  Open prompt
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </div>
              </Link>
            ))}
          </div>

          <p className="mt-10 text-sm text-gt-text-muted max-w-2xl">
            New prompts land every few weeks. If there is a sustainability
            writing task you want a prompt for, write to us at{' '}
            <a
              href="mailto:hello@greentryst.com"
              className="text-[#005c55] font-semibold"
            >
              hello@greentryst.com
            </a>
            . A real person reads every message.
          </p>
        </LightSection>
      </main>
      <RedesignFooter />
    </>
  );
}
