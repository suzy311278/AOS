/**
 * Surface 5 - Compare.
 *
 * Server shell loads the resolved factor list. Picker + table are client-side.
 */

import type { Metadata } from 'next';
import { LightSection, CategoryLabel, SectionHeading } from '@/components/redesign';
import { loadResolvedFactors } from '@/lib/emission-factors/loader';
import type { ResolvedFactor } from '@/lib/emission-factors/types';
import { EFCompareClient } from './_compare-client';

export const metadata: Metadata = {
  title: 'Compare factors',
  description:
    'Place 2 to 4 emission factors side by side to compare values, methodology, vintage, and source.',
  alternates: { canonical: '/emission-factors/compare' },
  openGraph: {
    type: 'website',
    url: '/emission-factors/compare',
    title: 'Compare emission factors',
    description:
      'Place 2 to 4 emission factors side by side to compare values, methodology, vintage, and source.',
  },
};

export default function ComparePage() {
  const factors = loadResolvedFactors();
  const picker = factors.map<PickerRow>((f) => ({
    slug: f.slug,
    activity: f.activity,
    region: f.region_display,
    source: `${f.source.publisher_short} ${f.vintage_year}`,
  }));

  return (
    <LightSection padding="lg" variant="pale">
      <div className="max-w-3xl">
        <CategoryLabel>Compare</CategoryLabel>
        <SectionHeading size="sub" className="mt-3">
          Compare factors side by side.
        </SectionHeading>
        <p className="mt-4 text-lg text-gt-text-muted">
          Pick 2 to 4 factors. We line up value, unit, methodology, vintage, and
          source so you can justify a selection.
        </p>
      </div>
      <div className="mt-8">
        <EFCompareClient factors={factors} picker={picker} />
      </div>
    </LightSection>
  );
}

export interface PickerRow {
  slug: string;
  activity: string;
  region: string;
  source: string;
}

export type { ResolvedFactor };
