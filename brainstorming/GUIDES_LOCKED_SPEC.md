# Guides Pages - Locked Specification

**Status:** LOCKED (April 2026)
**Routes:** `/redesign/guides` (listing) and `/redesign/guides/[guideId]` (detail)

This document captures the approved design for the Practitioner Guides pages. Read this before making any changes.

## Guides Listing Page (`/redesign/guides`)

### Structure

1. **RedesignNav** (fixed, light tone)
2. **AnimatedGuidesHero** (dark section)
   - Animated gradient blobs (pulse animation)
   - 7 floating icons (Leaf, Globe, TrendingUp, BarChart3, BookOpen, FileText, Sparkles)
   - Staggered fade-in animations on mount
   - "RESOURCES" category label (teal, uppercase)
   - "Practitioner Guides" heading (white, 36-44px)
   - Subtitle (white/60)
3. **GuidesClient** (interactive filtering)
   - Search bar with clear button
   - Topic filter capsules with counts (staggered animation)
   - Results count display
   - Guide cards grid (single column, staggered fade-in)
4. **RedesignFooter**

### Topic Categories

```typescript
const TOPICS = [
  { id: 'all', label: 'All Guides' },
  { id: 'ghg-accounting', label: 'GHG Accounting' },
  { id: 'climate-finance', label: 'Climate Finance' },
  { id: 'eu-regulations', label: 'EU Regulations' },
  { id: 'esg-reporting', label: 'ESG Reporting' },
  { id: 'carbon-markets', label: 'Carbon Markets' },
  { id: 'strategy', label: 'Strategy' },
];
```

### Guide Card Design

- White background, rounded-xl, border `#e5e7e5`
- Icon container: 56x56px, `bg-gt-leaf/10`, FileText icon
- Title: 17px bold, hover changes to `gt-medium`
- Description: 14px muted, 2-line clamp
- Meta: reading time, related courses count, last updated
- Hover: border teal, shadow-lg, -translate-y-1, icon scales to 110%

### Animations

- Topic capsules: staggered fade-in (50ms delay per item)
- Guide cards: staggered fade-in (75ms delay per item)
- Re-animation on filter change (300ms)

## Guide Detail Page (`/redesign/guides/[guideId]`)

### Structure

1. **RedesignNav** (fixed, light tone)
2. **AnimatedHero** (dark section)
   - Animated gradient blobs
   - 6 floating icons with float animation
   - Breadcrumb: Guides > [Title]
   - "PRACTITIONER GUIDE" badge (teal pill)
   - Title (28-36px white)
   - Description (16px white/60)
   - Meta: reading time, last updated, related courses count
   - Action buttons: Save, Share (glass style)
3. **Main Content** (light section, flex layout)
   - Left: White card with MDX content (p-8 md:p-12)
   - Right: Table of Contents sidebar (hidden on mobile)
4. **Related Courses** (inside main content area)
5. **Back to Guides** link
6. **RedesignFooter**

### Table of Contents ("In this guide")

- Sticky position (top-28)
- White card with collapsible header
- Heading list (no internal scroll)
- Indentation: h2 normal, h3 pl-6, h4 pl-9
- Active heading: `bg-gt-leaf/10`, `text-gt-medium`, font-semibold
- Reading progress bar at bottom
- "Back to top" link
- Uses `rehype-slug` for heading IDs

### Layout Alignment

- Hero content: `max-w-[1200px]` container, text constrained to `max-w-[900px]`
- Main content: `max-w-[1200px]` container with flex layout
- Left column: flex-1 `max-w-[900px]`
- Right column: `w-[260px]` with `pt-8 md:pt-12` for alignment

### MDX Rendering

```typescript
<MDXRemote
  source={mdxContent}
  components={getMDXComponents()}
  options={{ 
    mdxOptions: { 
      remarkPlugins: [remarkGfm], 
      rehypePlugins: [rehypeSlug] 
    } 
  }}
/>
```

## Key Files

```
src/app/redesign/guides/
├── page.tsx                           # Listing page (server)
├── _components/
│   ├── GuidesClient.tsx               # Interactive filtering (client)
│   └── AnimatedGuidesHero.tsx         # Animated header (client)
└── [guideId]/
    ├── page.tsx                       # Detail page (server)
    └── _components/
        ├── AnimatedHero.tsx           # Animated header (client)
        └── TableOfContents.tsx        # Reading aid sidebar (client)
```

## Content Source

Guides are loaded from `src/content/guides/` via `src/lib/guides.ts`:
- `getAllGuides()` - returns all guide metadata
- `getGuide(slug)` - returns single guide metadata
- `getGuideContent(slug)` - returns MDX content string

## Do Not Change

- Floating icon positions and animation timings
- Topic-to-course mapping logic
- TOC heading extraction algorithm (must match rehype-slug)
- Layout container widths (1200px outer, 900px content)
- Staggered animation delays
