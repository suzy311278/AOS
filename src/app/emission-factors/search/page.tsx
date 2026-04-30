/**
 * Surface 2 - Search results.
 *
 * SSG shell with zero factor payload. The client-side results component
 * lazily loads /emission-factors/search-index.json on first user interaction
 * (search input focus, filter click, or a present ?q=/filter in the URL).
 * Anonymous landings on the bare /search URL ship ~15 KB of HTML.
 */

import type { Metadata } from 'next';
import { LightSection, CategoryLabel, SectionHeading } from '@/components/redesign';
import { loadAllSources } from '@/lib/emission-factors/loader';
import { EFSearchBar } from '../_components/EFSearchBar';
import { EFFilterSidebar } from '../_components/EFFilterSidebar';
import { EFResultsTableClient } from './_results-client';
// Cite-list preview is deferred to v1.1 alongside the saved/cite-list dashboard.
// import { EFCiteListPreview } from './_cite-list-preview';

export const metadata: Metadata = {
  title: 'Search emission factors',
  description:
    'Search the Greentryst emission factor library by activity, region, source, scope, and vintage.',
  alternates: { canonical: '/emission-factors/search' },
  openGraph: {
    type: 'website',
    url: '/emission-factors/search',
    title: 'Search emission factors',
    description:
      'Search verified emission factors by activity, region, source, scope, and vintage.',
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
  },
};

export default function EmissionFactorsSearchPage({
  searchParams,
}: {
  searchParams?: { q?: string | string[] };
}) {
  const sources = loadAllSources();
  const q = Array.isArray(searchParams?.q)
    ? searchParams?.q[0]
    : searchParams?.q ?? '';

  return (
    <LightSection padding="lg" variant="pale">
      <div className="max-w-3xl">
        <CategoryLabel>Search</CategoryLabel>
        <SectionHeading size="sub" className="mt-3">
          Find any emission factor
        </SectionHeading>
      </div>
      <div className="mt-6">
        <EFSearchBar initialValue={q} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
        <EFFilterSidebar sources={sources} />
        <EFResultsTableClient />
      </div>
    </LightSection>
  );
}
