/**
 * Category landing page (SEO).
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getFactorsByCategory,
} from '@/lib/emission-factors/loader';
import { ALL_CATEGORIES, CATEGORY_META } from '@/lib/emission-factors/categories';
import type { Category } from '@/lib/emission-factors/types';
import { LightSection, CategoryLabel, SectionHeading } from '@/components/redesign';
import { EFResultsTable } from '../../_components/EFResultsTable';
import { resolvedFactorsToRows } from '@/lib/emission-factors/row-adapter';

export const dynamicParams = false;

export function generateStaticParams() {
  return ALL_CATEGORIES.map((c) => ({ category: c }));
}

function isCategory(value: string): value is Category {
  return (ALL_CATEGORIES as string[]).includes(value);
}

export async function generateMetadata({
  params,
}: {
  params: { category: string };
}): Promise<Metadata> {
  if (!isCategory(params.category)) return { title: 'Category not found' };
  const meta = CATEGORY_META[params.category];
  const title = `${meta.label} emission factors`;
  const path = `/emission-factors/category/${params.category}`;
  return {
    title,
    description: meta.description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      url: path,
      title,
      description: meta.description,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: meta.description,
    },
  };
}

export default function CategoryPage({ params }: { params: { category: string } }) {
  if (!isCategory(params.category)) notFound();
  const meta = CATEGORY_META[params.category];
  const factors = getFactorsByCategory(params.category);
  const Icon = meta.icon;

  return (
    <LightSection padding="lg" variant="pale">
      <div className="max-w-3xl">
        <CategoryLabel>
          <span className="inline-flex items-center gap-2">
            <Icon className="h-4 w-4" aria-hidden />
            Category
          </span>
        </CategoryLabel>
        <SectionHeading size="sub" className="mt-3">
          {meta.label} emission factors
        </SectionHeading>
        <p className="mt-4 text-lg text-gt-text-muted">{meta.description}</p>
      </div>

      <div className="mt-8">
        <EFResultsTable rows={resolvedFactorsToRows(factors)} />
      </div>
    </LightSection>
  );
}
