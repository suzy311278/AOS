/**
 * Supplier → SBTi company matcher.
 *
 * Reads `src/data/sbti-companies.json` (shape: { meta, companies }), builds
 * two indexes on first call, and scores user-supplied supplier records
 * against the 14,531 SBTi-listed companies.
 *
 * Two independent status axes are returned per row:
 *   - match_status : how confident the entity resolution is.
 *   - sbti_status  : the SBTi program state of the matched company.
 *   - target_class : ambition of the near-term target (if present).
 */
import sbtiData from '@/data/sbti-companies.json';
import countryAliasesRaw from '@/data/country-aliases.json';

type Company = {
  id: number | null;
  name: string;
  norm: string;
  isin: string | null;
  lei: string | null;
  type: string | null;
  country: string | null;
  region: string | null;
  sector: string | null;
  nt_status: string | null;
  nt_class: string | null;
  nt_year: number | string | null;
  lt_status: string | null;
  nz_status: string | null;
  nz_year: number | string | null;
};

type Meta = {
  source: string;
  source_url: string;
  snapshot_date: string;
  count: number;
};

const { meta, companies } = sbtiData as unknown as {
  meta: Meta;
  companies: Company[];
};

const COUNTRY_ALIASES = countryAliasesRaw as Record<string, string>;

export type SupplierInput = {
  name: string;
  country?: string;
  spend?: number;
};

export type MatchStatus = 'confirmed' | 'likely' | 'none';
export type SbtiStatus = 'targets_set' | 'committed' | 'removed' | null;
export type TargetClass = '1.5C' | 'WB2C' | '2C' | 'other' | null;

export type Bucket =
  | 'confirmed_1p5'
  | 'confirmed_wb2c_or_2c'
  | 'confirmed_committed'
  | 'confirmed_removed'
  | 'likely_any'
  | 'not_listed';

export const BUCKET_ORDER: Bucket[] = [
  'confirmed_1p5',
  'confirmed_wb2c_or_2c',
  'confirmed_committed',
  'confirmed_removed',
  'likely_any',
  'not_listed',
];

export type MatchResult = {
  input: SupplierInput;
  match_status: MatchStatus;
  sbti_status: SbtiStatus;
  target_class: TargetClass;
  score: number;
  bucket: Bucket;
  company: {
    name: string;
    country: string | null;
    sector: string | null;
    type: string | null;
    isin: string | null;
    lei: string | null;
    nt_status: string | null;
    nt_class: string | null;
    nt_year: number | string | null;
    lt_status: string | null;
    nz_status: string | null;
    nz_year: number | string | null;
  } | null;
};

export type BatchSummary = {
  total: number;
  spend_provided: boolean;
  counts: Record<Bucket, number>;
  spend: Record<Bucket, number> | null;
  top_gaps: Array<{ name: string; country?: string; spend?: number }>;
};

const SUFFIX_RE =
  /\b(inc|incorporated|corp|corporation|co|company|ltd|limited|llc|llp|lp|plc|pvt|private|pte|gmbh|ag|sa|sas|sarl|bv|nv|spa|srl|oy|ab|as|asa|aps|kg|ohg|se|ltda|cjsc|ojsc|pjsc|jsc|psc|kk|kabushiki|kaisha|holdings?|group|the|and|&)\b/gi;

const PUNCT_RE = /[^\w\s]/g;
const WS_RE = /\s+/g;

// Excluded from index keys (too-common generic tokens). Still used during
// Jaccard scoring.
const STOPWORDS = new Set<string>([
  'the',
  'and',
  'of',
  'group',
  'holdings',
  'holding',
  'co',
  'company',
  'corp',
  'corporation',
  'ltd',
  'limited',
  'inc',
  'incorporated',
  'llc',
  'llp',
  'plc',
  'gmbh',
  'ag',
  'sa',
  'sas',
  'bv',
  'nv',
  'se',
  'kk',
  'ab',
  'as',
  'oy',
  'spa',
  'srl',
  'ltda',
  'pvt',
  'private',
  'pte',
  'international',
  'global',
  'solutions',
  'services',
  'technologies',
  'technology',
  'industries',
  'systems',
  'energy',
  'enterprise',
  'enterprises',
]);

export function normalizeName(raw: string): string {
  if (!raw) return '';
  let s = raw.toLowerCase();
  s = s.replace(PUNCT_RE, ' ');
  s = s.replace(SUFFIX_RE, ' ');
  s = s.replace(WS_RE, ' ').trim();
  return s;
}

export function normalizeCountry(raw?: string): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const key = trimmed.toLowerCase();
  return COUNTRY_ALIASES[key] ?? trimmed;
}

function tokens(norm: string): string[] {
  if (!norm) return [];
  return norm.split(' ').filter(Boolean);
}

function significantTokens(toks: string[]): string[] {
  return toks.filter((t) => !STOPWORDS.has(t) && t.length > 1);
}

type Indexes = {
  exact: Map<string, number[]>;
  token: Map<string, number[]>;
  companyTokens: string[][];
};

let INDEXES: Indexes | null = null;

function buildIndexes(): Indexes {
  if (INDEXES) return INDEXES;
  const exact = new Map<string, number[]>();
  const token = new Map<string, number[]>();
  const companyTokens: string[][] = new Array(companies.length);

  for (let i = 0; i < companies.length; i++) {
    const c = companies[i];
    const norm = c.norm ?? normalizeName(c.name);
    const toks = tokens(norm);
    companyTokens[i] = toks;

    if (norm) {
      const list = exact.get(norm);
      if (list) list.push(i);
      else exact.set(norm, [i]);
    }

    const seen = new Set<string>();
    for (const t of toks) {
      if (STOPWORDS.has(t) || t.length <= 1) continue;
      if (seen.has(t)) continue;
      seen.add(t);
      const list = token.get(t);
      if (list) list.push(i);
      else token.set(t, [i]);
    }
  }

  INDEXES = { exact, token, companyTokens };
  return INDEXES;
}

function classifyTargetClass(c: Company): TargetClass {
  const raw = c.nt_class;
  if (!raw) return null;
  if (raw.includes('1.5')) return '1.5C';
  if (raw.includes('Well-below')) return 'WB2C';
  if (raw.includes('2°C')) return '2C';
  return 'other';
}

function classifySbtiStatus(c: Company): SbtiStatus {
  const s = c.nt_status;
  if (s === 'Targets set') return 'targets_set';
  if (s === 'Committed') return 'committed';
  if (s === 'Commitment removed') return 'removed';
  return null;
}

function deriveBucket(
  match_status: MatchStatus,
  sbti_status: SbtiStatus,
  target_class: TargetClass,
): Bucket {
  if (match_status === 'none') return 'not_listed';
  if (match_status === 'likely') return 'likely_any';
  // confirmed
  if (sbti_status === 'targets_set') {
    if (target_class === '1.5C') return 'confirmed_1p5';
    return 'confirmed_wb2c_or_2c';
  }
  if (sbti_status === 'committed') return 'confirmed_committed';
  if (sbti_status === 'removed') return 'confirmed_removed';
  // Edge case: confirmed entity exists but has no near-term status at all.
  // Treat as committed-ish (rare; SMEs that only have a streamlined target)
  return 'confirmed_committed';
}

function emitCompanyView(c: Company) {
  return {
    name: c.name,
    country: c.country,
    sector: c.sector,
    type: c.type,
    isin: c.isin,
    lei: c.lei,
    nt_status: c.nt_status,
    nt_class: c.nt_class,
    nt_year: c.nt_year,
    lt_status: c.lt_status,
    nz_status: c.nz_status,
    nz_year: c.nz_year,
  };
}

function buildResult(
  input: SupplierInput,
  c: Company | null,
  match_status: MatchStatus,
  score: number,
): MatchResult {
  if (!c || match_status === 'none') {
    return {
      input,
      match_status: 'none',
      sbti_status: null,
      target_class: null,
      score: 0,
      bucket: 'not_listed',
      company: null,
    };
  }
  const sbti_status = classifySbtiStatus(c);
  const target_class =
    sbti_status === 'targets_set' ? classifyTargetClass(c) : null;
  const bucket = deriveBucket(match_status, sbti_status, target_class);
  return {
    input,
    match_status,
    sbti_status,
    target_class,
    score: Math.round(score * 1000) / 1000,
    bucket,
    company: emitCompanyView(c),
  };
}

function pickByCountry(
  candidates: number[],
  normalizedCountry: string | undefined,
): { idx: number; aligned: boolean } {
  if (!normalizedCountry) return { idx: candidates[0], aligned: false };
  for (const idx of candidates) {
    if (companies[idx].country === normalizedCountry) {
      return { idx, aligned: true };
    }
  }
  return { idx: candidates[0], aligned: false };
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

export function matchSupplier(input: SupplierInput): MatchResult {
  const indexes = buildIndexes();
  const qNorm = normalizeName(input.name);
  const qCountry = normalizeCountry(input.country);

  if (!qNorm) {
    return buildResult(input, null, 'none', 0);
  }

  // 1) Exact-normalized path
  const exactHits = indexes.exact.get(qNorm);
  if (exactHits && exactHits.length > 0) {
    const pick = pickByCountry(exactHits, qCountry);
    const c = companies[pick.idx];
    if (pick.aligned) {
      return buildResult(input, c, 'confirmed', 1.0);
    }
    // Exact name match without country agreement (or country missing on
    // either side) — downgrade to likely to flag to the user.
    return buildResult(input, c, 'likely', 0.9);
  }

  // 2) Token-set Jaccard over candidate pool
  const qToks = tokens(qNorm);
  const qSig = significantTokens(qToks);
  if (qSig.length === 0) {
    return buildResult(input, null, 'none', 0);
  }
  const candidateSet = new Set<number>();
  for (const t of qSig) {
    const list = indexes.token.get(t);
    if (!list) continue;
    for (const idx of list) candidateSet.add(idx);
  }
  if (candidateSet.size === 0) {
    return buildResult(input, null, 'none', 0);
  }

  const qTokSet = new Set(qToks);
  let bestIdx = -1;
  let bestScore = 0;
  for (const idx of candidateSet) {
    const cToks = indexes.companyTokens[idx];
    const score = jaccard(qTokSet, new Set(cToks));
    const boosted =
      qCountry && companies[idx].country === qCountry ? score + 0.05 : score;
    if (boosted > bestScore) {
      bestScore = boosted;
      bestIdx = idx;
    }
  }

  if (bestIdx === -1) {
    return buildResult(input, null, 'none', 0);
  }

  const best = companies[bestIdx];
  if (bestScore >= 0.95) {
    return buildResult(input, best, 'confirmed', Math.min(bestScore, 1.0));
  }
  if (bestScore >= 0.8) {
    return buildResult(input, best, 'likely', bestScore);
  }
  return buildResult(input, null, 'none', 0);
}

export function matchBatch(suppliers: SupplierInput[]): {
  results: MatchResult[];
  summary: BatchSummary;
} {
  const results = suppliers.map(matchSupplier);
  const spend_provided = suppliers.some(
    (s) => typeof s.spend === 'number' && s.spend > 0,
  );

  const counts: Record<Bucket, number> = {
    confirmed_1p5: 0,
    confirmed_wb2c_or_2c: 0,
    confirmed_committed: 0,
    confirmed_removed: 0,
    likely_any: 0,
    not_listed: 0,
  };
  const spend: Record<Bucket, number> | null = spend_provided
    ? {
        confirmed_1p5: 0,
        confirmed_wb2c_or_2c: 0,
        confirmed_committed: 0,
        confirmed_removed: 0,
        likely_any: 0,
        not_listed: 0,
      }
    : null;

  for (const r of results) {
    counts[r.bucket] += 1;
    if (spend && typeof r.input.spend === 'number') {
      spend[r.bucket] += r.input.spend;
    }
  }

  const gaps = results
    .filter(
      (r) =>
        r.bucket === 'not_listed' ||
        r.bucket === 'confirmed_removed' ||
        r.bucket === 'likely_any',
    )
    .map((r) => ({
      name: r.input.name,
      country: r.input.country,
      spend: r.input.spend,
    }))
    .sort((a, b) => (b.spend ?? 0) - (a.spend ?? 0))
    .slice(0, 15);

  return {
    results,
    summary: {
      total: results.length,
      spend_provided,
      counts,
      spend,
      top_gaps: gaps,
    },
  };
}

export function getDatasetMeta(): Meta {
  return meta;
}

export type DatasetStats = {
  total: number;
  near_term_set: number;
  at_1p5: number;
  at_1p5_pct: number;
  net_zero_set: number;
  removed: number;
  removed_pct: number;
  countries: number;
};

let STATS: DatasetStats | null = null;

export function getDatasetStats(): DatasetStats {
  if (STATS) return STATS;
  let nearTerm = 0;
  let onePointFive = 0;
  let netZero = 0;
  let removedCount = 0;
  const countrySet = new Set<string>();
  for (const c of companies) {
    if (c.nt_status === 'Targets set') nearTerm++;
    if (c.nt_status === 'Targets set' && c.nt_class?.includes('1.5')) onePointFive++;
    if (c.nz_status === 'Targets set') netZero++;
    if (c.nt_status === 'Commitment removed') removedCount++;
    if (c.country) countrySet.add(c.country);
  }
  const total = companies.length;
  STATS = {
    total,
    near_term_set: nearTerm,
    at_1p5: onePointFive,
    at_1p5_pct: onePointFive / total,
    net_zero_set: netZero,
    removed: removedCount,
    removed_pct: removedCount / total,
    countries: countrySet.size,
  };
  return STATS;
}
