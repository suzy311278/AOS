/**
 * Surface 1 - Emission Factors home / search.
 */

import type { Metadata } from 'next';
import { LightSection, DarkSection, SectionHeading, CategoryLabel } from '@/components/redesign';
import { loadAllSources } from '@/lib/emission-factors/loader';
import { EFSearchBar } from './_components/EFSearchBar';
import { EFSourceTrustRow } from './_components/EFSourceTrustRow';
import { EFHeroPreviewCard } from './_components/EFHeroPreviewCard';
import { EFStatStrip } from './_components/EFStatStrip';
import { EFMethodologyDemo } from './_components/EFMethodologyDemo';
import { EFFaqAccordion } from './_components/EFFaqAccordion';
import { JsonLd } from '@/components/seo/JsonLd';
import { dataCatalogSchema, breadcrumbList } from '@/lib/seo/schema';
import { SITE_ORIGIN } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Emission Factors',
  description:
    'Every emission factor. Sourced. Dated. Free. A reference library of greenhouse-gas emission factors with full provenance, citation formats, and vintage tracking.',
  alternates: { canonical: '/emission-factors' },
  openGraph: {
    type: 'website',
    url: '/emission-factors',
    title: 'Emission Factors',
    description:
      'A reference library of greenhouse-gas emission factors with full provenance, citation formats, and vintage tracking.',
  },
};

const EF_CATALOG = dataCatalogSchema({
  url: `${SITE_ORIGIN}/emission-factors`,
  name: 'Greentryst Emission Factor Database',
  description:
    'Reference library of greenhouse-gas emission factors with full provenance, citation formats, and vintage tracking. Sourced from DEFRA, US EPA, India CEA, IPCC, and other primary bodies. Every factor links to its source document.',
});
const EF_BREADCRUMBS = breadcrumbList([
  { name: 'Home', url: '/' },
  { name: 'Emission Factors' },
]);

export default function EmissionFactorsHomePage() {
  const sources = loadAllSources();

  return (
    <>
      <JsonLd data={EF_CATALOG} />
      <JsonLd data={EF_BREADCRUMBS} />
      <DarkSection dotGrid glow padding="sm" className="!pt-20 md:!pt-24">
        <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-10">
          {/* Left: copy + search */}
          <div className="text-center lg:text-left">
            <CategoryLabel tone="dark">Emission factor library</CategoryLabel>
            <h1
              className="mt-4 text-4xl md:text-5xl lg:text-[56px] font-bold tracking-gt-tight text-white leading-[1.05]"
              style={{ textWrap: 'balance' }}
            >
              <span className="gt-hero-rise gt-hero-rise-1">Every emission factor.</span>{' '}
              <span className="gt-hero-rise gt-hero-rise-2">Sourced.</span>{' '}
              <span className="gt-hero-rise gt-hero-rise-3">Dated.</span>{' '}
              <span className="gt-hero-rise gt-hero-rise-4">Free.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base md:text-lg text-white/70 lg:mx-0">
              A reference library of greenhouse-gas emission factors with full
              provenance, citation formats, and vintage tracking. Built for
              sustainability professionals who need auditable numbers.
            </p>
            <div className="mt-8">
              <EFSearchBar />
            </div>
          </div>

          {/* Right: small floating preview card. Hidden on small screens. */}
          <div className="hidden justify-center lg:flex">
            <EFHeroPreviewCard />
          </div>
        </div>
      </DarkSection>

      <LightSection padding="sm" variant="white">
        <EFStatStrip />
      </LightSection>

      <LightSection padding="md" variant="white">
        <div className="text-center">
          <div className="text-xs uppercase tracking-[0.12em] text-gt-text-dim">
            Sourced from
          </div>
          <div className="mt-4">
            <EFSourceTrustRow sources={sources} />
          </div>
        </div>
      </LightSection>

      <DarkSection dotGrid glow padding="md">
        <div className="max-w-3xl">
          <div className="text-xs uppercase tracking-[0.12em] text-white/50">
            How it works
          </div>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-gt-tight text-white">
            Search, cite, verify.
          </h2>
          <p className="mt-4 text-lg text-white/70 leading-relaxed">
            Every factor page shows the value, the source, the methodology, and a
            machine-readable citation block. Vintage supersession is tracked
            automatically.
          </p>
        </div>
      </DarkSection>

      <LightSection padding="lg" variant="pale">
        <EFMethodologyDemo />
      </LightSection>

      <LightSection padding="lg" variant="white">
        <div className="mx-auto max-w-3xl text-center">
          <CategoryLabel>Common questions</CategoryLabel>
          <SectionHeading size="sub" className="mt-4">
            What practitioners ask first.
          </SectionHeading>
        </div>
        <div className="mt-12">
          <EFFaqAccordion />
        </div>
      </LightSection>
    </>
  );
}
