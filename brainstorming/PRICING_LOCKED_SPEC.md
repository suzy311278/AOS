# Greentryst Pricing Page, Locked Specification

Status: LOCKED on 2026-04-13
Branch: `redesign` (local only, never pushed)
Live at: `/redesign/pricing`
Target production route: `/pricing` once the redesign branch is cut over

Single source of truth for the pricing page. Premium custom engagements moved out to a dedicated Services page (see `SERVICES_LOCKED_SPEC.md`); usage caps moved out to a dedicated Fair Use page (see `FAIR_USE_LOCKED_SPEC.md`). Everything else lives here.

Any change to a section below must land in the same commit as an update to this document.

## 1. Core Vision

Greentryst is a product company first. The pricing page exists to convert a practitioner evaluating the product, not to upsell services. Tiers, comparison, tools, and trust. Services are a separate surface for the buyer who explicitly wants done-for-you work.

## 2. Branch and Safety Rules

All pricing-page work happens on the `redesign` branch (local-only). Verify `git branch --show-current` returns `redesign` before editing.

## 3. Page Structure, In Order

1. Nav (RedesignNav, tone dark)
2. Hero band (charcoal, eyebrow + heading + provenance line, centered)
3. Tier cards (PricingSection with Individuals/Teams + Monthly/Annual toggles)
4. Comparison matrix (full feature × tier table)
5. Tools à la carte (6 tools at $15/mo each)
6. Provenance callout (charcoal band)
7. Who this is for (four audience cards)
8. FAQ (eight questions)
9. Security & compliance (six tiles on charcoal)
10. Closing CTA
11. Footer

Sections 5 (Usage) and 6 (Services) from an earlier iteration were removed and moved to their own pages.

## 4. Route and Entry Points

- Route file: `src/app/redesign/pricing/page.tsx`
- No client components of its own; `PricingSection` is imported from the redesign library

## 5. Hero

- `<DarkSection dotGrid glow padding="sm">` wrapping a centered max-w-3xl block
- Eyebrow `PRICING` in leaf-green mono, 0.2em tracking
- Headline, locked: `Pick the tier that fits the work.` — 44–52px extrabold, leading 1.1
- Subtext, locked: `Fixed pricing. No sales calls required. Cancel any time. Every tier, including Free, ships with full source citations on every answer and every calculation.`
- No CTA in the hero. The plan cards are the action.

## 6. Tier Cards

- Component: `PricingSection` from `src/components/redesign/PricingSection.tsx`
- Wrapper: `<LightSection variant="pale" padding="lg" className="!pt-16 !pb-20">`
- Internal toggles: **Individuals / Teams** (primary), **Monthly / Annual** (secondary)
- Tiers, locked:
  - **Free** — `$0`, 1 course/month, audio lessons + quizzes included, 5 SustainIQ queries/month, browse board + regulations, trial tools, community support
  - **Individual** — `$12/mo` or `$99/yr`. 5 SustainIQ/day, 1 tool included, extra tools $15/mo each, reports in all formats with full audit trails and sources
  - **Pro** — `$29/mo` or `$239/yr`, 7-day trial (CC required). 25 SustainIQ/day, 3 tools included, unlimited extra tools at $15/mo each, reports in all formats with full audit trails and sources. Flagged `popular` on Individuals side.
  - **Team** — `$99/mo` or `$799/yr`. Up to 10 users. Tagline: `For small sustainability teams and consultants.` All tools for every user, unlimited SustainIQ (fair use), all report formats with full audit trails and sources, shared workspace, team profile for hiring, SSO/SAML, custom onboarding. Consultancy: free diagnostics, paid engagements.
  - **Enterprise** — `$400/mo` or `$3,840/yr`. Up to 50 users, 50+ custom. Tagline: `For mid-size sustainability teams.` Everything in Team. Flagged `popular` on Teams side.

Source of truth: `TIERS` array in `src/components/redesign/PricingSection.tsx`. Pricing changes go through this spec.

## 7. Comparison Matrix

- `<LightSection variant="white" padding="lg" className="!pt-16 !pb-20">`
- Eyebrow `What's included` + heading `Full comparison across every tier.` + short blurb
- Table: min-width 920px, overflow-x-auto on smaller screens
- Column headers: `Feature` (pale bg), then `Free / Individual / Pro / Team / Enterprise` in leaf-green mono
- Seven feature groups, each introduced by a pale-bg row with a leaf-green mono group label + icon:
  1. **Learn** (BookOpen): course library, audio & quizzes, certificates, team enrollment dashboard
  2. **SustainIQ** (Sparkles): query volume, page-level citations, saved workspaces
  3. **Tools** (Calculator): trial access, included tools, swap, à la carte extras
  4. **Regulations** (Bell): browse, applicability engine, deadline tracking
  5. **Career** (Briefcase): browse jobs, skill-gap analysis, resume + priority notifications, team profile for hiring
  6. **Reports & exports** (FileCheck): PDF export, all formats, full audit trails and sources
  7. **Admin & support** (UserCog): SSO/SAML, admin dashboard, custom onboarding, support channel
- Cell renderers: a green circled Check, a muted Minus, or a mono text value like `5/day` or `$15/mo ea`

## 8. Tools À la Carte

- `<LightSection variant="pale" padding="lg" className="!pt-16 !pb-20">`
- Eyebrow `Tools, À la carte` + heading `Pay only for the tools you actually use.` + blurb about tier inclusions
- Six tools, each a white card with hover lift + deeper shadow + leaf-green border tint:
  1. GHG Calculator — Scope 1, 2, and 3 emissions
  2. Report Drafter — BRSR / CSRD / TCFD
  3. IFRS Gap Assessment — IFRS S1/S2 gap matrix
  4. BRSR Screener — BRSR Core Section K
  5. CBAM Preparer — quarterly CBAM reports
  6. Scope 3 Estimator — spend-based and hybrid methods
- Each card: icon tile (inverts on hover), mono `$15/mo` price top-right, name, one-line description

## 9. Provenance Callout

- `<DarkSection dotGrid padding="md">` centered
- Leaf-green ShieldCheck tile, eyebrow `The Provenance Promise`
- Heading, locked: `Every tier, including Free, ships with full source citations on every answer and every calculation.`
- Supporting, locked: `Provenance is not a feature we hold back for paid tiers. It is how the platform works.`

## 10. Who This Is For

- `<LightSection variant="pale" padding="lg" className="!pt-20 !pb-20">`
- Four cards in a four-column grid on desktop, hover-lift + border-green
- Segments, locked recommendations:
  1. **Individual practitioner** → `Individual · $12 / month`
  2. **Independent consultant** → `Pro · $29 / month`
  3. **In-house sustainability team** → `Team · $99 / month`
  4. **Enterprise** → `Enterprise · $400 / month`

## 11. FAQ

- `<LightSection variant="white" padding="lg" className="!pt-20 !pb-24">`
- Centered eyebrow `Questions we get asked` + heading `Answers, before you ask.`
- Eight `<details>` rows with a + that rotates to × on open, green on-open state
- Questions, locked, in order: plan switching, cancel + data retention, data residency, student/nonprofit discounts, how we track new regulations, why SustainIQ is capped for individuals, free trial terms, bring-your-own-methodology
- Answers are locked in `FAQ` constant; edits require a spec update

## 12. Security & Compliance

- Charcoal band with dot grid hero pattern reused
- Eyebrow `Security & compliance` + heading `Built to clear audit, procurement, and legal on day one.`
- Six tiles: `SOC 2 Type II`, `GDPR compliant`, `ISO 27001 aligned`, `SSO / SAML`, `Encrypted at rest and in transit`, `Full audit logs`
- Each tile: leaf-green icon that inverts on hover, label in white, subline in mono white-55

## 13. Closing CTA + Footer

Reuses `ClosingCTA` and `RedesignFooter` from the shared component library. Standard across the redesign.

## 14. Copy, Locked

All headlines, subtext, and CTA labels must match the strings above. Tier names, prices, and tagline strings are especially load-bearing.

## 15. Files Under Lock

- `src/app/redesign/pricing/page.tsx`
- `src/components/redesign/PricingSection.tsx`
- `src/components/redesign/ClosingCTA.tsx` (shared)

Changes to any of the above that alter pricing, features, tier names, or copy require a spec edit in the same commit.

## 16. Related Documents

- `SERVICES_LOCKED_SPEC.md` — premium engagements previously embedded here
- `FAIR_USE_LOCKED_SPEC.md` — usage caps previously embedded here
- `JOBS_MATCHING_BACKEND_PLAN.md` — resume + match backend that the Individual tier depends on

## 17. Change Log

- 2026-04-13: First locked spec for the standalone `/redesign/pricing` page. Supersedes the pricing section that used to live on the homepage.
