/**
 * /redesign/services — dedicated services page.
 *
 * Greentryst is product-first; this page is where premium custom
 * engagements live, away from the Pricing page. The core is the twelve
 * engagement cards (Climate Risk as flagship, three charcoal-surface
 * picks, the rest on white). Around them we layer:
 *
 *   1. Hero
 *   2. Category index strip (jump links)
 *   3. Twelve engagement cards
 *   4. How we work (four-step process)
 *   5. Outcomes strip
 *   6. Services FAQ
 *   7. Closing CTA
 *   8. Footer
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  BookOpen,
  Sparkles,
  Calculator,
  Briefcase,
  ShieldCheck,
  FileCheck,
  Layers,
  Building2,
  GraduationCap,
  PenTool,
  HelpCircle,
  Plus,
  Globe,
  Award,
  Scale,
  ClipboardCheck,
  ClipboardList,
  MessagesSquare,
  PackageCheck,
  Handshake,
  BadgeCheck,
  Timer,
  Route,
  Target,
  Coins,
  Leaf,
  Truck,
  Search,
  Presentation,
  Microscope,
  Droplets,
} from 'lucide-react';
import { Nav } from '@/components/Nav';
import {
  RedesignFooter,
  DarkSection,
  LightSection,
  CategoryLabel,
  SectionHeading,
  ClosingCTA,
  RedesignButton,
} from '@/components/redesign';

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Premium custom engagements for sustainability teams. Climate risk at global-leading spatial resolution, double materiality, ratings support, training, and enterprise implementations. Fixed scope, fixed fee, every claim sourced.',
  alternates: { canonical: '/services' },
  openGraph: {
    type: 'website',
    url: '/services',
    title: 'Services',
    description:
      'Premium custom engagements for sustainability teams. Fixed scope, fixed fee, every claim sourced.',
  },
};

// ============================================================================
// SERVICES DATA
// ============================================================================

interface Service {
  /** Engagement id matching /api/enquiry's ENGAGEMENTS map. */
  engagementId:
    | 'climate-risk'
    | 'diagnostic'
    | 'net-zero-plan'
    | 'sbti-targets'
    | 'double-materiality'
    | 'tnfd-assessment'
    | 'framework-gap'
    | 'esg-ratings'
    | 'scope-3'
    | 'supplier-decarb'
    | 'verra-feasibility'
    | 'drafting'
    | 'personalised-training'
    | 'board-briefing'
    | 'internal-carbon-pricing'
    | 'shadow-water-pricing'
    | 'retainer'
    | 'custom-tool'
    | 'ma-due-diligence'
    | 'enterprise-implementation';
  category: string;
  title: string;
  blurb: string;
  duration: string;
  price: string;
  includes: string[];
  outcome: string;
  Icon: typeof GraduationCap;
  /** Flagship: full-width card with persistent leaf-green top bar. */
  flagship?: boolean;
  /** Render on a charcoal surface for visual prominence. */
  dark?: boolean;
  /** Free tier highlight: full-width, leaf-green wash, FREE badge. */
  freeHighlight?: boolean;
}

const SERVICES: Service[] = [
  {
    flagship: true,
    dark: true,
    engagementId: 'climate-risk',
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
    engagementId: 'diagnostic',
    freeHighlight: true,
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
    engagementId: 'net-zero-plan',
    dark: true,
    category: 'Strategy',
    title: 'Net Zero Transition Plan',
    blurb:
      'Build a credible, board-approved transition plan across your 2030, 2040, and net-zero-year targets. Sector-specific abatement levers, capex pacing, governance, and disclosure-ready narrative, all grounded in your own emissions data.',
    duration: '10 to 14 weeks',
    price: 'From $18,000',
    includes: [
      'Emissions baseline + multi-pathway projection',
      'Sector-specific marginal abatement cost (MAC) curve',
      'Capex + opex pacing scenarios built with your finance team',
      'Scope 1, 2, and 3 reduction pathway with milestones',
      'Residual emissions and high-integrity removal strategy',
      'Governance model for annual plan updates',
      'Board-ready transition plan document',
      'Disclosure package aligned to IFRS S2 and TPT framework',
    ],
    outcome:
      'A transition plan that regulators, investors, and your board accept on first read.',
    Icon: Route,
  },
  {
    engagementId: 'sbti-targets',
    category: 'Targets',
    title: 'SBTi Target Setting & Validation',
    blurb:
      'Set near-term, net-zero, and (where applicable) FLAG targets that meet the Science Based Targets initiative criteria. We handle the methodology, the SBTi portal submission, and the reviewer back-and-forth.',
    duration: '8 to 12 weeks',
    price: 'From $8,500',
    includes: [
      'Inventory alignment with SBTi requirements',
      'Sector-specific criteria mapping (SDA or cross-sector absolute)',
      'Near-term, net-zero, and FLAG target calculations',
      'SBTi portal submission + supporting documentation',
      'Response to SBTi reviewer clarifications',
      'Internal + external communication pack',
    ],
    outcome:
      'A validated SBTi target on the books, and a plan for the annual reconfirmation.',
    Icon: Target,
  },
  {
    engagementId: 'double-materiality',
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
    engagementId: 'tnfd-assessment',
    dark: true,
    category: 'Nature',
    title: 'TNFD Biodiversity Assessment',
    blurb:
      'The nature counterpart to our Climate Risk Assessment. A full TNFD LEAP evaluation across your operations and value chain, with the same spatial-resolution depth applied to biodiversity, water, and ecosystem dependencies.',
    duration: '6 to 10 weeks',
    price: 'From $8,000',
    includes: [
      'LEAP assessment: Locate, Evaluate, Assess, Prepare',
      'Operations + value-chain asset mapping against biodiversity-sensitive areas',
      'Nature-related dependencies and impacts register',
      'Priority location identification with ground-truth overlays',
      'TNFD-aligned disclosure pack + recommendation roadmap',
      'Integration path with existing Climate Risk Assessment outputs',
    ],
    outcome:
      'A disclosure-ready TNFD assessment that stands up to the same audit scrutiny as our climate work.',
    Icon: Leaf,
  },
  {
    dark: true,
    engagementId: 'framework-gap',
    category: 'Training',
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
    engagementId: 'esg-ratings',
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
    dark: true,
    engagementId: 'scope-3',
    category: 'Build',
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
    engagementId: 'supplier-decarb',
    category: 'Value Chain',
    title: 'Supplier Decarbonization Strategy',
    blurb:
      'Turn a Scope 3 inventory into supplier action. Hotspot analysis, supplier segmentation, engagement playbook, scorecards, and target-setting with the suppliers that actually move your number.',
    duration: '6 to 10 weeks',
    price: 'From $12,000',
    includes: [
      'Scope 3 hotspot analysis by category and supplier',
      'Supplier tiering: critical, material, long-tail',
      'Engagement playbook per tier',
      'Supplier scorecard with measurable KPIs',
      'Joint target-setting sessions with top suppliers',
      'Annual review and re-tiering framework',
    ],
    outcome:
      'A supplier roadmap that connects your target to the few dozen suppliers who actually control your footprint.',
    Icon: Truck,
  },
  {
    engagementId: 'verra-feasibility',
    category: 'Carbon Project',
    title: 'Verra Methodology Feasibility Assessment',
    blurb:
      'Before you commit to a full PDD, find out whether the project is viable. We map your available data against the Verra methodology requirements, identify the data gaps, and produce a first-pass estimate of credit generation so you can make an informed go or no-go decision.',
    duration: '3 to 5 weeks',
    price: 'From $3,000',
    includes: [
      'Methodology selection against project type (VM0042, VM0044, and others)',
      'Data availability mapping against the methodology requirements',
      'Data gap register with severity and remediation cost estimates',
      'First-pass credit generation potential (low, central, high scenarios)',
      'Baseline scenario feasibility screen',
      'Additionality and permanence screen',
      'Go or no-go recommendation with next-step options',
    ],
    outcome:
      'A clear answer on whether to commit to the PDD, and exactly which data gaps to close first if you proceed.',
    Icon: Microscope,
  },
  {
    engagementId: 'drafting',
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
    engagementId: 'personalised-training',
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
    engagementId: 'board-briefing',
    category: 'Leadership',
    title: 'Board & C-Suite Briefings',
    blurb:
      'A focused session for directors and executives on the part of the sustainability landscape that matters to your business this quarter. Delivered by a named analyst, tailored to your sector, your footprint, and the decisions on your table.',
    duration: '90 min per session',
    price: 'From $2,400 per session',
    includes: [
      '30-minute discovery call with the sponsoring executive',
      'Tailored 90-minute session with materials and Q&A',
      'Industry-specific regulatory and investor updates',
      'Implications for three-to-five-year strategy',
      'Post-session written memo of key takeaways',
      'One follow-up working session included',
    ],
    outcome:
      'A boardroom that can make the decision confidently, not one that asks for another briefing.',
    Icon: Presentation,
  },
  {
    engagementId: 'internal-carbon-pricing',
    category: 'Finance',
    title: 'Internal Carbon Pricing Design',
    blurb:
      'Design an internal carbon price your finance team will actually apply to capital decisions. Shadow pricing, internal carbon fees, or a hybrid, calibrated to your abatement curve and your disclosure obligations.',
    duration: '4 to 6 weeks',
    price: 'From $2,800',
    includes: [
      'Choice of mechanism: shadow price, internal fee, or implicit price',
      'Price calibration against abatement curve and market signals',
      'Integration with capex approval workflow',
      'Governance and exception process',
      'Year-one monitoring framework',
      'Board-level briefing deck',
    ],
    outcome:
      'A price your capex committee uses, not an aspirational number in a sustainability report.',
    Icon: Coins,
  },
  {
    engagementId: 'shadow-water-pricing',
    category: 'Finance',
    title: 'Shadow Water Pricing',
    blurb:
      'The economic price of water, not the utility tariff. A shadow price per site built from the opportunity cost of use and the next-best-alternative value of that water, so your capex committee evaluates projects against what water is actually worth in that basin, not what the meter says.',
    duration: '4 to 6 weeks',
    price: 'From $1,200',
    includes: [
      'Opportunity-cost analysis per site across agricultural, industrial, and municipal demand',
      'Next-best-alternative valuation calibrated to local basin conditions',
      'Site-level water stress overlay (WRI Aqueduct + basin hydrology + regulatory trajectory)',
      'Integration with capex approval workflow and investment appraisal',
      'Scenario pricing across 2030 and 2040 water stress pathways',
      'Alignment with CDP Water disclosure and TNFD water metrics',
      'Board-level briefing deck',
    ],
    outcome:
      'A per-site shadow price your finance team applies to capex and your sustainability team defends to disclosure, grounded in economic logic instead of utility billing.',
    Icon: Droplets,
  },
  {
    engagementId: 'retainer',
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
    engagementId: 'custom-tool',
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
    engagementId: 'ma-due-diligence',
    category: 'Transactions',
    title: 'M&A Sustainability Due Diligence',
    blurb:
      'Review a target company\u2019s ESG posture, climate risks, undisclosed liabilities, and regulatory exposure before the deal closes. Short, confidential, and written for investment committees, not sustainability teams.',
    duration: '2 to 4 weeks per target',
    price: 'From $12,000 per target',
    includes: [
      'Emissions baseline and trajectory review',
      'Climate risk exposure per asset or site',
      'Regulatory readiness (CSRD, SEC climate rule, local obligations)',
      'Sustainability-linked debt and litigation risk scan',
      'Integration considerations for post-close',
      'IC-ready memo with red-flag list',
    ],
    outcome:
      'An IC memo that names the sustainability risks priced into the deal, and the ones that are not.',
    Icon: Search,
  },
  {
    dark: true,
    engagementId: 'enterprise-implementation',
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
// CATEGORY INDEX (jump links)
// ============================================================================

const CATEGORIES = [
  { label: 'Climate Risk', Icon: Globe },
  { label: 'Diagnostic', Icon: HelpCircle },
  { label: 'Strategy', Icon: Route },
  { label: 'Targets', Icon: Target },
  { label: 'Assessment', Icon: Scale },
  { label: 'Nature', Icon: Leaf },
  { label: 'Training', Icon: GraduationCap },
  { label: 'Ratings', Icon: Award },
  { label: 'Build', Icon: Calculator },
  { label: 'Value Chain', Icon: Truck },
  { label: 'Carbon Project', Icon: Microscope },
  { label: 'Draft', Icon: PenTool },
  { label: 'Leadership', Icon: Presentation },
  { label: 'Finance', Icon: Coins },
  { label: 'Retainer', Icon: ShieldCheck },
  { label: 'Transactions', Icon: Search },
  { label: 'Enterprise', Icon: Building2 },
];

// ============================================================================
// HOW WE WORK
// ============================================================================

const PROCESS_STEPS = [
  {
    step: '01',
    title: 'Scope call',
    blurb:
      'Sixty-minute working session with a Greentryst analyst. We surface the real problem, agree the deliverable, and write the statement of work on the spot.',
    Icon: MessagesSquare,
  },
  {
    step: '02',
    title: 'Clear scope of work',
    blurb:
      'You receive a written scope of work with the deliverable, the engagement fee, and the engagement timeline agreed up front. No hourly meters, no surprise invoices, no change orders without your sign-off.',
    Icon: Handshake,
  },
  {
    step: '03',
    title: 'Execution inside Greentryst',
    blurb:
      'Work happens inside your Greentryst workspace. You see the draft, the sources, and the calculations in real time. Every number is traceable to its source.',
    Icon: Timer,
  },
  {
    step: '04',
    title: 'Handoff + year-one support',
    blurb:
      'Final deliverable is yours to own. We include thirty days of post-handoff support to answer questions, fix edge cases, and brief auditors.',
    Icon: PackageCheck,
  },
];

// ============================================================================
// OUTCOMES (stat strip)
// ============================================================================

const OUTCOMES = [
  { value: '100%', label: 'Claims sourced' },
  { value: '900 m', label: 'Physical risk resolution' },
  { value: '100 m', label: 'Flood risk resolution' },
  { value: '7', label: 'ESG ratings covered' },
  { value: '30d', label: 'Post-handoff support' },
  { value: 'Fixed', label: 'Fee structure' },
];

// ============================================================================
// FAQ
// ============================================================================

const SERVICES_FAQ = [
  {
    q: 'Who owns the deliverables?',
    a: 'You do, the moment the final invoice is paid. The report, the workbook, the checklist, the dashboard: every deliverable is yours to keep, edit, publish, and reuse. Greentryst retains no rights over your data or your outputs.',
  },
  {
    q: 'How do you handle data residency and confidentiality?',
    a: 'Every engagement is backed by a mutual NDA. Client data is stored in the region you choose (EU or US) inside your Greentryst workspace, with role-scoped access. Enterprise engagements can require private-cloud enclaves or customer-managed keys.',
  },
  {
    q: 'Can you subcontract, or is this your own team?',
    a: 'All engagements are delivered by our in-house team of sustainability experts, each with deep domain experience across climate risk, disclosure, carbon markets, and regulation.',
  },
  {
    q: 'What is your revision policy?',
    a: 'Unlimited. We keep working until the deliverable meets the acceptance criteria you signed off on at kickoff, with no clock and no revision limit. If you want something that sits outside the original scope, we write it up as a short change order so the work stays clear on both sides. The point is simple: you should feel proud of what we hand over, not rushed to approve it.',
  },
  {
    q: 'How are engagements paid?',
    a: 'Fixed-fee engagements are split three ways: 20 percent at kickoff, 30 percent at the half-way milestone, and the remaining 50 percent on delivery. Retainers are invoiced quarterly, payable net fifteen. Enterprise engagements follow your procurement schedule.',
  },
  {
    q: 'Can we run an engagement without a Greentryst subscription?',
    a: 'Technically yes, but you lose half the value. The deliverables are built inside Greentryst and live there with full audit trails, so your team can maintain the output after handoff. Any engagement above $5,000 includes a complimentary Team tier subscription for the full duration of the engagement, so there is no reason to run it without one. We strongly recommend the Team or Enterprise tier for any significant engagement.',
  },
  {
    q: 'Do you run pilots for the Climate Risk Assessment?',
    a: 'Yes. A single-asset pilot runs in three weeks and demonstrates the 900 m physical, 100 m flood, and downscaled transition-risk modelling on one of your sites. Pilot fee credits back against a full engagement.',
  },
  {
    q: 'How do you price the Custom Tool / Template Build?',
    a: 'Pricing scales with the complexity of your methodology, not with your company size. We scope against the number of calculations, the data sources to integrate, and the user roles involved. Most engagements land in the $2,400 to $9,600 range.',
  },
];

// ============================================================================
// PAGE
// ============================================================================

export default function ServicesPage() {
  return (
    <>
      <Nav tone="dark" />

      {/* =====================================================================
          SECTION 1. HERO
          ===================================================================== */}
      <DarkSection dotGrid glow padding="sm" className="!pb-0">
        <div className="pt-16 pb-0 max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-[52px] font-extrabold text-white leading-[1.08] tracking-tight">
            Premium custom engagements,
            <br className="hidden md:inline" /> delivered on the same platform
            you use every day.
          </h1>
          <p className="mt-7 text-[15px] md:text-base text-white/70 leading-relaxed max-w-2xl mx-auto">
            Most sustainability work is repeatable, and that&rsquo;s what our
            tools are for. Services are for the harder questions. The ones
            where software isn&rsquo;t enough, where the right answer turns
            on business judgement and regulatory nuance, and where you want
            an expert on the call who has walked this path many times before.
          </p>

          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <RedesignButton
              variant="primary"
              size="lg"
              href="/services/enquire?engagement=diagnostic"
            >
              Book the free diagnostic
              <ArrowRight className="w-4 h-4" />
            </RedesignButton>
            <RedesignButton
              variant="secondary-dark"
              size="lg"
              href="#engagements"
            >
              Browse all engagements
            </RedesignButton>
          </div>
        </div>
      </DarkSection>

      {/* =====================================================================
          SECTION 2. CATEGORY INDEX
          ===================================================================== */}
      <section className="bg-gt-text-dark pt-8 pb-10 md:pb-14">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="flex flex-wrap gap-3 justify-center">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.label}
                href={`#cat-${cat.label.toLowerCase().replace(/\s+/g, '-')}`}
                className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-gt-leaf/40 transition-all duration-300"
              >
                <cat.Icon
                  className="w-4 h-4 text-gt-leaf transition-transform group-hover:scale-110"
                  strokeWidth={2}
                />
                <span
                  className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/80 group-hover:text-white transition-colors"
                  style={{
                    fontFamily:
                      'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                  }}
                >
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 3. TWELVE ENGAGEMENT CARDS
          ===================================================================== */}
      <LightSection
        variant="pale"
        padding="lg"
        className="!pt-20 !pb-24"
        id="engagements"
      >
        <div className="max-w-3xl mb-12">
          <CategoryLabel>Engagements</CategoryLabel>
          <SectionHeading size="section" tone="dark" className="mt-5">
            We don&rsquo;t sell hours.
            <br />
            We provide <span className="whitespace-nowrap">sustainability solutions</span>.
          </SectionHeading>
          <p className="mt-5 text-[15px] text-gt-text-muted leading-relaxed max-w-2xl">
            Every engagement below is a fixed-scope, fixed-fee piece of work
            with a defensible deliverable at the end. No timesheets. No scope
            creep. No surprise invoices.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {SERVICES.map((service) => {
            const dark = !!service.dark;
            const anchorId = `cat-${service.category
              .toLowerCase()
              .replace(/\s+/g, '-')}`;
            return (
              <article
                id={anchorId}
                key={service.title}
                className={`group relative scroll-mt-24 rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 overflow-hidden ${
                  service.flagship || service.freeHighlight ? 'md:col-span-2' : ''
                } ${
                  service.freeHighlight
                    ? 'bg-gradient-to-br from-gt-leaf/10 via-white to-white border-2 border-gt-leaf/40 hover:shadow-[0_22px_50px_-14px_rgba(82,183,136,0.35)] hover:border-gt-leaf'
                    : dark
                    ? 'bg-gt-text-dark border border-white/10 hover:shadow-[0_22px_50px_-16px_rgba(0,0,0,0.6)] hover:border-gt-leaf/40'
                    : 'bg-white border border-gt-border-light hover:shadow-[0_18px_40px_-14px_rgba(0,60,41,0.2)] hover:border-gt-medium/30'
                }`}
              >
                {service.flagship || service.freeHighlight ? (
                  <span
                    className="absolute left-0 right-0 top-0 h-[3px] bg-gt-leaf"
                    aria-hidden
                  />
                ) : (
                  <span
                    className="absolute left-0 top-0 bottom-0 w-[3px] bg-gt-leaf scale-y-0 origin-top transition-transform duration-500 group-hover:scale-y-100"
                    aria-hidden
                  />
                )}
                {service.freeHighlight && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -top-16 -right-12 w-56 h-56 rounded-full"
                    style={{
                      background:
                        'radial-gradient(circle, rgba(82,183,136,0.22) 0%, transparent 70%)',
                      filter: 'blur(8px)',
                    }}
                  />
                )}

                <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                        dark
                          ? 'bg-gt-leaf/15 text-gt-leaf group-hover:bg-gt-leaf group-hover:text-gt-text-dark'
                          : 'bg-gt-medium/10 text-gt-medium group-hover:bg-gt-medium group-hover:text-white'
                      }`}
                    >
                      <service.Icon className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <span
                      className="text-[10px] font-bold uppercase tracking-[0.2em] text-gt-leaf"
                      style={{
                        fontFamily:
                          'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                      }}
                    >
                      {service.category}
                    </span>
                    {service.flagship && (
                      <span
                        className="text-[10px] font-bold uppercase tracking-[0.2em] text-gt-text-dark bg-gt-leaf px-2 py-1 rounded-full"
                        style={{
                          fontFamily:
                            'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                        }}
                      >
                        Flagship
                      </span>
                    )}
                    {service.freeHighlight && (
                      <span
                        className="relative text-[10px] font-extrabold uppercase tracking-[0.22em] text-white bg-gt-medium px-2.5 py-1 rounded-full shadow-[0_4px_10px_-2px_rgba(45,106,79,0.5)]"
                        style={{
                          fontFamily:
                            'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                        }}
                      >
                        Free · Start here
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-bold whitespace-nowrap ${
                      dark ? 'text-white/55' : 'text-gt-text-muted'
                    }`}
                    style={{
                      fontFamily:
                        'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                    }}
                  >
                    {service.duration}
                  </span>
                </div>

                <h3
                  className={`font-bold leading-snug mb-3 ${
                    dark ? 'text-white' : 'text-gt-text'
                  } ${service.flagship || service.freeHighlight ? 'text-[26px] md:text-[30px]' : 'text-[20px]'}`}
                >
                  {service.title}
                </h3>
                <p
                  className={`leading-relaxed mb-5 ${
                    dark ? 'text-white/65' : 'text-gt-text-muted'
                  } ${service.flagship || service.freeHighlight ? 'text-[15px] max-w-3xl' : 'text-[14px]'}`}
                >
                  {service.blurb}
                </p>

                <ul
                  className={`space-y-2 mb-5 ${
                    service.flagship || service.freeHighlight
                      ? 'md:grid md:grid-cols-2 md:gap-x-8 md:space-y-0 md:gap-y-2'
                      : ''
                  }`}
                >
                  {service.includes.map((item) => (
                    <li
                      key={item}
                      className={`flex items-start gap-2.5 text-[13px] leading-snug ${
                        dark ? 'text-white/85' : 'text-gt-text'
                      }`}
                    >
                      <Check
                        className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                          dark ? 'text-gt-leaf' : 'text-gt-medium'
                        }`}
                        strokeWidth={2.5}
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div
                  className={`pt-4 flex items-center justify-between gap-3 border-t ${
                    dark ? 'border-white/10' : 'border-gt-border-light/70'
                  }`}
                >
                  <p
                    className={`text-[11px] font-bold ${
                      dark ? 'text-gt-leaf' : 'text-gt-medium'
                    }`}
                    style={{
                      fontFamily:
                        'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                    }}
                  >
                    {service.price}
                  </p>
                  <Link
                    href={`/services/enquire?engagement=${service.engagementId}`}
                    className={`inline-flex items-center gap-1.5 text-[12px] font-bold transition-colors group/link ${
                      dark
                        ? 'text-gt-leaf hover:text-white'
                        : 'text-gt-medium hover:text-gt-dark'
                    }`}
                  >
                    Enquire
                    <ArrowUpRight
                      className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5"
                      strokeWidth={2.2}
                    />
                  </Link>
                </div>

                <p
                  className={`mt-4 text-[12px] italic leading-relaxed ${
                    dark ? 'text-white/55' : 'text-gt-text-muted'
                  }`}
                >
                  {service.outcome}
                </p>
              </article>
            );
          })}
        </div>

        <div className="mt-12 p-6 md:p-8 rounded-2xl bg-white border border-gt-border-light flex flex-col md:flex-row items-start md:items-center gap-5 md:gap-8">
          <div className="flex-1">
            <h3 className="text-[18px] font-bold text-gt-text mb-2">
              Not sure which engagement you need?
            </h3>
            <p className="text-[14px] text-gt-text-muted leading-relaxed">
              Start with a free sixty-minute Sustainability Readiness
              Diagnostic. You walk out with a written gap snapshot and a
              recommended plan. No obligation.
            </p>
          </div>
          <RedesignButton
            variant="primary"
            size="md"
            href="/services/enquire?engagement=diagnostic"
            className="whitespace-nowrap"
          >
            Book the diagnostic
            <ArrowRight className="w-4 h-4" />
          </RedesignButton>
        </div>
      </LightSection>

      {/* =====================================================================
          SECTION 4. HOW WE WORK (4-step process)
          ===================================================================== */}
      <section className="bg-gt-text-dark py-20 md:py-24 border-y border-white/5">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="max-w-3xl mb-12">
            <p className="text-[10px] uppercase tracking-[0.2em] text-gt-leaf font-bold mb-6">
              How we work
            </p>
            <h2 className="text-3xl md:text-[40px] font-extrabold text-white leading-tight tracking-tight">
              Four steps, from first call to handoff.
            </h2>
            <p className="mt-5 text-[15px] text-white/65 leading-relaxed max-w-2xl">
              No sales cycle, no consultant theatre. A working session, a clear
              scope of work with engagement fees and timelines agreed up front,
              execution inside your workspace, and a clean handoff.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {PROCESS_STEPS.map((step, i) => (
              <div
                key={step.step}
                className="group relative rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-all duration-300 hover:bg-white/[0.06] hover:border-gt-leaf/40 hover:-translate-y-1"
              >
                <span
                  className="absolute left-0 top-0 bottom-0 w-[2px] bg-gt-leaf/0 group-hover:bg-gt-leaf/70 transition-colors duration-300"
                  aria-hidden
                />
                <div className="flex items-center justify-between mb-5">
                  <span
                    className="text-[11px] font-bold text-gt-leaf tracking-wider"
                    style={{
                      fontFamily:
                        'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                    }}
                  >
                    {step.step}
                  </span>
                  <div className="w-10 h-10 rounded-lg bg-gt-leaf/10 text-gt-leaf flex items-center justify-center transition-colors group-hover:bg-gt-leaf group-hover:text-gt-text-dark">
                    <step.Icon className="w-5 h-5" strokeWidth={2} />
                  </div>
                </div>
                <h3 className="text-[17px] font-bold text-white mb-2 leading-snug">
                  {step.title}
                </h3>
                <p className="text-[13px] text-white/60 leading-relaxed">
                  {step.blurb}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 5. OUTCOMES STRIP
          ===================================================================== */}
      <LightSection variant="white" padding="lg" className="!pt-20 !pb-20">
        <div className="max-w-3xl mb-10">
          <CategoryLabel>What you get</CategoryLabel>
          <SectionHeading size="section" tone="dark" className="mt-5">
            Defensible work, at global-leading resolution.
          </SectionHeading>
          <p className="mt-5 text-[15px] text-gt-text-muted leading-relaxed max-w-2xl">
            A few numbers that matter more than a logo wall.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {OUTCOMES.map((o) => (
            <div
              key={o.label}
              className="group rounded-2xl border border-gt-border-light bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gt-medium/40 hover:shadow-[0_12px_28px_-12px_rgba(0,60,41,0.15)]"
            >
              <p
                className="text-[28px] md:text-[32px] font-extrabold text-gt-medium leading-none tracking-tight"
                style={{
                  fontFamily:
                    'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                }}
              >
                {o.value}
              </p>
              <p
                className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-gt-text-dim transition-colors group-hover:text-gt-medium"
                style={{
                  fontFamily:
                    'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                }}
              >
                {o.label}
              </p>
            </div>
          ))}
        </div>
      </LightSection>

      {/* =====================================================================
          SECTION 6. SERVICES FAQ
          ===================================================================== */}
      <LightSection variant="pale" padding="lg" className="!pt-16 !pb-24">
        <div className="max-w-3xl mx-auto mb-10 text-center">
          <CategoryLabel>Questions we get asked</CategoryLabel>
          <SectionHeading size="section" tone="dark" className="mt-5">
            The practical stuff, up front.
          </SectionHeading>
        </div>

        <div className="max-w-3xl mx-auto divide-y divide-gt-border-light border-y border-gt-border-light bg-white rounded-2xl">
          {SERVICES_FAQ.map((item) => (
            <details
              key={item.q}
              className="group py-5 transition-colors hover:bg-gt-pale-warm/30 [&_summary]:list-none first:rounded-t-2xl last:rounded-b-2xl"
            >
              <summary className="flex items-start justify-between gap-6 cursor-pointer px-4 md:px-5">
                <span className="text-[15px] md:text-[16px] font-bold text-gt-text leading-snug">
                  {item.q}
                </span>
                <span
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-gt-medium/10 text-gt-medium flex items-center justify-center transition-all duration-300 group-open:rotate-45 group-open:bg-gt-medium group-open:text-white"
                  aria-hidden
                >
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                </span>
              </summary>
              <p className="mt-4 px-4 md:px-5 text-[14px] text-gt-text-muted leading-relaxed">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </LightSection>

      {/* =====================================================================
          SECTION 7. CLOSING CTA
          ===================================================================== */}
      <ClosingCTA />

      {/* =====================================================================
          SECTION 8. FOOTER
          ===================================================================== */}
      <RedesignFooter />
    </>
  );
}
