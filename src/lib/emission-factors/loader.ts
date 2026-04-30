// Server-only loader for emission factor sources and factors.
//
// Data source: `data/ef-sources/defra/2025/ingested.json` (produced by the
// parser at `scripts/ef-ingest/defra-2025/parse.ts`). If that file is absent,
// falls back to the YAML content folder at `src/content/emission-factors`.
//
// IMPORTANT: Never import this module from a client component. It uses Node
// `fs`. Client code should consume the `ResolvedFactor` shape returned here.

import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';
import { SourceSchema, FactorsFileSchema } from './schemas';
import type { Factor, ResolvedFactor, Source, Category } from './types';
import { factorToSlug } from './slug';
import { formatUnitDisplay } from './unit-display';

const CONTENT_ROOT = join(process.cwd(), 'src', 'content', 'emission-factors');
const JSON_INGESTED_PATHS = [
  // Primary: deployed content path (tracked in git, shipped with Vercel build).
  join(process.cwd(), 'src', 'content', 'emission-factors', 'defra-2025', 'ingested.json'),
  // Legacy: local-only working path. Kept for back-compat during dev.
  join(process.cwd(), 'data', 'ef-sources', 'defra', '2025', 'ingested.json'),
];

// js-yaml parses ISO dates into Date objects. Coerce them back to YYYY-MM-DD.
function coerceDates<T>(value: T): T {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map(coerceDates) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = coerceDates(v);
    }
    return out as unknown as T;
  }
  return value;
}

let _sources: Source[] | null = null;
let _factors: Factor[] | null = null;
let _resolved: ResolvedFactor[] | null = null;
// Map of source_id -> dataset_slug -> precomputed slug, used when the factor
// already carries a parser-issued slug we want to preserve.
let _precomputedSlugs: Map<string, string> | null = null;

function listSourceFolders(): string[] {
  if (!existsSync(CONTENT_ROOT)) return [];
  return readdirSync(CONTENT_ROOT).filter((entry) => {
    const full = join(CONTENT_ROOT, entry);
    return statSync(full).isDirectory() && !entry.startsWith('.');
  });
}

function readYaml(path: string): unknown {
  return coerceDates(yaml.load(readFileSync(path, 'utf8')));
}

interface IngestedJson {
  version: string;
  source: Source & { slug?: string };
  dataset?: unknown;
  factors: Factor[];
  // precomputed slug per factor id, optional
  factorSlugs?: Record<string, string>;
}

function readIngestedJson(path: string): IngestedJson | null {
  if (!existsSync(path)) return null;
  try {
    const raw = JSON.parse(readFileSync(path, 'utf8')) as IngestedJson;
    return raw;
  } catch (err) {
    throw new Error(
      `Failed to parse ingested JSON at ${path}: ${(err as Error).message}`
    );
  }
}

function loadFromJson(): { sources: Source[]; factors: Factor[]; slugs: Map<string, string> } {
  const sources: Source[] = [];
  const factors: Factor[] = [];
  const slugs = new Map<string, string>();
  const seenSourceIds = new Set<string>();
  // Dedup factors when the same source appears at multiple ingestion paths
  // (e.g. the legacy `data/ef-sources/...` path is still present alongside the
  // new `src/content/emission-factors/.../ingested.json` path during dev).
  const seenFactorIds = new Set<string>();

  for (const path of JSON_INGESTED_PATHS) {
    const data = readIngestedJson(path);
    if (!data) continue;
    if (!seenSourceIds.has(data.source.id)) {
      // Strip any extended fields (e.g. slug) that aren't part of Source.
      const s: Source = {
        id: data.source.id,
        name: data.source.name,
        publisher: data.source.publisher,
        publisher_short: data.source.publisher_short,
        country: data.source.country,
        document_type: data.source.document_type,
        license: data.source.license,
        attribution_required: data.source.attribution_required,
        source_url: data.source.source_url,
        source_pdf_url: data.source.source_pdf_url,
        vintage_year: data.source.vintage_year,
        published_date: data.source.published_date,
        description: data.source.description,
        usage_note: data.source.usage_note,
        logo_path: data.source.logo_path,
      };
      sources.push(s);
      seenSourceIds.add(s.id);
    }
    for (const f of data.factors) {
      if (seenFactorIds.has(f.id)) continue;
      seenFactorIds.add(f.id);
      factors.push(f);
      // Parser emits a deterministic public slug on the factor itself via a
      // conventional field name; we reconstruct it here if provided.
      const anyF = f as unknown as { slug?: string };
      if (anyF.slug) slugs.set(f.id, anyF.slug);
    }
  }

  return { sources, factors, slugs };
}

function loadFromYaml(): { sources: Source[]; factors: Factor[] } {
  const sources: Source[] = [];
  const factors: Factor[] = [];
  for (const folder of listSourceFolders()) {
    const sourcePath = join(CONTENT_ROOT, folder, 'source.yaml');
    if (existsSync(sourcePath)) {
      const raw = readYaml(sourcePath);
      const parsed = SourceSchema.safeParse(raw);
      if (!parsed.success) {
        throw new Error(
          `Invalid source.yaml at ${sourcePath}: ${parsed.error.issues
            .map((i) => `${i.path.join('.')} ${i.message}`)
            .join('; ')}`
        );
      }
      sources.push(parsed.data);
    }
    const factorsPath = join(CONTENT_ROOT, folder, 'factors.yaml');
    if (existsSync(factorsPath)) {
      const raw = readYaml(factorsPath);
      const parsed = FactorsFileSchema.safeParse(raw);
      if (!parsed.success) {
        throw new Error(
          `Invalid factors.yaml at ${factorsPath}: ${parsed.error.issues
            .map((i) => `${i.path.join('.')} ${i.message}`)
            .join('; ')}`
        );
      }
      factors.push(...parsed.data);
    }
  }
  return { sources, factors };
}

function ensureLoaded(): void {
  if (_sources && _factors) return;

  const sources: Source[] = [];
  const factors: Factor[] = [];
  const slugs = new Map<string, string>();

  // JSON sources take precedence.
  const fromJson = loadFromJson();
  sources.push(...fromJson.sources);
  factors.push(...fromJson.factors);
  for (const [k, v] of fromJson.slugs) slugs.set(k, v);

  // Merge YAML sources (skipping any that duplicate a source already loaded
  // from JSON).
  const fromYaml = loadFromYaml();
  const seenSourceIds = new Set(sources.map((s) => s.id));
  for (const s of fromYaml.sources) {
    if (!seenSourceIds.has(s.id)) sources.push(s);
  }
  for (const f of fromYaml.factors) factors.push(f);

  // Publishing gate. The parser writes `published` to every factor; any row
  // without the field (e.g. legacy YAML) is treated as unpublished for
  // safety. Sources and datasets remain intact so the trust row + source
  // pages can still enumerate them - only the factor array is filtered.
  _sources = sources;
  _factors = factors.filter((f) => f.published === true);
  _precomputedSlugs = slugs;
}

export function loadAllSources(): Source[] {
  ensureLoaded();
  return _sources!;
}

export function loadAllFactors(): Factor[] {
  ensureLoaded();
  return _factors!;
}

export function getSourceById(id: string): Source | undefined {
  return loadAllSources().find((s) => s.id === id);
}

export function loadResolvedFactors(): ResolvedFactor[] {
  if (_resolved) return _resolved;
  const sources = loadAllSources();
  const factors = loadAllFactors();
  const byId = new Map(sources.map((s) => [s.id, s]));
  const resolved: ResolvedFactor[] = [];
  for (const factor of factors) {
    const source = byId.get(factor.source_id);
    if (!source) {
      throw new Error(
        `Factor ${factor.id} references unknown source ${factor.source_id}`
      );
    }
    const precomputed = _precomputedSlugs?.get(factor.id);
    resolved.push({
      ...factor,
      source,
      slug: precomputed ?? factorToSlug(factor, source),
      unit_display: formatUnitDisplay(factor),
    });
  }
  _resolved = resolved;
  return resolved;
}

// Unit ranking for determining primary factor when multiple units share a slug.
// Lower index = higher priority (more commonly searched/used).
const UNIT_RANK: string[] = [
  'kWh',
  'kWh (Net CV)',
  'kWh (Gross CV)',
  'litres',
  'cubic metres',
  'tonnes',
  'kg',
  'km',
  'miles',
  'passenger.km',
  'tonne.km',
  'GJ',
];

function unitRank(uom: string): number {
  const idx = UNIT_RANK.indexOf(uom);
  return idx === -1 ? 999 : idx;
}

/**
 * Get the primary factor for a slug. When multiple unit variants share the
 * same slug (family-based URLs), returns the highest-ranked unit per UNIT_RANK.
 */
export function getResolvedFactorBySlug(slug: string): ResolvedFactor | undefined {
  const matches = loadResolvedFactors().filter((f) => f.slug === slug);
  if (matches.length === 0) return undefined;
  if (matches.length === 1) return matches[0];
  // Multiple siblings share this slug - return the primary unit
  return matches.sort((a, b) => unitRank(a.unit_denominator) - unitRank(b.unit_denominator))[0];
}

/**
 * Get all factors sharing a slug (the unit family). Returns sorted by UNIT_RANK.
 */
export function getFactorFamilyBySlug(slug: string): ResolvedFactor[] {
  return loadResolvedFactors()
    .filter((f) => f.slug === slug)
    .sort((a, b) => unitRank(a.unit_denominator) - unitRank(b.unit_denominator));
}

export function getFactorsBySourceId(id: string): ResolvedFactor[] {
  return loadResolvedFactors().filter((f) => f.source_id === id);
}

export function getFactorsByCategory(category: Category): ResolvedFactor[] {
  return loadResolvedFactors().filter((f) => f.category === category);
}

/**
 * Return the top N unique factor slugs to pre-render at build time. At 200k+
 * factors we cannot afford to statically generate everything; the rest are
 * served via ISR on first request (dynamicParams = true in the page).
 *
 * Since multiple unit variants share the same slug (family-based URLs), we
 * deduplicate before slicing.
 *
 * Ranking heuristic (placeholder): prioritize Scope 2 electricity (the most
 * searched category in prod telemetry), then alphabetical by slug for
 * determinism. Swap for a popularity-derived list once analytics lands.
 */
export function getTopFactorSlugsForStaticGen(n = 200): string[] {
  const all = loadResolvedFactors();
  const rank = (f: ResolvedFactor): number => {
    if (f.category === 'electricity' && f.scope === 2) return 0;
    if (f.category === 'electricity') return 1;
    if (f.category === 'fuels') return 2;
    if (f.category === 'transport') return 3;
    return 4;
  };
  const sorted = [...all].sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    return a.slug.localeCompare(b.slug);
  });
  // Deduplicate slugs (siblings share the same slug)
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const f of sorted) {
    if (!seen.has(f.slug)) {
      seen.add(f.slug);
      unique.push(f.slug);
    }
    if (unique.length >= n) break;
  }
  return unique;
}
