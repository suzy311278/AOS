/**
 * Central JSON-LD schema builders for ArmorInnovate.
 *
 * All builders return plain objects. Serialize with `safeJsonLd()` from
 * `@/lib/json-ld` before injecting via dangerouslySetInnerHTML.
 *
 * Entity graph convention: every site-wide node uses stable @id anchors so
 * page-specific schemas can reference them without duplication.
 */

import { SITE_ORIGIN } from '@/lib/site';

export const SITE_URL = SITE_ORIGIN;
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const SAAS_ID = `${SITE_URL}/#saas`;
export const LOGO_ID = `${SITE_URL}/#logo`;
export const EDITORIAL_ID = `${SITE_URL}/#editorial-board`;

/**
 * Topical "desks" — each is a sub-organization authoring a cluster of content.
 * Named teams without named individuals, so E-E-A-T signals accumulate against
 * topical entities instead of a generic site byline.
 */
export const DESKS = {
  carbonMarkets: {
    id: `${SITE_URL}/#carbon-markets-desk`,
    name: 'ArmorInnovate Carbon Markets Desk',
    knowsAbout: [
      'CBAM (Carbon Border Adjustment Mechanism)',
      'EU Emissions Trading System',
      'Voluntary Carbon Markets',
      'Article 6 Carbon Markets',
      'Verra VCS methodologies',
      'Gold Standard',
      'Carbon Credit Retirements',
      'VM0042',
      'VM0044',
    ],
  },
  climateDisclosure: {
    id: `${SITE_URL}/#climate-disclosure-desk`,
    name: 'ArmorInnovate Climate Disclosure Desk',
    knowsAbout: ['IFRS S1 and S2', 'TCFD', 'CDP', 'SFDR', 'CSRD', 'ESRS', 'Double Materiality'],
  },
  ghgAccounting: {
    id: `${SITE_URL}/#ghg-accounting-desk`,
    name: 'ArmorInnovate GHG Accounting Desk',
    knowsAbout: [
      'GHG Protocol Corporate Standard',
      'Scope 1, 2, and 3 Emissions',
      'Financed Emissions (PCAF)',
      'Emission Factors',
      'ISO 14064',
      'SBTi target setting',
    ],
  },
  natureSupplyChain: {
    id: `${SITE_URL}/#nature-supply-chain-desk`,
    name: 'ArmorInnovate Nature & Supply Chain Desk',
    knowsAbout: ['EUDR', 'TNFD', 'Biodiversity', 'Human Rights Due Diligence', 'IFC Performance Standards'],
  },
  sustainableFinance: {
    id: `${SITE_URL}/#sustainable-finance-desk`,
    name: 'ArmorInnovate Sustainable Finance Desk',
    knowsAbout: ['EU Taxonomy', 'Green Bonds', 'ESG Investing', 'Principles for Responsible Investment'],
  },
} as const;

export type DeskKey = keyof typeof DESKS;

/** Map a guide slug to the desk that authors it. Falls back to carbonMarkets. */
export function deskForGuide(slug: string): DeskKey {
  const s = slug.toLowerCase();
  if (/cbam|ets|vm00|verra|gold.?standard|vcm|article.?6|retirement|carbon.?market/.test(s)) return 'carbonMarkets';
  if (/ifrs|tcfd|sfdr|csrd|cdp|esrs|double.?materiality|disclosure/.test(s)) return 'climateDisclosure';
  if (/scope|ghg|financed|pcaf|emission.?factor|sbti|iso.?14064/.test(s)) return 'ghgAccounting';
  if (/eudr|tnfd|biodiversity|human.?rights|ifc.?performance/.test(s)) return 'natureSupplyChain';
  if (/taxonomy|green.?bond|esg.?investing|pri/.test(s)) return 'sustainableFinance';
  return 'carbonMarkets';
}

/** Map a course id to the desk that authors it. */
export function deskForCourse(courseId: string): DeskKey {
  const s = courseId.toLowerCase();
  if (/cbam|vm00|vcm|article-6|carbon-taxation-and-ets/.test(s)) return 'carbonMarkets';
  if (/ifrs|tcfd|sfdr|csrd|cdp|esg-reporting|double-materiality/.test(s)) return 'climateDisclosure';
  if (/scope|ghg|financed|emission-factors|sbti/.test(s)) return 'ghgAccounting';
  if (/eudr|tnfd|biodiversity|human-rights|ifc/.test(s)) return 'natureSupplyChain';
  if (/taxonomy|esg-investing|esg-benchmarking|circular/.test(s)) return 'sustainableFinance';
  return 'carbonMarkets';
}

/** Build the site-wide @graph injected on every page via the root layout. */
export function siteGraph() {
  const deskNodes = Object.values(DESKS).map((d) => ({
    '@type': 'Organization',
    '@id': d.id,
    name: d.name,
    parentOrganization: { '@id': ORG_ID },
    knowsAbout: d.knowsAbout,
    publisher: { '@id': ORG_ID },
  }));
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': ORG_ID,
        name: 'ArmorInnovate',
        alternateName: 'The Sustainability OS',
        url: SITE_URL,
        logo: {
          '@type': 'ImageObject',
          '@id': LOGO_ID,
          url: `${SITE_URL}/brand/greentryst-logo.png`,
          contentUrl: `${SITE_URL}/brand/greentryst-logo.png`,
        },
        description:
          'Professional operating system for sustainability practitioners. Learning, AI-sourced answers, and tools covering 120+ regulations across 14+ geographies. Built by consultants from top consulting firms with 10+ years of experience across Finance, Environmental Science, Energy Efficiency, and Renewable Energy.',
        email: 'hello@armorinnovate.com',
        contactPoint: [
          {
            '@type': 'ContactPoint',
            contactType: 'customer support',
            email: 'hello@armorinnovate.com',
            availableLanguage: ['en'],
          },
          {
            '@type': 'ContactPoint',
            contactType: 'sales',
            email: 'business@armorinnovate.com',
            availableLanguage: ['en'],
          },
        ],
        sameAs: ['https://www.linkedin.com/company/green-tryst/'],
        hasCredential: [
          {
            '@type': 'EducationalOccupationalCredential',
            credentialCategory: 'professional experience',
            description:
              'Team members bring 10+ years of experience from top management consulting firms across Finance, Environmental Science, Energy Efficiency, and Renewable Energy. All content is produced by topical desks (Carbon Markets, Climate Disclosure, GHG Accounting, Nature & Supply Chain, Sustainable Finance) and reviewed by the ArmorInnovate Editorial Board before publication.',
          },
        ],
        subOrganization: Object.values(DESKS).map((d) => ({ '@id': d.id })),
        knowsAbout: [
          'Greenhouse Gas Accounting',
          'Scope 1, 2, and 3 Emissions',
          'CBAM (Carbon Border Adjustment Mechanism)',
          'IFRS S1 and S2',
          'GRI Standards',
          'SASB Standards',
          'TCFD',
          'SBTi',
          'EU Taxonomy',
          'SFDR',
          'EUDR',
          'TNFD',
          'Article 6 Carbon Markets',
          'Financed Emissions',
          'ESG Reporting',
          'Double Materiality',
          'Emission Factors',
          'Carbon Credit Retirements',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': WEBSITE_ID,
        url: SITE_URL,
        name: 'ArmorInnovate',
        publisher: { '@id': ORG_ID },
        inLanguage: 'en',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE_URL}/emission-factors/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': SAAS_ID,
        name: 'ArmorInnovate',
        applicationCategory: 'BusinessApplication',
        applicationSubCategory: 'Sustainability & ESG Platform',
        operatingSystem: 'Web',
        url: SITE_URL,
        publisher: { '@id': ORG_ID },
        featureList: [
          '23 sustainability courses with 552+ lessons',
          'SustainIQ — AI Q&A with regulation-sourced citations',
          'Emission Factor database with full provenance',
          'Carbon market intelligence and retirement leaderboard',
          'Prompt library for sustainability workflows',
          'Career directory with 400+ sustainability jobs',
        ],
        offers: [
          { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD' },
          {
            '@type': 'Offer',
            name: 'Individual',
            price: '99',
            priceCurrency: 'USD',
          },
          {
            '@type': 'Offer',
            name: 'Pro',
            price: '239',
            priceCurrency: 'USD',
          },
        ],
      },
      {
        '@type': 'Organization',
        '@id': EDITORIAL_ID,
        name: 'ArmorInnovate Editorial Board',
        parentOrganization: { '@id': ORG_ID },
        description:
          'Reviews every published guide, course, and reference entry against the primary source document before publication. Verifies regulatory citations, dates, thresholds, and worked examples.',
      },
      ...deskNodes,
    ],
  };
}

export interface BreadcrumbEntry {
  name: string;
  url?: string;
}

/** BreadcrumbList. Last entry is current page; leave url undefined on it. */
export function breadcrumbList(entries: BreadcrumbEntry[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: entries.map((e, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: e.name,
      ...(e.url ? { item: e.url.startsWith('http') ? e.url : `${SITE_URL}${e.url}` } : {}),
    })),
  };
}

export interface CourseInput {
  id: string;
  title: string;
  description: string;
  totalLessons: number;
  estimatedHours?: number;
}

export function courseSchema(c: CourseInput) {
  const url = `${SITE_URL}/courses/${c.id}`;
  const deskId = DESKS[deskForCourse(c.id)].id;
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    '@id': `${url}#course`,
    name: c.title,
    description: c.description,
    url,
    provider: { '@id': ORG_ID },
    author: { '@id': deskId },
    reviewedBy: { '@id': EDITORIAL_ID },
    inLanguage: 'en',
    numberOfLessons: c.totalLessons,
    ...(c.estimatedHours ? { timeRequired: `PT${c.estimatedHours}H` } : {}),
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'Online',
      courseWorkload: c.estimatedHours ? `PT${c.estimatedHours}H` : 'PT2H',
    },
  };
}

export interface LearningResourceInput {
  courseId: string;
  lessonId: string;
  title: string;
  description: string;
  courseTitle: string;
}

export function learningResourceSchema(l: LearningResourceInput) {
  const url = `${SITE_URL}/courses/${l.courseId}/${l.lessonId.replace(/\./g, '_')}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    '@id': `${url}#lesson`,
    name: l.title,
    description: l.description,
    url,
    learningResourceType: 'Lesson',
    isPartOf: {
      '@type': 'Course',
      '@id': `${SITE_URL}/courses/${l.courseId}#course`,
      name: l.courseTitle,
    },
    inLanguage: 'en',
    provider: { '@id': ORG_ID },
  };
}

export interface ArticleInput {
  slug: string;
  title: string;
  description: string;
  dateModified?: string;
  datePublished?: string;
  readingMinutes?: number;
  desk?: DeskKey;
}

export function articleSchema(a: ArticleInput) {
  const url = `${SITE_URL}/guides/${a.slug}`;
  const isoMod = toIso(a.dateModified);
  const isoPub = toIso(a.datePublished) ?? isoMod;
  const deskId = a.desk ? DESKS[a.desk].id : DESKS[deskForGuide(a.slug)].id;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: a.title,
    description: a.description,
    url,
    mainEntityOfPage: url,
    inLanguage: 'en',
    author: { '@id': deskId },
    reviewedBy: { '@id': EDITORIAL_ID },
    editor: { '@id': EDITORIAL_ID },
    publisher: { '@id': ORG_ID },
    ...(isoPub ? { datePublished: isoPub } : {}),
    ...(isoMod ? { dateModified: isoMod } : {}),
    ...(a.readingMinutes
      ? { timeRequired: `PT${a.readingMinutes}M` }
      : {}),
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h2', 'h3', '.faq', '.action-items'],
    },
  };
}

export interface FaqEntry {
  question: string;
  answer: string;
}

export function faqPageSchema(slug: string, entries: FaqEntry[]) {
  const url = `${SITE_URL}/guides/${slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    isPartOf: { '@id': `${url}#article` },
    mainEntity: entries.map((e) => ({
      '@type': 'Question',
      name: e.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: e.answer,
      },
    })),
  };
}

export interface QuizQuestionInput {
  question: string;
  explanation?: string;
}

export function lessonFaqPageSchema(
  courseId: string,
  lessonId: string,
  questions: QuizQuestionInput[],
) {
  const url = `${SITE_URL}/courses/${courseId}/${lessonId.replace(/\./g, '_')}`;
  const entries = questions
    .filter((q) => q.explanation && q.explanation.trim().length > 0)
    .map((q) => ({
      '@type': 'Question' as const,
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer' as const,
        text: q.explanation!.trim(),
      },
    }));
  if (entries.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    isPartOf: { '@id': `${url}#lesson` },
    mainEntity: entries,
  };
}

export interface DefinedTermInput {
  slug: string;
  name: string;
  description: string;
}

export function definedTermSetSchema(
  terms: DefinedTermInput[],
  opts?: { limit?: number }
) {
  const url = `${SITE_URL}/glossary`;
  const limited = opts?.limit ? terms.slice(0, opts.limit) : terms;
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    '@id': `${url}#set`,
    name: 'ArmorInnovate Sustainability Glossary',
    description: `${terms.length} definitions across carbon markets, GHG accounting, ESG frameworks, climate science, climate finance, EU Taxonomy, reporting standards, biodiversity, and social safeguards.`,
    url,
    inLanguage: 'en',
    publisher: { '@id': ORG_ID },
    hasDefinedTerm: limited.map((t) => ({
      '@type': 'DefinedTerm',
      '@id': `${url}#term-${t.slug}`,
      name: t.name,
      description: t.description,
      inDefinedTermSet: `${url}#set`,
      termCode: t.slug,
      url: `${url}#term-${t.slug}`,
    })),
  };
}

export interface DataCatalogInput {
  url: string;
  name: string;
  description: string;
  datasetUrls?: string[];
}

export function dataCatalogSchema(d: DataCatalogInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DataCatalog',
    '@id': `${d.url}#catalog`,
    name: d.name,
    description: d.description,
    url: d.url,
    publisher: { '@id': ORG_ID },
    inLanguage: 'en',
    ...(d.datasetUrls && d.datasetUrls.length > 0
      ? { dataset: d.datasetUrls.map((u) => ({ '@id': `${u}#dataset` })) }
      : {}),
  };
}

export interface DatasetInput {
  url: string;
  name: string;
  description: string;
  keywords?: string[];
  variableMeasured?: string[];
  temporalCoverage?: string;
  license?: string;
  creator?: string;
  distributionUrl?: string;
  distributionFormat?: string;
}

export function datasetSchema(d: DatasetInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': `${d.url}#dataset`,
    name: d.name,
    description: d.description,
    url: d.url,
    publisher: { '@id': ORG_ID },
    ...(d.creator ? { creator: { '@type': 'Organization', name: d.creator } } : {}),
    inLanguage: 'en',
    ...(d.keywords && d.keywords.length > 0 ? { keywords: d.keywords } : {}),
    ...(d.variableMeasured && d.variableMeasured.length > 0
      ? { variableMeasured: d.variableMeasured }
      : {}),
    ...(d.temporalCoverage ? { temporalCoverage: d.temporalCoverage } : {}),
    ...(d.license ? { license: d.license } : {}),
    ...(d.distributionUrl
      ? {
          distribution: {
            '@type': 'DataDownload',
            contentUrl: d.distributionUrl,
            encodingFormat: d.distributionFormat ?? 'application/json',
          },
        }
      : {}),
  };
}

export interface PromptInput {
  slug: string;
  title: string;
  description: string;
  category?: string;
  dateModified?: string;
}

export function promptCreativeWorkSchema(p: PromptInput) {
  const url = `${SITE_URL}/prompt-library/${p.slug}`;
  const iso = toIso(p.dateModified);
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    '@id': `${url}#prompt`,
    name: p.title,
    headline: p.title,
    description: p.description,
    url,
    inLanguage: 'en',
    creator: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    ...(p.category ? { genre: p.category } : {}),
    ...(iso ? { dateModified: iso } : {}),
    learningResourceType: 'Prompt',
  };
}

function toIso(d?: string): string | undefined {
  if (!d) return undefined;
  const parsed = new Date(d);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString().slice(0, 10);
}
