/**
 * Shared Tools catalog.
 *
 * Single source of truth for the tools hub page (/tools) and the Tools
 * dropdown in the top nav. Grouped by job-to-be-done so IA stays
 * consistent across surfaces.
 *
 * Pure data module: no server-only imports; safe to import in client
 * components.
 */

import {
  Library,
  Calculator,
  FileText,
  ClipboardCheck,
  Sparkles,
  Globe2,
  Users2,
  type LucideIcon,
} from 'lucide-react';

export interface ToolCard {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  href: string | null;
  cta: string;
  status: 'live' | 'soon';
}

export interface ToolGroup {
  id: string;
  eyebrow: string;
  title: string;
  intent: string;
  tools: ToolCard[];
}

export const TOOL_GROUPS: ToolGroup[] = [
  {
    id: 'reference',
    eyebrow: 'Reference data',
    title: 'Sourced data to pull into your inventories and reports.',
    intent:
      'Open the library surface first when you need a number you can cite and stand behind.',
    tools: [
      {
        id: 'emission-factors',
        title: 'Emission Factors',
        description: 'Every emission factor. Sourced, dated, and free.',
        icon: Library,
        href: '/emission-factors',
        cta: 'Open tool',
        status: 'live',
      },
      {
        id: 'carbon-market',
        title: 'Carbon Market Intelligence',
        description:
          'Global carbon market, made traceable. 12,234 projects across Verra VCS, CCB, PWRP, Gold Standard, ACR, CAR, and ART TREES in one searchable index.',
        icon: Globe2,
        href: '/carbon/market',
        cta: 'Open tool',
        status: 'live',
      },
    ],
  },
  {
    id: 'assess',
    eyebrow: 'Assess & disclose',
    title: 'Structured self-checks and disclosure-ready outputs.',
    intent:
      'Use these when the question is "where are we against the framework, and what do we disclose?"',
    tools: [
      {
        id: 'ifrs-s2-gap-assessment',
        title: 'IFRS S2 Gap Assessment',
        description:
          'Clause-by-clause self-assessment with slot-filled draft disclosures. Governance, strategy, risk, and metrics in one workflow.',
        icon: ClipboardCheck,
        // In-progress build; the tool files are not yet committed, so
        // flag it as coming soon and drop the href to keep the link
        // from 404ing in production. Flip back to status:'live' + the
        // real href once src/app/tools/ifrs-s2-gap-assessment lands.
        href: null,
        cta: 'Coming soon',
        status: 'soon',
      },
      {
        id: 'supplier-sbti-tracker',
        title: 'Supplier SBTi Tracker',
        description:
          'Upload your supplier list and see which suppliers have science-based targets. Coverage by count and by spend, CSV export, free.',
        icon: Users2,
        // Same state as IFRS S2 tool above — the /tools page file is
        // still local-only. Keep the tile visible but don't ship a link
        // that would 404.
        href: null,
        cta: 'Coming soon',
        status: 'soon',
      },
      {
        id: 'brsr-screener',
        title: 'BRSR Screener',
        description:
          'Map your disclosures against the Indian BRSR Core and flag gaps before assurance.',
        icon: ClipboardCheck,
        href: null,
        cta: 'Coming soon',
        status: 'soon',
      },
    ],
  },
  {
    id: 'draft',
    eyebrow: 'Draft & communicate',
    title: 'Professional-voice artefacts with cited numbers.',
    intent:
      'Reach for these when the answer is ready and you need to write it up without the AI-tells.',
    tools: [
      {
        id: 'prompt-library',
        title: 'Prompt Library',
        description:
          'Detailed prompts for drafting ESG reports, CDP responses, DJSI answers, BRSR indicators. Professional voice, no AI tells.',
        icon: Sparkles,
        href: '/prompt-library',
        cta: 'Open tool',
        status: 'live',
      },
      {
        id: 'report-drafter',
        title: 'Report Drafter',
        description:
          'Structured drafting for CSRD, BRSR, and TCFD with cited numbers linked to primary sources.',
        icon: FileText,
        href: null,
        cta: 'Coming soon',
        status: 'soon',
      },
    ],
  },
  {
    id: 'calculate',
    eyebrow: 'Calculate',
    title: 'Inventories and compliance numbers, computed once.',
    intent:
      'Built on the Emission Factors library so every input has a citation and every output is reproducible.',
    tools: [
      {
        id: 'ghg-calculator',
        title: 'GHG Calculator',
        description:
          'Compute organisational inventories across Scope 1, 2, and 3 using the Emission Factors library.',
        icon: Calculator,
        href: null,
        cta: 'Coming soon',
        status: 'soon',
      },
    ],
  },
];
