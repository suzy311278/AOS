# Greentryst Homepage, Locked Specification

Status: LOCKED on 2026-04-11
Branch: `redesign` (local only, never pushed)
Live at: `/redesign/components` (composite showcase page)
Target production route: `/` (homepage) once the redesign branch is cut over

This document is the single source of truth for the Greentryst homepage. Every section, every component, every line of copy, and every significant design decision is recorded here. If a future agent or contributor wants to change any element, they should start by reading this document in full, and any change must be approved before it lands. The homepage is the front door of the brand and small drift in copy or layout erodes the trust narrative that the rest of the product depends on.

## 1. Core Vision Reflected on the Homepage

Greentryst is the professional operating system for sustainability practitioners. The homepage must make three things immediately obvious to a cold visitor who works in sustainability:

1. This is a professional tool, not a content site or a course marketplace. It is built to be treated with the same seriousness that a doctor treats UpToDate, a lawyer treats Westlaw, or a trader treats Bloomberg.
2. Every answer on the platform can be traced back to an original source document. This is the core differentiator versus ChatGPT, versus scattered PDFs, and versus the fragmented SaaS stack that sustainability professionals currently assemble for themselves.
3. The platform collapses five work modes into one login: learning a new domain, looking up a verified answer, executing the work, orienting to something new in the regulatory landscape, and advancing the career. Nothing is siloed.

The tone throughout is authoritative, trustworthy, premium, and quietly confident. The brand's voice respects the practitioner as a peer, never as a prospect. The design language is Bloomberg Terminal meets modern SaaS, with forest green accents on neutral surfaces and dark product cards as the signature visual element.

## 2. Branch and Safety Rules

All homepage work happens on the `redesign` branch. The branch is deliberately local only and must never be pushed to a remote. Main continues to deploy to greentryst.com during the redesign. Before editing any file referenced in this document, verify the current branch is `redesign` or a feature branch off it.

## 3. Page Structure, In Order

The homepage flows through eight sections in a strict order. Each section has a specific job in the narrative arc of the page, and reordering any section breaks the flow. The sections are:

1. Navigation bar
2. Hero
3. Ticker band
4. Trust Identity (Provenance Promise) with live TryItDemo
5. Four Work Modes via ActiveShowcase
6. Pricing
7. Closing CTA (the three promises)
8. Footer

The narrative arc is: who we are (hero), what we cover (ticker), why you can trust us (trust identity), how the product actually works (active showcase), what it costs (pricing), what we commit to (closing CTA), and where to go next (footer).

## 4. Section One. Navigation Bar

Component: `src/components/redesign/RedesignNav.tsx`
Symbol imported from: `@/components/redesign`
Mounted in: `src/app/redesign/components/page.tsx`

The nav bar sits at the top on every redesign page, not just the homepage. It contains the Greentryst wordmark on the left, five product links in the center (Learn, SustainIQ, Career, Tools, Pricing), and the auth CTAs on the right (Sign In, Get Started). The Get Started button uses the primary leaf green color.

## 5. Section Two. Hero

Component: inline inside `src/app/redesign/components/page.tsx`
Section wrapper: `DarkSection`

The hero headline is locked as three short declarative sentences, stacked on three lines. The headline is:

> Learn the framework.
> Verify the answer.
> Execute the work.

This is the culmination of multiple iterations. An earlier draft used the phrase "Work like a sustainability professional" which was rejected as too slogan-like. The current version is factual and mirrors the four work modes.

Under the headline sits a sub-tagline explaining Greentryst as the professional operating system for sustainability practitioners, followed by two CTAs (Start Free as the primary leaf green button, See Pricing as the ghost secondary). The hero background is the dark `gt-text-dark` surface (#18181B) with an ambient teal glow and a subtle dot grid texture. To the right of the headline column sits a shuffling card deck that cycles through four product surfaces as a preview of the ActiveShowcase further down the page.

The grid is `[1.25fr_1fr]` so the headline column has breathing room and "sustainability" never wraps mid word. Hero headline font size is 56px on desktop, stepping down on mobile.

## 6. Section Three. Ticker Band

Component: `src/components/redesign/Ticker.tsx`
Section wrapper: a thin dark band between the hero and the trust identity section.

The ticker runs a continuous horizontal marquee of sustainability frameworks, methodologies, acronyms, and regulations. It is read as a confidence signal. A practitioner should see at least five things they recognize in the first five seconds. The list spans global standards (TCFD, IFRS S1 and S2, GRI, SASB, SBTi, ISSB, CDP, PCAF), regional regulations (CSRD, SB 253, AASB S2, EU Taxonomy, CBAM, SFDR, EUDR, EU ETS), carbon market methodologies (VM0042, VCS, Gold Standard, ACR, CAR), and core concepts (Scope 1, Scope 2, Scope 3, LCA, double materiality, Article 6, CORSIA, BRSR).

## 7. Section Four. Trust Identity with TryItDemo

Component: inline inside `src/app/redesign/components/page.tsx`, uses `TryItDemo` from `src/components/redesign/TryItDemo.tsx`
Section wrapper: `LightSection`
Label above the heading: `PROVENANCE PROMISE`

The heading is "Every answer can be traced to its source." The subheading explains that this is the single most important thing Greentryst offers. Under the heading sits the TryItDemo, which is a live input box that simulates a SustainIQ query and surfaces a real sourced answer with a citation back to an actual document in the source library.

The visual contrast drawn in this section is between Greentryst and ChatGPT. The unspoken thesis is: ChatGPT gives you a plausible answer, Greentryst gives you a defensible one. This section must never be softened. It is the core trust moment of the page.

## 8. Section Five. Four Work Modes via ActiveShowcase

Component: `src/components/redesign/ActiveShowcase.tsx`
Section wrapper: `LightSection`
Label above the heading: `THE PLATFORM`
Heading: "Four work modes. One platform."

The ActiveShowcase is the largest and most important section on the page. It is a five canvas carousel where each canvas represents a work mode on the Greentryst platform. The canvases are, in strict order:

1. Learn (blue accent). Shows a course shell mockup with a lesson tree, a reading meter, an audio player, and a quiz preview.
2. Ask (SustainIQ, purple accent). Shows a SustainIQ query interface with a question in neon mint text, streaming sourced answers, and citation cards showing the document and the exact location.
3. Tools (amber accent). Shows a professional tool workspace with four clickable tabs: GHG Calculator, Report Drafter, IFRS Gap Assessment, and BRSR Screener. Each tab has its own content variant and its own export button label.
4. Regulations (cyan accent). Shows a regulations tracker with a four stage status timeline (Draft, Consultation, Final, Enforced), an "Applies To Your Business" card with specific criteria, and a Recent Changes list.
5. Careers (rose accent). Shows a job board mockup with live data pulled from `getJobsMeta()` at build time. The stats displayed are `totalJobCount`, `countries.length`, and `totalCompanies`. The skill gap list now reads: Scope 3 Advanced, TCFD, SBTi Target Setting.

The ActiveShowcase auto advances every 4500 milliseconds. Hovering any canvas pauses the auto advance. Clicking a canvas locks it as sticky for 15 seconds before auto advance resumes. The left rail of the component has five nav items, one per work mode, each of which stretches via `flex-1` to match the canvas height exactly.

The Tools canvas is unique in that its tabs are clickable and each tab swaps the content area to a different mockup. The export button label is dynamic per tab and lives in the `TOOL_EXPORT_LABELS` dictionary at the top of `ActiveShowcase.tsx`. On the IFRS Gap tab the long label "Export gap assessment with recommendations" required vertical centering on the icon via `self-center` and `leading-tight` on the text span.

## 9. Section Six. Pricing

Component: `src/components/redesign/PricingSection.tsx`
Section wrapper: `LightSection` with the pale variant
Label above the heading: `PRICING`
Heading: "Pick the tier that fits your work."
Subheading: "Professional grade at individual prices. Or take your entire team off Excel for less than one enterprise seat."

The pricing section has two independent toggles. The primary toggle switches between Individuals and Teams and Enterprise. The secondary toggle switches between Monthly and Annual billing. The default state of the page loads with Individuals selected and Annual billing selected. This is deliberate. When Annual is active, the big headline number on each card displays the effective monthly rate, rounded to the whole dollar, and the total annual cost is disclosed in smaller footnote text directly below the price. This is a standard pricing psychology pattern and it is the reason we build with annual as the default.

### 9.1 The five tiers

Tier one is Free. Price is zero. No annual option. Targeted at visitors who want to try Greentryst without committing a credit card. Included: one course per month without certificate, five SustainIQ queries per month, browse access to the job board, browse access to regulations, trial access to professional tools, basic free tools, community support.

Tier two is Individual. Price is twelve dollars monthly, ninety nine dollars annually (which presents as eight dollars per month when billed annually). Targeted at the everyday sustainability practitioner. Included: all courses with certificates, audio, and quizzes, five SustainIQ queries per day, one professional tool per month with the ability to swap anytime, extra tools at fifteen dollars per month each, regulations browse plus selected alerts, full job matching with resume and priority notifications, skill gap analysis with course recommendations, reports and exports as PDF, community support.

Tier three is Pro. Price is twenty nine dollars monthly, two hundred thirty nine dollars annually (which presents as twenty dollars per month when billed annually). Marked as Most Popular in the Individuals group. Targeted at consultants and power practitioners. Includes everything in Individual, plus twenty five SustainIQ queries per day, three professional tools per month with the ability to swap anytime, unlimited extra tools at fifteen dollars per month each, full regulations applicability engine, reports in all formats with full audit trails, priority community support. Pro offers a seven day free trial with a credit card required.

Tier four is Team. Price is ninety nine dollars monthly, seven hundred ninety nine dollars annually. User limit is ten users. Targeted at small sustainability teams. Includes all professional tools for every user, unlimited SustainIQ queries under a fair use policy, full regulations applicability engine, all report formats with full audit trails, shared team workspace, a team profile visible to job seekers, advanced admin dashboard, SSO and SAML, custom onboarding, priority feature requests, priority email support, consultancy with free diagnostics and paid engagements, and all courses and certificates for every user.

Tier five is Enterprise. Price is four hundred dollars monthly, three thousand eight hundred forty dollars annually. User limit is fifty users and teams above fifty users receive custom pricing. Marked as Most Popular in the Teams and Enterprise group. The value statement is that Enterprise at four hundred dollars per month is an unbeatable deal compared to thirty thousand dollar plus competitors. The feature set is the same as Team, just at a higher user count.

### 9.2 Pricing psychology rules that are locked

Extra tools are fifteen dollars per month each, not twenty five. Tool swaps are unlimited for Individual and Pro. India pricing is applied automatically at checkout via Stripe PPP. Students get fifty percent off the Individual tier with a dot edu or verified NGO email. All tiers can be cancelled anytime. There are no long term contracts on any paid tier. Teams above fifty seats link to a contact form for custom pricing, not a sales call.

### 9.3 Trust strip under the pricing grid

Four short trust lines sit below the pricing grid in a two column layout. They are: students get fifty percent off, India pricing applied automatically, cancel anytime, and the 50+ seats custom pricing link.

## 10. Section Seven. Closing CTA

Component: `src/components/redesign/ClosingCTA.tsx`
Section wrapper: the component renders its own dark section
Background: `gt-text-dark` with ambient teal radial glow and a subtle dot grid

This is the single most vision critical block on the page. Its copy is locked and must not be changed without a conversation with the product owner. The closing section reads:

> We simplify.
> We show you the source.
> We make the work easy for you.
>
> This is the whole deal.
>
> (signature) GREENTRYST
>
> (CTAs) Start free, See pricing

The middle line "We show you the source." is colored in mint (`text-gt-mint`) for emphasis because it is the core trust contract. The other two lines are white. The "This is the whole deal." line is styled slightly smaller and at eighty percent white opacity to feel like a signoff. The signature is a mono uppercase line at forty five percent white opacity.

Vertical padding was deliberately tightened to `py-16 md:py-20` so the band feels like a period, not a paragraph. Headline is 38px on desktop, spaced at `space-y-1.5` between the three promises.

A longer Letter draft was written and rejected for the homepage close because it felt like About page content. That Letter draft is parked for future use on `/about` or `/manifesto` and is preserved in section 14 of this document.

## 11. Section Eight. Footer

Component: `src/components/redesign/RedesignFooter.tsx`
Background: `gt-text-dark`
Layout: five columns on desktop, collapsing to a single column on mobile

Column one is the brand column. It contains the Greentryst wordmark, a one sentence tagline, a newsletter capture form labeled "The Briefing" with a one line value proposition ("Monthly note on new regulations, courses, and tools. No spam, unsubscribe any time."), and three social icons (X, LinkedIn, GitHub).

Columns two through five are link columns. The columns and links are:

Product column: Learn (to `/courses`), SustainIQ (to `/ask`), Career (to `/jobs`), Tools (placeholder with Soon pill), Intelligence (placeholder with Soon pill), Community (placeholder with Soon pill).

Learn column: Climate Science (to `/courses/climate-science-101`), Carbon Markets (to `/courses/vcm-101`), ESG Reporting (to `/courses/esg-reporting`), GHG Accounting (to `/courses/ghg-scope-1-2`), EU Taxonomy (to `/courses/eu-taxonomy`), All courses (to `/courses`).

Resources column: Glossary (to `/glossary`), Guides (to `/guides`), Feedback (to `/feedback`), Disclaimer (to `/disclaimer`).

Company column: About (placeholder), Contact (to `/feedback`), Privacy (placeholder), Terms (placeholder).

The bottom bar contains a mono copyright line ("2026 Greentryst. Built for sustainability professionals.") and the brand's signature phrase "Every claim sourced. Every answer defensible." on the right in mint.

The newsletter form is presentational only. Wiring it to a real provider is a post cutover task.

## 12. Design Tokens and Rules

Tokens are defined in `tailwind.config.ts` and custom utilities live in `src/app/redesign/redesign.css`. Key tokens:

1. `gt-text-dark` is #18181B. This is the primary dark surface.
2. `gt-deep` is #23232A. Used for slightly lighter dark areas.
3. `gt-medium` is #2D6A4F. Primary brand green for accents and CTAs.
4. `gt-leaf` is #52B788. Bright leaf green for hover states, primary CTA fills, and signature accents.
5. `gt-mint` is #95D5B2. Pale mint used for the closing trust contract line and for small eyebrow labels.
6. `gt-text` is the main body text color on light surfaces.
7. `gt-text-muted` is the secondary body text color on light surfaces.
8. `gt-text-dim` is the tertiary body text color on light surfaces.
9. `gt-border-light` is the hairline border color on light surfaces.

Fonts are Inter for everything and JetBrains Mono for eyebrows, mono quotes, copyright lines, and timestamps. No other fonts.

Icons are Lucide only. No emoji, no Material icons, no hand drawn illustrations anywhere on the homepage.

Shadows and corners are rounded 2xl (16px) for cards and lg (8px) for buttons. No 1px borders on cards in light mode. Borders are acceptable on the dark product cards.

## 13. Locked Copy Inventory

Every piece of copy that appears on the page is recorded below. If any of this copy needs to change, update this document at the same commit.

1. Nav wordmark: Greentryst
2. Nav links: Learn, SustainIQ, Career, Tools, Pricing
3. Nav CTAs: Sign In, Get Started
4. Hero headline: Learn the framework. Verify the answer. Execute the work.
5. Hero CTAs: Start Free, See Pricing
6. Trust Identity eyebrow: PROVENANCE PROMISE
7. Trust Identity heading: Every answer can be traced to its source.
8. Work Modes eyebrow: THE PLATFORM
9. Work Modes heading: Four work modes. One platform.
10. Pricing eyebrow: PRICING
11. Pricing heading: Pick the tier that fits your work.
12. Pricing subheading: Professional grade at individual prices. Or take your entire team off Excel for less than one enterprise seat.
13. Closing CTA line 1: We simplify.
14. Closing CTA line 2: We show you the source. (colored mint)
15. Closing CTA line 3: We make the work easy for you.
16. Closing CTA signoff: This is the whole deal.
17. Closing CTA signature: GREENTRYST
18. Footer brand tagline: The professional operating system for sustainability practitioners. Learn the framework, verify the answer, execute the work.
19. Footer newsletter heading: The Briefing
20. Footer newsletter copy: Monthly note on new regulations, courses, and tools. No spam, unsubscribe any time.
21. Footer copyright line: 2026 Greentryst. Built for sustainability professionals.
22. Footer signature phrase: Every claim sourced. Every answer defensible.

## 14. Parked Content for /about or /manifesto

The following Letter draft was written during the ClosingCTA iteration and ultimately rejected for the homepage close because it was too much content for a page ending. It is preserved here for future use on `/about`, `/manifesto`, or a similar long form brand page. Do not use this on the homepage.

> To the person doing the actual work.
>
> You already know the real problem.
>
> It is not the science. The science is in the PDFs.
> It is not the standards. The standards are written down.
>
> It is that doing anything with them takes weeks you do not have, five tools that half work, a team that does not agree, and a regulation page that contradicts itself.
>
> Greentryst is one place that fixes this.
> Learn the framework. Verify the answer. Execute the work. Find the next role.
>
> Without the team, the meetings, the contracts, or the months lost.
>
> You start. We show you the source. That is the whole deal.
>
> (signature) Greentryst

## 15. Deferred and Post Cutover Work

The homepage is visually complete but a number of wirings are deferred until after the redesign branch is cut over to production. These are known gaps and are not bugs:

1. The footer newsletter form is presentational only. It is not wired to a mail provider.
2. The Tools, Intelligence, and Community destinations are placeholder links with Soon pills. Their pages will be built in Phase 2 of the redesign.
3. The About, Privacy, and Terms destinations in the footer are placeholder links. These pages will be written later.
4. The Contact destination currently points at `/feedback` as a stopgap. A proper contact page will be built when needed.
5. The pricing page itself (`/pricing`) does not yet exist as a standalone route. The homepage PricingSection component can be reused on that page.
6. The Letter draft in section 14 is waiting for a home. When `/about` or `/manifesto` is built, lift the draft from this document rather than rewriting it.

## 16. Change Control

If you are about to modify any file in `src/components/redesign/` or `src/app/redesign/components/page.tsx`, read this document first. If your change affects any of the following, you must update this document in the same commit:

1. Any locked copy in section 13
2. Any pricing number or feature in section 9
3. Any section order or component inventory in section 3
4. Any design token in section 12
5. Any reordering or removal of ActiveShowcase canvases in section 8

Small visual tweaks, spacing adjustments, color refinements within the locked token palette, and internal component refactors that do not alter the rendered output do not require an update to this document.

## 17. File Index

For fast navigation, here is every file that backs the homepage:

1. `src/app/redesign/components/page.tsx` — the composite showcase page
2. `src/app/redesign/redesign.css` — custom utility classes and animations
3. `src/components/redesign/index.ts` — barrel exports
4. `src/components/redesign/RedesignNav.tsx`
5. `src/components/redesign/Ticker.tsx`
6. `src/components/redesign/TryItDemo.tsx`
7. `src/components/redesign/ActiveShowcase.tsx`
8. `src/components/redesign/PricingSection.tsx`
9. `src/components/redesign/ClosingCTA.tsx`
10. `src/components/redesign/RedesignFooter.tsx`
11. `src/components/redesign/DarkSection.tsx` and `LightSection.tsx` for section wrappers
12. `src/components/redesign/DarkUICard.tsx` for the signature dark product cards
13. `src/components/redesign/SectionHeading.tsx`, `CategoryLabel.tsx`, `RedesignButton.tsx`, `StatBadge.tsx`, `Stat.tsx` for primitives
14. `src/lib/jobs.ts` for the live careers data feeding ActiveShowcase
15. `tailwind.config.ts` for the gt- token palette
16. `stitch-output/GREENTRYST_DESIGN_BIBLE.md` for the full design language specification

End of original locked specification.

---

## Addendum A. 2026-04-13 Update (locked)

Changes that landed after the original 2026-04-11 lock. All items below supersede the matching language in earlier sections.

### A.1 Hero sub-tagline (supersedes the sub-tagline in Section 5)

Locked: `Stop toggling between regulation and framework PDFs, Excel calculation sheets, and unverified ChatGPT responses. Greentryst is the one tab you keep open.`

The earlier "More accurate than ChatGPT. Cheaper than Bloomberg..." line is retired.

### A.2 Hero CTAs (locked wiring)

- Primary: `Start Free` → `/redesign/sign-up`
- Secondary (dark): `See How It Works` → `/redesign/courses`

### A.3 Hero cards (supersedes the cards listed in the original)

Four stacked glass cards on the right, cycling in sync with the shuffling headline. Each uses `rgba(24, 24, 27, 0.72)` charcoal glass. Content per card, locked:

- **Lesson Citation** — leadIn `Scope 3 Cat. 6: Business Travel` (used as heading body), body `Air, rail, and bus travel under operational control.`, source `GHG Protocol CVC, Ch. 7, Table 7.1`, icon `BookOpen`
- **SustainIQ Answer** — leadIn `What is the baseline period for VM0042?`, heading `10 years prior to the project start.`, source `VM0042 v2.2, Sec. 3.1.2, p.14`, icon `Sparkles`
- **Emission Factor** — heading `0.716 tCO₂/MWh` (mono, large), caption `Grid EF · India · Updated Mar 2024`, source `CEA CO₂ Baseline Database, 2024`, icon `Calculator`
- **Career Match** — heading `Deloitte · London`, caption `Senior ESG Analyst · 87% match`, source `Matches your Scope 3, TCFD, and PCAF work`, icon `Briefcase`

Card label and source lines render in leaf green. The earlier rotate-through-four list with `text-gt-leaf` / `text-gt-mint` accents is retired.

### A.4 Text shuffle animation (locked)

- Single headline frame, CSS grid stack (all taglines share `grid-area: 1/1`)
- Outgoing: `gt-rise-out`, 900ms, `cubic-bezier(0.4, 0, 0.2, 1)`, translateY `0 → -28px`, blur `0 → 14px`, opacity `1 → 0`
- Incoming: `gt-rise-in`, 1000ms with 300ms delay, same curve, translateY `36px → 0`, blur `14px → 0`, opacity `0 → 1`
- Cycle interval: 3500ms
- Keyframes defined in `src/app/redesign/redesign.css`

### A.5 Stats bar (new section, between Ticker and Provenance)

A single-line horizontal strip on a white surface with a bottom `gt-border-light` divider.

- Nine mono-number stats in JetBrains Mono, `text-[28px]` leaf-green, with `text-[10px]` mono uppercase labels in muted grey
- Thin `w-px h-10 bg-gt-border-light` vertical dividers between items
- Hover on a stat turns the label leaf green
- Locked values and labels (in order): `22+ Courses`, `470+ Lessons`, `530+ Source Docs`, `6 Pro Tools`, `120+ Regulations`, `416+ Jobs Listed`, `14+ Geographies`, `1K+ Practitioners`, `100% Sourced`

### A.6 Provenance cards (supersedes Section 7 card list)

Five cards on a `md:grid-cols-12 items-start` grid. Rows are not equal-height — each card sizes to its own content.

- Row 1: `SustainIQ Answer` (col-span 5) · `Lesson Citation` (col-span 7)
- Row 2: `Emission Factor` (col-span 4) · `Calculator Output` (col-span 3) · `Regulation Tracker` (col-span 5)

Card content, locked (text-variant for Lesson Citation and SustainIQ Answer; value-variant with mono heading for the other three):

1. **SustainIQ Answer** — `What is the baseline period for VM0042?` · heading `10 years prior to the project start date` · source `VM0042 v2.2, Sec. 3.1.2, p.14`
2. **Lesson Citation** — heading `Scope 3 Category 6: Business Travel` · body `Mandatory reporting including air, rail, and bus transport for business purposes under operational control.` · source `GHG Protocol CVC, Ch. 7, Table 7.1`
3. **Emission Factor** — leadIn `Grid Emission Factor · India (CEA 2024)` · heading `0.716 tCO₂/MWh` (mono) · source `CEA CO₂ Baseline Database, 2024`
4. **Calculator Output** — leadIn `Scope 3 Cat. 6 · 142,420 km short-haul flights` · heading `36.3 tCO₂e` (mono) · body `Reconciled against DEFRA 2024 · distance-based method` · source `DEFRA 2024, Table 4c · GHG Protocol CVC Ch. 7`
5. **Regulation Tracker** — leadIn `CSRD · Wave 2 filing deadline` · heading `Jan 1, 2026` (mono) · body `Applies to large EU companies with EU subsidiaries. First report covers FY2025 data.` · source `Directive 2022/2464 · Art. 5(2)`

The provenance section padding is `!pt-16 !pb-16` (not `xl`). `TryItDemo` sits beneath the cards with `mt-16 max-w-4xl mx-auto`.

Provenance headline is locked: `Sustainability work deserves better than fragmented PDFs, unverified AI, and software priced out of reach.` Supporting paragraph starts `Every answer on Greentryst traces back to its original source document, page number, and publication year...`

### A.7 Four Work Modes heading (supersedes Section 8 heading)

Locked: `Different work modes. One platform.` (was `Four work modes. One platform.`)

### A.8 ActiveShowcase: Careers + Ask data (locked)

- Careers stats now fed from `getJobsMeta()` server-side; page.tsx passes `jobsCount`, `geographiesCount`, `companiesCount` as props to `<ActiveShowcase>`.
- Ask mode middle stat: `Page / Every citation` (was `Page-level / Every citation`, which wrapped).
- Ask CTA: `Try SustainIQ` → `/redesign/ask`. Tools and Regulations CTAs → `/redesign/guides` until their own pages ship. Learn → `/redesign/courses`. Careers → `/redesign/jobs`.

### A.9 Pricing section intro (new, above PricingSection)

Centered copy above the plan toggle:

- Eyebrow `Pricing`
- Heading `Pick the tier that fits the work.`
- Sub: `Start free, upgrade when a specific work mode becomes core to your day.`
- Wrapper has `id="pricing"` for nav-link anchor jumps. Padding `pt-24 pb-24`.

### A.10 Footer (supersedes Section 10)

Full rebuild. Five-column premium layout:

- Columns: Brand (3) · Platform (2) · Courses (3, centered) · Resources (2) · Company (2)
- All column headers in leaf-green mono with a small leaf-green horizontal mark above each
- `Browse all courses →` link at the bottom of the Courses column, rendered as a leaf-green CTA with an arrow that nudges on hover
- Subtle radial glow at the top of the footer
- Wordmark rendered through the shared `Logo` component (`variant="dark" size="lg"`)
- Bottom bar in mono: copyright on the left, the provenance tagline on the right with a leaf-green dot separator
- `Services` added to the Platform column; `Fair Use` added to the Resources column; `Tools` and `Regulations` kept with `Soon` badges and fall back to `/redesign/guides`

### A.11 Nav wordmark + scrollbar alignment

- Nav wordmark rendered through the `Logo` component (`variant={isDark ? 'dark' : 'light'}`, `size="sm"`).
- `html { scrollbar-gutter: stable; }` added in `globals.css` so the fixed nav aligns with in-flow hero content when a scrollbar is present.
- Nav label update: `Tools` replaced with `Services`; `Pricing` points to `/redesign/pricing`; Learn / SustainIQ / Career / Pricing wired to existing redesign routes.
- Sign In / nav link color: white text under `tone="dark"` (matches the dark hero).

### A.12 Hero eyebrow, right-column stats, and small polish

- Eyebrow line on the hero: `THE SUSTAINABILITY OS` in leaf green, 0.2em tracking, above the shuffling headline.
- `No credit card required. 3 lessons free.` micro-line beneath the CTAs, `text-white/45`, `mt-4`.
- Section padding on the hero is `padding="sm"` (py-16), `min-h-[90vh]` removed.

### A.13 Locked specs summary

Every tagline, card body, source line, stat label, and CTA label mentioned above is locked. Edits require a commit to this document.

### A.14 Related documents

- `PRICING_LOCKED_SPEC.md` — standalone pricing page (the homepage pricing section scrolls to `/redesign/pricing#pricing`)
- `SERVICES_LOCKED_SPEC.md` — premium engagements
- `FAIR_USE_LOCKED_SPEC.md` — usage caps
- `JOBS_LOCKED_SPEC.md` — the matched job search the hero preview cards hint at

### Addendum change log

- 2026-04-13: Addendum A added to capture the homepage updates from the redesign session. Original spec body retained above for historical context.

End of addendum.
