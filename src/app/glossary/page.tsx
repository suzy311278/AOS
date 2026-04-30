/**
 * /redesign/glossary - Glossary Page
 *
 * Searchable sustainability terms and definitions.
 */

import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { RedesignFooter } from '@/components/redesign';
import { GlossaryClient } from './_components/GlossaryClient';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { JsonLd } from '@/components/seo/JsonLd';
import { definedTermSetSchema, breadcrumbList } from '@/lib/seo/schema';

export const metadata: Metadata = {
  title: 'Glossary',
  description:
    'Comprehensive glossary of sustainability, ESG, carbon markets, and climate terminology.',
  alternates: { canonical: '/glossary' },
  openGraph: {
    type: 'website',
    url: '/glossary',
    title: 'Glossary',
    description:
      'Comprehensive glossary of sustainability, ESG, carbon markets, and climate terminology.',
  },
};

interface GlossaryTerm {
  term: string;
  slug: string;
  definition: string;
  category: string;
  related?: string[];
}

async function getGlossaryTerms(): Promise<GlossaryTerm[]> {
  const filePath = path.join(process.cwd(), 'src/content/glossary.yaml');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const terms = yaml.load(fileContents) as GlossaryTerm[];
  return terms.sort((a, b) => a.term.localeCompare(b.term));
}

const CATEGORIES = [
  { id: 'all', label: 'All Terms' },
  { id: 'carbon-markets', label: 'Carbon Markets' },
  { id: 'ghg-accounting', label: 'GHG Accounting' },
  { id: 'esg', label: 'ESG' },
  { id: 'climate-science', label: 'Climate Science' },
  { id: 'climate-finance', label: 'Climate Finance' },
  { id: 'eu-taxonomy', label: 'EU Taxonomy' },
  { id: 'reporting-standards', label: 'Reporting Standards' },
  { id: 'biodiversity', label: 'Biodiversity' },
  { id: 'social-safeguards', label: 'Social Safeguards' },
];

export default async function GlossaryPage() {
  const terms = await getGlossaryTerms();

  const definedTermSet = definedTermSetSchema(
    terms.map((t) => ({
      slug: t.slug,
      name: t.term,
      description: t.definition,
    }))
  );
  const breadcrumbs = breadcrumbList([
    { name: 'Home', url: '/' },
    { name: 'Glossary' },
  ]);

  return (
    <>
      <JsonLd data={definedTermSet} />
      <JsonLd data={breadcrumbs} />
      <Nav />

      {/* Hero - pt-28 accounts for fixed nav */}
      <section className="bg-[#fafbfa] border-b border-[#e5e7e5] pt-28 pb-12">
        <div className="max-w-[1100px] mx-auto px-8 text-center">
          <p
            className="text-[11px] font-bold uppercase text-gt-medium mb-3"
            style={{ letterSpacing: '0.25em' }}
          >
            Reference
          </p>
          <h1 className="text-[32px] font-extrabold text-gt-text mb-4">
            Glossary
          </h1>
          <p className="text-[15px] text-gt-text-muted max-w-xl mx-auto">
            Comprehensive definitions for sustainability, ESG, carbon markets, and climate terminology.
          </p>
        </div>
      </section>

      <GlossaryClient terms={terms} categories={CATEGORIES} />

      <RedesignFooter />
    </>
  );
}
