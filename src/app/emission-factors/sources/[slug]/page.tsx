/**
 * Surface 4 - Source page.
 *
 * Publisher profile: identity, provenance, usage guidance, full factor list.
 * Dark hero matches the alt factor page aesthetic; the factors table sits in
 * a light section below for readability.
 */

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, Scale, CheckCircle2 } from 'lucide-react';
import {
  loadAllSources,
  getSourceById,
  getFactorsBySourceId,
} from '@/lib/emission-factors/loader';
import { buildSourceJsonLd } from '@/lib/emission-factors/jsonld';
import { licenseUrl } from '@/lib/emission-factors/license';
import { safeJsonLd } from '@/lib/json-ld';
import { EFSourceFactorsExplorer } from '../../_components/EFSourceFactorsExplorer';
import { resolvedFactorsToRows } from '@/lib/emission-factors/row-adapter';

export const dynamicParams = false;

export function generateStaticParams() {
  return loadAllSources().map((s) => ({ slug: s.id }));
}

// ISO 3166-1 alpha-3 -> display name. Extend as new sources are added.
const COUNTRY_NAMES: Record<string, string> = {
  GBR: 'United Kingdom',
  USA: 'United States',
  IND: 'India',
  INT: 'International',
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatPublishedDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
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
  const source = getSourceById(params.slug);
  if (!source) return { title: 'Source not found' };
  const title = `${source.publisher_short} ${source.vintage_year} - ${source.name}`;
  const description = truncate(source.description);
  const path = `/emission-factors/sources/${source.id}`;
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
    robots: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  };
}

export default function SourceDetailPage({ params }: { params: { slug: string } }) {
  const source = getSourceById(params.slug);
  if (!source) notFound();

  const factors = getFactorsBySourceId(source.id);
  const jsonLd = buildSourceJsonLd(source, factors.length);

  // Distinct activity families (UOM siblings collapsed).
  const familyIds = new Set(
    factors.map((f) => f.factor_family_id ?? f.id),
  );
  const countryName = COUNTRY_NAMES[source.country] ?? source.country;
  const publishedDate = formatPublishedDate(source.published_date);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />

      {/* ===== HERO ===== */}
      <section className="relative bg-[#0a1a1a]">
        <div className="mx-auto max-w-6xl px-6 pt-20 pb-14 md:pt-28 md:pb-20">
          {/* Back link */}
          <Link
            href="/emission-factors"
            className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-white/40 hover:text-[#95D5B2] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
            All sources
          </Link>

          {/* Logo + identity */}
          <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-white/40">
                Source · {countryName} · {source.document_type.replace(/_/g, ' ')}
              </div>
              <h1 className="mt-4 text-3xl md:text-5xl font-semibold text-white leading-tight tracking-[-0.02em]">
                {source.publisher_short}{' '}
                <span className="text-[#95D5B2]">{source.vintage_year}</span>
              </h1>
              <p className="mt-3 text-base md:text-lg text-white/70 max-w-2xl">
                {source.name}
              </p>
            </div>

            {/* Logo block */}
            <div className="shrink-0 rounded-xl bg-white/[0.04] ring-1 ring-white/10 p-5">
              <Image
                src={source.logo_path ?? '/emission-factors/source-logos/desnz.svg'}
                alt={`${source.publisher_short} logo`}
                width={350}
                height={229}
                className="h-24 w-auto [filter:brightness(0)_invert(1)]"
                priority
              />
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 border-y border-white/10 divide-x divide-white/10">
            <Stat label="Factors" value={factors.length.toLocaleString()} />
            <Stat label="Activities" value={familyIds.size.toString()} />
            <Stat label="Vintage" value={String(source.vintage_year)} />
            <Stat label="Published" value={publishedDate} />
          </div>

          {/* Actions */}
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <a
              href={source.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-[#95D5B2] hover:bg-[#B7E4C7] text-[#0a1a1a] px-4 py-2.5 text-[12px] font-mono uppercase tracking-[0.14em] transition-colors"
            >
              Visit publisher
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
            </a>
            {source.source_pdf_url && (
              <a
                href={source.source_pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-white/5 hover:bg-white/10 ring-1 ring-white/10 text-white/80 px-4 py-2.5 text-[12px] font-mono uppercase tracking-[0.14em] transition-colors"
              >
                Source document
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ===== ABOUT + USAGE ===== */}
      <section className="bg-[#0a1a1a] border-t border-white/5">
        <div className="mx-auto max-w-6xl px-6 py-14 md:py-20 grid gap-12 lg:grid-cols-2">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-white/40 mb-4">
              About
            </div>
            <p className="text-[15px] text-white/80 leading-relaxed whitespace-pre-line">
              {source.description.trim()}
            </p>
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#95D5B2] mb-4">
              When to use
            </div>
            <p className="text-[15px] text-white/90 leading-relaxed whitespace-pre-line">
              {source.usage_note.trim()}
            </p>

            {/* License card */}
            <div className="mt-10 rounded-lg bg-white/[0.03] ring-1 ring-white/10 p-5">
              <div className="flex items-start gap-3">
                <Scale className="h-4 w-4 mt-0.5 text-[#95D5B2] shrink-0" strokeWidth={1.5} />
                <div className="min-w-0">
                  <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-white/40">
                    License
                  </div>
                  <div className="mt-1 text-sm text-white">
                    {(() => {
                      const url = licenseUrl(source.license);
                      return url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline decoration-white/30 hover:decoration-[#95D5B2] hover:text-[#95D5B2] transition-colors"
                        >
                          {source.license}
                        </a>
                      ) : (
                        source.license
                      );
                    })()}
                  </div>
                  {source.attribution_required && (
                    <div className="mt-3 flex items-center gap-1.5 text-[12px] text-white/60">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#95D5B2]" strokeWidth={2} />
                      Attribution required when citing this source
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FACTORS TABLE ===== */}
      <section className="bg-[#f8faf9]">
        <div className="mx-auto max-w-6xl px-6 py-14 md:py-20">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-gt-text-dim">
                Library
              </div>
              <h2 className="mt-2 text-2xl md:text-3xl font-semibold text-gt-text">
                {factors.length.toLocaleString()} emission factors from {source.publisher_short} {source.vintage_year}
              </h2>
            </div>
            <div className="font-mono text-xs text-gt-text-muted">
              {familyIds.size} distinct activities
            </div>
          </div>
          <div className="mt-6">
            <EFSourceFactorsExplorer
              rows={resolvedFactorsToRows(factors)}
              hideSource
            />
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-5 md:px-6 md:py-6">
      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/40">
        {label}
      </div>
      <div className="mt-2 font-mono text-lg md:text-xl text-white">{value}</div>
    </div>
  );
}
