# Greentryst Tools Catalogue (Extensive)

Comprehensive map of tools we can build. Organised by the practitioner workflow stages, with cross-cutting sections for jurisdiction-specific compliance, sector-specific tools, finance and carbon markets, nature, social, and operator-facing meta tools. The goal is exhaustiveness so we can later sequence and prioritise with a clear view of the full surface area.

Notation:
- Build types: `DET` deterministic code + reference tables, `ML` trained small model, `LLM` LLM over retrieved evidence, `HYB` small-ML hot path with LLM drafting, `GIS` geospatial, `OPS` workflow automation, `DATA` data-service or connector.
- Effort: `S` under 2 weeks, `M` 2-6 weeks, `L` 6+ weeks.
- Primitive codes refer to the shared services listed at the bottom of this file.

## 1. Intelligence and sensing

The practitioner's ambient awareness layer. Tools that answer "what happened, what changed, what should I care about."

| Tool | What it does | Build | Effort |
|---|---|---|---|
| Regulation Tracker (Global) | Monitor new and amended sustainability regulations across EU, UK, US, India, APAC, LATAM. Impact summaries and alerts. | OPS + LLM | M |
| Regulation Change Impact Assessor | Given a change to a standard (e.g. ESRS amendments, SBTi v2), map what it means for the customer's specific disclosures and data pipelines. | LLM + DET | M |
| Standards Amendment Tracker | Version-aware library of GHG Protocol, ISSB, GRI, ESRS, TNFD, etc. Diff between versions with migration notes. | OPS + LLM | M |
| Peer Disclosure Monitor | Auto-ingest and summarise sector peers' disclosures as they publish. Flag new disclosed metrics, targets, methodologies. | OPS + LLM | M |
| Competitor Benchmark Dashboard | Per-topic comparison against sector peers with citations. | HYB | M |
| ESG Ratings Change Monitor | Track MSCI, Sustainalytics, S&P Global CSA, ISS ESG, CDP rating changes and their drivers. | DATA + LLM | M |
| Sustainability League Table Monitor | DJSI, Corporate Knights Global 100, TIME100, Fortune Change the World, Ethisphere, CDP A-list status tracking. | DATA | S |
| Climate Litigation Monitor | Sabin Center database + news, per company and sector filings with summaries and risk classification. | OPS + LLM | M |
| Science Update Digest | IPCC, NGFS, IEA, IRENA, UNEP report releases with sustainability-practitioner summaries. | OPS + LLM | S |
| NGO Campaign Tracker | Greenpeace, Mighty Earth, WWF, Global Witness, InfluenceMap campaign flags per company. | DATA + LLM | M |
| Stakeholder Sentiment Monitor | Analyst, media, employee review sentiment on sustainability topics. | ML | M |
| Materiality Issue Evolution Tracker | How a material topic's prominence has shifted across a sector over the last N years. | HYB | M |
| Climate Lobbying Audit | InfluenceMap-style analysis of company and its trade associations against stated climate policy support. | HYB | M |
| Political Spend Alignment Checker | PAC / lobbying spend by climate stance of recipients. | LLM | M |

## 2. Scoping and boundary setting

Tools that help frame the work before anyone starts collecting data.

| Tool | What it does | Build | Effort |
|---|---|---|---|
| Organizational Boundary Setter | Walk through equity share vs operational control vs financial control choice with implications surfaced. | DET | S |
| Reporting Boundary Consistency Checker | Validate that subsidiaries, JVs, acquisitions, divestitures are treated consistently across GHG, water, waste inventories. | DET | S-M |
| Value Chain Mapper | Visual end-to-end value chain with tier-1/2/3 suppliers, downstream customers, sold products in use. | OPS + HYB | M |
| Scope 3 Category Scoping Helper | For each of the 15 categories, decide inclusion based on relevance, size, influence, stakeholder, risk, outsourcing criteria. | LLM + DET | M |
| Time Horizon Selector | Guide on short/medium/long-term horizons tailored to sector and disclosure framework. | DET | S |
| Base Year Setter and Recalculation Workflow | Choose base year, document recalculation policy, run recalculation when structural changes occur. | DET + OPS | M |
| Single-Site Boundary Audit | For complex sites (shared tenancy, co-gen, behind-the-meter), define what counts where. | DET | S-M |
| Legal Entity Tree Importer | Ingest parent-subsidiary structure from filings and map to GHG inventory boundary. | DATA + OPS | M |

## 3. Materiality

| Tool | What it does | Build | Effort |
|---|---|---|---|
| Single Materiality Assessment | Financial materiality workflow with peer overlays, investor expectations. | HYB | M |
| Double Materiality Assessment | EFRAG IG1 methodology: impact + financial materiality, stakeholder input, threshold setting. | HYB | L |
| Issue Identification from Peer Disclosures | Auto-suggest topics other sector peers have surfaced as material. | ML | M |
| Stakeholder Mapping and Engagement Workflow | Identify, rank, engage, document stakeholder input. | OPS | M |
| Topic-Level Materiality Scoring | Quantitative scoring across severity, likelihood, scale, scope, irremediability. | DET | M |
| Materiality Heatmap Builder | Build and visualise heatmaps with peer overlays. | DET | S-M |
| Dynamic Materiality Tracker | Track shifts in materiality signals between assessment cycles. | ML | M |
| Cross-Framework Materiality Reconciler | Reconcile ESRS material topics to IFRS S1 material topics to GRI to SASB. | HYB | M |

## 4. Data collection and ingestion

The unglamorous but high-ROI layer. Most tools here are utilities and connectors.

| Tool | What it does | Build | Effort |
|---|---|---|---|
| Activity Data Collection Workflow | Structured collection forms per category with validations, rollups, reviewer sign-off. | OPS | M |
| Utility Bill Parser | OCR PDF utility bills, extract kWh/therms/gal/dollar per account per month. | DET + ML | M |
| Fleet Data Importer | Odometer logs, fuel card transactions, telematics feeds into Scope 1 mobile combustion. | DATA + DET | M |
| Refrigerant Leak Log | Track refrigerant charge, top-ups, decommissions for fugitive emissions. | DET | S |
| Travel Data Importer | Concur, SAP Travel, Amex GBT connectors. | DATA | M |
| Commuting Survey Builder | Survey template, distribution, analysis, gap-fill for Scope 3 Cat 7. | OPS + DET | S-M |
| Waste Hauler Data Importer | Hauler manifests, landfill diversion, recycling rate. | DATA + DET | M |
| Water Bill Parser | Like utility parser, for water/sewer. | DET + ML | S |
| Data Gap Filler | Statistical imputation (hierarchical mean, regression, industry-default) with uncertainty propagation. | ML | M |
| Emission Factor Matcher | Given an activity description, suggest the correct EF from the factor library with confidence. | ML | M |
| Document Intake and Classifier | Classify uploaded documents as report / policy / invoice / contract / certificate and route. | ML | S-M |
| Data Version Control | Base year vs current, what changed, recalc triggers, diff viewer. | OPS | M |
| Supplier Questionnaire Builder | Generate differentiated questionnaires by supplier size, spend, risk tier. | OPS + LLM | M |
| Supplier Response Ingestor | Accept structured and unstructured responses, normalise to common schema. | HYB | M |
| Document OCR and Table Extractor | PDFs to tables with header detection, merged-cell handling. Docling is already in stack. | DET | S |
| Activity Data Validator | Range checks, year-over-year anomaly flags, unit consistency. | DET + ML | S-M |

## 5. Measurement: emissions (corporate)

The core accounting surface.

| Tool | What it does | Build | Effort |
|---|---|---|---|
| Scope 1 Stationary Combustion | Fuel type x activity x EF with regional overrides. | DET | S |
| Scope 1 Mobile Combustion | Fleet and on-road fuel combustion. | DET | S |
| Scope 1 Fugitive | Refrigerants, SF6, process leaks (GWP-100, GWP-20, AR6 values). | DET | S |
| Scope 1 Process Emissions | Sector-specific process emissions (cement calcination, steel reduction, chemicals). | DET | M |
| Scope 2 Location-Based | Grid factors by country and sub-country where available. | DET | S |
| Scope 2 Market-Based | Instrument hierarchy (direct PPA, GO/REC, supplier-specific, residual mix). | DET | S-M |
| Scope 2 Dual Reporting | Side-by-side location vs market with reconciliation notes. | DET | S |
| Scope 3 Cat 1 Purchased Goods and Services | USEEIO spend-based + supplier-specific override. Covered in dedicated design doc. | HYB | M |
| Scope 3 Cat 2 Capital Goods | Capex categorisation and embodied emission factoring. | HYB | M |
| Scope 3 Cat 3 Fuel and Energy Related | Upstream emissions of purchased energy, T&D losses. | DET | S |
| Scope 3 Cat 4 Upstream Transport and Distribution | Mode, distance, weight calculators. | DET | S-M |
| Scope 3 Cat 5 Waste Generated | Waste stream x treatment method x EF. | DET | S |
| Scope 3 Cat 6 Business Travel | Air, rail, road, hotel nights. | DET | S |
| Scope 3 Cat 7 Employee Commuting | Survey-based, MSA-inferred, remote-work adjusted. | DET + ML | M |
| Scope 3 Cat 8 Upstream Leased Assets | If not in Scope 1/2, include here. | DET | S |
| Scope 3 Cat 9 Downstream Transport and Distribution | Customer-facing logistics. | DET | S-M |
| Scope 3 Cat 10 Processing of Sold Products | Intermediate product handling emissions. | DET | M |
| Scope 3 Cat 11 Use of Sold Products | Use-phase energy and direct emissions with lifetime assumptions. | DET | M |
| Scope 3 Cat 12 End-of-Life Treatment | Disposal / recycling / incineration mix. | DET | S-M |
| Scope 3 Cat 13 Downstream Leased Assets | Leased-out real estate or equipment. | DET | S |
| Scope 3 Cat 14 Franchises | Franchisee rollups. | DET + OPS | M |
| Scope 3 Cat 15 Investments (PCAF) | All eight asset classes plus emerging. See Finance section. | DET | L |
| Avoided Emissions (Scope 4) | GHG Protocol Avoided Emissions guidance with guardrails. | DET + LLM | M |
| Removals and Sequestration Accounting | Separate line for durable removals vs temporary, vs book-and-claim. | DET | M |
| Biogenic Carbon Accounting | Biogenic CO2, CH4, N2O with sequestration/emission timing. | DET | M |
| Land-Use Change Emissions (SBTi FLAG) | Direct LUC, indirect LUC, amortisation period choices. | DET | M |
| Allocation Methods Helper | Physical, economic, system expansion, marginal. Audit which is used per product. | DET | S-M |
| Uncertainty Quantification | Monte Carlo propagation through the inventory. | DET | M |
| Data Quality Scorer | GHG Protocol data quality hierarchy per data point, rolled up. | DET | S |
| Recalculation Policy Engine | Trigger, threshold, base-year restatement. | DET | M |

## 6. Measurement: product and life cycle

| Tool | What it does | Build | Effort |
|---|---|---|---|
| Product Carbon Footprint Calculator (ISO 14067) | Cradle-to-gate, cradle-to-grave, with allocation sensitivity. | DET | M |
| Full LCA Builder (ISO 14040/44) | Process-based or hybrid, multiple impact categories. | DET | L |
| LCA-lite Screening | Fast streamlined LCA for non-experts. | DET | M |
| Environmental Product Declaration Generator (EN 15804) | EPD output for construction products or general GPI. | DET | M |
| EU Product Environmental Footprint (PEF) | Follow PEFCR rules per product category. | DET | L |
| Digital Product Passport Builder | EU DPP for batteries, textiles, electronics. | DET | M |
| Packaging Carbon Footprint | Packaging-only PCF with recyclability indicator. | DET | S-M |
| Hot-Spot Analyzer | Identify highest-impact stages across cradle-to-grave. | DET | S |
| Sensitivity and Monte Carlo on LCA Inputs | Distribution-based uncertainty. | DET | M |

## 7. Measurement: beyond carbon

| Tool | What it does | Build | Effort |
|---|---|---|---|
| Water Withdrawal / Consumption / Discharge Accounting | Standard categorisation per WRI/WWF. | DET | S |
| Water Stress Weighted Footprint | Local water stress (Aqueduct) multiplied by consumption. | DET + GIS | M |
| Water Risk Assessor | Physical, regulatory, reputational water risk per site. | DET + GIS | M |
| Water Scenario Analysis | Drought, flood, quality scenarios per site with financial impact. | DET + GIS | L |
| Air Pollutant Inventory | NOx, SOx, PM, VOC, NH3 from stacks and mobile sources. | DET | M |
| Noise and Light Pollution Screener | Screening-level assessment near sensitive receptors. | DET + GIS | S-M |
| Hazardous Waste Compliance | RCRA, EU Waste Framework classification. | DET | M |
| Circular Economy KPI Calculator | Material circularity indicator, recycled content, reuse rate, recyclability. | DET | S-M |
| Packaging Recyclability Scorer | Scorecards aligned to major Extended Producer Responsibility regimes. | DET | M |
| Plastic Footprint Calculator | Plastics Pact methodology, problematic polymers, single-use SKUs. | DET | M |
| Biodiversity Footprint (MSA / PDF) | Mean Species Abundance or Potentially Disappeared Fraction methodologies. | DET | L |
| STAR Metric Calculator | Species Threat Abatement and Restoration score. | DET + GIS | L |
| Land Use Conversion Tracker | Per site conversion history (satellite). | GIS + ML | L |
| Forest Risk Commodity Tracker | Per-commodity DCF / NDPE assessment. | GIS + HYB | L |
| Ecosystem Services Valuation | Monetisation of supporting / provisioning / regulating / cultural services. | DET | L |
| Nature Dependency Scorer (ENCORE) | Business activity to nature dependency mapping. | DET | M |

## 8. Measurement: portfolio and finance

| Tool | What it does | Build | Effort |
|---|---|---|---|
| PCAF Listed Equity and Corporate Bonds | Attribution-based financed emissions. | DET | M |
| PCAF Business Loans and Unlisted Equity | Same method, different attribution denominator. | DET | M |
| PCAF Project Finance | Project-level emissions attribution. | DET | M |
| PCAF Commercial Real Estate | Building-level emissions. | DET | M |
| PCAF Mortgages | Residential building emissions. | DET | M |
| PCAF Motor Vehicle Loans | Vehicle use-phase emissions. | DET | S-M |
| PCAF Sovereign Debt | National emissions attribution. | DET | M |
| PCAF Capital Market Facilitated Emissions | ICMA / Facilitated Emissions Standard. | DET | M |
| Portfolio Temperature Score (WACI, PTS) | Per methodology. | DET | M |
| Portfolio Alignment with Sector Pathways | Per sector convergence to SDA or equivalent. | DET | L |
| Net-Zero Alignment Score (NZAOA, NZBA) | Net-zero alliance-aligned scoring. | DET | M |
| Green Revenue Share | Share of revenue from green activities (Taxonomy-eligible, FTSE Russell, MSCI). | DET | M |
| Taxonomy Alignment % of Portfolio | Roll-up across holdings. | DET | M |
| Avoided Emissions Attribution (Impact Funds) | For climate-solution funds with guardrails. | DET | M |
| Transition Finance Classifier | Is this deal transition-aligned per ICMA handbook? | HYB | M |
| Sovereign Climate Risk | Sovereign-level climate physical and transition risk. | HYB | M |

## 9. Analysis and benchmarking

| Tool | What it does | Build | Effort |
|---|---|---|---|
| Year-Over-Year Variance Analyzer | Decompose changes into activity change, EF change, scope change, structural change. | DET | S-M |
| Intensity Metric Calculator | Per revenue, per employee, per unit product, per m2, per seat-km, per tonne-km. | DET | S |
| Peer Benchmarking | Per metric against sector peers with percentile ranking. | DATA | M |
| Sector Benchmarking | Sector-level aggregated benchmarks. | DATA | M |
| Scope 3 Screening (EEIO) | Whole-business Scope 3 screen from spend for first-pass estimate. | DET | M |
| Emission Driver Decomposition (Kaya) | Decompose changes into activity, intensity, mix effects. | DET | S-M |
| Abatement Decomposition | Separate actual abatement from baseline drift and EF updates. | DET | M |
| Scenario Analysis Runner | NGFS, IEA WEO, IPCC SSP, company-custom scenarios. | DET + LLM | L |
| Stress Testing Workflow | Sector stress tests with EBITDA / valuation impact. | DET | L |
| Monte Carlo Uncertainty on KPIs | Uncertainty propagation to disclosed figures. | DET | M |
| Methodology Comparison Tool | Location vs market, attributional vs consequential, EEIO vs activity-based, show deltas. | DET | S-M |
| Dashboard Builder | No-code dashboard over the customer's sustainability data warehouse. | OPS | L |

## 10. Risk

| Tool | What it does | Build | Effort |
|---|---|---|---|
| Physical Climate Risk Screener | Asset-level flood, heat, drought, wildfire, sea-level rise, hurricane under multi-scenario. | DET + GIS | L |
| Physical Risk Valuation | Financial impact modelling: capex loss, revenue disruption, insurance cost. | DET | L |
| Transition Risk Screener | Policy, market, technology, reputation exposure by sector and geography. | HYB | M |
| Climate VaR / Earnings-at-Risk | Distribution-based VaR for climate risks. | DET | L |
| Scenario-Adjusted Valuation | DCF with scenario-conditioned cashflows. | DET | L |
| Stranded Asset Analyzer | Coal, oil, gas, unabated cement/steel asset-level stranding risk. | DET | L |
| Litigation Risk Monitor | Filings tracker + company-specific risk signals. | OPS + LLM | M |
| Reputational Risk Scanner | Controversy heatmaps from news + NGO + social media. | HYB | M |
| Supplier Concentration Risk | Concentration in high-risk geographies, sectors, single-source. | DET | M |
| Water Risk Assessor | Site-level water risk with local stress. | DET + GIS | M |
| Biodiversity Risk Screener | Site-level proximity to Key Biodiversity Areas, protected areas, indigenous lands. | GIS | M |
| Human Rights Risk | Saliency matrix + geographic/sector risk scoring. | HYB | M |
| Sanctions and Traceability Checker | Entity screening against sanctions, UFLPA, EUDR-linked risks. | DATA + LLM | M |
| Climate Insurance Pricing Helper | Rate-making inputs: hazard exposure, business interruption risk. | DET | L |

## 11. Target setting

| Tool | What it does | Build | Effort |
|---|---|---|---|
| SBTi Corporate Target Setter | 1.5C cross-sector absolute contraction, SDA for applicable sectors. | DET | M |
| SBTi FLAG Target Setter | Land-related emissions targets. | DET | M |
| SBTi Financial Sector Target Setter | PCAF-based FI targets across asset classes. | DET | M |
| SBTi Net-Zero Standard Workflow | Full standard: near-term + long-term + residual neutralisation. | DET + LLM | L |
| Non-SBTi Target Setter | Custom targets aligned to sector-specific standards. | DET | M |
| Interim Target Gap Calculator | Required annualised reduction to stay on path. | DET | S |
| Science-Based Target for Nature (SBTN) | Land, freshwater, ocean, biodiversity. | DET | L |
| Water Target Setter | Alliance for Water Stewardship, CEO Water Mandate. | DET | M |
| Waste Target Setter | Absolute vs intensity, circular metrics. | DET | S-M |
| Social Target Setter (DEI, Living Wage) | Structured framework for non-environmental commitments. | DET | M |
| Target Recalibration Engine | Post-acquisition, divestiture, or base-year drift. | DET | M |
| Cascading Target Allocator | Parent to BU to site allocation with feasibility checks. | DET + ML | M |
| Target Attainment Probability | Monte Carlo on pathway to assess probability of hitting target. | DET | M |
| Target Statement Drafter | Write the formal target statement compliant with the framework's language. | LLM | S |

## 12. Strategy and planning

| Tool | What it does | Build | Effort |
|---|---|---|---|
| Decarbonization Lever Library | Curated, versioned library of abatement levers per sector with cost, TRL, time-to-deploy. | DATA | M |
| Marginal Abatement Cost Curve Builder | Rank levers by $/tCO2e and cumulative abatement. | DET | M |
| Bottom-Up Pathway Modeller | Asset and activity-level pathway with constraints. | DET | L |
| Top-Down Pathway Reconciler | Reconcile top-down SBTi requirement with bottom-up lever portfolio. | DET | M |
| Residual Emission Estimator | Hard-to-abate remainder for long-term neutralisation plan. | DET | M |
| Transition Plan Drafter (TPT, GFANZ, CDSB) | Narrative plus structured plan sections. | LLM + DET | L |
| Transition Plan Credibility Scorer | Check plan against TPT, ISSB, climate action 100+ principles. | HYB | M |
| Internal Carbon Price Calculator | Shadow vs fee-based, pathway-consistent. | DET | S-M |
| Capex Prioritisation with Carbon Overlay | NPV + tCO2e abated + strategic fit. | DET | M |
| Sustainable Product Portfolio Planner | Portfolio roadmap aligned to customer decarbonisation. | DET + LLM | M |
| Circular Strategy Builder | Design, use, retention, recover loops with metric targets. | DET + LLM | M |
| Just Transition Plan Builder | Workforce retraining, community investment, phase-out pacing. | LLM + DET | M |
| Nature-Positive Strategy Builder | SBTN + TNFD-aligned action plan. | LLM + DET | M |

## 13. Execution and operations

Where the strategy becomes projects.

| Tool | What it does | Build | Effort |
|---|---|---|---|
| Abatement Project Evaluator | Per-project NPV, tCO2e, risk, internal score. | DET | M |
| Clean Energy Procurement Advisor | PPA vs VPPA vs retail supplier switch vs on-site PV economics. | DET | M |
| REC / GO / I-REC Portfolio Manager | Track, match to load, retire. | DATA + DET | M |
| Supplier Decarbonization Program Designer | Tiering, engagement cadence, data ask, incentives, escalation. | LLM + DET | M |
| Green Procurement Policy Drafter | Categorise spend categories, set sustainable procurement criteria. | LLM | M |
| Sustainable Product Development Workflow | Gate process with sustainability criteria at each stage. | OPS | M |
| Energy Audit Synthesizer | Turn an engineering energy audit into prioritised opportunity list. | LLM | M |
| Retrofit ROI Calculator | Building-level retrofit economics with payback and abatement. | DET | M |
| Fleet Electrification Planner | TCO comparison, charger siting, grid constraints. | DET | M |
| Refrigerant Transition Planner | Phase-down HFCs to low-GWP alternatives with retrofit economics. | DET | M |
| Transport Mode Shift Analyser | Road-rail-air-sea trade-offs with cost, emissions, lead-time. | DET | M |
| Behaviour Change Campaign Builder | Employee commuting / energy / waste campaigns. | OPS | S |

## 14. Monitoring, reporting, verification (MRV)

| Tool | What it does | Build | Effort |
|---|---|---|---|
| Continuous Emissions Monitoring Integrator | Ingest CEMS, sub-meter, IoT feeds. | DATA | M |
| Methane Detection Integrator | Ground LDAR + satellite (MethaneSAT, Kayrros) + aerial. | DATA + ML | L |
| Satellite Deforestation Monitor | Per-plot change detection tied to supplier records. | GIS + ML | L |
| Anomaly Detection on Emissions Time Series | Outlier flags, drift detection. | ML | M |
| Grid Mix Real-Time Factor Service | Hourly market-based factors. | DATA | M |
| Weather Normalization Service | Degree-day normalisation for building energy. | DET | S |
| Data Reconciliation Engine | Sub-meter vs utility bill vs invoice. | DET | M |
| Sampling Plan Generator (Assurance) | Generate representative samples for assurance testing. | DET | S-M |
| Evidence Locker | Per-claim citations with retention policy and access controls. | OPS | M |
| Audit Trail and Model-Card Log | Who changed what, when, why. AI-tool governance register. | OPS | M |

## 15. Disclosure and reporting

The visible output. One engine, many manifests.

### 15a. Frameworks and standards

| Tool | What it does | Build | Effort |
|---|---|---|---|
| IFRS S1 General Sustainability Gap Assessment | Same engine as S2. | HYB | M |
| IFRS S2 Climate Gap Assessment | Dedicated design doc. | HYB | L |
| ESRS Gap Assessment (all 12 topical + 2 cross-cutting) | EFRAG delegated act. | HYB | L |
| ESRS Sector-Specific Readiness | When EFRAG publishes sector drafts. | HYB | M |
| BRSR Core Screener (India) | BRSR Core's nine principles for top listed entities. | HYB | M |
| BRSR Full Gap Assessment | Full BRSR questionnaire. | HYB | M |
| TCFD Alignment Checker | Governance, strategy, risk, metrics and targets. | HYB | M |
| TNFD Alignment Checker | LEAP workflow aware. | HYB | M |
| GRI Universal + Topic Standards Content Index | Mapper and disclosure drafter per topic standard. | HYB | M |
| SASB / ISSB Industry Metrics Workbook | Industry-specific metrics library with disclosure helpers. | DET + HYB | M |
| CDP Climate Questionnaire Drafter | Pre-fill current cycle from customer data. | LLM | M |
| CDP Water Questionnaire Drafter | As above. | LLM | M |
| CDP Forests Questionnaire Drafter | As above. | LLM | M |
| CDP Supply Chain Response Drafter | As above. | LLM | M |
| EcoVadis Questionnaire Helper | Themes, subthemes, evidence ask. | LLM | M |
| DJSI / S&P Global CSA Response Helper | Questionnaire drafter with evidence matching. | LLM | M |
| Sustainalytics Risk Rating Interpreter | Explain drivers and offer improvement levers. | LLM | M |
| MSCI ESG Rating Interpreter | As above. | LLM | M |
| ISS ESG Rating Interpreter | As above. | LLM | M |
| FTSE Russell Green Revenues Classifier | Map product revenues to Green Revenues taxonomy. | HYB | M |
| CDSB / Integrated Reporting Framework | For those still using legacy frameworks. | HYB | M |
| UNGC Communication on Progress Drafter | Ten Principles + SDG reporting. | LLM | S-M |
| SDG Reporting Mapper | Map company initiatives and metrics to 17 SDGs and 169 targets. | HYB | M |

### 15b. Report drafting

| Tool | What it does | Build | Effort |
|---|---|---|---|
| Sustainability Report Drafter | Full-report structured drafter. | LLM | L |
| Climate Transition Report Drafter | TPT-aligned climate-focused report. | LLM | M |
| Integrated Report Drafter | IR Framework's six capitals. | LLM | M |
| Annual Report Sustainability Section Drafter | For annual reports where sustainability sits inside. | LLM | M |
| 10-K Climate Disclosure Drafter (US SEC) | Rule-specific drafter with assurance-ready citations. | LLM | M |
| 20-F Climate Drafter | Foreign filer equivalent. | LLM | M |
| Proxy Statement ESG Section Drafter | Including executive comp linkage narrative. | LLM | S-M |
| Multi-Framework Content Index | Single index mapping disclosures to GRI, ESRS, IFRS, TCFD, CDP. | HYB | M |
| Cross-Standards Consistency Validator | Flag contradictions between frameworks in the same report. | DET + LLM | M |
| Standards Mapping Tool | Semantic mapping between any two frameworks. | HYB | M |
| Boilerplate Detector | Detect generic boilerplate that fails ESRS specificity tests. | ML | M |
| Materiality-to-Disclosure Traceability | Every material topic must have a corresponding disclosure. | DET | S-M |
| Assurance-Ready Citation Weaver | Inject in-text citations with evidence-locker refs. | OPS + LLM | M |

### 15c. Machine-readable filing

| Tool | What it does | Build | Effort |
|---|---|---|---|
| ESRS XBRL Tagger | Tag ESRS disclosures per EFRAG taxonomy. | DET | L |
| IFRS ISSB XBRL Tagger | As above for ISSB taxonomy. | DET | M |
| CSRD Reporting Package Builder | Package submission to national authorities. | DET + OPS | L |
| Inline XBRL Validator | Validate before submission. | DET | M |

## 16. Assurance preparation

| Tool | What it does | Build | Effort |
|---|---|---|---|
| ISSA 5000 Readiness Checker | Against IAASB ISSA 5000 criteria for sustainability assurance. | HYB | M |
| ISAE 3000 Readiness Checker | For engagements still under ISAE 3000. | HYB | M |
| Limited vs Reasonable Assurance Scoper | Cost-benefit and materiality thresholds. | DET | S-M |
| Control Design Effectiveness Checker | Walkthroughs and control documentation. | OPS + LLM | M |
| Sampling Plan Generator | Statistical sampling with materiality. | DET | S-M |
| Test of Details Workflow | Structured working paper templates. | OPS | M |
| Findings Tracker and Remediation | CAPA for assurance findings. | OPS | M |
| Management Representation Letter Drafter | Standard-compliant MRL. | LLM | S |
| Assurance Report Drafter | From findings to short form or long form report. | LLM | M |

## 17. Jurisdiction-specific compliance

### 17a. European Union

| Regulation | Tool | Build | Effort |
|---|---|---|---|
| CSRD | CSRD Mobilisation Assessment (in-scope? when? what's needed?) | HYB | M |
| ESRS | ESRS Gap Assessment (see 15a) | HYB | L |
| EU Taxonomy | Eligibility Classifier | HYB | M |
| EU Taxonomy | Alignment Assessor (substantial contribution + DNSH + minimum safeguards) | HYB | L |
| EU Taxonomy | KPI Calculator (turnover, capex, opex) | DET | M |
| SFDR | Article 8/9 Classifier | HYB | M |
| SFDR | PAI Indicator Calculator | DET | M |
| SFDR | Pre-contractual Template Generator | LLM + DET | M |
| SFDR | Periodic Report Template Generator | LLM + DET | M |
| SFDR | Targeted Consultation Response Helper | LLM | S |
| CBAM | Embedded Emissions Calculator (default + actual) | DET | M |
| CBAM | Quarterly Report Builder | DET | M |
| CBAM | Authorised Declarant Setup Helper | OPS + LLM | S |
| CBAM | NCA Communications Drafter | LLM | S |
| CSDDD | Risk-Based Due Diligence Workflow | HYB | L |
| CSDDD | Grievance Mechanism Design | OPS | M |
| EUDR | Due Diligence Statement Builder | DET + OPS | M |
| EUDR | Geolocation / Polygon Validator | GIS | M |
| EUDR | Per-Supplier Risk Classification | GIS + ML | M |
| Industrial Emissions Directive | BAT Conclusions Compliance Checker | DET + LLM | M |
| Batteries Regulation | Battery DPP Builder + Due Diligence | DET + LLM | L |
| Packaging and Packaging Waste Reg | Recyclability + Recycled Content Scorer | DET | M |
| Ecodesign for Sustainable Products | DPP + Eco-Profile Generator | DET | L |
| Green Claims Directive | Claim Substantiation Validator | HYB | M |
| Nature Restoration Law | Restoration Plan Drafter (land managers) | LLM + GIS | L |
| REACH / CLP | Chemical Compliance Tracker | DET | M |
| WEEE / RoHS | Compliance Data Collector | DET | M |
| Water Framework Directive | Pressure-Impact Assessment Helper | DET + GIS | M |
| EU ETS | Allowance Management + Compliance Cycle | DET + OPS | M |
| EU ETS 2 | Fuel Suppliers Compliance (2027) | DET | M |
| F-gas Regulation | HFC Phasedown Compliance | DET | M |

### 17b. United Kingdom

| Regulation | Tool | Build | Effort |
|---|---|---|---|
| SDR (Sustainability Disclosure Requirements) | Fund Label Classifier (Sustainability Focus, Improvers, Impact, Mixed Goals) | HYB | M |
| SDR | Product-Level Consumer-Facing Disclosure | LLM | S-M |
| TPT | Transition Plan Validator against TPT Disclosure Framework | HYB | M |
| UK SRS (once adopted) | Readiness pre-adoption | HYB | M |
| UK CBAM (2027) | Compliance prep | DET | M |
| UK ETS | Compliance | DET | M |
| Modern Slavery Act | Statement Drafter | LLM | S |
| Streamlined Energy and Carbon Reporting (SECR) | Annual report inclusion helper | DET | S |

### 17c. United States

| Regulation | Tool | Build | Effort |
|---|---|---|---|
| SEC Climate Rule (post-litigation) | Readiness Assessor | HYB | M |
| California SB 253 | Scope 1/2/3 disclosure readiness and filing helper | HYB | M |
| California SB 261 | Climate-related financial risk report drafter | LLM | M |
| California AB 1305 | Voluntary carbon market claim disclosure | LLM + DET | S-M |
| NYC Local Law 97 | Building emissions compliance calculator | DET | M |
| New York State S 897 / A 4282 | Disclosure readiness (if enacted) | HYB | M |
| FTC Green Guides | Claim Validator | HYB | M |
| EPA GHGRP | Reporting helper | DET | M |
| IRA 45Q | Carbon capture credit eligibility + calculation | DET | M |
| IRA 45V | Clean hydrogen credit eligibility (lifecycle GHG) | DET | M |
| IRA 48C | Advanced energy project credit | DET | M |
| IRA 45X | Advanced manufacturing production credit | DET | M |
| Inflation Reduction Act Monitoring Period | Tracker for credit monitoring conditions | OPS | M |

### 17d. India

| Regulation | Tool | Build | Effort |
|---|---|---|---|
| BRSR Core | Mandatory assurance readiness | HYB | M |
| BRSR Full | Annual disclosure drafter | HYB | M |
| SEBI Green Bond Framework | Compliance + Use-of-Proceeds Reporting | DET + LLM | M |
| PAT Scheme | Energy Savings Certificate tracker and target progress | DET | M |
| CCTS (Carbon Credit Trading Scheme) | Compliance and trading workflow | DET | M |
| CPCB / SPCB | Waste and air compliance aggregator | DET | M |
| Energy Conservation Act | Designated Consumer compliance | DET | M |
| RE Policy Tracker by State | RPO compliance + REC purchase | DATA | M |

### 17e. Rest of World

| Jurisdiction | Tool | Build | Effort |
|---|---|---|---|
| Australia | ASRS readiness (AASB S1 / S2) | HYB | M |
| Australia | Modern Slavery Statement | LLM | S |
| Canada | CSDS readiness (CSSB S1 / S2) | HYB | M |
| Canada | CSA 51-107 if adopted | HYB | M |
| Singapore | MAS climate disclosure readiness | HYB | M |
| Singapore | Green Taxonomy alignment | HYB | M |
| Japan | TCFD + ISSB readiness | HYB | M |
| China | ETS compliance | DET | M |
| China | Listed-company disclosure (Shanghai, Shenzhen, Beijing exchanges) | HYB | M |
| South Korea | ESG disclosure readiness | HYB | M |
| Hong Kong | HKEX Climate Disclosure (IFRS-aligned) | HYB | M |
| Brazil | CVM Resolution 193 (IFRS S1/S2 adoption) | HYB | M |
| Mexico | CNBV financial sector climate disclosure | HYB | M |
| New Zealand | XRB climate-related disclosure | HYB | M |
| Philippines | SEC Form-ACGR / Sustainability Report | HYB | M |
| Thailand | One Report SET-SD guidelines | HYB | M |
| South Africa | JSE Sustainability and Climate Disclosure Guidance | HYB | M |

## 18. Carbon markets

| Tool | What it does | Build | Effort |
|---|---|---|---|
| Carbon Credit Quality Scorer (CCP / VCMI) | Per-credit scoring against ICVCM Core Carbon Principles and VCMI Claims Code. | HYB | L |
| Credit Project-Type Risk Assessor | REDD+, ARR, BECCS, DAC, IFM, soil carbon, blue carbon, cookstoves. | HYB | L |
| Registry Retirement Matcher | Verra, Gold Standard, ACR, CAR, Plan Vivo, CDM, ART. | DATA | M |
| Credit Vintage and Retirement Tracker | Per-credit lifecycle tracking. | DATA | M |
| Double Counting Checker | Cross-registry and jurisdictional double-counting detection. | DATA | M |
| Corresponding Adjustment Tracker (Article 6) | Host party authorised. | DATA + OPS | M |
| Article 6.2 Project Evaluator | ITMO structure review. | LLM + DET | M |
| Article 6.4 Project Evaluator | Supervisory Body requirements. | LLM + DET | M |
| VCS Methodology Comparator | Side-by-side methodology comparison. | LLM | M |
| Gold Standard Methodology Comparator | As above. | LLM | M |
| Offset Portfolio Risk Dashboard | Leakage, reversal, permanence, buffer pool exposure. | DET | M |
| Buffer Pool Exposure Tracker | Per-registry buffer contributions and claim risk. | DET | S-M |
| ICVCM Assessment Reader | Auto-extract scores from ICVCM published assessments. | OPS | S |
| Jurisdictional REDD+ Program Checker | ART TREES alignment, CORSIA eligibility. | HYB | M |
| CORSIA Compliance Helper | For aviation operators. | DET | M |
| Article 6 Host Country Registry Sync | Letter of Authorisation lifecycle. | OPS | M |
| Removal-vs-Reduction Portfolio Mixer | Portfolio design consistent with SBTi neutralisation. | DET | M |

## 19. Nature and biodiversity

| Tool | What it does | Build | Effort |
|---|---|---|---|
| TNFD LEAP Workflow | Locate, Evaluate, Assess, Prepare, end-to-end. | HYB + GIS | L |
| SBTN Target Setting | Step 1 assess, step 2 interpret, step 3 measure, step 4 act, step 5 track across land, water, ocean, biodiversity. | HYB + GIS | L |
| ENCORE Dependency and Impact Scorer | Business-activity to nature dependency and impact mapping. | DET | M |
| Biodiversity Footprint Financial Institutions (BFFI) | For portfolio-level biodiversity. | DET | L |
| STAR Metric | Species Threat Abatement and Restoration. | DET + GIS | L |
| High Conservation Value (HCV) Assessor | Per site / landscape HCV detection. | GIS + LLM | L |
| No Deforestation No Peat No Exploitation (NDPE) Tracker | Supplier-level NDPE status. | GIS + HYB | L |
| Forest-Risk Commodity Tracker | Cocoa, coffee, palm, rubber, soy, cattle, wood traceability. | GIS + HYB | L |
| Water Stewardship AWS Workflow | AWS International Water Stewardship Standard steps. | OPS + DET | M |
| Pollinator Risk Assessor | Pollinator-dependent supply chain and site risk. | GIS + DET | M |
| Marine / Blue Economy Footprint | Fisheries, aquaculture, shipping impact. | GIS + DET | L |
| Nature Credits Quality Scorer | Emerging nature credit market, biodiversity credits quality. | HYB | M |

## 20. Social, human rights, governance

| Tool | What it does | Build | Effort |
|---|---|---|---|
| UNGP Human Rights Due Diligence Workflow | Policy, assess, integrate, track, communicate, remediate. | OPS + LLM | L |
| Salient Issues Identification | Industry-specific salient human rights issue matrix. | HYB | M |
| UFLPA / Forced Labor Screener | Supplier risk against Uyghur Forced Labor Prevention Act and Xinjiang-linked entities. | DATA + ML | M |
| Modern Slavery Statement Drafter | UK / Australia / Canada. | LLM | S |
| Living Wage Gap Calculator | Per-location wage vs living wage benchmark. | DET | M |
| Gender and Ethnic Pay Gap Analyzer | Adjusted + unadjusted. | DET | M |
| DEI Metrics Dashboard | Representation, hiring, promotion, retention. | DET | M |
| Community Investment Tracker | LBG model or equivalent. | DET | M |
| Free Prior Informed Consent (FPIC) Workflow | Per-project documentation. | OPS + LLM | M |
| Grievance Mechanism Design | UNGP effectiveness criteria. | OPS | M |
| Worker Voice Platform Integration | Third-party worker voice data ingestion. | DATA | M |
| Labor Audit Synthesizer | Consolidate supplier audits (SMETA, RBA, BSCI). | LLM | M |
| Just Transition Plan Builder | Workforce and community transition planning. | LLM + DET | M |
| Board Climate Competency Assessor | Per-member competency assessment with gap identification. | LLM | S-M |
| Board Climate Training Tracker | Training completion, currency. | OPS | S |
| Executive Compensation Climate Linkage Analyzer | ESG KPIs in STI / LTI, materiality of linkage. | LLM + DET | M |
| Say-on-Climate Vote Drafter | Shareholder resolution text. | LLM | S |
| Fiduciary Duty and Climate Guide | Jurisdiction-specific memo generator. | LLM | S |
| Ethics Hotline Effectiveness Score | Volume, resolution, recurrence. | DET | S |
| Board Diversity Metrics | Against Nasdaq / SEC / NV / CFA Institute templates. | DET | S |

## 21. Finance and capital

| Tool | What it does | Build | Effort |
|---|---|---|---|
| Green Bond Framework Validator (ICMA GBP) | Framework against ICMA principles. | LLM | M |
| Social Bond Validator (SBP) | As above. | LLM | S-M |
| Sustainability Bond Validator (SBG) | As above. | LLM | S-M |
| Sustainability-Linked Bond KPI and SPT Validator | Material, ambitious, measurable, relevant. | LLM + DET | M |
| Use-of-Proceeds Tracker | Live tracker of committed vs deployed. | DET + OPS | M |
| Green Loan Framework (LMA GLP) | Framework check. | LLM | S-M |
| SLL KPI and Step-Up Calculator | Rate adjustment calculator. | DET | S |
| Transition Finance Classifier (ICMA) | Climate Transition Finance Handbook alignment. | HYB | M |
| Green Revenue Share Calculator | Per product revenue categorisation. | HYB | M |
| Net-Zero Aligned Capital Budget | Capex classified by climate alignment. | HYB | M |
| Climate Stress Test (Tier 1 Capital) | Banking-specific. | DET | L |
| Internal Carbon Price Pricing Tool | Sector-pathway and social-cost-of-carbon options. | DET | S-M |
| Shadow Carbon Price Integration Helper | Integrate shadow price into IRR / NPV / capex tools. | DET | S |
| Carbon Tax Exposure Modeller | Jurisdictional carbon price forecasting. | DET | M |
| ETS Cost Forecaster | Sector-level ETS cost forecast. | DET | M |
| Concessional Finance Eligibility | EIB, IFC, ADB, GCF eligibility screener. | LLM + DET | M |
| Climate Risk Insurance Pricing | Insurance pricing inputs. | DET | L |
| Carbon Border Levy Economic Impact | Product-level CBAM cost impact. | DET | M |

## 22. Sector-specific

Stopping short of full sector catalogues, but naming the tools unique to each high-value sector.

### Oil & Gas

- OGMP 2.0 Level-by-Level Reporter
- Upstream Methane LDAR Planner
- Flare Minimisation Tracker
- Unabated Asset Stranded Value Analyser
- Responsible Upstream Certification Helper (MiQ, Responsible Gas Initiative)
- Just Transition for Fossil Asset Retirement

### Mining & Metals

- ICMM Sustainability Report Helper
- IRMA Responsible Mining Readiness
- Tailings Storage Facility Risk Tracker (Global Industry Standard on Tailings)
- Mine Closure and Rehabilitation Tracker
- Responsible Cobalt / Nickel / Lithium Traceability

### Chemicals

- Responsible Care Reporting Helper
- PFAS Emissions and Phase-Out Tracker
- Persistent Organic Pollutants Tracker
- Chemical Category 11 Scope 3 (Use of Sold Products with reaction chemistry)

### Fashion, Apparel, Textiles

- Higg Index (MSI, FEM, FSLM) Reporter
- Textile Exchange Preferred Fibre & Materials Reporter
- Deadstock and Overstock Circularity Tracker
- Leather Working Group / Responsible Down certification helper
- Microfiber Pollution Accounting

### Food, Agriculture, AFOLU

- FLAG Emissions Calculator (SBTi FLAG Guidance)
- Soil Carbon MRV Workflow (VCS VM0042, regenerative practices)
- Regenerative Ag Practice Tracker
- Deforestation-Free Sourcing Checker
- SAI Platform FSA Assessment Helper
- Palm Oil Mass Balance and Segregated Certification
- Traceable Cocoa / Coffee Workflow
- Livestock Enteric Methane Calculator (with breed, feed, additive overlays)
- Crop-Level GHG Calculator (Cool Farm Tool style)

### Construction and Real Estate

- LEED Scorecard Helper
- BREEAM Scorecard Helper
- WELL and Fitwel Scorecard Helper
- Embodied Carbon Calculator (EC3-style)
- Operational Carbon Modeller (CRREM pathway)
- Retrofit ROI Calculator (deep retrofit vs shallow)
- GRESB Benchmark Helper
- NABERS Energy + Water Rating Helper
- Green Lease Clause Library

### Technology, ICT, Digital

- Data Center PUE + WUE Tracker
- Cloud Emissions Calculator (AWS, Azure, GCP calculators)
- AI Model Training Emissions Estimator
- Device Lifetime Carbon Footprint
- E-Waste Accounting
- ITU L.1470 Compliance

### Transport and Logistics

- Fleet Electrification Planner
- Clean Cargo Working Group Emissions Reporter
- GLEC Framework Reporter
- Modal Shift Opportunity Analyser
- SAF Supply and Cost Tracker (aviation)
- CII (IMO Carbon Intensity Indicator) Calculator (shipping)
- FuelEU Maritime Compliance Calculator
- EU ETS Maritime Compliance
- CORSIA Compliance Calculator (aviation)
- Poseidon Principles Alignment (shipping finance)

### Financial Services

- NZBA Aligned Target Setter
- NZAOA Portfolio Alignment
- NZAM Signatory Reporting
- PRI Reporting Helper
- PRB Self-Assessment Helper
- Sustainable Banking Alignment Assessor (UNEP FI)
- Insurance Underwriting Climate Risk Toolkit

### Cement and Concrete

- GCCA Net Zero Roadmap Tracker
- Clinker Factor Optimiser
- Alternative Fuel Substitution Planner
- CCUS Deployment Economics

### Steel and Aluminium

- ResponsibleSteel Readiness
- SteelZero Commitment Tracker
- Green Steel Procurement Helper
- ASI (Aluminium Stewardship Initiative) Helper

### Automotive and Mobility

- EV Transition Strategy
- Battery DPP Data Readiness
- Supply Chain Raw Materials Due Diligence
- Vehicle Lifecycle CO2 Calculator

### Healthcare and Pharma

- NHS Net Zero Playbook Helper
- Clinical Waste and Anaesthetic Gas Emissions
- Pharma Clinical Trial Sustainability
- Green Chemistry in Manufacturing

### Public Sector and Higher Education

- Public Procurement Sustainable Criteria Builder
- City Climate Action Plan Drafter
- University Sustainability Reporting (AASHE STARS)
- Green Campus Assessment

## 23. Training, capability, and education

| Tool | What it does | Build | Effort |
|---|---|---|---|
| Role-Based Learning Path Generator | Personalised curriculum from learner role. | ML + LLM | M |
| Team Skill Gap Analyzer | Team capability assessment vs role requirements. | LLM + DET | M |
| Certification Prep Companion | CFA ESG, GARP SCR, GRI Professional, ISSB learning. | DET + LLM | M |
| Standards Study Guide Generator | Auto-study guide from any standard. | LLM | M |
| Scenario-Based Learning Simulator | Practice runs of a reporting cycle, an audit, a materiality assessment. | LLM + OPS | L |
| Glossary Q&A | Domain glossary chatbot scoped to a taxonomy. | LLM | S |
| CPD Tracker | Continuing Professional Development hours per framework. | OPS | S |
| Role-Based Recommended Reading | Primary-source reading list per role + topic. | HYB | S-M |

## 24. Operator and meta tools

For sustainability teams, consultants, assurance practitioners running these tools.

| Tool | What it does | Build | Effort |
|---|---|---|---|
| Sustainability Data Catalog | Business-friendly catalogue of all sustainability data assets. | OPS | M |
| Data Lineage Tracker | Per metric, source to report. | OPS | M |
| Methodology Change Log | Versioned methodology per KPI. | OPS | S-M |
| Analyst Productivity Dashboard | Time to assessment, time to report, bottlenecks. | DET | S-M |
| Review and Approval Workflow | Maker-checker for disclosures and metrics. | OPS | M |
| Evidence Locker | Per-claim evidence with retention controls. | OPS | M |
| Model Card and AI Governance Log | For AI-assisted disclosures, required for some regimes. | OPS | M |
| Standards Version Library | Which version of GHG Protocol, Scope 3 Standard, IFRS S2 is cited in which artefact. | OPS | S-M |
| Supplier Onboarding Workflow | Supplier creation, data ask, SLA tracking. | OPS | M |
| Client and Engagement Manager (Consultants) | Multi-tenant project management with engagement templates. | OPS | L |
| Engagement Profitability (Consultants) | Time, cost, scope against contracted fee. | DET | M |
| Peer Group Comparison Subscription | Sector peer benchmarks on a recurring release. | DATA | M |
| Benchmark Subscription Library | Licensed or proprietary benchmarks across topics. | DATA | M |
| Reg-Change Impact Workbook | Standing record of regulatory changes and customer response. | OPS | M |
| Portfolio-Wide Program Management (Large Enterprises) | Multi-BU, multi-country program dashboards. | OPS | L |

## 25. Connectors and data services

Not tools themselves but the infrastructure tools call.

- ERP: SAP, Oracle, Microsoft Dynamics
- HR: Workday, SuccessFactors, BambooHR
- Travel: Concur, Amex GBT, Navan, Egencia
- Expense: Concur Expense, Brex, Ramp, Expensify
- Procurement: Coupa, Ariba, Jaggaer, Ivalua
- Cloud: AWS CUR, Azure Cost Management, GCP Billing, Carbon Footprint APIs
- Collaboration: Salesforce, HubSpot (for supplier engagement programs)
- Data warehouse: Snowflake, Databricks, BigQuery
- Utility data: Arcadia, Urjanet, EnergyStar Portfolio Manager, IESO feeds
- Geospatial: Planet Labs, Sentinel Hub, Global Forest Watch, ThinkHazard
- Registry: Verra, Gold Standard, ACR, CAR, Plan Vivo, ICE ECX
- Weather: NOAA, Copernicus Climate Data Store, ERA5
- Financial market data: Refinitiv, S&P Capital IQ, Bloomberg (licensed)
- Ratings: MSCI, Sustainalytics, ISS ESG, S&P Global CSA (licensed)
- Regulatory filings: SEC EDGAR, ESMA, SEBI, Companies House
- Litigation: Sabin Center CCLW database
- NGO feeds: InfluenceMap, Mighty Earth, Global Witness
- Legal: LexisNexis, Thomson Reuters Practical Law

## 26. Priority sequencing cues

Given the breadth above, the following lenses matter when we sequence:

1. **Manifest re-use**: every standards-gap tool uses the same engine from IFRS S2 Gap Assessment. Build one, build ten. Prioritise the engine, then the manifests per standard.
2. **Factor-library re-use**: every emissions tool uses the same factor library. Build it once, serve it from a single API.
3. **Document-pipeline re-use**: every tool that ingests customer documents uses the same Docling + Voyage index + evidence verifier stack. Invest here once.
4. **Jurisdictional urgency**: CSRD, BRSR Core, California SB 253, IFRS S2 adoption by jurisdiction drive scheduled customer pain. Tools mapped to near-term mandatory disclosure windows have the tightest pull.
5. **Monetisable MRR vs. engagement services**: tools that run unattended (CBAM calculator, PCAF, portfolio tools) monetise as SaaS. Tools that are one-per-engagement (materiality assessment, transition plan) are better monetised as services with software leverage.
6. **Moat-builders**: the Emission Factor Library, the Standards Manifest Framework, the Document Pipeline, the Evidence Verifier, and the Primary-Source Retrieval Index are the five moats. Every other tool is a wrapper on these.

## 27. Cross-cutting primitives (build once, reused by many tools)

1. **Emission Factor Library** — curated, versioned, citation-traceable factors from DEFRA, EPA, IEA, Ecoinvent, USEEIO, EXIOBASE, regional authorities. One data model, one API.
2. **Standards Manifest Framework** — the schema described in the IFRS S2 Gap Assessment doc. One schema, many standards.
3. **Document Ingestion and Indexing Service** — Docling + Voyage context-3 + hybrid retrieval + caching. Already partly built.
4. **Evidence Verifier** — the fact-check pass from the ask-server. Reusable across any tool that cites source documents.
5. **Citation-Linked Branded PDF Export** — react-pdf export with page-jump + phrase-highlight citations.
6. **Sector / Industry Classifier** — NAICS, SICS, ICB, ISIC, GICS crosswalks.
7. **Scenario and Pathway Library** — NGFS, IEA WEO, IPCC SSP, SBTi sector pathways as structured trajectories.
8. **Company Entity Resolver** — unify refs across tickers, LEIs, ISINs, brand names, subsidiaries.
9. **Geospatial Service** — Aqueduct, Global Forest Watch, ThinkHazard, WWF Water Risk Filter, Copernicus Climate Data Store wrappers.
10. **Rating and Questionnaire Schema Registry** — CDP, EcoVadis, DJSI, Sustainalytics questionnaire schemas with versioning.
11. **Registry Interface Layer** — Verra, Gold Standard, ACR, CAR retirement lookups.
12. **Regulation Library** — structured regulation texts with amendments, effective dates, applicability.
13. **Stakeholder Identity Service** — persisted stakeholder graph (suppliers, investors, NGOs, regulators) linked to their engagements.
14. **Audit Trail / Evidence Locker** — append-only event store with retention and access controls.
15. **Benchmark Library** — licensed and open benchmarks with consistent schemas and update cadences.

## 28. Rough tier assignment

Tier 0 (Now):
- GHG Inventory Scope 1 + 2
- Scope 3 Cat 1 Classifier
- IFRS S2 Gap Assessment (and engine)
- BRSR Core Gap Assessment (same engine)
- ESRS Gap Assessment (same engine)
- Sustainability Report Drafter
- Emission Factor Library (primitive)
- Standards Manifest Framework (primitive)
- Document Pipeline (primitive)

Tier 1 (Next 12 months):
- Scope 3 Cat 2-7 calculators
- PCAF Listed Equity + Business Loans
- EU CBAM Calculator + Report Builder
- EU Taxonomy Eligibility + Alignment
- SFDR PAI Calculator
- TCFD Alignment Checker
- TNFD Alignment Checker
- GRI Content Index Builder
- CDP Climate Questionnaire Drafter
- Double Materiality Assessment
- SBTi Target Setter
- Physical Climate Risk Screener
- Decarbonization Pathway Modeller
- Transition Plan Drafter (TPT)
- California SB 253 / SB 261 Readiness
- Carbon Credit Quality Scorer
- Supplier Decarbonization Program Designer
- Utility Bill Parser
- Travel Data Importer

Tier 2 (12-24 months):
- Remaining Scope 3 categories (8-15)
- PCAF Project Finance, CRE, Mortgages, Auto, Sovereign
- PEF (EU Product Environmental Footprint)
- Full LCA Builder
- EUDR compliance suite
- CSDDD risk-based DD
- TNFD LEAP workflow + SBTN targets
- Nature-positive strategy builder
- HRDD workflow + UFLPA screener
- Just Transition Plan
- Carbon Markets Article 6 workflows
- Sector-specific emission tools (cement, steel, O&G, shipping, aviation)
- XBRL Taggers (ESRS, ISSB)
- Executive Comp Climate Linkage Analyzer
- Ratings Interpreters (MSCI, Sustainalytics, S&P CSA)
- Climate Lobbying Audit

Tier 3 (Opportunistic / premium / experimental):
- AI Model Training Emissions Estimator
- Nature Credits Quality Scorer (once market matures)
- Methane Satellite Detection Integrator
- CCUS Deployment Economics
- Ecosystem Services Valuation (monetary)
- Public Sector Climate Action Planning
- University AASHE STARS helpers
- Greenwashing risk checker (ACCC / CMA / FTC)
- Corporate climate litigation exposure scoring
- Adaptive MRV with continuous assurance
- Edge-deployed versions of core calculators (offline compliance)
