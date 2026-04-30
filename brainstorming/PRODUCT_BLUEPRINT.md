# Greentryst: Product Blueprint

**Date:** April 2026
**Status:** Foundational specification, derived from first-principles product discovery
**Author:** Prajjwal Kaushik + Claude (structured interview process)

## 1. What This Is

Greentryst is the professional home for sustainability practitioners. It is the single environment where anyone whose work touches sustainability, climate, or ESG comes to understand new domains, execute their work efficiently, stay current on regulations and market developments, and advance their career.

It is not a learning platform with tools bolted on. It is not an EdTech product. It is the operating system for the sustainability profession, analogous to what Bloomberg is for finance, Westlaw is for law, or GitHub is for software engineering.

## 2. The Origin Problem

The founder was assigned a client project requiring deep understanding of VM0042 (a carbon credit methodology for agriculture land management). The official methodology document was impenetrable: dense technical language, unfamiliar concepts (SOC, enteric fermentation, additionality, uncertainty analysis), non-linear structure, and assumed knowledge the founder didn't have.

The existing options (read the PDF, Google it, ask colleagues) failed. The founder used technology to decompose the 130-page methodology into small, sequenced, digestible pieces. It worked. He could sit in a client meeting and understand the methodology well enough to scope and execute the project.

The realization: every sustainability professional faces this same problem repeatedly. The domain expands faster than anyone can keep up. New regulations, new methodologies, new frameworks appear constantly. Even experienced practitioners are perpetually encountering sub-domains they don't understand. And the source materials are always written for people who already understand them.

## 3. The Core Problem (First Principles)

**The sustainability profession has no central professional infrastructure.**

Every mature profession has a system that practitioners live inside:
- Finance: Bloomberg Terminal
- Legal: Westlaw / LexisNexis
- Design: Figma
- Software: GitHub

Sustainability has nothing. Practitioners currently cobble together:
- PDFs and Google for learning new frameworks
- Excel for GHG calculations
- Scattered databases for emission factors
- ChatGPT for quick answers (unreliable, unsourced)
- LinkedIn for jobs
- Manual research for company ESG ratings and peer benchmarking
- Email chains and Google alerts for RFPs and regulatory changes
- Consultants for materiality assessments and reporting

This fragmentation wastes enormous time and produces unreliable outputs. The most common activity, research ("finding out how something needs to be done"), consumes disproportionate hours because information is scattered, unstructured, and often unverifiable.

## 4. The Trust Principle

**If it's on Greentryst, it can be traced back to the original source.**

This is the product's DNA. Every piece of content, every data point, every recommendation is sourced and verifiable:
- Courses cite the exact section of the methodology or regulation they teach
- Emission factors link to the publication, page number, and year
- Company screener data points to the published sustainability report
- Regulation summaries link to the legal text
- SustainIQ responses include source citations

This is the fundamental differentiator from "just use ChatGPT." ChatGPT gives plausible answers. Greentryst gives **defensible** answers. In a profession where work must be verified, audited, and traced, this is not a nice-to-have. It is the reason a professional would trust the platform for real work.

## 5. The Four Modes of Professional Work

Sustainability professionals don't operate in "learning mode" and "working mode." They constantly flow between four modes, sometimes within the same hour:

| Mode | Mindset | What they need | Example |
|------|---------|---------------|---------|
| **Deep Learn** | "I don't know what I don't know" | Structured, sequential breakdown of a new domain | "I need to understand PCAF methodology from scratch for a new project" |
| **Quick Lookup** | "I know what I need, give me the answer" | Precise, sourced answer to a specific question | "What's the GWP of methane under AR6?" |
| **Execute** | "I know what to do, I need to do it efficiently" | Tool that performs the calculation, assessment, or report | "Calculate Scope 3 Category 6 emissions for this travel data" |
| **Orient** | "Something new appeared, what is it?" | Rapid overview with implications | "SEBI just mandated BRSR Core for top 1000 companies. What does this mean for my clients?" |

The platform serves all four modes. The user never thinks about which mode they're in. They arrive with a need, and the platform meets them where they are.

The content is created deeply and accurately (sourced, verified). It can be surfaced in different ways depending on the mode: as a full course (Deep Learn), as a search result (Quick Lookup), as embedded context inside a tool (Execute), or as a briefing (Orient).

## 6. The Product Layers

### Layer 1: Learn
**22+ courses, 470+ lessons** covering:
- Carbon credit methodologies (VM0042, VCS, Gold Standard)
- GHG accounting and Scope 1/2/3
- ESG frameworks (GRI, ISSB, CSRD, BRSR, EU Taxonomy)
- Sustainable finance (PCAF, TCFD, financed emissions)
- ESG investing and benchmarking
- Climate science and risk
- Biodiversity, circular economy
- Upcoming and new regulations

Every course decomposes complex source documents into small, sequenced, digestible pieces. Each lesson cites its source. Courses include quizzes and earn certificates on completion.

**Certificates** are verifiable (unique URL), downloadable (PDF), and shareable (LinkedIn). They represent verified understanding of a specific domain, not just course attendance.

### Layer 2: SustainIQ (Intelligence Layer)
The connective tissue of the entire platform. A search and question-answering system backed by indexed source documents (80-90 PDFs currently, expanding).

SustainIQ serves multiple modes:
- **Quick Lookup:** "What are the additionality requirements for VM0042?" returns a sourced, precise answer
- **Orient:** "What is CSRD and how does it affect Indian companies?" returns a concise briefing
- **Route:** "I need to do a double materiality assessment" returns: the relevant course, the tool (when built), peer examples, and the regulatory context

SustainIQ is not a chatbot. It is a **verified knowledge retrieval system** with source citations. Every response is grounded in indexed documents, not generated from general training data.

Query limits by tier create a natural upgrade path:
- Learn ($8): 10 queries/month
- Career ($14): 6 queries/day
- Pro ($25): 20 queries/day

### Layer 3: Career
A curated job board specifically for sustainability roles, aggregated across domains (consulting, corporate, regulatory, startups, freelance).

**Phase 1 (current):** Browsable job board with filters (profile category, country, company type, remote/on-site, search).

**Phase 2:** Resume upload, skills extraction, and match scoring. The matching algorithm (already developed for personal use) scores jobs based on skill overlap, domain match, location, and seniority. Critically: **completing courses improves match scores**, creating a direct link between learning and career advancement.

**Skill gap analysis:** "You're 80% matched for this role. Complete the GHG Accounting course to close the gap." This is the mechanism that connects Layer 1 (Learn) to Layer 3 (Career).

### Layer 4: Tools (Phase 3)
Professional-grade tools that operationalize the knowledge from the courses:

- **GHG Inventory Calculator:** Scope 1, 2, 3 calculations with verified emission factors, audit trails, and exportable reports
- **Report Writing/Drafting:** Guided templates for GRI, TCFD, CSRD, BRSR disclosures. Auto-populated where data exists.
- **Policy Drafting Tool:** Helps companies and regulators draft sustainability policies aligned with global regulations
- **Double Materiality Assessment:** Guided workflow with stakeholder survey generation, scoring, and matrix visualization
- **Methodology Checklists:** Step-by-step operational checklists derived from methodologies (like the VM0042 feasibility checklist already built)

### Layer 5: Intelligence (Phase 3)
- **Company ESG Screener:** Consolidated view of company sustainability performance across ratings, reports, and disclosures. Sourced from published data. The tool that consultants currently spend days building manually for each client pitch.
- **Regulation Tracker:** Living database of sustainability regulations by jurisdiction, with alerts on changes and compliance applicability
- **RFP Aggregator:** Aggregated requests for proposals from agencies and organizations seeking sustainability consulting work

### Layer 6: Community (embedded, not standalone)
- Discussion threads on every lesson page (free users can post, rate-limited)
- Case studies submitted by practitioners (peer-reviewed)
- Public professional profiles built from courses completed, tools used, contributions made
- Graduates to a standalone section only when activity volume justifies it

## 7. How Everything Connects

This is not six separate products. It is one system where every action reinforces every other action:

```
                    ┌──────────────┐
                    │  SustainIQ   │
                    │ (the brain)  │
                    └──────┬───────┘
                           │
              routes, answers, connects
                           │
        ┌──────────┬───────┼───────┬──────────┐
        │          │       │       │          │
   ┌────▼───┐ ┌───▼──┐ ┌──▼──┐ ┌──▼───┐ ┌───▼────┐
   │ Learn  │ │Tools │ │Intel│ │Career│ │Community│
   │Courses │ │Calc, │ │Screen│ │Jobs, │ │Discuss, │
   │Certs   │ │Report│ │Regs │ │Match │ │Cases   │
   └───┬────┘ └──┬───┘ └──┬──┘ └──┬───┘ └───┬────┘
       │         │        │       │          │
       └─────────┴────────┴───┬───┴──────────┘
                              │
                    ┌─────────▼─────────┐
                    │  User Profile     │
                    │  Skills, certs,   │
                    │  tools used,      │
                    │  contributions,   │
                    │  match scores     │
                    └───────────────────┘
```

- Completing a **course** earns a certificate, adds skills to your **profile**, improves your **job match** scores
- Using a **tool** demonstrates practical ability on your **profile**
- **SustainIQ** routes you to the right course, tool, or data depending on your need
- **Intelligence** (screeners, regs) informs what you need to **learn** and what **tools** to use
- **Community** contributions build reputation on your **profile**
- **Job matching** identifies gaps that link back to **courses**

Nothing is siloed. Everything feeds one professional identity.

## 8. The User's Experience

A sustainability consultant named Priya opens Greentryst on Monday morning.

**8:30 AM:** She has a new client project: calculate financed emissions for a bank. She types into SustainIQ: "How do I calculate financed emissions for a commercial bank?" SustainIQ returns: a sourced answer explaining PCAF methodology with key steps, a link to the full Financed Emissions course, and (in Phase 3) a link to the Financed Emissions Calculator tool.

**9:00 AM:** She takes the first 3 lessons of the PCAF course. Each lesson is 10-15 minutes. She now understands asset classes, attribution factors, and data quality scores. The content cites PCAF Standard v3, Sections 4-6.

**10:00 AM:** She opens the GHG Calculator (Phase 3), selects "Financed Emissions - PCAF," inputs her client's portfolio data. The tool auto-applies the correct emission factors (sourced, with provenance) and generates a calculation with full audit trail.

**11:30 AM:** Her boss asks about a potential new client. She opens the Company Screener (Phase 3), looks up the company, sees their ESG ratings consolidated from published reports, recent disclosures, and peer comparison. She has a client-ready briefing in 5 minutes instead of 2 days.

**12:00 PM:** She checks the job board during lunch. Her profile (enriched by the PCAF course she just completed) now shows a higher match score for "Climate Risk Analyst" roles. She sees 3 new matches above 80%.

**1:00 PM:** A colleague in the lesson discussion for PCAF Module 2 asked a question about how to handle data quality gaps. Priya answers from her morning's experience. She earns community reputation.

**Priya never thought about whether she was "learning" or "working." She was just doing her job, and Greentryst was the environment she did it in.**

## 9. Pricing

| | **Learn** | **Career** | **Pro** |
|---|---|---|---|
| **Price** | $8/month | $14/month | $25/month |
| Courses + certificates | Unlimited | Unlimited | Unlimited |
| SustainIQ queries | 10/month | 6/day | 20/day |
| Job board | Browse only | Full matching + resume | Full matching + resume |
| Tools | No | No | Full access |
| Intelligence | No | No | Screeners, reg tracker, RFP |
| Community discussions | Post (rate-limited) | Post (unlimited) | Post (unlimited) |

**Annual pricing** (with discount, exact numbers TBD).
**Regional pricing** via Stripe PPP for India, Southeast Asia, Africa, Latin America.
**Lifetime deal** for first 500 users (generates upfront cash, creates evangelists).

The pricing reflects who the user is: an individual professional, consultant, or small firm. Not an enterprise. Enterprise/team pricing comes later when demand justifies it.

## 10. Competitive Position

The market is split into two worlds, and Greentryst occupies the gap between them:

**World 1: Expensive enterprise tools ($10K-100K+/year)**
Watershed, Persefoni (GHG), MSCI, Sustainalytics (screeners), Workiva (reporting). Functional but inaccessible to individuals, small firms, and professionals in emerging markets. Even for companies that can afford them, they are overpriced for what they deliver.

**World 2: Cheap/free but theoretical or unreliable**
Coursera, GARP (learning), LinkedIn (jobs), ChatGPT (quick answers). Accessible but don't help you do actual work. No verification, no sourcing, no professional-grade tools.

**Greentryst: Professional-grade, verified, affordable.**
The tools and intelligence of World 1, at a price point accessible to World 2's audience. Every piece of information is sourced and verifiable, unlike ChatGPT. Every tool is designed for real work output, unlike academic courses.

## 11. Build Sequence (Solo Founder)

### Phase 1: The $8 Product (target: launch in 30-45 days)
What ships:
- 22 courses, 470+ lessons with the new UI (architecture revision applied)
- Certificate generation (PDF, verifiable URL, LinkedIn sharing)
- Stripe subscriptions + tier gating (server-side enforcement)
- SustainIQ ask (80-90 PDFs indexed, sourced responses)
- Job board (browse, filter, search)
- New navigation and homepage reflecting "professional home" positioning
- Pricing page

What this proves: people will pay $8/month for fast, sourced sustainability learning + verified knowledge search + curated job discovery.

### Phase 2: The $14 Upgrade (target: 4-8 weeks after Phase 1)
What ships:
- Resume upload + skills extraction
- Job matching algorithm (already developed)
- Skill gap analysis linked to courses
- Enhanced SustainIQ query limits
- Career profile page

What this proves: the learning-to-career link is a real upgrade driver.

### Phase 3: The $25 Upgrade (target: 3-6 months after Phase 2)
What ships (incrementally, one tool at a time):
- Emission factor search engine (first tool, reuses SustainIQ infrastructure)
- GHG inventory calculator
- Regulation tracker
- Company ESG screener (the major differentiator)
- Report/policy drafting tools
- RFP aggregator

What this proves: practitioners will pay for professional-grade tools at individual price points.

### Phase 4: Scale
- Community features graduate to standalone section (if activity justifies)
- Team/enterprise pricing
- API access for tools
- Mobile optimization / PWA
- Additional courses driven by user demand and regulatory changes

## 12. Technical Architecture Principles

These are derived from the product requirements, not from framework preferences:

1. **Static content, dynamic tools.** Courses and public pages are statically generated (SSG) for speed and SEO. Tools, dashboards, and authenticated features are dynamic. Route groups in Next.js App Router keep these separated so auth doesn't contaminate static builds.

2. **Server-side enforcement.** Subscription tier checks happen in server components and API routes, not client-side. Middleware checks auth presence only.

3. **Course URLs don't move.** Existing `/courses/[courseId]/[lessonId]` URLs stay. No SEO migration risk. New sections (`/tools`, `/learn` hub, `/jobs/matches`) are additive.

4. **SustainIQ is the connective layer.** It's not a separate feature. It's the intelligence that routes users between courses, tools, jobs, and intelligence. Architecturally, it's a RAG pipeline over indexed source documents with structured citation output.

5. **Source provenance is a data model requirement.** Every content item (lesson, emission factor, regulation, screener data point) must have a `source` field linking to the original document. This is enforced at the schema level, not as an afterthought.

## 13. What Greentryst Is NOT

- It is not a school or academy. Learning is one mode of professional work, not the primary identity.
- It is not a chatbot. SustainIQ is a verified knowledge retrieval system with source citations, not a conversational AI.
- It is not an enterprise SaaS product (yet). It serves individual professionals and small teams at accessible price points.
- It is not trying to replace Big Four consulting. It gives practitioners the tools to do their work more efficiently, whether they work at a Big Four or compete against one.
- It is not theoretical. Every feature exists because the founder, an active sustainability practitioner, has felt the specific pain it addresses.

## 14. The One-Sentence Description

**Greentryst is where sustainability professionals learn new domains, execute their work with verified tools, and advance their careers, all in one place.**

## 15. Open Decisions

| Decision | Options | Recommendation |
|----------|---------|---------------|
| SustainIQ branding | Keep as feature name inside Greentryst, or rename to "Ask Greentryst" | Keep "SustainIQ" as the intelligence layer brand. It's strong and communicates verified intelligence. |
| Community timing | Build lesson discussions in Phase 1 or Phase 2 | Phase 2. Phase 1 should focus on paid value (courses, certs, SustainIQ, jobs). Discussions add retention but not conversion. |
| Homepage framing | "Professional home" vs "Learning platform that does more" | "Professional home." The homepage should communicate the full vision even if only Phase 1 is live. Use "Coming soon" for unreleased features. |
| Annual pricing | Exact discount percentage | 25-30% discount. $8/mo becomes $69-72/yr. $14/mo becomes $120-126/yr. $25/mo becomes $210-225/yr. |
| Lifetime deal | Offer or not | Yes, for first 500 users. $149 lifetime for Career tier equivalent. Generates cash and evangelists. |

## 16. Assumptions to Validate

These are beliefs the product is built on. If any prove false, the strategy must change:

1. **Sustainability professionals will pay $8-25/month for individual tools.** (Validate with Phase 1 launch and conversion data)
2. **Sourced, verified content is a meaningful differentiator over ChatGPT.** (Validate by asking early users why they pay)
3. **The learning-to-career link drives upgrades.** (Validate with Phase 2 upgrade rates)
4. **A solo founder can ship and maintain this scope.** (Validate by tracking actual build velocity against this plan)
5. **The $25 tier tools are valuable enough to justify 3x the base price.** (Validate with Phase 3 usage data)
6. **Global positioning works better than India-first.** (Validate by tracking user geography and content demand)
