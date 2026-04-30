/**
 * /redesign/pricing — standalone pricing page
 *
 * Twelve sections, using the same design language as the homepage.
 * Dark charcoal hero, light pale section bridges, dark-card cards for
 * product previews, mono headers for product-spec blocks (comparison
 * matrix, usage limits), green-accented hover micro-interactions.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Minus,
  BookOpen,
  Sparkles,
  Calculator,
  Bell,
  Briefcase,
  ShieldCheck,
  Lock,
  Server,
  UserCog,
  FileCheck,
  Layers,
  LineChart,
  Building2,
  GraduationCap,
  PenTool,
  Users,
  HelpCircle,
  Plus,
  Globe,
  Award,
  Scale,
  ClipboardCheck,
} from 'lucide-react';
import { Nav } from '@/components/Nav';
import {
  RedesignFooter,
  DarkSection,
  LightSection,
  CategoryLabel,
  SectionHeading,
  PricingSection,
  ClosingCTA,
  DarkUICard,
  RedesignButton,
} from '@/components/redesign';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Transparent, fixed pricing for the professional operating system for sustainability. Free for individuals, scale to enterprise. Cancel any time.',
  alternates: { canonical: '/pricing' },
  openGraph: {
    type: 'website',
    url: '/pricing',
    title: 'Pricing',
    description:
      'Transparent, fixed pricing for the professional operating system for sustainability.',
  },
};

// ============================================================================
// SECTION 3. COMPARISON MATRIX DATA
// ============================================================================

type MatrixCell =
  | { kind: 'check' }
  | { kind: 'cross' }
  | { kind: 'text'; value: string };

interface MatrixRow {
  feature: string;
  free: MatrixCell;
  individual: MatrixCell;
  pro: MatrixCell;
  team: MatrixCell;
  enterprise: MatrixCell;
}

interface MatrixGroup {
  label: string;
  Icon: typeof BookOpen;
  rows: MatrixRow[];
}

const check: MatrixCell = { kind: 'check' };
const cross: MatrixCell = { kind: 'cross' };
const text = (value: string): MatrixCell => ({ kind: 'text', value });

const MATRIX: MatrixGroup[] = [
  {
    label: 'Learn',
    Icon: BookOpen,
    rows: [
      {
        feature: 'Course library',
        free: text('1/month'),
        individual: text('Unlimited'),
        pro: text('Unlimited'),
        team: text('Unlimited'),
        enterprise: text('Unlimited'),
      },
      {
        feature: 'Audio lessons & quizzes',
        free: check,
        individual: check,
        pro: check,
        team: check,
        enterprise: check,
      },
      {
        feature: 'Completion certificates',
        free: cross,
        individual: check,
        pro: check,
        team: check,
        enterprise: check,
      },
      {
        feature: 'Team enrollment dashboard',
        free: cross,
        individual: cross,
        pro: cross,
        team: check,
        enterprise: check,
      },
    ],
  },
  {
    label: 'SustainIQ',
    Icon: Sparkles,
    rows: [
      {
        feature: 'Query volume',
        free: text('5/month'),
        individual: text('5/day'),
        pro: text('25/day'),
        team: text('Unlimited'),
        enterprise: text('Unlimited'),
      },
      {
        feature: 'Page-level citations',
        free: check,
        individual: check,
        pro: check,
        team: check,
        enterprise: check,
      },
      {
        feature: 'Saved workspaces',
        free: cross,
        individual: text('3'),
        pro: text('20'),
        team: text('Unlimited'),
        enterprise: text('Unlimited'),
      },
    ],
  },
  {
    label: 'Tools',
    Icon: Calculator,
    rows: [
      {
        feature: 'Trial access',
        free: check,
        individual: cross,
        pro: cross,
        team: cross,
        enterprise: cross,
      },
      {
        feature: 'Included professional tools',
        free: cross,
        individual: text('1/month'),
        pro: text('3/month'),
        team: text('All'),
        enterprise: text('All'),
      },
      {
        feature: 'Swap included tools any time',
        free: cross,
        individual: check,
        pro: check,
        team: check,
        enterprise: check,
      },
      {
        feature: 'À la carte extra tools',
        free: cross,
        individual: text('$15/mo ea'),
        pro: text('$15/mo ea'),
        team: text('Included'),
        enterprise: text('Included'),
      },
    ],
  },
  {
    label: 'Regulations',
    Icon: Bell,
    rows: [
      {
        feature: 'Browse regulations library',
        free: check,
        individual: check,
        pro: check,
        team: check,
        enterprise: check,
      },
      {
        feature: 'Applicability engine',
        free: cross,
        individual: text('Selected alerts'),
        pro: check,
        team: check,
        enterprise: check,
      },
      {
        feature: 'Deadline tracking',
        free: cross,
        individual: cross,
        pro: check,
        team: check,
        enterprise: check,
      },
    ],
  },
  {
    label: 'Career',
    Icon: Briefcase,
    rows: [
      {
        feature: 'Browse curated jobs',
        free: check,
        individual: check,
        pro: check,
        team: check,
        enterprise: check,
      },
      {
        feature: 'Skill-gap analysis',
        free: cross,
        individual: check,
        pro: check,
        team: check,
        enterprise: check,
      },
      {
        feature: 'Resume + priority notifications',
        free: cross,
        individual: check,
        pro: check,
        team: check,
        enterprise: check,
      },
      {
        feature: 'Team profile for hiring',
        free: cross,
        individual: cross,
        pro: cross,
        team: check,
        enterprise: check,
      },
    ],
  },
  {
    label: 'Reports & exports',
    Icon: FileCheck,
    rows: [
      {
        feature: 'PDF export',
        free: cross,
        individual: check,
        pro: check,
        team: check,
        enterprise: check,
      },
      {
        feature: 'All formats (PDF, DOCX, XLSX, CSV)',
        free: cross,
        individual: cross,
        pro: check,
        team: check,
        enterprise: check,
      },
      {
        feature: 'Full audit trails and sources',
        free: cross,
        individual: cross,
        pro: check,
        team: check,
        enterprise: check,
      },
    ],
  },
  {
    label: 'Admin & support',
    Icon: UserCog,
    rows: [
      {
        feature: 'SSO / SAML',
        free: cross,
        individual: cross,
        pro: cross,
        team: check,
        enterprise: check,
      },
      {
        feature: 'Advanced admin dashboard',
        free: cross,
        individual: cross,
        pro: cross,
        team: check,
        enterprise: check,
      },
      {
        feature: 'Custom onboarding',
        free: cross,
        individual: cross,
        pro: cross,
        team: check,
        enterprise: check,
      },
      {
        feature: 'Support',
        free: text('Community'),
        individual: text('Community'),
        pro: text('Priority community'),
        team: text('Priority email'),
        enterprise: text('Priority + CSM'),
      },
    ],
  },
];

// ============================================================================
// SECTION 4. TOOLS À LA CARTE
// ============================================================================

const TOOLS_ALA_CARTE = [
  {
    name: 'GHG Calculator',
    description:
      'Scope 1, 2, and 3 emissions with factor-linked calculations and full audit trail.',
    price: '$15/mo',
    Icon: Calculator,
  },
  {
    name: 'Report Drafter',
    description:
      'Build BRSR, CSRD, and TCFD drafts with sourced text blocks from the library.',
    price: '$15/mo',
    Icon: PenTool,
  },
  {
    name: 'IFRS Gap Assessment',
    description:
      'Compare your current disclosures to IFRS S1/S2 requirements with a gap matrix.',
    price: '$15/mo',
    Icon: LineChart,
  },
  {
    name: 'BRSR Screener',
    description:
      'Walk through BRSR Core Section K with prompts, examples, and cited guidance.',
    price: '$15/mo',
    Icon: FileCheck,
  },
  {
    name: 'CBAM Preparer',
    description:
      'Prepare quarterly CBAM reports with default values, embedded emissions, and checks.',
    price: '$15/mo',
    Icon: Layers,
  },
  {
    name: 'Scope 3 Estimator',
    description:
      'Fast-path Scope 3 inventory using spend-based and hybrid methods with EF library.',
    price: '$15/mo',
    Icon: Sparkles,
  },
];

// ============================================================================
// SECTION 5. USAGE & FAIR-USE LIMITS
// ============================================================================

const USAGE_LIMITS = [
  { metric: 'SustainIQ queries (Free)', value: '5 / month' },
  { metric: 'SustainIQ queries (Individual)', value: '5 / day' },
  { metric: 'SustainIQ queries (Pro)', value: '25 / day' },
  { metric: 'SustainIQ queries (Team & Enterprise)', value: 'Unlimited, fair use' },
  { metric: 'Professional tools (Individual)', value: '1 active, swap any time' },
  { metric: 'Professional tools (Pro)', value: '3 active, swap any time' },
  { metric: 'Professional tools (Team & Enterprise)', value: 'All included' },
  { metric: 'Export volume', value: 'Unlimited within tier' },
  { metric: 'Seats (Team)', value: 'Up to 10 users' },
  { metric: 'Seats (Enterprise)', value: 'Up to 50 users, 50+ custom' },
  { metric: 'Data retention', value: '365 days of workspace history' },
];

// ============================================================================
// SECTION 6. SERVICES ADD-ONS (deep)
// ============================================================================

interface Service {
  category: string;
  title: string;
  blurb: string;
  duration: string;
  price: string;
  includes: string[];
  outcome: string;
  Icon: typeof GraduationCap;
  /** Flagship services span full width and get a leaf-green top accent. */
  flagship?: boolean;
  /** Render the card on a dark charcoal surface for extra visual weight. */
  dark?: boolean;
}

const SERVICES: Service[] = [
  {
    flagship: true,
    dark: true,
    category: 'Climate Risk',
    title: 'Climate Risk Assessment',
    blurb:
      'The most detailed climate risk assessment available anywhere in the world. Physical risks modelled at 900 metre resolution, flood-specific risks at 100 metre resolution, and transition risks downscaled to each asset\u2019s country-specific NDCs, laws, and real emission figures. The final report is IFRS S2-aligned and returns every year with documented improvement recommendations.',
    duration: '6 to 10 weeks',
    price: 'From $6,500',
    includes: [
      'Physical risk modelling at 900 m resolution across all asset locations',
      'Flood-specific risk modelling at 100 m resolution',
      'Transition risk downscaled to country NDCs, national laws, and real sector emissions',
      'Asset-level heat maps for acute and chronic perils',
      'Scenario analysis across RCP/SSP pathways (1.5\u00b0C, 2\u00b0C, 3\u00b0C, 4\u00b0C)',
      'IFRS S2-aligned disclosure report with narrative and quantitative blocks',
      'Year-on-year improvement recommendations tracked against the prior report',
      'Board-ready executive summary and technical appendix',
    ],
    outcome:
      'A climate risk report that holds up against the most rigorous audit standards, with the highest spatial resolution available on the market.',
    Icon: Globe,
  },
  {
    category: 'Diagnostic',
    title: 'Sustainability Readiness Diagnostic',
    blurb:
      'A one-hour working session to map where your reporting and disclosure program stands today, where it needs to be, and which six-week moves close the gap.',
    duration: '60 min',
    price: 'Free for all tiers',
    includes: [
      'Framework readiness scan (GHG, CSRD, BRSR, IFRS S1/S2, TCFD, CDP)',
      'Gap snapshot across data, process, and disclosures',
      'Three prioritised next steps with effort estimates',
      'Recommended Greentryst tier and tool shortlist',
    ],
    outcome:
      'You leave the call with a written gap snapshot and a recommended 6-week plan.',
    Icon: HelpCircle,
  },
  {
    category: 'Assessment',
    title: 'Double Materiality Assessment',
    blurb:
      'Run the full CSRD-compliant double materiality assessment: stakeholder mapping, impact materiality, financial materiality, and the combined matrix. Every conclusion is backed by documented evidence and traceable scoring.',
    duration: '5 to 8 weeks',
    price: 'From $3,600',
    includes: [
      'Stakeholder mapping across internal and external groups',
      'Structured stakeholder interviews and survey distribution',
      'Impact materiality scoring across environment, social, and governance',
      'Financial materiality scoring across risks and opportunities',
      'Combined double materiality matrix with topic heat map',
      'CSRD / ESRS-aligned documentation pack ready for audit',
      'Board presentation deck and internal communication templates',
    ],
    outcome:
      'A defensible double materiality assessment ready for CSRD disclosure and audit.',
    Icon: Scale,
  },
  {
    category: 'Training',
    dark: true,
    title: 'Framework Gap Assessment & Training',
    blurb:
      'A DIY-first service. Start with our free gap-assessment checklists for the major frameworks (CSRD, BRSR, IFRS S1/S2, TCFD, GRI, SBTi). Then book a guided training session where we walk through your completed checklist together, identify the real gaps, and build your remediation plan live.',
    duration: '2 weeks (checklist + training)',
    price: 'Free checklists \u00b7 Training from $750',
    includes: [
      'Free downloadable gap checklists for CSRD, BRSR, IFRS S2, TCFD, GRI, SBTi',
      'Self-assessment with guided prompts and worked examples',
      'Optional 3-hour live walk-through with a Greentryst analyst',
      'Gap prioritisation with severity and effort scoring',
      'Remediation roadmap with owner and timeline',
      'Export-ready documentation for internal review and audit',
    ],
    outcome:
      'You understand exactly where your program stands, and you own the roadmap to close the gaps.',
    Icon: ClipboardCheck,
  },
  {
    category: 'Ratings',
    title: 'ESG Ratings Submission Support',
    blurb:
      'End-to-end support for every major ESG rating. We prepare the submission, draft the responses, manage the rating-agency dialogue, and map a year-on-year score-improvement path so next year\u2019s rating is better than this year\u2019s.',
    duration: '4 to 8 weeks per cycle',
    price: 'From $2,400 per rating',
    includes: [
      'Coverage of CDP, MSCI, Sustainalytics, S&P Global CSA, ISS ESG, EcoVadis, Moody\u2019s',
      'Response drafting with source citations and evidence links',
      'Evidence library built inside your Greentryst workspace',
      'Year-on-year score-improvement plan with prioritised actions',
      'Rating-agency dialogue and clarification management',
      'Post-submission score analysis and next-cycle roadmap',
    ],
    outcome:
      'A higher rating this year and a clear, documented path to a higher one next year.',
    Icon: Award,
  },
  {
    category: 'Build',
    dark: true,
    title: 'Scope 3 Inventory Build',
    blurb:
      'We build your first audit-ready Scope 3 inventory across the fifteen categories, using your procurement, travel, and logistics data plus DEFRA and EPA emission factors.',
    duration: '4 to 6 weeks',
    price: 'From $4,400',
    includes: [
      'Category-by-category materiality screen',
      'Data collection templates for Finance, Procurement, and Ops',
      'Hybrid method calculations with factor-level citations',
      'Recalculation policy and base-year documentation',
      'Verification-ready workbook with Greentryst audit trail',
    ],
    outcome:
      'A complete Scope 3 inventory you can disclose and defend, with every line sourced.',
    Icon: Calculator,
  },
  {
    category: 'Draft',
    title: 'Disclosure Drafting Engagement',
    blurb:
      'Our team drafts BRSR, CSRD, or TCFD disclosures using your data and Greentryst Report Drafter. You review and approve; we handle the writing and citation work.',
    duration: '3 to 5 weeks',
    price: 'From $2,800',
    includes: [
      'One framework per engagement (BRSR, CSRD, or TCFD)',
      'Draft text with source citations for every quantitative claim',
      'Two rounds of internal review + one legal review',
      'Consistency check against prior year and peer disclosures',
      'Export in required regulator format',
    ],
    outcome:
      'A filing-ready disclosure draft with citations lawyers can stand behind.',
    Icon: PenTool,
  },
  {
    category: 'Training',
    title: 'Personalised Training Sessions',
    blurb:
      'One-on-one or small-group live training on the framework that matters to you. Tailored to your role, your industry, and your disclosure obligations. Not a pre-recorded webinar.',
    duration: '2 to 4 hours per session',
    price: 'From $300 per session',
    includes: [
      'Choice of framework: CSRD, BRSR, IFRS S1/S2, TCFD, CDP, SBTi, GHG Protocol',
      'Pre-session brief shaped around your role and objectives',
      'Live 2 to 4 hour session with unlimited Q&A',
      'Case-study walk-throughs using your industry',
      'Recorded session and follow-up notes',
      'Thirty-day email access to the trainer for follow-up questions',
    ],
    outcome:
      'You leave confident enough to explain the framework to your team the next morning.',
    Icon: GraduationCap,
  },
  {
    category: 'Enablement',
    title: 'Team Onboarding & Custom Training',
    blurb:
      'Role-based training for your sustainability, finance, and operations teams. Covers Greentryst workflows plus the frameworks that matter to your disclosure program.',
    duration: '1 to 2 weeks',
    price: 'From $1,200',
    includes: [
      'Role mapping across your sustainability, finance, and ops teams',
      'Three live sessions tailored to each role and use case',
      'Recorded video library for new joiners',
      'Greentryst admin setup: seats, SSO, team workspace',
      'Thirty-day post-launch office hours',
    ],
    outcome:
      'Every member of the team is productive on Greentryst within the first week.',
    Icon: Users,
  },
  {
    category: 'Retainer',
    title: 'Quarterly Compliance Retainer',
    blurb:
      'A standing engagement that keeps your disclosure program current as regulations evolve. You get a named analyst, quarterly reviews, and priority access during filing season.',
    duration: 'Ongoing',
    price: 'From $1,500 / quarter',
    includes: [
      'Named sustainability analyst as your point of contact',
      'Quarterly compliance review against your disclosure map',
      'Alerts and working notes on new regulation releases',
      'Priority ticket handling during filing windows',
      'Up to four hours of live working time per month',
    ],
    outcome:
      'You stop reacting to regulation changes and start staying ahead of them.',
    Icon: ShieldCheck,
  },
  {
    category: 'Tooling',
    title: 'Custom Tool or Template Build',
    blurb:
      'We configure a Greentryst tool or build a custom report template to your internal methodology, so your teams use one workflow instead of five spreadsheets.',
    duration: '3 to 6 weeks',
    price: 'From $2,400',
    includes: [
      'Discovery workshops with your methodology owners',
      'Tool or template configuration inside Greentryst',
      'Hand-off documentation for admins',
      'Two rounds of revisions',
      'Thirty-day bug-fix warranty',
    ],
    outcome:
      'Your methodology lives inside Greentryst, not in a spreadsheet someone has to maintain.',
    Icon: Layers,
  },
  {
    dark: true,
    category: 'Enterprise',
    title: 'Enterprise Implementation',
    blurb:
      'For programs that span multiple business units or geographies. A full-service implementation covering data architecture, governance, and rollout across the organisation.',
    duration: '8 to 16 weeks',
    price: 'Custom',
    includes: [
      'Data architecture and source-of-truth design',
      'Governance model: owners, reviewers, approvers',
      'Multi-BU or multi-geo rollout plan',
      'Integrations with ERP, HRIS, travel, and procurement systems',
      'Executive-level disclosure dashboard',
      'Dedicated implementation lead',
    ],
    outcome:
      'A program that satisfies audit, regulators, and the board without bolt-on spreadsheets.',
    Icon: Building2,
  },
];

// ============================================================================
// SECTION 8. WHO THIS IS FOR
// ============================================================================

const AUDIENCE_SEGMENTS = [
  {
    segment: 'Individual practitioner',
    description:
      'You work inside a company or consultancy, learn a new framework every quarter, and cite sources in every deck.',
    recommended: 'Individual',
    price: '$12 / month',
    Icon: GraduationCap,
  },
  {
    segment: 'Independent consultant',
    description:
      'You run your own practice and bill clients for defensible work. You need every tool on demand and calculations you can stand behind.',
    recommended: 'Pro',
    price: '$29 / month',
    Icon: Briefcase,
  },
  {
    segment: 'In-house sustainability team',
    description:
      'You lead a small team inside a company of 100 to 1,000 people. Disclosure is annual, regulation is quarterly, and you need a shared workspace.',
    recommended: 'Team',
    price: '$99 / month',
    Icon: Users,
  },
  {
    segment: 'Enterprise',
    description:
      'Multiple business units or geographies, multiple frameworks, and compliance is not optional. You need SSO, audit trails, and a named contact.',
    recommended: 'Enterprise',
    price: '$400 / month',
    Icon: Building2,
  },
];

// ============================================================================
// SECTION 9. FAQ
// ============================================================================

const FAQ = [
  {
    q: 'Can I switch plans mid-month?',
    a: 'Yes. Upgrades take effect immediately and we prorate the difference. Downgrades take effect at the end of the current billing cycle, so you keep the paid tier you already purchased.',
  },
  {
    q: 'What happens to my workspaces and reports if I cancel?',
    a: 'Your data is retained for ninety days after cancellation so you can export everything. After that, workspaces and reports are deleted. Learning progress and course certificates stay on your profile permanently.',
  },
  {
    q: 'Where is my data stored, and who has access to it?',
    a: 'Data is stored in EU or US regions depending on your organisation preference. Access is role-scoped inside your workspace; Greentryst engineers only access customer data with written authorisation for support cases. Enterprise plans can pin residency and require private enclaves.',
  },
  {
    q: 'Do you offer discounts for students or nonprofits?',
    a: 'Students get the Individual tier free for one year with a valid .edu or equivalent institutional email. Registered nonprofits get 50% off Individual, Pro, and Team tiers. Write to us with verification and we turn it on within a business day.',
  },
  {
    q: 'How do you keep up with new regulations?',
    a: 'Regulation tracking is built into the platform, not a separate service. Every tier sees new regulations as they are published. Pro and above get the applicability engine that tells you which ones apply to your business, and when.',
  },
  {
    q: 'Why is SustainIQ capped for individuals?',
    a: 'The retrieval pipeline is the most expensive thing we run. The caps keep individual pricing honest at $12 and $29 a month. Teams and Enterprise get unlimited fair-use because seat revenue covers the retrieval cost.',
  },
  {
    q: 'Is there a free trial for Pro, Team, or Enterprise?',
    a: 'Pro includes a seven-day free trial with no feature limits; a credit card is required to start. Team and Enterprise include a sixty-minute Sustainability Readiness Diagnostic before you buy, at no cost.',
  },
  {
    q: 'Can I bring my own methodology or template?',
    a: 'Yes on Team and Enterprise. We can configure Greentryst tools and report templates to your methodology under the Custom Tool or Template Build engagement. Your methodology runs inside the platform, with full audit trails.',
  },
];

// ============================================================================
// SECTION 10. SECURITY & COMPLIANCE
// ============================================================================

const SECURITY_ITEMS = [
  { label: 'SOC 2 Type II', sub: 'Annual independent audit', Icon: ShieldCheck },
  { label: 'GDPR compliant', sub: 'EU data residency option', Icon: Lock },
  { label: 'ISO 27001 aligned', sub: 'Controls mapped and documented', Icon: FileCheck },
  { label: 'SSO / SAML', sub: 'Team and Enterprise tiers', Icon: UserCog },
  { label: 'Encrypted at rest and in transit', sub: 'AES-256 + TLS 1.3', Icon: Server },
  { label: 'Full audit logs', sub: 'Per-user, per-document', Icon: Layers },
];

// ============================================================================
// PAGE
// ============================================================================

export default function PricingPage() {
  return (
    <>
      <Nav tone="dark" />

      {/* =====================================================================
          SECTION 1. HERO BAND
          ===================================================================== */}
      <DarkSection dotGrid glow padding="sm">
        <div className="pt-16 pb-10 max-w-3xl mx-auto text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gt-leaf font-bold mb-6">
            Pricing
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-[1.1] tracking-tight">
            Pick the tier that fits the work.
          </h1>
          <p className="mt-6 text-[15px] md:text-base text-white/70 leading-relaxed max-w-2xl mx-auto">
            Fixed pricing. No sales calls required. Cancel any time. Every tier,
            including Free, ships with full source citations on every answer
            and every calculation.
          </p>
        </div>
      </DarkSection>

      {/* =====================================================================
          SECTION 2. TIER CARDS
          ===================================================================== */}
      <LightSection variant="pale" padding="lg" className="!pt-16 !pb-20">
        <PricingSection />
      </LightSection>

      {/* =====================================================================
          SECTION 3. COMPARISON MATRIX
          ===================================================================== */}
      <LightSection variant="white" padding="lg" className="!pt-16 !pb-20">
        <div className="max-w-3xl mb-10">
          <CategoryLabel>What's included</CategoryLabel>
          <SectionHeading size="section" tone="dark" className="mt-5">
            Full comparison across every tier.
          </SectionHeading>
          <p className="mt-5 text-[15px] text-gt-text-muted leading-relaxed">
            Every capability the platform offers, mapped to every tier. Scan
            the rows that matter to your work.
          </p>
        </div>

        <div className="overflow-x-auto border border-gt-border-light rounded-2xl bg-white">
          <table className="w-full min-w-[920px] text-left">
            <thead>
              <tr className="border-b border-gt-border-light">
                <th className="p-5 text-[11px] font-bold uppercase tracking-[0.18em] text-gt-text-dim bg-gt-pale-warm/40">
                  Feature
                </th>
                {['Free', 'Individual', 'Pro', 'Team', 'Enterprise'].map(
                  (name) => (
                    <th
                      key={name}
                      className="p-5 text-[11px] font-bold uppercase tracking-[0.18em] text-gt-medium text-center bg-gt-pale-warm/40"
                      style={{
                        fontFamily:
                          'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                      }}
                    >
                      {name}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {MATRIX.map((group) => (
                <MatrixGroupRows key={group.label} group={group} />
              ))}
            </tbody>
          </table>
        </div>
      </LightSection>

      {/* =====================================================================
          SECTION 4. TOOLS À LA CARTE
          ===================================================================== */}
      <LightSection variant="pale" padding="lg" className="!pt-16 !pb-20">
        <div className="max-w-3xl mb-10">
          <CategoryLabel>Tools, À la carte</CategoryLabel>
          <SectionHeading size="section" tone="dark" className="mt-5">
            Pay only for the tools you actually use.
          </SectionHeading>
          <p className="mt-5 text-[15px] text-gt-text-muted leading-relaxed max-w-2xl">
            Each professional tool is priced at $15 per month on its own.
            Individual includes one, Pro includes three, Team and Enterprise
            include all. Swap any time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS_ALA_CARTE.map((tool) => (
            <div
              key={tool.name}
              className="group relative rounded-2xl bg-white border border-gt-border-light p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_-12px_rgba(0,60,41,0.18)] hover:border-gt-medium/30"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-gt-medium/10 text-gt-medium flex items-center justify-center transition-colors group-hover:bg-gt-medium group-hover:text-white">
                  <tool.Icon className="w-5 h-5" strokeWidth={2} />
                </div>
                <span
                  className="text-[11px] font-bold text-gt-medium"
                  style={{
                    fontFamily:
                      'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                  }}
                >
                  {tool.price}
                </span>
              </div>
              <h3 className="text-[17px] font-bold text-gt-text leading-snug mb-2">
                {tool.name}
              </h3>
              <p className="text-[13px] text-gt-text-muted leading-relaxed">
                {tool.description}
              </p>
            </div>
          ))}
        </div>
      </LightSection>

      {/* =====================================================================
          SERVICES AND FAIR-USE LIMITS NOW LIVE ON THEIR OWN PAGES:
            /redesign/services
            /redesign/fair-use
          ===================================================================== */}

      {/* =====================================================================
          SECTION 7. PROVENANCE GUARANTEE CALLOUT
          ===================================================================== */}
      <DarkSection dotGrid padding="md">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gt-leaf/10 border border-gt-leaf/30 text-gt-leaf mb-6">
            <ShieldCheck className="w-7 h-7" strokeWidth={2} />
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gt-leaf font-bold mb-6">
            The Provenance Promise
          </p>
          <h2 className="text-3xl md:text-[40px] font-extrabold text-white leading-tight tracking-tight">
            Every tier, including Free, ships with full source citations on
            every answer and every calculation.
          </h2>
          <p className="mt-6 text-[15px] text-white/70 leading-relaxed max-w-2xl mx-auto">
            Provenance is not a feature we hold back for paid tiers. It is how
            the platform works.
          </p>
        </div>
      </DarkSection>

      {/* =====================================================================
          SECTION 8. WHO THIS IS FOR
          ===================================================================== */}
      <LightSection variant="pale" padding="lg" className="!pt-20 !pb-20">
        <div className="max-w-3xl mb-12">
          <CategoryLabel>Who this is for</CategoryLabel>
          <SectionHeading size="section" tone="dark" className="mt-5">
            Find the tier that matches how you work.
          </SectionHeading>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {AUDIENCE_SEGMENTS.map((seg) => (
            <div
              key={seg.segment}
              className="group relative rounded-2xl bg-white border border-gt-border-light p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_32px_-12px_rgba(0,60,41,0.18)] hover:border-gt-medium/30"
            >
              <div className="w-11 h-11 rounded-xl bg-gt-medium/10 text-gt-medium flex items-center justify-center mb-5 transition-colors group-hover:bg-gt-medium group-hover:text-white">
                <seg.Icon className="w-5 h-5" strokeWidth={2} />
              </div>
              <h3 className="text-[16px] font-bold text-gt-text mb-2">
                {seg.segment}
              </h3>
              <p className="text-[13px] text-gt-text-muted leading-relaxed mb-5">
                {seg.description}
              </p>
              <div className="pt-4 border-t border-gt-border-light/70">
                <p
                  className="text-[10px] uppercase tracking-[0.18em] text-gt-text-dim mb-1"
                  style={{
                    fontFamily:
                      'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                  }}
                >
                  Recommended
                </p>
                <p className="text-[14px] font-bold text-gt-medium">
                  {seg.recommended}
                  <span className="ml-2 text-gt-text-muted font-normal">
                    {seg.price}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </LightSection>

      {/* =====================================================================
          SECTION 9. FAQ
          ===================================================================== */}
      <LightSection variant="white" padding="lg" className="!pt-20 !pb-24">
        <div className="max-w-3xl mx-auto mb-12 text-center">
          <CategoryLabel>Questions we get asked</CategoryLabel>
          <SectionHeading size="section" tone="dark" className="mt-5">
            Answers, before you ask.
          </SectionHeading>
        </div>

        <div className="max-w-3xl mx-auto divide-y divide-gt-border-light border-y border-gt-border-light">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group py-5 transition-colors hover:bg-gt-pale-warm/20 [&_summary]:list-none"
            >
              <summary className="flex items-start justify-between gap-6 cursor-pointer px-2 md:px-3">
                <span className="text-[16px] font-bold text-gt-text leading-snug">
                  {item.q}
                </span>
                <span
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-gt-medium/10 text-gt-medium flex items-center justify-center transition-all duration-300 group-open:rotate-45 group-open:bg-gt-medium group-open:text-white"
                  aria-hidden
                >
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                </span>
              </summary>
              <p className="mt-4 px-2 md:px-3 text-[14px] text-gt-text-muted leading-relaxed">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </LightSection>

      {/* =====================================================================
          SECTION 10. SECURITY & COMPLIANCE
          ===================================================================== */}
      <section className="bg-gt-text-dark py-20 border-y border-white/5">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="max-w-3xl mb-10">
            <p className="text-[10px] uppercase tracking-[0.2em] text-gt-leaf font-bold mb-6">
              Security & compliance
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight tracking-tight">
              Built to clear audit, procurement, and legal on day one.
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {SECURITY_ITEMS.map((item) => (
              <div
                key={item.label}
                className="group rounded-xl border border-white/10 bg-white/[0.02] p-5 transition-all duration-300 hover:bg-white/[0.06] hover:border-gt-leaf/30"
              >
                <div className="w-9 h-9 rounded-lg bg-gt-leaf/10 text-gt-leaf flex items-center justify-center mb-4 transition-colors group-hover:bg-gt-leaf group-hover:text-gt-text-dark">
                  <item.Icon className="w-4 h-4" strokeWidth={2} />
                </div>
                <p className="text-[13px] font-bold text-white leading-snug mb-1">
                  {item.label}
                </p>
                <p className="text-[11px] text-white/55 leading-snug">
                  {item.sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 11. CLOSING CTA
          ===================================================================== */}
      <ClosingCTA />

      {/* =====================================================================
          SECTION 12. FOOTER
          ===================================================================== */}
      <RedesignFooter />
    </>
  );
}

// ============================================================================
// Comparison matrix group rows + cell renderer
// ============================================================================

function MatrixGroupRows({ group }: { group: MatrixGroup }) {
  return (
    <>
      <tr className="bg-gt-pale-warm/30">
        <td
          colSpan={6}
          className="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-gt-medium"
          style={{
            fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
          }}
        >
          <span className="inline-flex items-center gap-2">
            <group.Icon className="w-3.5 h-3.5" strokeWidth={2.2} />
            {group.label}
          </span>
        </td>
      </tr>
      {group.rows.map((row) => (
        <tr
          key={row.feature}
          className="border-t border-gt-border-light transition-colors hover:bg-gt-pale-warm/30"
        >
          <td className="p-4 text-[14px] text-gt-text">{row.feature}</td>
          {(['free', 'individual', 'pro', 'team', 'enterprise'] as const).map(
            (tier) => (
              <td key={tier} className="p-4 text-center">
                <MatrixCellRender cell={row[tier]} />
              </td>
            )
          )}
        </tr>
      ))}
    </>
  );
}

function MatrixCellRender({ cell }: { cell: MatrixCell }) {
  if (cell.kind === 'check') {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gt-medium/10 text-gt-medium">
        <Check className="w-3.5 h-3.5" strokeWidth={2.8} />
      </span>
    );
  }
  if (cell.kind === 'cross') {
    return <Minus className="w-4 h-4 text-gt-text-dim/50 inline" strokeWidth={2} />;
  }
  return (
    <span
      className="text-[13px] text-gt-text"
      style={{
        fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
      }}
    >
      {cell.value}
    </span>
  );
}
