/**
 * Server-only loader for the /frameworks content layer.
 *
 * A "framework" is any sustainability reporting structure the platform
 * catalogues: standards (IFRS S2, GRI, SASB, ESRS), directives (CSRD,
 * BRSR), and frameworks in the strict sense (TCFD, TNFD, CDP). The
 * `/frameworks` URL uses the looser term because practitioners type
 * "framework" even for standards and directives.
 *
 * Each framework directory under src/content/frameworks/<id>/ contains:
 *
 *   meta.yaml        — framework identity + pillar list.
 *   disclosures.yaml — disclosure requirements with verbatim text,
 *                      plain-English explanation, and exemplar.
 *
 * Never import this file from a client component. Uses fs.
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

const CONTENT_ROOT = join(process.cwd(), 'src', 'content', 'frameworks');

export type PillarStatus = 'live' | 'in_progress';
export type FrameworkType =
  | 'Standard'
  | 'Framework'
  | 'Directive'
  | 'Disclosure System';

export interface PillarMeta {
  id: string;
  name: string;
  slug: string;
  order: number;
  summary: string;
  paragraph_refs: string[];
  status: PillarStatus;
}

export interface RelatedLesson {
  course: string;
  lesson: string;
}

export interface DisclosureEntry {
  ref: string;
  /** Stable URL fragment derived from ref (e.g. 6(a)(i) -> 6-a-i). */
  anchor: string;
  pillar: string;
  section_full: string;
  parent: string | null;
  requirement_text: string;
  plain_english: string;
  example_disclosure: string;
  related_lessons: RelatedLesson[];
  related_tools: string[];
}

export interface JurisdictionRow {
  name: string;
  regulator: string;
  status: string;
  period: string;
  notes: string;
}

export interface FrameworkMeta {
  id: string;
  name: string;
  short_name: string;
  issuer: string;
  issuer_short?: string;
  type: FrameworkType;
  status: string;
  effective_from?: string;
  jurisdictions: string[];
  summary: string;
  long_summary?: string;
  /** Hand-authored SEO title. Falls back to `${name}: Practitioner Guide` if absent. */
  seo_title?: string;
  /** Hand-authored meta description. Falls back to a slice of summary. */
  seo_description?: string;
  /** ISO date (YYYY-MM-DD) of the last Editorial Board review. Drives dateModified. */
  last_reviewed?: string;
  /** Canonical external URL for the standard itself (e.g. the issuer's official page for the document). */
  issuer_url?: string;
  /** Jurisdiction-by-jurisdiction adoption rows. Powers the on-page adoption table. */
  jurisdictions_detailed?: JurisdictionRow[];
  related_courses: string[];
  related_tools: string[];
  pillars: PillarMeta[];
}

export interface Framework extends FrameworkMeta {
  disclosures: DisclosureEntry[];
}

/** Framework catalogue rendered on /frameworks even before content lands. */
export interface FrameworkStub {
  id: string;
  name: string;
  short_name: string;
  issuer: string;
  type: FrameworkType;
  summary: string;
  status: 'live' | 'in_preparation';
}

const FRAMEWORK_CATALOGUE: FrameworkStub[] = [
  {
    id: 'ifrs-s2',
    name: 'IFRS S2: Climate-related Disclosures',
    short_name: 'IFRS S2',
    issuer: 'IFRS Foundation (ISSB)',
    type: 'Standard',
    summary:
      'Global baseline for climate-related financial disclosures. Four pillars carried forward from TCFD, plus quantitative and industry-based metric requirements.',
    status: 'live',
  },
  {
    id: 'ifrs-s1',
    name: 'IFRS S1: General Requirements',
    short_name: 'IFRS S1',
    issuer: 'IFRS Foundation (ISSB)',
    type: 'Standard',
    summary:
      'General requirements for disclosure of sustainability-related financial information. Companion to IFRS S2 and the umbrella under which other topical standards sit.',
    status: 'in_preparation',
  },
  {
    id: 'gri',
    name: 'GRI Standards',
    short_name: 'GRI',
    issuer: 'Global Reporting Initiative',
    type: 'Standard',
    summary:
      'Impact-materiality focused sustainability reporting standards. Universal Standards plus topical Environmental, Social, and Economic Standards.',
    status: 'in_preparation',
  },
  {
    id: 'esrs',
    name: 'European Sustainability Reporting Standards',
    short_name: 'ESRS',
    issuer: 'EFRAG',
    type: 'Standard',
    summary:
      'The EU reporting standards that implement the CSRD. Twelve topical standards covering environmental, social, governance, and cross-cutting requirements under a double-materiality lens.',
    status: 'in_preparation',
  },
  {
    id: 'csrd',
    name: 'Corporate Sustainability Reporting Directive',
    short_name: 'CSRD',
    issuer: 'European Commission',
    type: 'Directive',
    summary:
      'EU law requiring in-scope entities to report against the ESRS. Defines scope, timing, assurance, and digital reporting obligations.',
    status: 'in_preparation',
  },
  {
    id: 'brsr',
    name: 'Business Responsibility and Sustainability Report',
    short_name: 'BRSR',
    issuer: 'Securities and Exchange Board of India',
    type: 'Directive',
    summary:
      'Mandatory sustainability reporting format for the top 1,000 listed companies in India, organised around nine principles from the National Guidelines on Responsible Business Conduct.',
    status: 'in_preparation',
  },
  {
    id: 'tcfd',
    name: 'Task Force on Climate-related Financial Disclosures',
    short_name: 'TCFD',
    issuer: 'Financial Stability Board',
    type: 'Framework',
    summary:
      'The four-pillar climate disclosure framework now absorbed into IFRS S2. Still widely referenced in jurisdictions that have not yet adopted ISSB standards.',
    status: 'in_preparation',
  },
  {
    id: 'tnfd',
    name: 'Task Force on Nature-related Financial Disclosures',
    short_name: 'TNFD',
    issuer: 'TNFD Taskforce',
    type: 'Framework',
    summary:
      'Nature-focused counterpart to TCFD. LEAP approach for locating nature exposures, evaluating dependencies and impacts, assessing risks and opportunities, and preparing disclosures.',
    status: 'in_preparation',
  },
  {
    id: 'sasb',
    name: 'SASB Standards',
    short_name: 'SASB',
    issuer: 'IFRS Foundation',
    type: 'Standard',
    summary:
      'Industry-specific sustainability accounting standards now maintained by the IFRS Foundation. Source of the industry-based metrics referenced by IFRS S2.',
    status: 'in_preparation',
  },
  {
    id: 'cdp',
    name: 'CDP Disclosure System',
    short_name: 'CDP',
    issuer: 'CDP Worldwide',
    type: 'Disclosure System',
    summary:
      'Annual environmental disclosure platform covering Climate, Water, and Forests questionnaires. Scoring from A to D-/F drives institutional investor engagement.',
    status: 'in_preparation',
  },
];

export function listFrameworks(): FrameworkStub[] {
  return FRAMEWORK_CATALOGUE;
}

export function getFrameworkStub(id: string): FrameworkStub | null {
  return FRAMEWORK_CATALOGUE.find((f) => f.id === id) ?? null;
}

/**
 * Convert an IFRS-style paragraph reference like "6(a)(i)" into a URL
 * fragment safe slug like "6-a-i". The transformation is total so the
 * mapping is stable across sessions.
 */
export function refToAnchor(ref: string): string {
  return ref
    .replace(/\(/g, '-')
    .replace(/\)/g, '')
    .replace(/\./g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

export function getFramework(id: string): Framework | null {
  const dir = join(CONTENT_ROOT, id);
  const metaPath = join(dir, 'meta.yaml');
  const discPath = join(dir, 'disclosures.yaml');
  if (!existsSync(metaPath)) return null;

  const metaRaw = readFileSync(metaPath, 'utf8');
  const meta = yaml.load(metaRaw) as FrameworkMeta;

  let disclosures: DisclosureEntry[] = [];
  if (existsSync(discPath)) {
    const discRaw = readFileSync(discPath, 'utf8');
    const parsed = yaml.load(discRaw) as { disclosures?: Partial<DisclosureEntry>[] };
    disclosures = (parsed?.disclosures ?? []).map((d) => ({
      ref: String(d.ref ?? ''),
      anchor: refToAnchor(String(d.ref ?? '')),
      pillar: String(d.pillar ?? ''),
      section_full: String(d.section_full ?? ''),
      parent: d.parent ?? null,
      requirement_text: String(d.requirement_text ?? '').trim(),
      plain_english: String(d.plain_english ?? '').trim(),
      example_disclosure: String(d.example_disclosure ?? '').trim(),
      related_lessons: Array.isArray(d.related_lessons)
        ? (d.related_lessons as RelatedLesson[])
        : [],
      related_tools: Array.isArray(d.related_tools)
        ? (d.related_tools as string[])
        : [],
    }));
  }

  return { ...meta, disclosures };
}

export function getFrameworkPillar(
  id: string,
  pillarSlug: string
): { framework: Framework; pillar: PillarMeta; disclosures: DisclosureEntry[] } | null {
  const framework = getFramework(id);
  if (!framework) return null;
  const pillar = framework.pillars.find((p) => p.slug === pillarSlug);
  if (!pillar) return null;
  const disclosures = framework.disclosures.filter((d) => d.pillar === pillar.id);
  return { framework, pillar, disclosures };
}

export function getFrameworkStaticParams(): { frameworkId: string }[] {
  if (!existsSync(CONTENT_ROOT)) return [];
  return readdirSync(CONTENT_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => ({ frameworkId: d.name }));
}

export function getFrameworkPillarStaticParams(): {
  frameworkId: string;
  pillarId: string;
}[] {
  const out: { frameworkId: string; pillarId: string }[] = [];
  for (const { frameworkId } of getFrameworkStaticParams()) {
    const fw = getFramework(frameworkId);
    if (!fw) continue;
    for (const p of fw.pillars) {
      if (p.status === 'live') {
        out.push({ frameworkId, pillarId: p.slug });
      }
    }
  }
  return out;
}
