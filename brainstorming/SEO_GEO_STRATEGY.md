# Greentryst SEO + GEO Strategy

Last updated: 2026-04-09

## 1. Current State Audit

### What We Have (Strong Foundation)

**Technical SEO in place:**
- Dynamic `generateMetadata()` on all course and lesson pages with titles, descriptions, OG tags, canonical URLs
- Rich JSON-LD structured data:
  - `LearningResource` with `teaches`, `educationalLevel`, `keywords` on every lesson page
  - `Course` schema on course overview pages
  - `BreadcrumbList` on all course and lesson pages
  - `FAQPage` auto-generated from quiz questions with explanations
  - `AudioObject` on lessons with audio narration
  - `DefinedTermSet` with all 190+ glossary terms as `DefinedTerm` entries
- Dynamic sitemap (`app/sitemap.ts`) auto-generating 513 URLs from course data
- robots.txt configured (allows all, disallows /jobs)
- Canonical URLs set across all pages via `alternates.canonical`
- All URLs point to `greentryst.com` domain

**Content assets:**
- 22 courses, 487 lessons covering the full sustainability practitioner toolkit
- 190+ glossary terms with definitions
- Interactive components: CalculationExercise, EquationBreakdown, RoughChart, Flowchart
- Audio narration on many lessons (Cloudflare R2 hosted, AudioPlayer component)
- Soft registration wall preserving full crawlability (3 free lessons/month for anonymous users, all content rendered and indexable)

**Internal linking (implemented 2026-04-09):**
- 18 cross-course contextual inline links connecting related concepts:
  - Scope 3 hub (5 courses linking in): SBTi, IFRS S2, SFDR, Financed Emissions
  - EU regulatory cluster: Taxonomy <-> SFDR, CBAM -> Scope 1-2, CSDDD -> Taxonomy, TNFD -> EUDR
  - Carbon markets cluster: Article 6 <-> VCM, VCM -> CBAM, VCM -> VM0044, Climate Science -> Article 6
  - Financial sector cluster: Financed Emissions <-> Scope 3, Financed Emissions -> SBTi, IFRS S2 -> Financed Emissions

### Known Gaps

| Gap | Impact | Status |
|-----|--------|--------|
| No Open Graph images | Social shares have no preview card, hurting CTR on LinkedIn/Twitter | Not started |
| No `next/image` usage | Raw `<img>` tags, missing WebP/AVIF, lazy loading, responsive sizes. Hurts LCP | Not started |
| No individual glossary pages | 190 terms on one page, each could be its own ranking page | Not started |
| No topic/pillar pages | No pages targeting high-volume informational queries directly | Not started |
| No comparison pages | Missing "X vs Y" pages for framework comparison queries | Not started |
| No free tools/calculators | No standalone tool pages targeting transactional queries | Not started |
| No blog/insights section | No timely content for freshness signals | Not started |
| Mechanical meta titles | Titles are "Lesson Title - Course Title", not optimized for search queries | Waiting for Search Console data |
| No author/expert E-E-A-T signals | JSON-LD author is just the organization, no individual credentials | Not started |
| Weak lesson opening paragraphs | Many lessons don't start with clear definition-style sentences for AI citation | Not started |

## 2. Google Search Console Setup

Completed 2026-04-09:
- Property type: Domain property (`greentryst.com`)
- Verification: DNS CNAME record
  - Host: `3anv5ra2seg5`
  - Target: `gv-o25a4qwdqrk2ub.dv.googlehosted.com`
- Sitemap submitted: `https://greentryst.com/sitemap.xml`
- Data expected to be meaningful by late April 2026

### What to check once data arrives (2-3 weeks)

1. **Performance > Queries**: Sort by impressions descending. Filter position > 10 to find "striking distance" keywords
2. **Performance > Pages**: Which lessons get the most search traffic? These are proven content types to replicate
3. **Indexing > Pages**: Are all 487 lesson pages indexed? If not, investigate why
4. **AI Overview citations**: Search Console flags when pages are cited in AI Overviews

## 3. SEO Landscape (2025-2026)

### Google Algorithm Direction

Google's March 2025 core update continued the trajectory from the September 2023 Helpful Content Update: rewarding original, expert-driven content and penalizing thin, AI-generated filler.

Key signals being rewarded:
- First-hand experience and unique data
- Brand signals and entity authority (established topical authority)
- Content demonstrating E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)
- Site reputation and domain authority

Key signals being penalized:
- Scaled content abuse (mass-produced AI content without editorial oversight)
- Site reputation abuse (parasite SEO)
- Thin content lacking genuine expertise

### AI Overviews (formerly SGE)

AI Overviews rolled out broadly in 2025. Impact on organic traffic:
- Informational queries see 20-40% click reduction when AI Overview appears
- Content most often cited: pages with clear structured answers, definitions, tables, numbered lists
- Long-tail and transactional queries less affected
- Pages cited in AI Overviews tend to already rank in the top 10 organically

### GEO (Generative Engine Optimization)

Best practices for getting cited by AI search engines (Google AI Overviews, ChatGPT search, Perplexity):
- Structure content with clear H2/H3 hierarchies and concise paragraph openings
- Include statistics, citations, and named sources (AI engines prefer verifiable claims)
- Use "X is Y" definition-style sentence patterns near section tops
- FAQ sections with schema markup increase citation probability
- Topical depth over breadth (comprehensive coverage of narrow topics)
- Author bylines with credentials help AI systems assess authority

### E-E-A-T for Sustainability Content

Sustainability and ESG content is YMYL-adjacent (Your Money or Your Life) because it involves financial and regulatory implications. Google applies higher E-E-A-T scrutiny to YMYL content.

- **Experience**: First-person case studies, practitioner perspectives, worked examples (our CalculationExercise components)
- **Expertise**: Author bios with verifiable credentials, consistent publication in the domain
- **Authoritativeness**: Backlinks from domain-relevant sources, mentions in authoritative publications
- **Trustworthiness**: HTTPS, clear contact/about pages, accurate citations to source documents

### Technical SEO Priorities

- Core Web Vitals: LCP < 2.5s, INP < 200ms, CLS < 0.1
- INP replaced FID in March 2024
- Structured data types that matter most: FAQ, HowTo, Article, Course, LearningResource, BreadcrumbList, DefinedTerm
- Mobile-first indexing is universal

## 4. Competitive Landscape

### Who we compete against for search traffic

**Institutional sites (very hard to outrank):**
- GHG Protocol, ISSB/IFRS Foundation, EU Commission, UNFCCC
- Own navigational queries ("GHG Protocol Scope 3 standard")
- Strategy: Don't compete on their terms. Compete on "how to" and "explained" queries

**Consulting firms (hard but beatable):**
- McKinsey Sustainability, Deloitte ESG, PwC
- Shallow thought leadership (1,000 words, surface-level)
- Our lessons go 3-5x deeper on methodology
- Strategy: Outdepth them on practitioner-level content

**Training platforms (direct competition):**
- GRI Academy, CDP learning, SASB courses
- Narrow scope (only their own framework)
- Our cross-framework coverage is the differentiator
- Strategy: Own the cross-framework explanation space

**Generic content mills (easy to outrank):**
- ESG blogs, sustainability news sites
- Thin content, no interactive elements
- Strategy: Already beating them on content quality

### Our competitive advantage

Practitioner-depth explanations of how frameworks actually work, with interactive elements and cross-framework connections. Nobody else has:
- Interactive equation breakdowns for carbon accounting formulas
- Calculation exercises with hints and solutions
- 18 cross-course links showing how SFDR connects to Taxonomy connects to CSRD connects to GHG Protocol
- Audio narration for on-the-go learning
- 487 lessons covering the full sustainability practitioner toolkit, all free and fully crawlable

## 5. Keyword Strategy

### Query categories and our position

**Regulatory/framework keywords (high intent, moderate competition):**
- "EU CBAM explained", "SFDR classification", "EU Taxonomy eligibility criteria"
- "Scope 3 emissions calculation", "GHG Protocol categories"
- These are our core strength. Practitioners search these when understanding compliance

**Definition/concept keywords (high volume, AI Overview targets):**
- "What is carbon leakage", "What are Scope 3 emissions", "ESG vs sustainability"
- 190+ glossary terms map directly to these
- Each is a ranking opportunity, especially as individual pages

**Calculation/methodology keywords (low competition, high conversion):**
- "How to calculate carbon intensity", "CBAM embedded emissions formula"
- Our interactive components make these pages stickier than competitors' text-only content

**Comparison keywords (high intent, weak competition):**
- "CSRD vs ISSB", "Verra vs Gold Standard", "Article 6 vs voluntary carbon market"
- Practitioners search these constantly, results are usually weak consulting blog posts

**Tool/calculator keywords (transactional, very low competition):**
- "Carbon intensity calculator", "CBAM cost calculator", "Scope 3 category finder"
- Almost no free tools exist for these. Massive opportunity

### Keyword research process

1. **Google Search Console** (primary, once data arrives): Performance > Queries, sort by impressions, filter position > 10
2. **Google Autocomplete + People Also Ask**: Search topic areas, note suggestions
3. **AlsoAsked.com**: Enter seed keywords, get full PAA tree
4. **Google Trends**: Compare keyword variations
5. **Ahrefs/Semrush** (when ready): Export competitor domain keywords, filter for beatable opportunities

### Prioritization framework

Score each keyword opportunity on three axes:
- **Content match**: Do we already have a lesson covering this? (Optimization vs new content)
- **Competition**: Are page-1 results from massive institutions (hard) or mediocre blogs (beatable)?
- **Intent alignment**: Is the searcher a sustainability practitioner or student? (Our target audience)

Sweet spot: queries where we have deep existing content, page-1 results are weak, and the searcher matches our user profile.

## 6. Implementation Roadmap

### Phase 1: Technical Quick Wins (Completed 2026-04-09)

- [x] Update all URLs from sustainabilityacademy.vercel.app to greentryst.com
- [x] Set up Google Search Console (domain property, DNS verification)
- [x] Submit sitemap
- [x] Add AudioObject JSON-LD to lessons with audio
- [x] Enrich LearningResource schema (teaches, educationalLevel, keywords)
- [x] Add DefinedTermSet schema to glossary page
- [x] Replace static sitemap.xml with dynamic app/sitemap.ts (513 URLs)
- [x] Add 18 cross-course internal links across all major content clusters

### Phase 2: High-Impact Structural Changes (Next)

**Individual glossary pages (highest ROI):**
- Route: `/glossary/[term-slug]`
- Each of 190+ terms becomes its own indexable page
- Content per page: definition (2-3 sentences), "Where this appears" (links to relevant lessons), related terms
- DefinedTerm JSON-LD per page
- Targets definition queries ("what is carbon leakage", "ITMO definition")
- These are the queries AI Overviews cite most
- Keep the master `/glossary` page as an index

**Open Graph images:**
- Generate dynamic OG images per course using Next.js `ImageResponse`
- Course title + icon + Greentryst branding
- Critical for LinkedIn sharing (sustainability professionals share on LinkedIn)

**`next/image` migration:**
- Replace all raw `<img>` tags with `next/image`
- Automatic WebP/AVIF, lazy loading, responsive sizes
- Direct LCP improvement

**Author/E-E-A-T page:**
- Create an `/about` page with author credentials
- Update JSON-LD author from generic organization to include expertise signals
- Even a simple "Content developed by sustainability domain experts" with credential details

### Phase 3: Content Expansion (Data-Driven)

Timing: After Search Console data arrives (late April 2026)

**Guides (question-based evergreen pages):**
- Route: `/guides/[question-slug]` (e.g., `/guides/how-to-calculate-financed-emissions`)
- Full spec: `brainstorming/GUIDES_SPEC.md`
- Question-based URLs matching how practitioners actually search
- 1,500-2,000 word authoritative guides, not blog posts
- Inline "Go deeper" cards linking to specific course lessons
- Footer placement only (SEO-first, not primary navigation)
- Writing style adapted from personal style guide (conversational, layered, practitioner-focused)

Priority guides (first 10):
1. `/guides/how-to-calculate-scope-3-emissions` (ghg-scope-3, sbti, ifrs-s2, eu-sfdr)
2. `/guides/what-is-double-materiality` (double-materiality, esg-reporting, ifrs-s2)
3. `/guides/how-to-calculate-financed-emissions` (financed-emissions, ghg-scope-3, ifrs-s2, sbti)
4. `/guides/how-does-eu-cbam-work` (eu-cbam, ghg-scope-1-2)
5. `/guides/what-are-science-based-targets` (sbti, ghg-scope-3, financed-emissions)
6. `/guides/how-does-article-6-work` (article-6, vcm-101, climate-science-101)
7. `/guides/what-is-the-difference-between-sfdr-article-8-and-article-9` (eu-sfdr, eu-taxonomy)
8. `/guides/how-to-build-a-corporate-ghg-inventory` (ghg-scope-1-2, ghg-scope-3)
9. `/guides/what-is-the-eu-taxonomy` (eu-taxonomy, eu-sfdr, double-materiality)
10. `/guides/how-do-voluntary-carbon-markets-work` (vcm-101, article-6, vm0042, vm0044)

**Comparison pages:**
- Route: `/compare/[slug]`
- Side-by-side tables, "when to use which" guidance, links to both courses

Priority comparisons:
1. `/compare/csrd-vs-issb` (most searched regulatory comparison)
2. `/compare/verra-vs-gold-standard` (carbon market practitioners)
3. `/compare/article-6-vs-voluntary-carbon-market` (already covered in lessons, extract into standalone)
4. `/compare/gri-vs-sasb` (ESG reporting practitioners)
5. `/compare/sfdr-article-8-vs-article-9` (fund classification)
6. `/compare/eu-ets-vs-cbam` (compliance markets)
7. `/compare/scope-1-vs-scope-2-vs-scope-3` (foundational)
8. `/compare/tcfd-vs-issb` (transition from TCFD)

**Meta title optimization:**
- Use Search Console data to identify pages with high impressions but low CTR
- Rewrite titles from mechanical ("Lesson Title - Course Title") to search-optimized ("Scope 3 Categories: All 15 Explained with Calculation Examples")

**Definition-style lesson openings:**
- Audit first paragraphs of high-traffic lessons
- Ensure each starts with a clear "X is Y" definition for AI citation

### Phase 4: Creative Growth Plays

**Free tools/calculators:**
- Route: `/tools/[tool-slug]`
- Standalone interactive tools using existing CalculationExercise and EquationBreakdown components
- Each tool page has a CTA to the relevant course

Priority tools:
1. `/tools/carbon-intensity-calculator` (input revenue + emissions)
2. `/tools/financed-emissions-calculator` (input investment + enterprise value + emissions)
3. `/tools/scope-3-category-finder` (answer 5 questions, get applicable categories)
4. `/tools/cbam-liability-estimator` (input volumes + emission factors)
5. `/tools/ghg-conversion-calculator` (convert between gas types using GWP values)

These target transactional queries that lessons can never rank for. Consultants bookmark and share them.

**Regulatory tracker:**
- Route: `/tracker` or `/regulatory-calendar`
- Single living page showing deadlines: CBAM, CSRD, SFDR, SBTi, ISSB adoption
- Data-driven from a YAML file (same pattern as course content)
- Practitioners bookmark and return to it
- Ranks for "CBAM deadline 2026", "CSRD timeline" queries
- Earns links from sustainability newsletters

**Learning paths (persona-based):**
- Route: `/paths/[persona-slug]`
- Curated cross-course sequences for specific roles
- `/paths/sustainability-consultant` (ESG Reporting, Double Materiality, GRI, ISSB)
- `/paths/carbon-market-analyst` (VCM 101, Article 6, VM0042, VM0044)
- `/paths/corporate-sustainability-officer` (SBTi, Scope 1-2, Scope 3, CSRD, SFDR)
- `/paths/esg-fund-manager` (SFDR, EU Taxonomy, Financed Emissions, ESG Benchmarking)
- Target queries like "sustainability consulting course", "carbon markets training"
- Strong internal linking (each path links to 20-30 lessons)

**Cheat sheets:**
- Route: `/cheatsheets/[slug]`
- One-page visual summaries of complex frameworks
- Web page + downloadable PDF (email capture if desired)
- `/cheatsheets/scope-3-categories` (all 15 categories, one-line descriptions)
- `/cheatsheets/eu-taxonomy-screening` (decision tree for eligibility)
- `/cheatsheets/sfdr-product-classification` (Article 6 vs 8 vs 9 at a glance)

**Blog/insights (only if sustainable cadence):**
- Route: `/insights/[slug]`
- Regulatory update content: "CSRD latest updates 2026", "CBAM transition changes"
- 2-4 posts per month minimum to maintain freshness signals
- Each post links back to course content
- Only pursue if publishing cadence can be sustained. A stale blog hurts more than no blog

### Phase 5: Advanced (When Ready)

**Programmatic SEO:**
- Auto-generated pages: `/regulations/eu-cbam`, `/frameworks/ghg-protocol/scope-3/category-15`
- High execution risk. Google penalizes thin programmatic pages
- Only do after topic pages are proven and Search Console shows demand

**Course catalog schema:**
- Add `CourseInstance`, `offers` (free), `hasCourseInstance` to course overview pages
- Google has a dedicated course search carousel
- Very few free platforms do this properly

**Backlink strategy:**
- Create embeddable/shareable versions of best charts and calculators
- Reach out to university sustainability programs for resource list inclusion
- Get listed on sustainability education aggregator sites
- Publish original data visualizations that journalists/bloggers reference

## 7. Metrics and Tracking

### Primary KPIs

| Metric | Source | Check frequency |
|--------|--------|-----------------|
| Organic impressions | Google Search Console | Weekly |
| Organic clicks | Google Search Console | Weekly |
| Average position (target queries) | Google Search Console | Weekly |
| Pages indexed | Google Search Console > Indexing | Monthly |
| AI Overview citations | Google Search Console | Weekly |
| Core Web Vitals (LCP, INP, CLS) | PageSpeed Insights / Search Console | Monthly |

### Secondary KPIs

| Metric | Source | Check frequency |
|--------|--------|-----------------|
| Referral traffic from social shares | Vercel Analytics | Monthly |
| Glossary term featured snippets | Manual SERP checks | Monthly |
| Tool page backlinks | Ahrefs/Semrush (when available) | Monthly |
| Comparison page rankings | Search Console | Weekly |

### Milestone targets

- **May 2026**: All 487 lesson pages indexed. First Search Console data analyzed
- **June 2026**: Individual glossary pages live. OG images deployed. 5 topic pages published
- **July 2026**: 10 comparison pages live. First tools published. Meta titles optimized from data
- **August 2026**: Learning paths live. Regulatory tracker launched
- **Q4 2026**: Evaluate blog viability. Consider programmatic SEO based on data

## 8. Files Changed (2026-04-09 Session)

### Domain update (commit 0225f89)
- `public/robots.txt` - sitemap URL updated
- `public/sitemap.xml` - all URLs updated (later replaced by dynamic route)
- `src/app/layout.tsx` - siteUrl constant
- `src/app/page.tsx` - siteUrl constant
- `src/app/courses/[courseId]/page.tsx` - siteUrl constant
- `src/app/courses/[courseId]/[lessonId]/page.tsx` - siteUrl constant
- `scripts/generate-sitemap.ts` - SITE_URL constant

### Structured data (commit 1828d71)
- `src/app/courses/[courseId]/[lessonId]/page.tsx` - AudioObject JSON-LD, enriched LearningResource (teaches, educationalLevel, keywords)
- `src/app/glossary/page.tsx` - DefinedTermSet JSON-LD with all terms

### Dynamic sitemap (commit 7f960b8)
- `src/app/sitemap.ts` - new dynamic sitemap route (replaced static XML)
- `public/sitemap.xml` - deleted

### Cross-course links batch 1 (commit f316bd5)
- `src/content/ghg-scope-3/lessons/4.3.mdx` -> financed-emissions/0.2
- `src/content/financed-emissions/lessons/0.2.mdx` -> ghg-scope-3/0.4
- `src/content/article-6/lessons/4.3.mdx` -> vcm-101/5.5
- `src/content/vcm-101/lessons/0.2.mdx` -> eu-cbam/0.3
- `src/content/sbti/lessons/2.4.mdx` -> ghg-scope-3/0.4
- `src/content/ifrs-s2/lessons/5.2.mdx` -> ghg-scope-3/0.3
- `src/content/ifrs-s2/lessons/6.1.mdx` -> financed-emissions/1.1
- `src/content/eu-taxonomy/lessons/4.2.mdx` -> eu-sfdr/4.5
- `src/content/eu-sfdr/lessons/3.2.mdx` -> ghg-scope-1-2/0.1 + ghg-scope-3/0.3
- `src/content/double-materiality/lessons/4.3.mdx` -> ifrs-s2/0.3

### Cross-course links batch 2 (commit cd525c5)
- `src/content/esg-reporting/lessons/2.2.mdx` -> double-materiality/0.1
- `src/content/esg-benchmarking/lessons/3.1.mdx` -> ifrs-s2/0.2
- `src/content/eu-cbam/lessons/2.1.mdx` -> ghg-scope-1-2/1.1
- `src/content/climate-science-101/lessons/5.1.mdx` -> article-6/0.1
- `src/content/vcm-101/lessons/2.4.mdx` -> vm0044/0.1
- `src/content/financed-emissions/lessons/5.3.mdx` -> sbti/0.1
- `src/content/tnfd-biodiversity/lessons/0.2.mdx` -> eudr/0.1
- `src/content/human-rights-dd/lessons/4.1.mdx` -> eu-taxonomy/1.4
