# Greentryst Services Page, Locked Specification

Status: LOCKED on 2026-04-13
Branch: `redesign` (local only, never pushed)
Live at: `/redesign/services`
Target production route: `/services` once the redesign branch is cut over

Single source of truth for the Services page. Greentryst is a product company; this page exists for buyers who explicitly want done-for-you engagements. Climate Risk Assessment is the flagship.

## 1. Core Vision

- Product-first framing. Services are premium custom engagements, not the main offering.
- Every deliverable is owned by the client, every claim sourced, every number auditable.
- Fixed scope, fixed fee, no sales cycle.
- Climate Risk Assessment is positioned as globally leading in spatial resolution: 900 m physical risk, 100 m flood risk, transition risk downscaled to country NDCs, laws, and real sector emissions.

## 2. Branch and Safety Rules

All services-page work happens on the `redesign` branch (local-only). Verify `git branch --show-current` returns `redesign` before editing.

## 3. Page Structure, In Order

1. Nav (RedesignNav, tone dark)
2. Hero (charcoal, centered, with CTAs)
3. Category index strip (nine jump-link pills, dark)
4. Twelve engagement cards (`engagements` section)
5. How we work (four-step process on charcoal)
6. Outcomes strip (six mono stats)
7. Services FAQ (eight questions)
8. Closing CTA
9. Footer

## 4. Route and Entry Points

- Route file: `src/app/redesign/services/page.tsx`
- No route segment for individual engagements; everything is anchored by category on this page

## 5. Hero

- `<DarkSection dotGrid glow padding="sm">`
- Eyebrow `Services` in leaf-green mono
- Headline, locked: `Premium custom engagements, delivered on the same platform you use every day.` (with `<br/>` after the comma on desktop)
- Subtext, locked: `Greentryst is a product company first. These services exist for the moments when software alone is not enough. Fixed scope, fixed fee, every claim sourced, every number auditable. Delivered by our sustainability analysts inside your Greentryst workspace.`
- Two CTAs:
  - Primary: **Book the free diagnostic** → `/redesign/feedback`
  - Secondary (dark): **Browse all engagements** → `#engagements`

## 6. Category Index Strip

- Dark band, thin bottom padding, sits directly under the hero
- Nine pills in a wrap flex row, each with a leaf-green icon + mono uppercase label
- Categories, in order: Climate Risk · Diagnostic · Assessment · Training · Ratings · Build · Draft · Retainer · Enterprise
- Each pill links to `#cat-{lowercased-with-dashes}`; each engagement card has a matching `id` with `scroll-mt-24`

## 7. Twelve Engagement Cards

- `<LightSection variant="pale" padding="lg" className="!pt-20 !pb-24" id="engagements">`
- Eyebrow `Engagements` + heading `Twelve fixed-scope engagements, from a free diagnostic to full enterprise implementations.` + short blurb
- Grid: `grid-cols-1 md:grid-cols-2 gap-5`. The flagship card spans both columns (`md:col-span-2`)
- Card shell:
  - White cards: white background, `gt-border-light` border, hover lift + green-tinted shadow
  - Dark cards (`dark: true`): `bg-gt-text-dark`, white-10 border, hover shows leaf-green/40 border + heavier shadow
  - Flagship gets a persistent 2px leaf-green top rule; non-flagship cards show a vertical leaf-green rule on hover (scale-y from 0 → 1)
- Card anatomy: category chip + icon tile + duration (top), title, blurb, bullet list with Checks, price + "Enquire" link (bottom-border), italic outcome line
- Flagship card uses a 2-column bullet grid at md+ since it has more detail

### 7.1 Card inventory (order locked)

1. **Climate Risk Assessment** — **Flagship · dark card** · `Globe` icon · 6 to 10 weeks · From $6,500. The most detailed climate risk assessment available anywhere in the world. Physical risks at 900 m, flood risks at 100 m, transition risks downscaled to country NDCs + laws + real emissions. IFRS S2-aligned report, year-on-year improvement recommendations. Bullets: 8 items covering modelling resolutions, scenario analysis across RCP/SSP pathways, board-ready outputs.
2. **Sustainability Readiness Diagnostic** — `HelpCircle` · 60 min · Free for all tiers. One-hour scoping session that produces a gap snapshot and 6-week plan.
3. **Double Materiality Assessment** — `Scale` · 5 to 8 weeks · From $3,600. Full CSRD-compliant exercise: stakeholder mapping, impact + financial materiality, combined matrix.
4. **Framework Gap Assessment & Training** — **dark card** · `ClipboardCheck` · 2 weeks (checklist + training) · `Free checklists · Training from $750`. DIY-first. Free checklists for CSRD, BRSR, IFRS S2, TCFD, GRI, SBTi, plus optional 3-hour live walk-through.
5. **ESG Ratings Submission Support** — `Award` · 4 to 8 weeks per cycle · From $2,400 per rating. Covers CDP, MSCI, Sustainalytics, S&P CSA, ISS ESG, EcoVadis, Moody's. Year-on-year score-improvement plan.
6. **Scope 3 Inventory Build** — **dark card** · `Calculator` · 4 to 6 weeks · From $4,400. Audit-ready Scope 3 inventory across all fifteen categories.
7. **Disclosure Drafting Engagement** — `PenTool` · 3 to 5 weeks · From $2,800. BRSR / CSRD / TCFD drafting with sourced citations.
8. **Personalised Training Sessions** — `GraduationCap` · 2 to 4 hours per session · From $300 per session. 1:1 or small-group live training, framework-specific.
9. **Team Onboarding & Custom Training** — `Users` · 1 to 2 weeks · From $1,200. Role-based training on Greentryst workflows + frameworks.
10. **Quarterly Compliance Retainer** — `ShieldCheck` · Ongoing · From $1,500 / quarter. Named analyst, quarterly reviews, priority during filing season.
11. **Custom Tool or Template Build** — `Layers` · 3 to 6 weeks · From $2,400. Configure a Greentryst tool or build a custom report template to the client's methodology.
12. **Enterprise Implementation** — **dark card** · `Building2` · 8 to 16 weeks · Custom. Full-service implementation across BUs/geographies.

Pricing in this section is locked. Changes require a spec edit. Order is locked: Climate Risk first (flagship), Diagnostic second as the free on-ramp.

### 7.2 "Not sure" panel (after the grid)

- Pale-bg card with leaf-green CTA
- Heading: `Not sure which engagement you need?`
- Copy: `Start with a free sixty-minute Sustainability Readiness Diagnostic. You walk out with a written gap snapshot and a recommended plan. No obligation.`
- CTA: **Book the diagnostic** → `/redesign/feedback`

## 8. How We Work (4-Step Process)

- Charcoal band, bordered top and bottom with white-5
- Eyebrow `How we work` + heading `Four steps, from first call to handoff.` + subtext about no sales cycle
- Four dark tiles in a `md:grid-cols-2 lg:grid-cols-4` grid, each with:
  - Mono step number (01–04) top-left
  - Leaf-green icon tile top-right (inverts on hover)
  - Hover reveals a 2px leaf-green left rule
- Steps, locked:
  1. **Scope call** (MessagesSquare) — Sixty-minute working session; statement of work written on the spot
  2. **Fixed-fee contract** (Handshake) — One-page contract with scope, timeline, price, and acceptance criteria; no hourly meters
  3. **Execution inside Greentryst** (Timer) — Work happens inside the client's workspace; every number traceable
  4. **Handoff + year-one support** (PackageCheck) — Deliverable owned by client; thirty days of post-handoff support

## 9. Outcomes Strip

- `<LightSection variant="white" padding="lg" className="!pt-20 !pb-20">`
- Eyebrow `What you get` + heading `Defensible work, at global-leading resolution.`
- Six mono-stat cards in `md:grid-cols-3 lg:grid-cols-6`: `100% / Claims sourced`, `900 m / Physical risk resolution`, `100 m / Flood risk resolution`, `7 / ESG ratings covered`, `30d / Post-handoff support`, `Fixed / Fee structure`

## 10. Services FAQ

- `<LightSection variant="pale" padding="lg" className="!pt-16 !pb-24">`
- Centered eyebrow `Questions we get asked` + heading `The practical stuff, up front.`
- Eight questions, in order, locked in `SERVICES_FAQ`: IP ownership, data residency + confidentiality, subcontracting, revisions, payment terms, subscription requirement, Climate Risk pilots, custom tool pricing

## 11. Closing CTA + Footer

Reuses `ClosingCTA` + `RedesignFooter`.

## 12. Copy, Locked

Every headline, subtext, card blurb, bullet, and outcome line on this page is locked. Paraphrasing is not permitted without a spec edit. The Climate Risk copy in particular must preserve the three resolution claims (900 m physical, 100 m flood, downscaled transition risk).

## 13. Files Under Lock

- `src/app/redesign/services/page.tsx`
- Nav/footer: the `Services` link in both `RedesignNav.tsx` and `RedesignFooter.tsx` must keep `/redesign/services` as the target

## 14. Related Documents

- `PRICING_LOCKED_SPEC.md` — sister page for product pricing
- `FAIR_USE_LOCKED_SPEC.md` — usage caps, also split off pricing
- `JOBS_MATCHING_BACKEND_PLAN.md` — backend plan for the matching feature some Individual/Team buyers will want

## 15. Change Log

- 2026-04-13: First locked spec (12 engagements).
- 2026-04-13 (late): Addendum A. Engagement catalogue expanded from 12 to 19,
  free-tier visual highlight for the Diagnostic, new section heading, updated
  payment / revision / subcontract / IP copy, linked enquiry surface and API
  routes. See Addendum A below.

---

## Addendum A. 2026-04-13 Late Update (locked)

Landed after the initial 12-engagement lock. Items below supersede matching
language in earlier sections.

### A.1 Hero copy (supersedes Section 5)

- **Eyebrow removed.** The "SERVICES" pill is gone; the section leads with the
  headline.
- **Headline, unchanged**: `Premium custom engagements, delivered on the same
  platform you use every day.`
- **Subtext, locked, rewritten**: `Most sustainability work is repeatable, and
  that's what our tools are for. Services are for the harder questions. The
  ones where software isn't enough, where the right answer turns on business
  judgement and regulatory nuance, and where you want an expert on the call
  who has walked this path many times before.`
- **CTA wiring**: `Book the free diagnostic` now links to
  `/redesign/services/enquire?engagement=diagnostic` (was `/redesign/feedback`).
- **Hero bottom padding**: reduced to `!pb-0` on the DarkSection and `pb-0` on
  the inner column so the capsule band sits closer to the CTAs.

### A.2 Category index strip

- Section now starts with `pt-8` (was `pt-1`) giving a measured gap below CTAs
- Seven new category pills added to reflect the expanded catalogue: `Strategy`,
  `Targets`, `Nature`, `Value Chain`, `Carbon Project`, `Leadership`, `Finance`,
  `Transactions`. Full list (17): Climate Risk, Diagnostic, Strategy, Targets,
  Assessment, Nature, Training, Ratings, Build, Value Chain, Carbon Project,
  Draft, Leadership, Finance, Retainer, Transactions, Enterprise.
- Icons added to the Lucide set on this page: `Route, Target, Coins, Leaf,
  Truck, Search, Presentation, Microscope`.

### A.3 Engagements section heading (supersedes Section 7 intro)

- **Eyebrow**: `Engagements`
- **Heading, locked**: `We don't sell hours. We sell outcomes.`
- **Blurb, locked**: `Every engagement below is a fixed-scope, fixed-fee piece
  of work with a defensible deliverable at the end. No timesheets. No scope
  creep. No surprise invoices.`

### A.4 Service card variants (supersedes Section 7 card shell)

Three visual treatments, in priority:

1. **Flagship** (`flagship: true`, `dark: true`) — full-width `md:col-span-2`,
   persistent 2px leaf-green top rule, charcoal background, `Flagship` pill in
   the header. Reserved for **Climate Risk Assessment**.
2. **Free highlight** (`freeHighlight: true`) — full-width `md:col-span-2`,
   persistent 2px leaf-green top rule, gradient leaf-green/pale-white wash,
   2px leaf-green/40 border that brightens on hover, ambient leaf glow at
   top-right, `FREE · START HERE` pill in the header, heading sized at 26-30px
   like a flagship. Reserved for **Sustainability Readiness Diagnostic**.
3. **Dark** (`dark: true`) — charcoal card, white-10 border, hover-shadow
   heavier. Used for engagements that deserve extra prominence without being
   flagship: Net Zero Transition Plan, TNFD Biodiversity Assessment, Framework
   Gap Assessment & Training, Scope 3 Inventory Build, Enterprise Implementation.
4. **Default** (no flag) — white card, light border, hover lift. All other
   engagements.

### A.5 Engagement catalogue (supersedes Section 7.1)

**19 engagements** in this order, with locked metadata. Flagship and free
treatments are called out; dark treatment marked `(dark)`.

1. **Climate Risk Assessment** — *Flagship, dark* · `Globe` · Climate Risk · 6–10 weeks · From $6,500
2. **Sustainability Readiness Diagnostic** — *Free highlight* · `HelpCircle` · Diagnostic · 60 min · Free for all tiers
3. **Net Zero Transition Plan** — *dark* · `Route` · Strategy · 10–14 weeks · From $18,000
4. **SBTi Target Setting & Validation** · `Target` · Targets · 8–12 weeks · From $8,500
5. **Double Materiality Assessment** · `Scale` · Assessment · 5–8 weeks · From $3,600
6. **TNFD Biodiversity Assessment** — *dark* · `Leaf` · Nature · 6–10 weeks · From $8,000
7. **Framework Gap Assessment & Training** — *dark* · `ClipboardCheck` · Training · 2 weeks (checklist + training) · Free checklists · Training from $750
8. **ESG Ratings Submission Support** · `Award` · Ratings · 4–8 weeks per cycle · From $2,400 per rating
9. **Scope 3 Inventory Build** — *dark* · `Calculator` · Build · 4–6 weeks · From $4,400
10. **Supplier Decarbonization Strategy** · `Truck` · Value Chain · 6–10 weeks · From $12,000
11. **Verra Methodology Feasibility Assessment** · `Microscope` · Carbon Project · 3–5 weeks · From $6,000
12. **Disclosure Drafting Engagement** · `PenTool` · Draft · 3–5 weeks · From $2,800
13. **Personalised Training Sessions** · `GraduationCap` · Training · 2–4 hours per session · From $300 per session
14. **Board & C-Suite Briefings** · `Presentation` · Leadership · 90 min per session · From $2,400 per session
15. **Internal Carbon Pricing Design** · `Coins` · Finance · 4–6 weeks · From $6,500
16. **Quarterly Compliance Retainer** · `ShieldCheck` · Retainer · Ongoing · From $1,500 / quarter
17. **Custom Tool or Template Build** · `Layers` · Tooling · 3–6 weeks · From $2,400
18. **M&A Sustainability Due Diligence** · `Search` · Transactions · 2–4 weeks per target · From $12,000 per target
19. **Enterprise Implementation** — *dark* · `Building2` · Enterprise · 8–16 weeks · Custom

`Team Onboarding & Custom Training` is **retired** and removed from the
catalogue, the category list, the enquiry dropdown, and the API route's
ENGAGEMENTS map.

### A.6 "How we work" section (supersedes Section 8)

- **Section subtext, locked**: `No sales cycle, no consultant theatre. A
  working session, a clear scope of work with engagement fees and timelines
  agreed up front, execution inside your workspace, and a clean handoff.`
- **Step 02 retitled** `Clear scope of work` (was `Fixed-fee contract`), with
  locked blurb: `You receive a written scope of work with the deliverable, the
  engagement fee, and the engagement timeline agreed up front. No hourly
  meters, no surprise invoices, no change orders without your sign-off.`

### A.7 FAQ updates (supersedes Section 10 answers)

Five answers rewritten; questions unchanged.

- **Who owns the deliverables?** `You do, the moment the final invoice is
  paid. The report, the workbook, the checklist, the dashboard: every
  deliverable is yours to keep, edit, publish, and reuse. Greentryst retains
  no rights over your data or your outputs.` *(Removed "the trained model" to
  match current deliverable scope.)*
- **Can you subcontract, or is this your own team?** `All engagements are
  delivered by our in-house team of sustainability experts, each with deep
  domain experience across climate risk, disclosure, carbon markets, and
  regulation.`
- **What is your revision policy?** `Unlimited. We keep working until the
  deliverable meets the acceptance criteria you signed off on at kickoff,
  with no clock and no revision limit. If you want something that sits
  outside the original scope, we write it up as a short change order so the
  work stays clear on both sides. The point is simple: you should feel proud
  of what we hand over, not rushed to approve it.`
- **How are engagements paid?** `Fixed-fee engagements are split three ways:
  20 percent at kickoff, 30 percent at the half-way milestone, and the
  remaining 50 percent on delivery. Retainers are invoiced quarterly,
  payable net fifteen. Enterprise engagements follow your procurement
  schedule.`
- **Can we run an engagement without a Greentryst subscription?**
  `Technically yes, but you lose half the value. The deliverables are built
  inside Greentryst and live there with full audit trails, so your team can
  maintain the output after handoff. Any engagement above $5,000 includes a
  complimentary Team tier subscription for the full duration of the
  engagement, so there is no reason to run it without one. We strongly
  recommend the Team or Enterprise tier for any significant engagement.`

### A.8 Enquiry surface (new)

- New page: `/redesign/services/enquire` with a dedicated lead form (name,
  email, company, role, engagement, timeline, budget, message). Email + name
  auto-populate from Clerk when signed in, fully editable. Engagement
  pre-selects from `?engagement=<id>` query parameter.
- New API route: `POST /api/enquiry` stores into `service_enquiries` (new
  Turso table) and fires two Resend emails:
  - **Lead notification** to `prajjwalkaushik08@gmail.com` from
    `services@greentryst.com` with subject `[Greentryst Lead] <Engagement> —
    <Company>`, formatted for fast triage
  - **Auto-response to prospect** from `services@greentryst.com` with subject
    `Your Greentryst enquiry — <Engagement>`, professional tone ("a member of
    our team will respond inside two business days")
- All "Enquire" CTAs on the Services page (hero, per-card, bottom panel) now
  link to the enquire page with the right `engagement` pre-selected.
- Sender addresses are locked: feedback uses `feedback@greentryst.com`,
  services uses `services@greentryst.com`. Both covered by the verified
  `greentryst.com` domain in Resend.

### A.9 Files under lock (additions)

- `src/app/redesign/services/enquire/page.tsx` — the enquiry form
- `src/app/api/enquiry/route.ts` — the enquiry API route
- `src/lib/schema.ts` — the `service_enquiries` table definition (do not
  alter column names without a migration)

### Addendum change log

- 2026-04-13 (late): Addendum A captures the 19-engagement catalogue, free-tier
  visual highlight, new hero + engagements copy, updated payment/revision/IP
  FAQ answers, and the new enquiry surface (page, API, table, Resend wiring).
