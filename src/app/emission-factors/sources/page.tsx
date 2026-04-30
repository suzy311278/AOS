/**
 * Sources index - one card per source.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import {
  loadAllSources,
  getFactorsBySourceId,
} from '@/lib/emission-factors/loader';
import { LightSection, CategoryLabel, SectionHeading } from '@/components/redesign';

export const metadata: Metadata = {
  title: 'Sources',
  description:
    'Every publisher, standard, and reference document that feeds the Greentryst emission factor library.',
  alternates: { canonical: '/emission-factors/sources' },
  openGraph: {
    type: 'website',
    url: '/emission-factors/sources',
    title: 'Emission factor sources',
    description:
      'Every publisher, standard, and reference document that feeds the Greentryst emission factor library.',
  },
};

export default function SourcesIndexPage() {
  const sources = loadAllSources();

  return (
    <LightSection padding="lg" variant="pale">
      <div className="max-w-3xl">
        <CategoryLabel>Sources</CategoryLabel>
        <SectionHeading size="sub" className="mt-3">
          Every publisher, every vintage.
        </SectionHeading>
        <p className="mt-4 text-lg text-gt-text-muted">
          Each factor in the library is traceable back to a public, dated
          source. Here is the full list.
        </p>
      </div>

      <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {sources.map((source) => {
          const factorCount = getFactorsBySourceId(source.id).length;
          return (
            <li key={source.id}>
              <Link
                href={`/emission-factors/sources/${source.id}`}
                className="group block rounded-2xl bg-white border border-gt-border-light shadow-gt-card p-6 hover:shadow-gt-card-hover transition-shadow h-full"
              >
                {source.logo_path && (
                  <Image
                    src={source.logo_path}
                    alt={source.publisher_short}
                    width={140}
                    height={40}
                    className="h-9 w-auto"
                  />
                )}
                <div className="mt-4 text-xs uppercase tracking-[0.08em] text-gt-text-dim">
                  {source.publisher_short} - {source.vintage_year}
                </div>
                <h2 className="mt-1 font-semibold text-gt-text">{source.name}</h2>
                <p className="mt-2 text-sm text-gt-text-muted line-clamp-3">
                  {source.description}
                </p>
                <div className="mt-5 flex items-center justify-between text-sm">
                  <span className="text-gt-text-muted">
                    {factorCount} {factorCount === 1 ? 'factor' : 'factors'}
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-[#2D6A4F] group-hover:underline">
                    Open source <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </LightSection>
  );
}
