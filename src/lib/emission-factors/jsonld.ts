// schema.org JSON-LD builders for emission factor and source pages.
// Factor -> Dataset. Source -> DataCatalog.

import type { Factor, Source } from './types';
import { formatUnit } from './unit-display';
import { licenseUrl } from './license';

/**
 * Google's Dataset requires `license` to be a URL or CreativeWork, not a
 * plain string. Map known names to canonical URLs; fall back to a
 * CreativeWork carrying the name for anything we haven't mapped yet.
 */
function licenseFor(name: string): string | { '@type': 'CreativeWork'; name: string } {
  const url = licenseUrl(name);
  if (url) return url;
  return { '@type': 'CreativeWork', name };
}

/**
 * Google's Dataset requires `description` ≥ 50 characters. Editor-supplied
 * notes are preferred when long enough; otherwise synthesise a rich fallback
 * from the factor's structured fields so the string is always substantive.
 */
function datasetDescription(factor: Factor, source: Source): string {
  const notes = factor.notes?.trim();
  if (notes && notes.length >= 50) return notes;

  const parts: string[] = [];
  const scopeLabel =
    factor.scope === 0 ? 'methodology' : `Scope ${factor.scope}`;
  const subCat = factor.sub_category ? ` (${factor.sub_category}, ${scopeLabel})` : ` (${scopeLabel})`;
  parts.push(
    `Emission factor for ${factor.activity}${subCat} in ${factor.region_display}: ${factor.value} ${formatUnit(factor)}.`,
  );
  parts.push(`Published by ${source.publisher} in ${factor.vintage_year}.`);
  if (factor.methodology && factor.methodology !== 'not_applicable') {
    parts.push(`Methodology: ${factor.methodology.replace(/_/g, ' ')}.`);
  }
  if (notes) parts.push(notes);

  return parts.join(' ');
}

export function buildFactorJsonLd(factor: Factor, source: Source) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `${factor.activity} (${factor.region_display}) - ${source.publisher_short} ${source.vintage_year}`,
    description: datasetDescription(factor, source),
    identifier: factor.id,
    keywords: factor.tags.join(', '),
    license: licenseFor(source.license),
    creator: {
      '@type': 'Organization',
      name: source.publisher,
    },
    isBasedOn: source.source_url,
    datePublished: `${factor.published_year}`,
    variableMeasured: {
      '@type': 'PropertyValue',
      name: factor.activity,
      value: factor.value,
      unitText: formatUnit(factor),
    },
    spatialCoverage: factor.region_display,
    temporalCoverage: `${factor.vintage_year}`,
  };
}

export function buildSourceJsonLd(source: Source, factorCount: number) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DataCatalog',
    name: source.name,
    description: source.description,
    publisher: {
      '@type': 'Organization',
      name: source.publisher,
    },
    license: licenseFor(source.license),
    url: source.source_url,
    datePublished: source.published_date,
    measurementTechnique: `${factorCount} emission factors`,
  };
}
