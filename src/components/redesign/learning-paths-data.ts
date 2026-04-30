/**
 * learning-paths-data
 *
 * Shared definitions for the four curated learning paths shown on
 * the catalogue page and cross-linked from the course detail page.
 *
 * Lives in src/components/redesign/ rather than inside any single
 * page so multiple routes can import the same source of truth and
 * stay in sync. To edit a path, change the entry here and rebuild.
 *
 * Course titles and hours for each step are NOT stored here; they
 * are looked up at render time from the real course.yaml data so
 * the path data never drifts from the catalogue.
 */

import type { LearningPathRoleIcon } from '@/components/redesign/LearningPathShowcase';

export interface LearningPathDef {
  id: string;
  role: string;
  navLabel: string;
  title: string;
  outcomes: string[];
  steps: string[];
  iconName: LearningPathRoleIcon;
}

export const LEARNING_PATHS: LearningPathDef[] = [
  {
    id: 'carbon-analyst',
    role: 'For the carbon analyst',
    navLabel: 'Carbon Analyst',
    title: 'Measure, verify, and defend a GHG number.',
    outcomes: [
      'Calculate a defensible Scope 1 and 2 inventory',
      'Set a science-based target you can defend in front of an auditor',
      'Read a Verra methodology end-to-end without getting lost',
    ],
    iconName: 'calculator',
    steps: [
      'climate-science-101',
      'ghg-scope-1-2',
      'ghg-scope-3',
      'sbti',
      'vcm-101',
    ],
  },
  {
    id: 'esg-reporter',
    role: 'For the ESG reporter',
    navLabel: 'ESG Reporter',
    title: 'Publish a disclosure that holds up to scrutiny.',
    outcomes: [
      'Run a double materiality assessment aligned to CSRD',
      'Map your organization to GRI, SASB, and ESRS',
      'Publish a board-ready sustainability report',
    ],
    iconName: 'file-text',
    steps: [
      'esg-reporting',
      'double-materiality',
      'ifrs-s2',
      'esg-benchmarking',
      'human-rights-dd',
    ],
  },
  {
    id: 'climate-risk-analyst',
    role: 'For the climate risk analyst',
    navLabel: 'Climate Risk Analyst',
    title: 'Turn climate scenarios into business decisions.',
    outcomes: [
      'Build TCFD and IFRS S2 aligned scenario analysis',
      'Quantify physical and transition risk for any sector',
      'Translate climate models into board disclosures',
    ],
    iconName: 'line-chart',
    steps: [
      'climate-science-101',
      'ifrs-s2',
      'financed-emissions',
      'tnfd-biodiversity',
      'esg-reporting',
    ],
  },
  {
    id: 'sustainable-finance',
    role: 'For the sustainable finance specialist',
    navLabel: 'Sustainable Finance',
    title: 'Classify, disclose, and raise capital under EU rules.',
    outcomes: [
      'Classify activities under the EU Taxonomy with DNSH',
      'Disclose under SFDR Article 8 and 9',
      'Calculate financed emissions with the PCAF methodology',
    ],
    iconName: 'banknote',
    steps: [
      'eu-taxonomy',
      'eu-sfdr',
      'financed-emissions',
      'esg-investing',
      'ifrs-s2',
    ],
  },
];

/**
 * Convenience helper. Returns every path that contains the given
 * course id in its `steps` array. Used by the course detail page to
 * cross-link "Continue your path" cards.
 */
export function findPathsContainingCourse(
  courseId: string
): LearningPathDef[] {
  return LEARNING_PATHS.filter((path) => path.steps.includes(courseId));
}
