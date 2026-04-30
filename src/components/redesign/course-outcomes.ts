/**
 * COURSE_OUTCOMES_MAP
 *
 * Hand-curated outcome bullets shown on the /redesign/courses/[courseId]
 * detail page in the "What you will learn" section. Each entry has 4
 * concrete capability statements describing what a practitioner can
 * do after finishing the course. These are deliberately specific so a
 * cold visitor can imagine the work, not just the topic.
 *
 * To edit a course's outcomes, change the array here and rebuild.
 * If a course id is not present, the detail page falls back to a
 * single generic line so the section never collapses.
 */

export const COURSE_OUTCOMES_MAP: Record<string, string[]> = {
  'climate-science-101': [
    'Explain the basic physics of the greenhouse effect and radiative forcing in your own words',
    'Read an IPCC AR6 chapter end-to-end and identify its core claims',
    'Describe the carbon cycle and the major feedback loops with confidence',
    'Place any climate news story in the context of established science instead of taking it on trust',
  ],
  'ghg-scope-1-2': [
    'Set defensible organizational and operational boundaries for a corporate inventory',
    'Calculate Scope 1 emissions from stationary combustion, mobile combustion, and process sources',
    'Calculate Scope 2 emissions using both location-based and market-based methods',
    'Produce a Scope 1 and 2 number an internal auditor or external assurance team will accept',
  ],
  'ghg-scope-3': [
    'Map a company value chain across all 15 Scope 3 categories',
    'Choose between spend-based, average-data, and supplier-specific methods for each category',
    'Run a screening assessment to identify which categories are material to your organization',
    'Report Scope 3 in line with the GHG Protocol Scope 3 Standard, with a documented methodology',
  ],
  'vcm-101': [
    'Explain how a carbon credit is generated, verified, issued, and retired',
    'Compare Verra, Gold Standard, ACR, and CAR registries on the dimensions that matter to a buyer',
    'Identify the integrity risks in any voluntary credit and apply ICVCM Core Carbon Principles',
    'Read a project description document for a real methodology and form a defensible opinion',
  ],
  'vm0042': [
    'Apply the Verra VM0042 methodology to a real agricultural land management project',
    'Calculate soil organic carbon stocks using the IPCC Tier 2 and Tier 3 approaches',
    'Estimate the net GHG benefit of an ALM intervention with explicit uncertainty bounds',
    'Defend your methodology choices in front of a Verra validator',
  ],
  'vm0044': [
    'Walk through the Verra VM0044 methodology for biochar carbon projects',
    'Estimate biochar permanence using the H/C ratio approach',
    'Calculate net GHG removals from a biochar project including soil application',
    'Compare biochar to other carbon dioxide removal pathways on cost and durability',
  ],
  'esg-reporting': [
    'Run a double materiality assessment that meets CSRD and ESRS expectations',
    'Map an organization to GRI Universal Standards, SASB, ESRS, and TCFD without overlap',
    'Build a sustainability data management process that supports external assurance',
    'Publish a board-ready sustainability report that holds up to regulator and investor scrutiny',
  ],
  'double-materiality': [
    'Apply the EFRAG double materiality methodology to any organization',
    'Distinguish impact materiality from financial materiality using the right tests for each',
    'Run a stakeholder engagement process that produces defensible materiality decisions',
    'Document the materiality assessment in a form CSRD assurance providers will accept',
  ],
  'esg-benchmarking': [
    'Decode how MSCI, Sustainalytics, and S&P Global construct their ESG scores',
    'Normalize peer ESG performance data across different rating methodologies',
    'Identify the gaps in your own ESG profile relative to peers in your sector',
    'Brief executives on what an ESG rating actually means and what to do about it',
  ],
  'esg-investing': [
    'Apply ESG integration techniques inside a fundamental investment process',
    'Distinguish ESG integration, screening, thematic, and impact investing strategies',
    'Use the PRI principles to structure a credible responsible investment policy',
    'Engage portfolio companies on ESG issues and document the engagement outcomes',
  ],
  'eu-cbam': [
    'Determine whether your company falls under CBAM as an importer or producer',
    'Calculate embedded emissions for CBAM goods using actual data and default values',
    'Submit a CBAM quarterly report through the transitional registry without errors',
    'Plan for the definitive period when CBAM certificates must be surrendered',
  ],
  'eu-sfdr': [
    'Classify a financial product as Article 6, Article 8, or Article 9 with confidence',
    'Disclose principal adverse impact (PAI) indicators using the right templates',
    'Build the website and pre-contractual disclosures that SFDR requires for each tier',
    'Avoid greenwashing claims that ESMA has flagged in recent supervisory notes',
  ],
  'eu-taxonomy': [
    'Determine whether an economic activity is taxonomy-eligible and taxonomy-aligned',
    'Apply substantial contribution criteria across the six environmental objectives',
    'Run the do-no-significant-harm (DNSH) and minimum safeguards checks',
    'Disclose taxonomy alignment percentages for turnover, capex, and opex',
  ],
  'eudr': [
    'Determine which products and supply chains fall inside EUDR scope',
    'Build a due diligence statement using geolocation data and risk assessment',
    'Run a country and supplier-level risk assessment that meets EUDR requirements',
    'Set up the internal processes needed to keep the due diligence statement current',
  ],
  'financed-emissions': [
    'Apply the PCAF Global GHG Accounting and Reporting Standard for the Financial Industry',
    'Calculate financed emissions for listed equities, business loans, mortgages, and project finance',
    'Use the right attribution factor for each asset class without double counting',
    'Disclose financed emissions and data quality scores in a CDP or TCFD report',
  ],
  'human-rights-dd': [
    'Apply the UN Guiding Principles on Business and Human Rights to a real organization',
    'Identify salient human rights risks across operations, products, and the value chain',
    'Build a grievance mechanism that meets UNGP effectiveness criteria',
    'Comply with the German Supply Chain Act, the EU CSDDD, and the UK Modern Slavery Act',
  ],
  'ifc-performance-standards': [
    'Apply IFC Performance Standards 1 through 8 to a project finance transaction',
    'Run an environmental and social impact assessment that meets lender expectations',
    'Build a stakeholder engagement and grievance mechanism aligned with PS1',
    'Manage land acquisition and resettlement under PS5 without triggering legal risk',
  ],
  'ifrs-s2': [
    'Disclose climate-related risks and opportunities under IFRS S2',
    'Run scenario analysis aligned with TCFD and ISSB guidance',
    'Quantify physical and transition risk with defensible methodologies',
    'Translate climate model output into board-level disclosure language',
  ],
  'sbti': [
    'Set a near-term and long-term emissions reduction target aligned with the SBTi Net-Zero Standard',
    'Choose between absolute contraction, sectoral decarbonization, and economic intensity approaches',
    'Build a decarbonization plan that maps target trajectory to actual emission reduction levers',
    'Submit a target for SBTi validation and respond to validator feedback',
  ],
  'tnfd-biodiversity': [
    'Apply the TNFD LEAP approach to any organization or financial portfolio',
    'Identify nature-related dependencies, impacts, risks, and opportunities',
    'Use the GBF Target 15 and the Kunming-Montreal framework as a disclosure anchor',
    'Build a biodiversity disclosure that complements existing climate reporting',
  ],
  'article-6': [
    'Distinguish Article 6.2 cooperative approaches from the Article 6.4 mechanism',
    'Explain how ITMOs are authorized, transferred, and corresponding-adjusted',
    'Read a Glasgow Rulebook decision and trace its operational consequences',
    'Evaluate whether a real bilateral cooperation deal meets environmental integrity tests',
  ],
  'circular-economy': [
    'Apply the Ellen MacArthur Foundation circular economy principles to a product or business model',
    'Distinguish reuse, repair, refurbishment, remanufacturing, and recycling on cost and impact',
    'Design a product or service for disassembly and material recovery',
    'Connect circular economy decisions to the EU Circular Economy Action Plan and CSRD reporting',
  ],
};

/**
 * Fallback used when a course id is not in the map. Keeps the section
 * from collapsing for any course we have not yet authored.
 */
export const DEFAULT_COURSE_OUTCOMES: string[] = [
  'Apply the frameworks, standards, and methodologies covered in this course to real practitioner work',
];
