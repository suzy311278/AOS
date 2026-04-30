/**
 * SustainIQ query library
 *
 * Curated starter queries organized by category. The main empty
 * state shows 6 featured queries from this library, and a
 * "Browse more topics" expander reveals the full set organized
 * by category so a cold visitor can see the breadth of topics
 * SustainIQ can answer defensibly.
 */

export interface LibraryCategory {
  id: string;
  label: string;
  queries: string[];
}

export const QUERY_LIBRARY: LibraryCategory[] = [
  {
    id: 'climate-science',
    label: 'Climate Science',
    queries: [
      'What does IPCC AR6 say about climate sensitivity?',
      'How is radiative forcing measured and why does it matter?',
      'What is the difference between SSP1-1.9 and SSP5-8.5 scenarios?',
      'How does the carbon cycle buffer against atmospheric CO2?',
    ],
  },
  {
    id: 'ghg-accounting',
    label: 'GHG Accounting',
    queries: [
      'How do I choose between location-based and market-based Scope 2 reporting?',
      'What are the 15 categories of Scope 3 emissions under the GHG Protocol?',
      'How is a corporate inventory boundary defined using operational control?',
      'What emission factors should I use for Scope 1 stationary combustion?',
    ],
  },
  {
    id: 'esg-reporting',
    label: 'ESG Reporting',
    queries: [
      'What is double materiality under CSRD and how is it assessed?',
      'How do GRI, SASB, and ESRS overlap and where do they differ?',
      'What counts as a sustainability-related risk under IFRS S1?',
      'How do I build a reasonable assurance audit trail for my sustainability report?',
    ],
  },
  {
    id: 'carbon-markets',
    label: 'Carbon Markets',
    queries: [
      'What are the three quantification approaches in VM0042?',
      'How does the ICVCM Core Carbon Principles framework evaluate credit integrity?',
      'What is the difference between Article 6.2 and Article 6.4 mechanisms?',
      'How is baseline emissions set under Verra VM0044 for biochar projects?',
    ],
  },
  {
    id: 'targets',
    label: 'Targets & Strategy',
    queries: [
      'How does SBTi validate a near-term emissions reduction target?',
      'What is the difference between absolute and intensity-based targets?',
      'How should a transition plan align with IFRS S2 disclosure requirements?',
      'What are the minimum criteria for a 1.5C-aligned pathway?',
    ],
  },
  {
    id: 'eu-regulation',
    label: 'EU Regulation',
    queries: [
      'When does EU CBAM move from the transitional to the definitive period?',
      'What is substantial contribution under the EU Taxonomy?',
      'How do SFDR Article 8 and Article 9 products differ in disclosure obligations?',
      'What are the PAI indicators under SFDR and which are mandatory?',
    ],
  },
];

/** The six featured queries shown in the default empty state on first
 *  (server-rendered) paint. Deterministic so server and client match on
 *  hydration. The client swaps in a shuffled set once mounted (see
 *  `pickFeaturedQueries`) so returning visitors see variety. */
export const FEATURED_QUERY_IDS: string[] = [
  'What does IPCC AR6 say about climate sensitivity?',
  'How do I choose between location-based and market-based Scope 2 reporting?',
  'What is double materiality under CSRD and how is it assessed?',
  'What are the three quantification approaches in VM0042?',
  'How does SBTi validate a near-term emissions reduction target?',
  'When does EU CBAM move from the transitional to the definitive period?',
];

/**
 * Pick a fresh set of featured queries for the empty state.
 *
 * Shape stays the same — one query per category, six total — but each
 * category's slot rotates through its 4 variants, and the category
 * order itself shuffles. Call on mount from a client component so SSR
 * hydration uses the deterministic FEATURED_QUERY_IDS first and the
 * shuffle replaces it on the client only (no mismatch warning).
 */
export function pickFeaturedQueries(): string[] {
  const randomItem = <T,>(arr: readonly T[]): T =>
    arr[Math.floor(Math.random() * arr.length)];

  // Shuffle a copy of QUERY_LIBRARY so category order rotates too.
  const cats = [...QUERY_LIBRARY].sort(() => Math.random() - 0.5);
  return cats.map((cat) => randomItem(cat.queries));
}
