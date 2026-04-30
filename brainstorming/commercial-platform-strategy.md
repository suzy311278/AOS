# Sustainability Academy: Commercial Platform Strategy

**Date:** April 2026
**Status:** Brainstorming / Pre-implementation

This document captures the full product brainstorm for taking Sustainability Academy commercial, covering pricing, job matching, community, moonshot ideas, and practitioner tools.

## 1. Pricing Structure (Aggressive)

Three-tier model designed to be an impulse purchase, especially for students, NGO workers, and professionals in developing countries.

| | **Learn** | **Practice / Pro** | **Work / Career** |
|---|---|---|---|
| **Monthly** | $0 | $5/mo | $12-29/mo (depends on tooling scope) |
| **Annual** | $0 | $39/yr ($3.25/mo) | $99-249/yr |
| **Lifetime** (early adopter, first 500 users) | - | $79 once | $199 once |

### Key Pricing Decisions
- **Regional pricing (PPP):** 40-60% discount in India, Southeast Asia, Africa, Latin America via Stripe's purchasing power parity. Our costs don't change per user, so every sale is pure margin.
- **Lifetime deal as launch weapon:** Generates upfront cash, creates evangelists. Infra cost per user is near-zero.
- **Corporate/Team tier (future):** $15-49/seat/month depending on tooling. Add once there are 50+ individual paying users and inbound interest from companies.

### Revenue Math (Sanity Check)
- 100 Pro users at $39/yr = ~$4K/yr
- 50 Career users at $99-249/yr = ~$5-12K/yr
- 10 companies at 20 seats at $200/seat = $40K/yr (B2B is where real money is)
- Infrastructure cost: Vercel free/hobby + Turso free + R2 free = nearly $0 until significant scale

## 2. Job Matching Product

### Current State
- `/jobs` route dynamically reads `src/jobs/jobs.xlsx`
- Table UI with filters (profile category, country, company type, remote/on-site, search)
- Jobs are fetched and auto-pushed via scripts

### Proposed: Resume-to-Job Matching

**Phase 1: Weighted keyword/skill overlap (no ML)**
```
match_score = (
  0.4 x skill_overlap(resume_skills, job_skills)
  + 0.2 x domain_match(resume_domains, job_category)
  + 0.2 x location_fit(user_prefs, job_location)
  + 0.1 x seniority_fit(user_experience, job_level)
  + 0.1 x course_completion_bonus(completed_courses, job_domain)
)
```

The `course_completion_bonus` is unique: completing courses on the platform improves your match score. Retention loop.

**Phase 2: Embeddings-based semantic matching**
- Embed resumes and job descriptions into the same vector space
- Catches semantic matches keywords miss (e.g., "carbon accounting" matching "GHG inventory analyst")
- Cosine similarity + weighted bonuses
- Reuses SustainIQ RAG infrastructure

**Phase 3: Learning-to-rank (needs user interaction data)**
- Train on click/apply/save/dismiss signals
- Features: semantic similarity, skill overlap, location, seniority delta, course completion, past behavior
- Model: XGBoost/LightGBM on a few thousand interactions

**Phase 4: Skill gap prediction (monetization driver)**
- Cluster jobs by required skill profiles
- Identify which skill clusters a user is close to but missing 1-2 skills
- Map missing skills to specific courses
- "Complete ESG Reporting and Carbon Markets to unlock 12 more job matches"

### New Schema
```ts
export const userProfiles = sqliteTable('user_profiles', {
  userId: text('user_id').primaryKey(),
  resumeUrl: text('resume_url'),
  skills: text('skills'),          // JSON array
  experience: text('experience'),  // JSON structured work history
  preferences: text('preferences'), // location, remote/hybrid, seniority
  updatedAt: integer('updated_at'),
});
```

### New API Routes
- `POST /api/profile/resume` - upload + parse resume
- `GET /api/jobs/matches` - jobs ranked by match score
- `GET /api/jobs/[jobId]/gap` - skill gap analysis for a specific job

## 3. Community and UGC

### Layer 1: In-Platform (build first)

**Course Discussion Threads**
- Discussion section at the bottom of every lesson page (scoped to that lesson)
- Upvoting, pinned answers, threaded replies
- Lowest-friction UGC entry point

```ts
export const discussions = sqliteTable('discussions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  courseId: text('course_id').notNull(),
  lessonId: text('lesson_id').notNull(),
  parentId: text('parent_id'),         // null = top-level
  body: text('body').notNull(),
  upvotes: integer('upvotes').default(0),
  isPinned: integer('is_pinned').default(0),
  createdAt: integer('created_at'),
});
```

**Public User Profiles**
- Display name, bio, LinkedIn, role, country
- Courses completed, certificates earned
- Discussion reputation score (from upvotes)
- "Top contributor" badge at 50+ upvotes

### Layer 2: UGC Content

**Practice Case Studies (user-submitted)**
- Template-guided: Company/Project, Challenge, How course concept applied, Outcome, Lessons learned
- Peer-rated, best ones featured on course pages
- Real-world application examples are the hardest content to create; users have them from their jobs

**Study Notes and Summaries**
- Users publish personal notes scoped to a lesson
- Others bookmark helpful notes
- Top-rated notes surface alongside official content

**Community Flashcard Decks**
- Spaced repetition built in
- Community votes surface best decks
- "Anki meets Quizlet for sustainability"

### Layer 3: Community as Product

**Mentor Matching**
- Senior professionals opt in (verified via LinkedIn)
- Async model: mentee posts question, mentor responds within 48h
- Mentors get status badge and profile visibility

**Weekly Community Challenges**
- "Calculate the carbon footprint of your morning commute using GHG Protocol methods from Module 3"
- Community votes, winners featured on homepage, XP awarded
- Duolingo-style engagement loop for sustainability

**Expert AMAs**
- Monthly live Q&A with practitioners (Big 4 ESG analyst, carbon project developer, climate scientist)
- Archived and searchable
- Each AMA produces 20-30 Q&As that become permanent content

**Project Showcase**
- Capstone portfolio pieces after completing a learning path
- Community reviews and rates
- Employers browsing the job board can see them
- Closes the loop: learn, build, showcase, get hired

### Gamification System

| Action | XP |
|--------|-----|
| Complete a lesson | 10 |
| Pass a quiz (80%+) | 25 |
| Complete a course | 100 |
| Post a discussion comment | 5 (daily cap: 25) |
| Receive an upvote | 3 |
| Submit a case study | 50 |
| Win weekly challenge | 75 |
| Complete a learning path | 200 |

**Levels:** Seedling (0-100), Sapling (100-500), Tree (500-2000), Forest (2000-5000), Ecosystem (5000+)

### Community Gating by Tier

| Feature | Free | Pro | Career |
|---------|------|-----|--------|
| Read discussions | Yes | Yes | Yes |
| Post in discussions | No | Yes | Yes |
| Submit case studies | No | Yes | Yes |
| Weekly challenges | No | Yes | Yes |
| Mentor access | No | No | Yes |
| Project showcase | No | No | Yes |
| AMA question submission | No | No | Yes |

Free users see community activity (FOMO drives conversion) but can't participate.

## 4. Moonshot Ideas

### Sustainability Credit Score (300-900)
Calculated from courses, quiz scores, case studies, peer ratings, job experience, community contributions. Publicly visible. Employers search/filter by score. Conferences invite speakers by score. You become the credentialing authority for the profession. ESG's greenwashing problem extends to resumes; this solves it.

### Prediction Markets for Climate/ESG Policy
Play-money or micro-stakes bets on sustainability outcomes. "Will EU CBAM exceed 100/tonne by 2028?" Users who predict well earn credibility. Aggregated predictions = crowdsourced intelligence feed. Sustainability-focused Polymarket.

### AI Roleplay Simulations
Interactive scenarios with LLM counterpart. "You're the sustainability officer, CEO wants to drop ESG reporting, convince them otherwise." "You're auditing a carbon credit project, find the three red flags." Scored on accuracy, persuasiveness, correct framework usage. Flight simulator training for sustainability professionals.

### Live "ESG War Room" Events
Monthly simulated crisis: supply chain forced labor exposure, extreme weather damage, whistleblower data leak. Teams of 4-5 collaborate in real-time, facilitators inject developments. $49/event or included in Career tier. Companies pay $500+ per team. War-gaming that McKinsey charges $50K+ for, at scale for $49.

### Reverse Job Board
Companies browse anonymized profiles of high-scoring users. Pay to send interview requests ($25-50 per contact or $500/mo). Reverses the power dynamic from "professionals applying" to "companies competing for talent."

### Open Source Course Creation (Wikipedia Model)
Anyone can create/publish courses. Visual editor for MDX + quiz format. Community peer review (3 reviews before publishing). Revenue split: 70% creator, 30% platform. Quality scoring and delisting. Goes from 10 courses to 500 courses.

### ESG Data Bounties
Companies post data challenges with real bounties. "Verified deforestation data for 50 Borneo concessions, $2,000." "Calculate our Scope 3 Category 11, $500." Kaggle meets Upwork for sustainability.

### Physical NFC Credential Card
Matte black card, tap to open verified profile. Name, specialization, SA Score embossed. $3-5 production cost, charge $29 or free with annual Career. Physical status symbol for conferences. People would Instagram it.

### "Green Seal" for Companies
Companies putting 80%+ of ESG team through the platform earn a verified badge. Bronze/Silver/Gold tiers. Annual renewal. Displayed on websites and reports. Charge $5K-15K/year (includes training). B Corp certification model applied to ESG training.

### Sustainability Career Simulation Game
Manage a fictional company's sustainability transformation over 10 "years" (10 sessions). Investment decisions, reporting choices, regulatory responses. ESG ratings change, stock price responds. SimCity for ESG. Leaderboard: who built the most sustainable company while staying profitable?

### Carbon Footprint of Learning
Track platform's carbon footprint vs alternatives. "This lesson: 0.2g CO2. Equivalent Zoom lecture: 36g. Flight to conference: 240kg." Running total per user. Partner with a carbon registry. Practice what you preach.

## 5. Practitioner Tools (Highest Commercial Value)

These are the features that make sustainability professionals pay because they save real working hours.

### 5.1 GHG Calculator Workbench
**The problem:** Every sustainability professional calculates emissions. Everyone does it in messy spreadsheets.

**What to build:**
- Scope 1, 2, 3 calculator with guided workflows per category
- Built-in emission factor database (DEFRA, EPA, IPCC, IEA) kept updated
- User inputs activity data, tool applies correct factors
- Exportable reports with full methodology audit trail
- Save and version calculations year-over-year
- Templates per industry (manufacturing, financial services, tech, retail)

**Why it's huge:** Free tools are terrible (outdated factors, no audit trail). Paid tools start at $10K+/year. A reliable calculator at $12-29/month is an instant purchase for consultants and small companies.

**Course tie-in:** "You just learned about Scope 3 Category 6 (Business Travel). Now calculate it for real data."

### 5.2 Emission Factor Lookup Engine
**The problem:** Emission factors are scattered across DEFRA, EPA, IPCC, IEA, ecoinvent, national registries. Finding the right one is a daily pain point.

**What to build:**
- Unified search: "electricity India 2025" returns correct grid emission factor with source, year, unit
- Unit conversions built in (kgCO2/kWh vs tCO2/MWh vs gCO2/MJ)
- Provenance tracking: every factor links to source document and page
- Alerts when factors you've used get updated
- API access for power users pulling factors into spreadsheets

**Infrastructure:** Natural extension of SustainIQ RAG pipeline. Same search infra, different data.

### 5.3 Regulation Tracker and Compliance Checker
**The problem:** Sustainability regulatory landscape changes weekly (CSRD, SEC, BRSR, ISSB adoption, CBAM). Nobody can keep up.

**What to build:**
- Living database of sustainability regulations by jurisdiction
- User sets company profile: HQ, operating countries, industry, size, public/private
- Dashboard: "You must comply with: CSRD (deadline Jan 2026), EU Taxonomy (active), CBAM (reporting phase)"
- Email alerts on changes to relevant regulations
- Side-by-side framework comparisons (CSRD vs ISSB vs CDP: overlap and differences)

**Value:** Consulting firms charge $5-20K for regulatory landscape assessments. This automates 80% of that.

### 5.4 Materiality Assessment Tool
**The problem:** Double materiality assessment is mandatory under CSRD. Most companies hire consultants at $15-50K.

**What to build:**
- Guided workflow: stakeholder identification, impact assessment, financial materiality scoring
- Pre-populated topic lists by industry (GRI sector standards, SASB maps)
- Stakeholder survey builder with auto-aggregation
- Materiality matrix generator (publication-ready visualization)
- Benchmarking: "Companies in your sector rate these topics as material"

**Pricing:** $99-199/assessment or included in Work tier subscription.

### 5.5 Report Builder / Disclosure Drafting
**The problem:** After calculations and assessments, writing the report takes weeks.

**What to build:**
- Template library: GRI, TCFD, CDP, BRSR, CSRD/ESRS
- Guided section-by-section drafting with AI assistance
- Auto-populate from GHG Calculator data
- Gap analysis: "14 of 23 required CSRD disclosures completed. Missing: biodiversity, value chain emissions, transition plan"
- Export to Word/PDF

### 5.6 Peer Benchmarking Database
**The problem:** "How do we compare to peers?" is the #1 question every sustainability team gets from their board.

**What to build:**
- Crowdsourced anonymized benchmarks from user base
- "Tech companies, 500-1000 employees: median Scope 1+2 intensity is X tCO2e per employee"
- Industry, geography, size breakdowns
- Year-over-year trends
- Users contribute data (anonymized) in exchange for benchmark access

**Network effect:** Every contributing user makes benchmarks more valuable.

### 5.7 Verification Prep Toolkit (Carbon Projects)
**The problem:** Verification preparation takes weeks. A missed document = verification finding = delays and costs.

**What to build:**
- Monitoring report templates pre-filled with methodology requirements
- Completeness checklist per methodology (VM0042, VCS, Gold Standard)
- Document organizer with completeness checking
- Common non-conformity warnings

### Tool-Aware Pricing

| | **Learn** ($5/mo) | **Practice** ($12/mo) | **Work** ($29/mo) |
|---|---|---|---|
| Courses + community | Unlimited | Unlimited | Unlimited |
| Job matching | Basic | Full | Full |
| GHG Calculator | Demo | Full (personal) | Full + export + API |
| Emission Factor Search | 10/mo | Unlimited | Unlimited + API |
| Regulation Tracker | View only | Alerts | Full compliance dashboard |
| Report Templates | View only | Download | Guided drafting + auto-populate |
| Materiality Assessment | No | No | Full tool |
| Benchmarking | No | View aggregates | Full detail |

$29/month is absurdly cheap: a consultant billing $150/hour saves 2+ hours/month with just the calculator and emission factor search. $300 value for $29.

## 6. Three Monetizable Assets

1. **Content** (courses) - subscription revenue
2. **Audience** (sustainability professionals) - employer/job board revenue
3. **Data and Tools** (calculators, factors, benchmarks) - SaaS revenue

Most EdTech platforms only monetize #1. Building toward all three creates a resilient business.

## 7. Implementation Priority

| Phase | What | Why First |
|-------|------|-----------|
| **Now** | Stripe + subscriptions + aggressive pricing | Revenue starts flowing |
| **Month 1** | PDF certificates + LinkedIn badges | #1 conversion driver |
| **Month 1** | Emission factor search engine | Daily-use tool, reuses SustainIQ infra |
| **Month 2** | GHG Calculator (Scope 1+2 first) | Most common practitioner need |
| **Month 2** | Resume upload + basic job matching | Career tier justification |
| **Month 3** | Discussion threads + user profiles + XP | Community foundation |
| **Month 3** | Learning paths + specializations | Retention |
| **Month 3** | Regional pricing (PPP) | Expands market 3-5x |
| **Month 4** | Regulation tracker | High perceived value |
| **Month 4** | Employer sponsored job listings | Revenue, zero engineering |
| **Month 5** | Report templates + materiality tool | Work tier justification |
| **Month 5** | Corporate portal (basic) | First B2B deals |
| **Month 6+** | ML job matching, benchmarking, simulations | Scale plays |

## 8. Architecture Notes

- **Payment:** Stripe (Clerk has Stripe integration, Vercel works well with webhooks, handles Indian + international cards)
- **Subscriptions table:** Add to Drizzle schema with plan, status, stripeCustomerId, stripeSubscriptionId, currentPeriodEnd
- **Gating:** Extend existing LessonMeter.tsx with plan-aware `canAccessLesson(userId, plan)` check
- **Tool data:** Emission factors and regulations stored in Turso. Could also use the vector search infra from SustainIQ for semantic factor lookup
- **Resume parsing:** Upload to R2 (existing bucket), parse with LLM into structured skills/experience
- **Certificates:** Auto-generated PDF (server-side), stored on R2, verifiable URL
