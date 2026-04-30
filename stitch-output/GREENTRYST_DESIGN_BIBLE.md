# Greentryst Design Bible

**Purpose:** Complete design specification and Stitch prompting guide for replicating Greentryst's visual language across all pages. This document captures the exact patterns, CSS values, component recipes, and prompting strategies that produced our approved designs.

**Status:** Approved design direction (April 2026). Use this as the source of truth for all new pages and sections.

## 1. Brand Identity

**Name:** Greentryst
**Positioning:** The professional operating system for sustainability practitioners
**Analogies:** Bloomberg for finance, Westlaw for law, GitHub for software
**Tone:** Authoritative, trustworthy, premium but accessible. Never playful, never academic, never EdTech.
**One rule:** If it looks like a Coursera page, it's wrong. If it looks like a Bloomberg terminal page, it's closer.

## 2. Color System

**Source:** Greentryst brand palette, unified with LinkedIn carousel presence. The palette is forest-green, not teal, which ties the web experience to the existing social brand.

**Design rhythm:** The site is predominantly LIGHT (about 60%) with dark sections used strategically for impact. The hero is dark, then alternating light/dark sections through the page, ending with a dark footer. Do NOT default to dark backgrounds.

### Primary Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `deep` | `#0B3D2E` | Dark product UI cards, deep accents |
| `dark` | `#1B4332` | Secondary dark elements, hover states, dark alt |
| `medium` | `#2D6A4F` | Primary CTAs, active states, key headings accent |
| `forest` | `#40916C` | Secondary buttons, mid-tone accents |
| `leaf` | `#52B788` | "LIVE" badges, success states, progress bars |
| `mint` | `#95D5B2` | Light accents on dark backgrounds, highlighted values |
| `pale` | `#D8F3DC` | Primary light section background |
| `white` | `#FFFFFF` | Cards on light sections, content containers |
| `text_dark` | `#081C15` | Primary body text on light bg, hero dark bg |
| `text_light` | `#F0FFF4` | Text on dark backgrounds, alt light bg |

### Section Backgrounds

| Role | Hex | When to use |
|------|-----|-------------|
| Light primary | `#D8F3DC` (pale) | Default section background, trust identity, pricing |
| Light alt | `#F0FFF4` (text_light) | Alternating sections for rhythm, product showcases |
| White | `#FFFFFF` | Cards, pricing cards, standalone callouts |
| Dark hero | `#081C15` (text_dark) | Hero, footer, dramatic sections only |
| Dark card | `#0B3D2E` (deep) | Product UI cards as accents on ANY background |
| Dark alt | `#1B4332` (dark) | Layered dark elements, glass cards |

### Text Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `text-primary` | `#081C15` | Body text on light backgrounds, headings |
| `text-secondary` | `#1B4332` | Sub-headings, emphasized body text on light |
| `text-muted` | `#40916C` at 70-80% opacity | Secondary descriptions, metadata on light |
| `text-on-dark` | `#F0FFF4` | Body text on dark backgrounds and dark cards |
| `text-on-dark-muted` | `#95D5B2` at 70% opacity | Secondary text on dark backgrounds |
| `text-on-dark-dim` | `#52B788` at 50% opacity | Tertiary text, timestamps, mono citations on dark |

### Accent Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `success` (LIVE) | `#52B788` (leaf) | Checkmarks, completed states, "LIVE" badges |
| `amber` (coming soon) | `#f59e0b` | "Coming Soon" badges, warnings |
| Primary CTA bg | `#2D6A4F` (medium) | Main CTA buttons |
| Primary CTA hover | `#1B4332` (dark) | Button hover state |
| Link / nav active | `#40916C` (forest) on light, `#95D5B2` (mint) on dark | |
| Subtle borders | `#95D5B2` at 20-30% | Dividers on light bg |
| Dark borders | `#40916C` at 15-20% | Dividers on dark bg |

### Badge Styles

```html
<!-- LIVE badge -->
<span class="px-2.5 py-1 rounded-md bg-[#4ae183]/15 text-[#4ae183] text-[11px] font-bold tracking-wider uppercase">Live</span>

<!-- COMING SOON badge -->
<span class="px-2 py-0.5 rounded bg-[#f59e0b]/15 text-[#f59e0b] text-[9px] font-bold tracking-wider uppercase">Coming Soon</span>

<!-- Category/label badge on dark -->
<span class="px-2.5 py-1 rounded-md bg-[#005c55]/15 text-[#8cd4ca] text-[11px] font-bold tracking-wider uppercase">Learn</span>
```

## 3. Typography

### Font Stack

```css
font-family: 'Inter', sans-serif;           /* All text */
font-family: 'JetBrains Mono', monospace;    /* Stats, data, citations, timestamps */
```

### Scale

| Element | Size | Weight | Tracking | Line-height |
|---------|------|--------|----------|-------------|
| Hero headline | 56-72px | 800 (extrabold) | -0.03em (tighter) | 1.05 |
| Section heading | 42-56px | 800 | -0.03em | 1.1 |
| Card/subsection heading | 20-36px | 700 | -0.02em | 1.2 |
| Body text | 16-18px | 400 | normal | 1.6 |
| Small/meta text | 13-14px | 500 | normal | 1.5 |
| Labels (uppercase) | 10-11px | 700 | 0.2-0.25em | normal |
| Mono data | 11-12px | 400-500 | normal | normal |

### Key Typography Patterns

```html
<!-- Section label (appears above headings) -->
<span class="text-[10px] tracking-[0.25em] font-bold text-[#005c55] uppercase">THE CONNECTED PLATFORM</span>

<!-- Section heading -->
<h1 class="text-5xl md:text-[56px] font-extrabold tracking-[-0.03em] text-white max-w-3xl leading-[1.1]">
  Everything you do builds one professional identity.
</h1>

<!-- Subtitle -->
<p class="text-lg text-[#889391] max-w-2xl leading-relaxed">
  Courses, tools, questions, and career moves, all feeding a single profile.
</p>

<!-- Mono timestamp/citation -->
<p class="font-['JetBrains_Mono'] text-[11px] text-[#4a6a6a]">Completed at 9:14 AM</p>

<!-- Mono source citation -->
<p class="font-['JetBrains_Mono'] text-xs text-[#8cd4ca]">VM0042 v2.2, Section 3.1.2, p.14</p>
```

## 4. Layout System

### Page Structure
- **Max width:** 1280px (content), 1440px (full-bleed sections)
- **Horizontal padding:** 32px (px-8)
- **Section vertical padding:** 128px (py-32) for major sections, 96px (py-24) for minor
- **Sections alternate:** dark (#0a1a1a) and light (#f8faf9)

### Grid
- Use CSS flexbox, not CSS grid, for most layouts
- Common splits: 45/55 (hero), 60/40 (bento cards), 50/50 (comparisons)
- Card gaps: 16px between cards in a row, 24px between rows

## 5. Component Recipes

### 5a. Navigation Bar (consistent across all pages)

```html
<nav class="fixed top-0 z-50 w-full bg-[#0a1a1a]/80 backdrop-blur-md">
  <div class="flex justify-between items-center px-8 py-4 max-w-[1280px] mx-auto">
    <div class="text-xl font-extrabold tracking-tighter text-white">Greentryst</div>
    <div class="hidden md:flex items-center space-x-8">
      <a class="text-[#8cd4ca] font-semibold text-sm border-b-2 border-[#005c55] pb-1" href="#">Learn</a>
      <a class="text-[#e0ebe8]/60 hover:text-white transition-colors text-sm font-medium" href="#">SustainIQ</a>
      <a class="text-[#e0ebe8]/60 hover:text-white transition-colors text-sm font-medium" href="#">Career</a>
      <a class="text-[#e0ebe8]/60 hover:text-white transition-colors text-sm font-medium" href="#">Tools</a>
      <a class="text-[#e0ebe8]/60 hover:text-white transition-colors text-sm font-medium" href="#">Pricing</a>
    </div>
    <div class="flex items-center space-x-6">
      <button class="text-[#e0ebe8]/60 hover:text-white transition-colors text-sm font-medium">Sign In</button>
      <button class="bg-[#005c55] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#00897b] transition-colors">Get Started</button>
    </div>
  </div>
</nav>
```

### 5b. Dark Product UI Card (the signature element)

This is the most distinctive visual element of the Greentryst design. Used to show real product interfaces as previews.

```html
<div class="bg-[#0e1e1e] rounded-2xl p-7 shadow-2xl border border-white/5">
  <!-- Label badge -->
  <div class="flex justify-between items-start mb-5">
    <span class="px-2.5 py-1 rounded-md bg-[#005c55]/15 text-[#8cd4ca] text-[11px] font-bold tracking-wider uppercase">SustainIQ</span>
  </div>
  <!-- Content -->
  <div class="mb-auto">
    <!-- ... card-specific content ... -->
  </div>
  <!-- Footer with citation -->
  <div class="pt-5 border-t border-white/5 mt-6">
    <p class="font-['JetBrains_Mono'] text-[11px] text-[#4a6a6a]">Source: VM0042 v2.2, Section 3.1.2</p>
  </div>
</div>
```

**Glass-dark variant** (for cards on dark backgrounds with depth):
```css
.glass-dark {
  background: rgba(14, 30, 30, 0.92);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(0, 92, 85, 0.12);
}
.card-glow:hover {
  box-shadow: 0 0 40px rgba(0, 92, 85, 0.15);
}
```

### 5c. Dark Section Background

```html
<section class="bg-[#0a1a1a] py-32 overflow-hidden">
  <!-- Dot grid texture -->
  <div class="absolute inset-0 opacity-30 pointer-events-none"
       style="background-image: radial-gradient(#1a2e2e 0.5px, transparent 0.5px); background-size: 24px 24px;">
  </div>
  <!-- Ambient glow (optional, use sparingly) -->
  <div class="absolute -bottom-32 left-1/4 w-[500px] h-[500px] bg-[#005c55]/5 rounded-full blur-[120px] pointer-events-none"></div>
  
  <div class="max-w-[1280px] mx-auto px-8 relative z-10">
    <!-- Content -->
  </div>
</section>
```

### 5d. Light Section

```html
<section class="bg-[#f8faf9] py-32">
  <div class="max-w-[1280px] mx-auto px-8">
    <!-- Content -->
  </div>
</section>
```

### 5e. Horizontal Connector (between cards in a flow)

```css
.connector-line {
  position: relative;
  width: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.connector-line::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, rgba(0,92,85,0.1), rgba(0,92,85,0.5), rgba(0,92,85,0.1));
}
.connector-line::after {
  content: '→';
  position: relative;
  z-index: 1;
  color: #005c55;
  font-size: 14px;
  background: #0a1a1a;
  padding: 0 4px;
}
```

### 5f. Stats Row (mono numbers)

```html
<div class="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
  <div>
    <div class="font-['JetBrains_Mono'] text-4xl font-bold text-[#8cd4ca] tracking-tight mb-2">22+</div>
    <div class="text-[11px] font-bold uppercase tracking-[0.2em] text-[#4a6a6a]">Courses</div>
  </div>
  <!-- repeat for 470+, 80+, 100% -->
</div>
```

### 5g. Editorial Trust Statement

```html
<div class="w-full lg:w-2/3 flex flex-col gap-6">
  <h2 class="text-[40px] font-extrabold leading-[1.1] tracking-[-0.02em]">
    Statement text here.
  </h2>
  <div class="w-20 h-0.5 bg-[#005c55]"></div>
  <p class="text-lg text-[#4a6a6a] max-w-2xl leading-relaxed">
    Supporting text.
  </p>
</div>
```

### 5h. Cascade Card Layout (fan/overlapping cards)

```css
.card-cascade-1 { transform: rotate(-4deg) translateX(40px); z-index: 10; }
.card-cascade-2 { transform: rotate(0deg) translateY(-20px); z-index: 20; }
.card-cascade-3 { transform: rotate(4deg) translateX(-40px); z-index: 10; }
```

### 5i. White Card on Light Background

```html
<div class="bg-white rounded-2xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-shadow">
  <!-- Colored accent bar at top -->
  <div class="h-[3px] bg-blue-500 rounded-full mb-6 w-12"></div>
  <!-- Content -->
</div>
```

### 5j. Pricing Card (highlighted variant)

```html
<!-- Highlighted/recommended card -->
<div class="bg-white rounded-2xl p-8 shadow-lg border-t-[3px] border-[#005c55] relative">
  <span class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#005c55] text-white text-[10px] font-bold uppercase tracking-wider rounded-full">Most Popular</span>
  <!-- Content -->
  <button class="w-full bg-[#005c55] text-white py-3 rounded-lg font-semibold">Start Career</button>
</div>

<!-- Normal card -->
<div class="bg-white rounded-2xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
  <!-- Content -->
  <button class="w-full border-2 border-[#005c55] text-[#005c55] py-3 rounded-lg font-semibold">Start Learning</button>
</div>
```

## 6. Content Box Styles (Lesson Page)

These match the existing MDX components but with the new design system colors:

```html
<!-- HighlightBox (green left border) -->
<div class="bg-emerald-50/50 border-l-4 border-[#005c55] rounded-lg p-8">
  <p class="font-bold text-[#005c55] mb-2">Key Takeaway</p>
  <p class="text-base">Content here.</p>
</div>

<!-- AnalogyBox (blue left border) -->
<div class="bg-blue-50/50 border-l-4 border-blue-600 rounded-lg p-8">
  <p class="font-bold text-blue-900 mb-2">Analogy</p>
  <p class="text-base text-blue-800">Content here.</p>
</div>

<!-- ExampleBox (amber left border) -->
<div class="bg-orange-50 border-l-4 border-orange-400 rounded-lg p-8">
  <p class="text-xs font-bold text-orange-800 uppercase tracking-widest mb-3">Worked Example</p>
  <p class="text-base text-orange-900">Content here.</p>
</div>

<!-- FormulaBox (dark background) -->
<div class="bg-[#0a1a1a] text-[#8cd4ca] p-8 rounded-xl text-center">
  <p class="text-[10px] uppercase tracking-[0.3em] font-bold text-[#005c55] mb-4">Formula</p>
  <code class="font-['JetBrains_Mono'] text-2xl font-medium">Formula here</code>
</div>
```

## 7. Stitch Prompting Guide

### Mandatory Preamble (include at the start of every Stitch prompt)

```
Desktop website [page/section] for Greentryst. Must match our established 
design language: dark product UI cards (#0e1e1e) on dark bg (#0a1a1a) or 
white cards with shadow on light bg (#f8faf9). Inter font for text, 
JetBrains Mono for data/citations. Teal accents (#005c55 / #8cd4ca). 
Rounded-2xl (16px) on cards, subtle box-shadows not borders. 
Professional, authoritative, not playful or academic.
```

### Design System Flag

Always pass `--design-system ./stitch-output/greentryst-design-system.md` to maintain color/font consistency.

### Prompting Principles (learned from iteration)

1. **Specify "desktop website" explicitly.** Stitch defaults toward mobile app designs otherwise.

2. **Name real content, never placeholder text.** Don't say "course title here." Say "GHG Protocol & Scope 3 Accounting." Real content produces real-feeling designs.

3. **Describe the visual concept, not just the layout.** Bad: "four cards in a row." Good: "a bento grid with asymmetric sizes, the top-left card spanning 60% width."

4. **Reference our established patterns by name.** Say "dark product UI card (same as Trust Identity section)" or "glass-dark card (same as Connected System)." This anchors Stitch to a known visual.

5. **Specify what NOT to include.** Always add: "No stock photos, no illustrations, no emoji icons, no Material icons except verified checkmark. No 1px borders on cards. No gradients."

6. **Describe the emotional intent.** "This should feel like opening a professional instrument" produces better results than "make it look professional."

7. **Keep prompts under 800 words.** The Stitch SDK falls back to callTool for long prompts, which works but loses the project.generate() screen persistence. If you need more detail, split into multiple sections.

8. **Always include nav specification.** Otherwise Stitch invents random nav links like "Dashboard, Ledger, Intelligence, Network." Specify: "Nav: Greentryst left, Learn/SustainIQ/Career/Tools/Pricing center, Sign In + Get Started right."

### Example Stitch Command

```bash
npx tsx /Users/knowprajjwal/.claude/skills/stitch-ui-designer/scripts/stitch-generate.ts generate \
  --prompt '[YOUR PROMPT]' \
  --device DESKTOP \
  --design-system ./stitch-output/greentryst-design-system.md \
  --label [descriptive-label] \
  --output-dir ./stitch-output/[category] 
```

### Post-Generation Extraction

Stitch saves raw JSON. Extract HTML and PNG with:

```python
import json, subprocess
data = json.load(open('path/to/raw.json'))
for comp in data.get('outputComponents', []):
    if 'design' in comp:
        for s in comp['design'].get('screens', []):
            html = s.get('htmlCode', {})
            ss = s.get('screenshot', {})
            if isinstance(html, dict) and 'downloadUrl' in html:
                subprocess.run(['curl', '-sL', html['downloadUrl'], '-o', 'output.html'])
            if isinstance(ss, dict) and 'downloadUrl' in ss:
                subprocess.run(['curl', '-sL', ss['downloadUrl'], '-o', 'output.png'])
```

## 8. Page Inventory (Designed So Far)

### Homepage Sections (approved)
| Section | File | Status |
|---------|------|--------|
| Hero | `stitch-output/sections/hero-section.html` | Approved |
| Trust Identity | `stitch-output/sections/trust-identity.html` | Approved |
| Connected System | `stitch-output/sections/connected-system-v2.html` | Approved (hand-edited) |
| Four Work Modes | `stitch-output/sections/work-modes.html` | Generated, review pending |
| Product Showcases (Live) | `stitch-output/sections/product-showcases.html` | Generated, review pending |
| Tool Showcases (Coming Soon) | `stitch-output/sections/tool-showcases.html` | Generated, review pending |
| Pricing + CTA | `stitch-output/sections/pricing-cta.html` | Generated, review pending |

### Full Pages (generated)
| Page | File | Status |
|------|------|--------|
| Course Directory | `stitch-output/pages/course-directory.html` | Broadly approved |
| Course Overview | `stitch-output/pages/course-overview.html` | Broadly approved |
| Lesson Page | `stitch-output/pages/lesson-page.html` | Needs rework (sidebar, nav, audio player) |

### Pages Still Needed
- SustainIQ search/results page
- User dashboard (profile, progress, streak calendar)
- Pricing page (full, not preview)
- Jobs/Career page
- Settings/Account page
- Certificate verification page
- Glossary page

## 9. Design Anti-Patterns (What Stitch Gets Wrong)

These are patterns Stitch repeatedly produces that must be corrected:

1. **Generic SaaS nav links.** Stitch invents "Dashboard, Ledger, Intelligence, Network" instead of our actual nav. Always specify nav links explicitly.

2. **Material Design color system.** Stitch imports a 40+ color Material theme (surface-container-highest, on-tertiary-fixed-variant, etc.). Our design uses a simple 12-color palette. When hand-editing, replace Material tokens with direct hex values.

3. **App sidebar instead of course sidebar.** For lesson pages, Stitch creates a generic app navigation. Our sidebar is a course table of contents with module/lesson tree, lesson IDs, and reading times.

4. **Equal-size feature cards.** Stitch defaults to 3 or 4 equal cards in a row. Our design uses asymmetric bento grids (60/40 splits) and cascade/overlapping layouts for visual interest.

5. **"Sovereign" language.** Stitch adds titles like "The Sovereign Ledger" or "The Sovereign Archive." Remove these. Our language is direct: "Greentryst" and the feature names (SustainIQ, Learn, Career, Tools).

6. **Footer boilerplate.** Stitch adds "v1.0.4-alpha" or "Precision in Strategy" taglines. Our footer is simple: "2026 Greentryst. Built for sustainability professionals."

## 10. Design Principles (Summary)

1. **Show the product, not illustrations.** The most powerful visual element is a dark UI card showing real product data (a SustainIQ answer with citations, a calculator result with source, a job match score).

2. **Every data point is real.** Don't use "Lorem ipsum" or generic numbers. Use actual sustainability content: VM0042 Section 3.1.2, DEFRA 2024 emission factors, PCAF v3 Table 4.2.

3. **Trust is visual.** Source citations in JetBrains Mono, green verified badges, "Source: ..." footer lines on every card. The trust principle is embedded in the design, not stated in copy.

4. **Dark and light alternate.** Sections alternate between #0a1a1a (dark, for product showcases and data-rich content) and #f8faf9 (light, for editorial text and pricing). This creates rhythm.

5. **Typography does the heavy lifting.** No decorative elements. Large bold headlines, generous whitespace, clear hierarchy. The design is 80% typography and 20% cards.

6. **Restraint is premium.** Fewer colors, fewer elements, more whitespace. Every element earns its space. If it doesn't communicate something essential, remove it.
