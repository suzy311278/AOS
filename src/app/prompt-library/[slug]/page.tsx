/**
 * Prompt detail page — /prompt-library/[slug].
 *
 * Server component: metadata, JSON-LD, frame. Hands off to the client
 * component for the copy button + gated personalisation form.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import {
  loadAllPrompts,
  getPromptBySlug,
} from '@/lib/prompt-library/loader';
import { Nav } from '@/components/Nav';
import {
  RedesignFooter,
  LightSection,
  CategoryLabel,
} from '@/components/redesign';
import { PromptDetailClient } from '../_components/PromptDetailClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { promptCreativeWorkSchema, breadcrumbList } from '@/lib/seo/schema';

export const dynamicParams = false;

export function generateStaticParams() {
  return loadAllPrompts().map((p) => ({ slug: p.slug }));
}

function truncate(str: string, max = 155): string {
  const clean = str.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).trimEnd() + '.';
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const prompt = getPromptBySlug(params.slug);
  if (!prompt) return { title: 'Prompt not found' };
  // Bare title. Root template appends ' | Greentryst'. Do NOT append it here.
  const title = `${prompt.title} — Prompt Library`;
  const description = truncate(
    prompt.short_description || prompt.description,
  );
  const path = `/prompt-library/${prompt.slug}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'article',
      url: path,
      title,
      description,
    },
    twitter: { card: 'summary_large_image', title, description },
    robots: { index: true, follow: true },
  };
}

export default function PromptDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const prompt = getPromptBySlug(params.slug);
  if (!prompt) notFound();

  const promptLd = promptCreativeWorkSchema({
    slug: prompt.slug,
    title: prompt.title,
    description: prompt.short_description || prompt.description,
    category: prompt.framework,
  });
  const breadcrumbs = breadcrumbList([
    { name: 'Home', url: '/' },
    { name: 'Prompt Library', url: '/prompt-library' },
    { name: prompt.title },
  ]);

  return (
    <>
      <JsonLd data={promptLd} />
      <JsonLd data={breadcrumbs} />
      <Nav />
      <main className="min-h-screen bg-gt-pale text-gt-text">
        <LightSection padding="lg" variant="pale">
          <Link
            href="/prompt-library"
            className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-gt-text-dim hover:text-[#005c55] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
            All prompts
          </Link>

          <div className="mt-8 max-w-3xl">
            <CategoryLabel>{prompt.framework}</CategoryLabel>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold tracking-gt-tight text-gt-text">
              {prompt.title}
            </h1>
            <p className="mt-4 text-base md:text-lg text-gt-text-muted whitespace-pre-line">
              {prompt.description}
            </p>
          </div>

          <div className="mt-10">
            <PromptDetailClient prompt={prompt} />
          </div>
        </LightSection>
      </main>
      <RedesignFooter />
    </>
  );
}
