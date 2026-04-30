# Greentryst Guides: Content Specification

Last updated: 2026-04-09

## Purpose

Guides are SEO-first evergreen reference pages that answer the exact questions sustainability practitioners type into Google. They sit between the homepage (discovery) and courses (structured learning), catching broad informational queries and funneling readers into the course system.

They are not blog posts. No dates, no "latest updates", no decay. They are living reference pages that get updated as frameworks evolve.

## URL Structure

Question-based, matching how practitioners actually search:

```
/guides/how-to-calculate-financed-emissions
/guides/what-is-double-materiality
/guides/how-does-eu-cbam-work
/guides/what-are-scope-3-emissions
/guides/how-to-set-science-based-targets
```

Rules:
- Always start with `how-to`, `what-is`, `what-are`, `how-does`, `why-do`, or `when-to`
- Use hyphens, lowercase, no abbreviations in the slug unless the abbreviation IS the search term (e.g., `cbam`, `sfdr`, `esg`)
- Keep slugs under 8 words
- The URL should read like a natural question someone would ask

## Site Placement

**Footer only.** Guides are not in the main navigation bar. Their primary purpose is SEO (catching search traffic), not site navigation.

Footer section:
```
Guides
- How to Calculate Financed Emissions
- What Is Double Materiality?
- How Does EU CBAM Work?
- [View all guides →]
```

The footer shows 4-6 featured guides plus a link to the full index page at `/guides`.

## Page Template

### Structure

```
1. Hero
   - Question as H1 (e.g., "How Do You Calculate Financed Emissions?")
   - One-line answer (the "definition sentence" for AI citation)
   - Estimated reading time

2. Body (1,500-2,000 words)
   - 4-6 sections with H2 headers
   - Inline "Go deeper" cards linking to specific course lessons
   - Interactive components where relevant (EquationBreakdown, CalculationExercise)
   - No fluff, no filler, every paragraph earns its place

3. Bottom section
   - "Go deeper" course cards (2-3 relevant courses with progress CTA)
   - FAQ section (3-5 questions, each 2-3 sentences)

4. JSON-LD
   - Article schema (type: "Guide")
   - FAQPage schema from the FAQ section
   - BreadcrumbList (Home > Guides > This Guide)
```

### Inline "Go Deeper" Cards

These appear naturally within the body text at transition points, not as interruptions. Visually distinct but not aggressive. Something like:

```
┌──────────────────────────────────────────────┐
│  📘 Go deeper                                │
│  Scope 3 GHG Calculations: The 15 Categories │
│  Learn the full calculation methodology →     │
└──────────────────────────────────────────────┘
```

Place 2-3 of these per guide, always at a point where the reader would naturally want more detail. They link to specific lesson pages, not course overview pages.

### Bottom Course Cards

After the FAQ, show 2-3 course cards with:
- Course title and icon
- One-line description
- "Start learning" or "Continue learning" CTA
- These are the courses most relevant to the guide topic

## Writing Style

Adapted from Prajjwal's personal writing style guide, tuned for company content that guides rather than lectures.

### Voice

Write as if you are sitting across from a practitioner who just asked you this question. You are not a textbook. You are a knowledgeable colleague who has been through this before and is walking them through it.

Second person ("you") as the default. First person plural ("we") when explaining something the industry does collectively. Never third person passive ("it is calculated by...").

Confident but not preachy. State things clearly. "PCAF uses six asset classes." Not "It should be noted that PCAF utilizes six distinct asset class categories."

### Opening (The Hook)

Never open with a definition. Never open with "In this guide, we will..." or "Understanding X is important because..."

Instead, open with one of:
- A practitioner pain point: "You have been asked to report your bank's financed emissions. The board wants a number by next quarter. Where do you even start?"
- A surprising fact: "For a typical commercial bank, financed emissions are 700 times larger than its own operational footprint. Category 15 is not a footnote. It is the whole story."
- A paradox or tension: "Double materiality sounds like it would be twice as hard. In practice, if you have done a proper GRI assessment, you are already halfway there."
- A direct answer to the question, then complicate it: "You calculate financed emissions by multiplying your ownership share by the borrower's emissions. Simple in theory. In practice, the data quality alone will keep you up at night."

The first two sentences should contain the core answer to the question (for AI citation), but delivered in a way that hooks rather than satisfies.

### Paragraph Structure

Short. One to three sentences per paragraph. White space is generous. Ideas breathe.

No walls of text. If a paragraph is longer than four lines on screen, break it.

### Transitions

Use rhetorical questions to pull the reader from one section to the next:
- "So you have your Scope 1 and 2 numbers. But what about the 85% of emissions sitting in your value chain?"
- "That covers the theory. But what does this actually look like in a real CBAM declaration?"
- "Simple enough for listed equities. But what happens when the borrower is a private company with no public emissions data?"

These keep the reader moving. They also create natural H2 break points.

### Argument Building

Layer, do not list. State the concept, give a concrete example (preferably with real numbers), then circle back with the practical implication.

Bad:
```
PCAF has six asset classes:
1. Listed equity and corporate bonds
2. Business loans and unlisted equity
3. Project finance
4. Commercial real estate
5. Mortgages
6. Motor vehicle loans
```

Good:
```
PCAF breaks the financial world into six asset classes, each with its own attribution formula.

For listed equity, it is straightforward: your ownership percentage times the company's emissions. If you own 2% of a steel company emitting 5 million tonnes, you claim 100,000 tonnes.

Mortgages are different. You cannot attribute a homeowner's emissions by ownership share because there is no "enterprise value" for a house. Instead, PCAF uses the property value as the denominator and the building's energy-related emissions as the numerator.

The point is that "financed emissions" is not one calculation. It is six different calculations wearing the same name.
```

### Technical Content

When explaining formulas, methods, or regulatory requirements:
- Lead with what the practitioner needs to DO, not the regulatory history
- Use real numbers in examples (not "Company A has X emissions")
- When a formula appears, explain what each variable means in plain language before showing the equation
- Reference source documents naturally: "The GHG Protocol's Scope 3 Standard defines 15 categories" (not "According to the GHG Protocol Corporate Value Chain Standard, published in 2011...")

### Endings

Short. A single thought that reframes what the reader just learned, or points them forward.

- "The hard part is not the formula. It is getting the data."
- "Double materiality is not twice the work. It is the same work, seen from both sides."
- "Start with what you can measure. Improve the data quality every cycle. That is what every institution that has been through this will tell you."

Never summarize. Never "In conclusion." Never a CTA like "Sign up for our course." The course cards below the ending handle that silently.

### What to Avoid

- Bullet-heavy listicle formats (use sparingly, only for genuinely parallel items)
- Emojis in body text (the Go Deeper card icon is fine)
- Academic or formal tone ("It is noteworthy that...", "Furthermore...", "In light of the aforementioned...")
- Preaching from authority. Guide from experience.
- Generic introductions ("In today's rapidly evolving sustainability landscape...")
- Long unbroken paragraphs
- Horizontal rules or em dashes
- Trailing summaries
- CTAs in the body text ("Sign up", "Enroll now")
- Jargon without explanation. If a term is not obvious, explain it inline or link to the glossary

### Tone Calibration

The personal writing style guide leans philosophical and exploratory. For Greentryst guides, shift toward:

| Personal style | Greentryst guides |
|----------------|-------------------|
| Thinking aloud, uncertain | Thinking alongside, clear but open |
| "I still do not know" | "This is where it gets complicated" |
| Personal anecdotes | Practitioner scenarios |
| Philosophical conclusions | Practical next steps |
| Stream of consciousness | Structured but conversational |
| First person singular | Second person ("you") + first person plural ("we") |

The core DNA stays: short paragraphs, rhetorical questions, layered arguments, punchy endings, no walls of text, no preaching. The container changes from personal reflection to professional guidance.

## Priority Guides (First 10)

Ordered by estimated search demand and cross-course content depth:

### Tier 1 (Strongest cross-course content, highest search demand)

1. **How Do You Calculate Scope 3 Emissions?**
   `/guides/how-to-calculate-scope-3-emissions`
   Courses: ghg-scope-3, sbti, ifrs-s2, eu-sfdr
   Interactive: EquationBreakdown for attribution formula

2. **What Is Double Materiality?**
   `/guides/what-is-double-materiality`
   Courses: double-materiality, esg-reporting, ifrs-s2
   Comparison: GRI (impact) vs ISSB (financial) vs ESRS (double)

3. **How Do You Calculate Financed Emissions?**
   `/guides/how-to-calculate-financed-emissions`
   Courses: financed-emissions, ghg-scope-3, ifrs-s2, sbti
   Interactive: EquationBreakdown for PCAF formula, CalculationExercise

4. **How Does EU CBAM Work?**
   `/guides/how-does-eu-cbam-work`
   Courses: eu-cbam, ghg-scope-1-2
   Timeline: transition period, definitive period deadlines

5. **What Are Science-Based Targets?**
   `/guides/what-are-science-based-targets`
   Courses: sbti, ghg-scope-3, financed-emissions
   Practical: the validation process step by step

### Tier 2 (Strong content, moderate search demand)

6. **How Does Article 6 of the Paris Agreement Work?**
   `/guides/how-does-article-6-work`
   Courses: article-6, vcm-101, climate-science-101
   Comparison: Article 6.2 vs 6.4 vs voluntary markets

7. **What Is the Difference Between SFDR Article 8 and Article 9?**
   `/guides/what-is-the-difference-between-sfdr-article-8-and-article-9`
   Courses: eu-sfdr, eu-taxonomy
   Decision guide: which classification applies

8. **How Do You Build a Corporate GHG Inventory?**
   `/guides/how-to-build-a-corporate-ghg-inventory`
   Courses: ghg-scope-1-2, ghg-scope-3
   Step-by-step: from organizational boundary to final report

9. **What Is the EU Taxonomy?**
   `/guides/what-is-the-eu-taxonomy`
   Courses: eu-taxonomy, eu-sfdr, double-materiality
   Decision tree: eligibility and alignment screening

10. **How Do Voluntary Carbon Markets Work?**
    `/guides/how-do-voluntary-carbon-markets-work`
    Courses: vcm-101, article-6, vm0042, vm0044
    Landscape: registries, credit types, integrity frameworks

## Technical Implementation

### Routing
```
src/app/guides/
  page.tsx           # Index page listing all guides
  [slug]/
    page.tsx         # Individual guide page
```

### Content Storage
Guides content as MDX files in `src/content/guides/`:
```
src/content/guides/
  how-to-calculate-scope-3-emissions.mdx
  what-is-double-materiality.mdx
  ...
```

Each guide MDX file has frontmatter:
```yaml
---
title: "How Do You Calculate Scope 3 Emissions?"
slug: how-to-calculate-scope-3-emissions
description: "A practitioner's guide to calculating Scope 3 value chain emissions using the GHG Protocol framework, covering all 15 categories with worked examples."
courses:
  - ghg-scope-3
  - sbti
  - ifrs-s2
  - eu-sfdr
readingTime: 12
lastUpdated: 2026-04-15
---
```

### Structured Data (JSON-LD)
Each guide page includes:
- `Article` schema (type guide, with author, dateModified)
- `FAQPage` schema from the FAQ section
- `BreadcrumbList` (Home > Guides > Guide Title)

### Footer Integration
Add a "Guides" section to the existing Footer component with 4-6 featured guides and a "View all" link.

### Components Needed
- `GuideCard` - inline "Go deeper" card linking to a lesson
- `GuideCourseCards` - bottom section with 2-3 course cards
- Reuse existing: EquationBreakdown, CalculationExercise, HighlightBox, ResponsiveTable

## Metrics

Track per guide:
- Organic impressions and clicks (Search Console)
- Average position for the target question query
- Click-through to course lessons (from Go Deeper cards)
- AI Overview citation appearances
- Featured snippet wins (especially for FAQ sections)
