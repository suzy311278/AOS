# Course Creation Guide — Sustainability Academy

This guide covers everything needed to plan, write, and publish a new course on the platform. It is written for a human author working with an AI assistant (Claude Code). You can hand this document to the AI and say "build me a course on X" and it will know exactly what files to create and how.

---

## Table of Contents

1. [How the Platform Works](#1-how-the-platform-works)
2. [Planning Your Course](#2-planning-your-course)
3. [Folder Structure to Create](#3-folder-structure-to-create)
4. [Writing `course.yaml`](#4-writing-courseyaml)
5. [Writing Lesson MDX Files](#5-writing-lesson-mdx-files)
6. [MDX Content Components Reference](#6-mdx-content-components-reference)
7. [Writing Quiz YAML Files](#7-writing-quiz-yaml-files)
8. [Writing `SOURCES.md`](#8-writing-sourcesmd)
9. [Validation & Testing](#9-validation--testing)
10. [Content Quality Verification](#10-content-quality-verification)
11. [Available Course Colors](#11-available-course-colors)
12. [Course Categories](#12-course-categories)
13. [Common Mistakes & Gotchas](#13-common-mistakes--gotchas)
14. [Complete Starter Templates](#14-complete-starter-templates)

---

## 1. How the Platform Works

Understanding the pipeline helps you write content correctly.

```
course.yaml          ← defines course, modules, and lesson list
  └── lessons/*.mdx  ← one file per lesson (MDX = Markdown + JSX components)
  └── quizzes/*.yaml ← one file per lesson (optional but recommended)
  └── sources/*.pdf  ← source documents (gitignored, kept locally)
  └── SOURCES.md     ← documents which PDF → which module
```

At build time, Next.js:
1. Reads `course.yaml` to build the sidebar, course overview, and navigation
2. Renders each `.mdx` file through `next-mdx-remote` to produce the lesson page HTML
3. Reads each `.yaml` quiz file to build the interactive quiz at the bottom of the lesson
4. Generates 100% static pages (no server needed at runtime)

Progress (completed lessons, quiz answers) is stored in the user's browser `localStorage` — there is no database.

**The course ID** (the folder name) becomes the URL: `course.yaml` with `id: esg-fundamentals` → `/courses/esg-fundamentals`.

---

## 2. Planning Your Course

Before writing a single file, answer these questions:

### 2.1 Course identity

| Question | Example |
|----------|---------|
| What is the course ID? (URL slug, lowercase, hyphens) | `esg-fundamentals` |
| What is the full title? | `ESG Fundamentals` |
| One-line subtitle? | `Understanding Environmental, Social & Governance reporting` |
| 2–3 sentence description for the catalog? | `A comprehensive intro to ESG frameworks...` |
| Emoji icon? | `📊` |
| Primary color? (see §11) | `blue` |
| Category? (see §12) | `esg` |
| Estimated total learning hours? | `12` |
| Status at launch? | `published` or `draft` |

### 2.2 Module structure

A module is a thematic grouping of 3–6 lessons. Think of it like a chapter. Good modules:
- Have a single clear theme
- Progress from conceptual → applied
- Take 2–5 hours total

A typical course has 4–10 modules. VM0042 has 11 (including a capstone). Most new courses will have 4–6.

**Module checklist:**
- [ ] Each module has a unique `id` (0, 1, 2…)
- [ ] Each module has a distinct `color` (different from adjacent modules looks better)
- [ ] Each module has an `icon` emoji, `title`, and `subtitle`
- [ ] Lessons within a module form a logical sequence

### 2.3 Lesson structure

Each lesson should:
- Cover one focused topic (not three)
- Take 30–90 minutes to read
- Open with a "why this matters" callout
- Include at least one analogy or worked example
- Close with a key takeaway callout
- Have 2–4 quiz questions

Good lesson IDs: `"0.1"`, `"0.2"`, `"1.1"`, `"CAP"`. They are strings, not numbers.

### 2.4 Source documents

List every PDF (or other document) that will inform the course content before you start writing. Gather them all into `sources/` before authoring lessons. This ensures:
- You have the source before writing, not after
- The `SOURCES.md` can accurately document provenance
- AI-assisted verification works correctly

---

## 3. Folder Structure to Create

Create this exact structure under `src/content/`:

```
src/content/
└── <course-id>/
    ├── course.yaml          ← Required. Course + module + lesson metadata.
    ├── SOURCES.md           ← Required. PDF → module provenance doc.
    ├── sources/             ← Required folder. Put source PDFs here.
    │   └── SourceDoc.pdf
    ├── lessons/             ← Required folder.
    │   ├── 0.1.mdx          ← One file per lesson ID in course.yaml.
    │   ├── 0.2.mdx
    │   └── ...
    └── quizzes/             ← Optional folder, but strongly recommended.
        ├── 0.1.yaml         ← Same filename as the lesson (no quiz = no file needed).
        └── ...
```

**Naming rules:**
- Folder name = course `id` (e.g. `esg-fundamentals`)
- Lesson files: `<lessonId>.mdx` where lessonId matches `course.yaml` exactly (`0.1`, `0.2`, `CAP`)
- Quiz files: same name as the lesson (`0.1.yaml`)
- PDFs: keep original filenames for traceability

---

## 4. Writing `course.yaml`

This is the skeleton of the entire course. Every lesson that appears in the sidebar and navigation must be listed here.

### 4.1 Full schema with all fields

```yaml
# ── Course-level fields ────────────────────────────────────────────────────────
id: esg-fundamentals               # REQUIRED. Lowercase, hyphens. Becomes the URL slug.
                                   # Must match the folder name exactly.

title: "ESG Fundamentals"          # REQUIRED. Displayed in sidebar, catalog, breadcrumbs.

subtitle: "Understanding Environmental, Social & Governance reporting"
                                   # REQUIRED. One-line description shown on course cards.

description: "A comprehensive introduction to ESG frameworks, disclosure standards,
  and corporate sustainability reporting. Covers GRI, SASB, TCFD, and UN SDGs."
                                   # REQUIRED. 2-4 sentences. Used in catalog and SEO.

icon: "📊"                         # REQUIRED. Single emoji. Shown on course card + sidebar header.

color: blue                        # REQUIRED. See §11 for all valid values.
                                   # This is the primary accent color for the whole course.

status: published                  # REQUIRED. One of:
                                   #   published    → visible and accessible
                                   #   draft        → shows yellow "Draft" badge, still accessible
                                   #   coming-soon  → shows grey badge, link disabled

category: esg                      # REQUIRED. See §12 for all valid values.

estimatedHours: 12                 # REQUIRED. Integer. Total estimated learning time.
                                   # Rough guide: (total lesson duration in mins) ÷ 60, rounded up.

# ── Module list ────────────────────────────────────────────────────────────────
modules:
  - id: 0                          # REQUIRED. Integer starting at 0. Displayed as "Module 1" in UI.
    title: "What is ESG?"          # REQUIRED. Module chapter title.
    subtitle: "Origins, frameworks, and why it matters"
                                   # REQUIRED. Short phrase shown under title on overview page.
    icon: "🌍"                     # REQUIRED. Single emoji.
    color: blue                    # REQUIRED. Can differ from course color. See §11.
    lessons:
      - id: "0.1"                  # REQUIRED. String. Must match the lesson MDX filename (0.1.mdx).
        title: "History and Origins of ESG"
                                   # REQUIRED. Shown in sidebar and lesson header.
        duration: "45 min"         # OPTIONAL. Shown in lesson metadata header.
        vmRef: "GRI Standards 2021, Introduction"
                                   # OPTIONAL. Source document reference shown in lesson header.
                                   # Name it after the actual source section.

      - id: "0.2"
        title: "The Three Pillars — E, S, and G"
        duration: "50 min"
        vmRef: "GRI Standards 2021, Section 2"

  - id: 1
    title: "Key ESG Frameworks"
    subtitle: "GRI, SASB, TCFD, and the UN SDGs"
    icon: "📋"
    color: teal
    lessons:
      - id: "1.1"
        title: "GRI Standards — The Global Baseline"
        duration: "60 min"
        vmRef: "GRI Universal Standards 2021"
      - id: "1.2"
        title: "SASB — Industry-Specific Materiality"
        duration: "55 min"
        vmRef: "SASB Standards 2023"

  # ... more modules ...

  - id: 4                          # A capstone module is optional but recommended for long courses.
    title: "Capstone"
    subtitle: "Applying the full ESG framework to a real company"
    icon: "🏆"
    color: indigo
    lessons:
      - id: "CAP"                  # The special capstone lesson ID — conventional but not required.
        title: "Full ESG Assessment: Case Study"
        duration: "2 hrs"
        vmRef: "All frameworks"
```

### 4.2 Rules and constraints

- `id` at the top level **must match the folder name**
- Module `id` integers must start at 0 and be sequential (0, 1, 2…)
- Lesson `id` values are **strings** (`"0.1"` not `0.1`) — YAML will parse unquoted `0.1` as a float, which breaks things
- Lesson `id` must exactly match the `.mdx` filename: `id: "0.1"` → file `lessons/0.1.mdx`
- `color` values must exist in `src/lib/colors.ts` (see §11)
- `status` must be exactly `published`, `draft`, or `coming-soon`
- `estimatedHours` is an integer

### 4.3 Running validation

After writing `course.yaml`, run:

```bash
npm run validate
```

This checks all IDs, all lesson files exist, all colors are valid, and all quiz questions conform to the schema. Fix all errors before writing lesson content.

---

## 5. Writing Lesson MDX Files

### 5.1 What MDX is

MDX is Markdown that can also contain JSX components. Each `.mdx` file becomes one lesson page. The platform renders it using `next-mdx-remote` on the server.

### 5.2 File header convention

Every lesson file starts with a comment identifying the lesson:

```mdx
{/* 0.1: History and Origins of ESG */}
```

This is for readability only — it has no functional effect.

### 5.3 Two ways to write content: MDX syntax vs HTML-in-MDX

**Option A — MDX/Markdown syntax (cleaner, recommended for new courses):**

```mdx
## What is ESG?

ESG stands for **Environmental, Social, and Governance**. It is a framework for...

- Environmental: climate impact, resource use, biodiversity
- Social: labour practices, community relations, diversity
- Governance: board structure, executive pay, anti-corruption

<HighlightBox>
Key takeaway: ESG is not just ethics — it's long-term risk management.
</HighlightBox>
```

**Option B — HTML-in-MDX with Tailwind classes (used by all existing vm0042 lessons):**

```mdx
<h2 class="text-2xl font-bold text-gray-800 mb-4">What is ESG?</h2>

<p class="mb-4">ESG stands for <strong>Environmental, Social, and Governance</strong>. It is a framework for...</p>

<ul class="list-disc ml-6 space-y-2 mb-4">
  <li>Environmental: climate impact, resource use, biodiversity</li>
  <li>Social: labour practices, community relations, diversity</li>
  <li>Governance: board structure, executive pay, anti-corruption</li>
</ul>

<HighlightBox>
Key takeaway: ESG is not just ethics — it's long-term risk management.
</HighlightBox>
```

**You can mix both freely.** The custom box components (`<HighlightBox>`, etc.) always use the JSX syntax regardless of which option you choose for the rest of the content.

For new courses, Option A (Markdown syntax) is recommended — it's cleaner to write and edit. Option B gives more precise layout control and matches the existing vm0042 style.

### 5.4 Recommended lesson structure

Every lesson should follow this pattern:

```
1. Opening HighlightBox — "Why this matters" / what the lesson covers
2. First section heading
3. Body content: explanations, diagrams (as tables), definitions
4. AnalogyBox — connects the concept to something familiar
5. ExampleBox — worked numerical example or concrete case study
6. More body content as needed
7. HighlightBox or plain callout div — key takeaway to close
```

This mirrors how good textbooks work: context → concept → analogy → example → takeaway.

### 5.5 HTML tags used in existing lessons (Option B reference)

| Element | Typical class string |
|---------|---------------------|
| `<h2>` section heading | `class="text-2xl font-bold text-gray-800 mb-4"` |
| `<h3>` subsection heading | `class="text-xl font-bold mt-6 mb-3"` |
| `<h4>` minor heading | `class="text-lg font-semibold text-gray-700 mt-4 mb-2"` |
| `<p>` paragraph | `class="mb-4"` |
| `<p>` small paragraph | `class="mb-4 text-sm"` |
| `<ul>` unordered list | `class="list-disc ml-6 space-y-2 mb-4"` |
| `<ul>` small list | `class="list-disc ml-6 text-sm space-y-2 mb-4"` |
| `<ol>` ordered list | `class="list-decimal ml-6 space-y-2 mb-4"` |
| `<strong>` emphasis | No class needed |
| `<em>` italic | No class needed |
| `<code>` inline code | No class needed (styled globally) |
| `<sub>` subscript | No class needed (e.g. CO₂ can use `CO<sub>2</sub>`) |

### 5.6 Inline callout divs (without a named component)

For simple coloured callouts that don't fit the four box components, use inline divs:

```mdx
<div class="bg-green-50 border border-green-200 rounded p-4">
  <p class="font-semibold text-green-800">Key Takeaway</p>
  <p class="text-green-900 mt-1">Your takeaway text here.</p>
</div>
```

Warning box:
```mdx
<div class="bg-amber-50 border border-amber-200 rounded p-3 mb-4 text-sm">
  <p class="font-semibold text-amber-800">⚠️ Important Note</p>
  <p class="mt-1 text-amber-900">Warning content here.</p>
</div>
```

### 5.7 Grid layouts

Use CSS grid directly for side-by-side cards:

```mdx
<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
  <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
    <h4 class="font-bold text-blue-800 mb-2">🌍 Environmental</h4>
    <p class="text-sm text-blue-900">Climate change, biodiversity, water use...</p>
  </div>
  <div class="bg-green-50 border border-green-200 rounded-lg p-4">
    <h4 class="font-bold text-green-800 mb-2">👥 Social</h4>
    <p class="text-sm text-green-900">Labour practices, community impact...</p>
  </div>
</div>
```

For 3-column grids: `grid-cols-1 md:grid-cols-3`.

### 5.8 Numbered step sequences (inside FormulaBox)

For workflows or processes, the existing lessons use a numbered list inside `<FormulaBox>`:

```mdx
<FormulaBox>
  <p class="text-green-400 font-bold mb-3 text-sm uppercase tracking-wide">The ESG Reporting Process</p>
  <div class="space-y-3 text-sm">
    <div class="flex gap-3">
      <span class="text-yellow-400 font-bold w-6 flex-shrink-0">①</span>
      <div>
        <span class="text-white font-semibold">Materiality Assessment</span><br/>
        <span class="text-slate-300">Identify which ESG topics are material to your business and stakeholders.</span>
      </div>
    </div>
    <div class="flex gap-3">
      <span class="text-yellow-400 font-bold w-6 flex-shrink-0">②</span>
      <div>
        <span class="text-white font-semibold">Data Collection</span><br/>
        <span class="text-slate-300">Gather metrics across the material topics identified.</span>
      </div>
    </div>
  </div>
</FormulaBox>
```

Numbered circle characters: ① ② ③ ④ ⑤ ⑥ ⑦ ⑧ ⑨ ⑩ 🔁

---

## 6. MDX Content Components Reference

These are the four named box components. Always import them with JSX self-closing if empty, or wrap content as children.

### 6.1 `<HighlightBox>` — green, for key context and takeaways

Use for:
- Opening "why this matters / what you'll learn" statement
- Closing "key takeaway" summary
- Important rules or requirements the learner must remember

```mdx
<HighlightBox>
  <p class="font-semibold text-green-800">Why this matters</p>
  <p class="text-green-900 mt-1">
    Understanding materiality is the foundation of all ESG reporting. Without it,
    you're measuring everything and prioritising nothing.
  </p>
</HighlightBox>
```

### 6.2 `<AnalogyBox>` — blue, for analogies and mental models

Use for:
- Connecting a technical concept to something the learner already understands
- "Think of it like…" explanations
- Mental models that make abstract ideas concrete

Always start with a bold lead line and an emoji:

```mdx
<AnalogyBox>
  <p class="font-semibold text-blue-800">🎯 Analogy: The Restaurant Health Inspection</p>
  <p class="mt-2 text-blue-900">
    A restaurant's Yelp reviews tell you what customers think. But a health inspector's
    report tells you what's actually happening in the kitchen. ESG disclosure is the
    health inspection — not the marketing brochure.
  </p>
</AnalogyBox>
```

### 6.3 `<ExampleBox>` — amber, for worked examples and case studies

Use for:
- Numerical calculations worked step-by-step
- Real company examples
- Hypothetical case studies ("Company X reports…")

Always start with a bold lead line:

```mdx
<ExampleBox>
  <p class="font-semibold text-amber-800">📐 Worked Example: Calculating Carbon Intensity</p>
  <p class="mt-2">Company Y emits <strong>50,000 tCO₂e</strong> per year and has revenue of <strong>$200M</strong>.</p>
  <p class="mt-2">Carbon Intensity = 50,000 ÷ 200 = <strong>250 tCO₂e / $M revenue</strong></p>
  <p class="mt-2 text-amber-700 text-sm">Industry average is 180 — so Company Y is 39% more carbon-intensive than peers.</p>
</ExampleBox>
```

You can nest `<FormulaBox>` inside `<ExampleBox>` for the calculation step:

```mdx
<ExampleBox>
  <p class="font-semibold text-amber-800">📐 Example Title</p>
  <p class="mt-2 text-sm">Given data...</p>
  <FormulaBox>
    Result = A ÷ B × 100 = <strong>X%</strong>
  </FormulaBox>
  <p class="mt-2 text-sm">Interpretation...</p>
</ExampleBox>
```

### 6.4 `<FormulaBox>` — dark background, for formulas and equations

Use for:
- Mathematical formulas
- Equations with variables
- Multi-step calculations
- Process workflows (numbered steps on dark background)

Text is light-coloured by default inside FormulaBox. Use these text colours:
- White text: `class="text-white"` — for main formula text
- Light grey: `class="text-gray-300"` or `class="text-slate-300"` — for variable labels
- Green accent: `class="text-green-400"` — for headings within the box
- Yellow accent: `class="text-yellow-400"` — for step numbers

```mdx
<FormulaBox>
  <p class="text-gray-300 text-xs mb-2">Carbon Intensity formula:</p>
  <p class="font-mono text-sm">CI = Total GHG Emissions (tCO₂e) ÷ Revenue ($M)</p>
  <p class="text-gray-400 text-xs mt-2">Units: tCO₂e per million dollars of revenue</p>
</FormulaBox>
```

For multi-formula boxes with variable definitions:

```mdx
<FormulaBox>
  <p class="text-green-400 font-bold mb-3 text-sm uppercase tracking-wide">Scope 3 Category 1 Formula</p>
  <p class="font-mono text-sm">E = A × EF</p>
  <div class="mt-3 text-xs text-gray-300 space-y-1">
    <p><strong class="text-white">E</strong> = Emissions (tCO₂e)</p>
    <p><strong class="text-white">A</strong> = Activity data (e.g. tonnes of goods purchased)</p>
    <p><strong class="text-white">EF</strong> = Emission factor (tCO₂e per unit of activity)</p>
  </div>
</FormulaBox>
```

### 6.5 `<ResponsiveTable>` — wraps tables for mobile scrolling

Always wrap any `<table>` in `<ResponsiveTable>`. The wrapper handles horizontal overflow on small screens.

```mdx
<ResponsiveTable>
<table class="mb-6">
  <tr>
    <th>Framework</th>
    <th>Scope</th>
    <th>Audience</th>
    <th>Mandatory?</th>
  </tr>
  <tr>
    <td>GRI</td>
    <td>Broad ESG</td>
    <td>All stakeholders</td>
    <td>Voluntary (some jurisdictions require)</td>
  </tr>
  <tr>
    <td>SASB</td>
    <td>Industry-specific financial materiality</td>
    <td>Investors</td>
    <td>Voluntary</td>
  </tr>
  <tr>
    <td>TCFD</td>
    <td>Climate risk only</td>
    <td>Investors, lenders</td>
    <td>Mandatory in UK, NZ, Switzerland</td>
  </tr>
</table>
</ResponsiveTable>
```

**Table styling notes:**
- `<th>` cells get a dark green header automatically (styled in `mdx-components.tsx`)
- `<td>` cells get a light bottom border automatically
- No need to add CSS classes to `<th>` or `<td>` — just add content
- Exception: if you need text size control inside a table, add `class="text-sm"` to the `<table>` tag
- You can nest a `<ResponsiveTable>` inside an `<ExampleBox>` for tables within worked examples

---

## 7. Writing Quiz YAML Files

### 7.1 File format

Each quiz file is a YAML list of question objects. The file lives at `quizzes/<lessonId>.yaml`.

**With explanation (preferred):**
```yaml
- question: "What does materiality mean in ESG reporting?"
  options:
    - "The use of physical materials in production"
    - "Topics significant enough to influence stakeholder decisions"
    - "The financial value of ESG investments"
    - "Legal requirements for disclosure"
  answer: 1
  explanation: "Materiality refers to whether an ESG topic is significant enough that
    its omission or misstatement could influence decisions made by users of the report.
    GRI defines this as topics that represent significant impacts on the economy, environment,
    or people."

- question: "Which framework is specifically designed for investor-focused climate risk disclosure?"
  options:
    - "GRI Standards"
    - "SASB Standards"
    - "TCFD Recommendations"
    - "UN SDGs"
  answer: 2
  explanation: "TCFD (Task Force on Climate-related Financial Disclosures) was specifically
    created to help investors understand climate-related financial risks and opportunities.
    GRI is broader, SASB covers all ESG for investors, and UN SDGs are goals not a reporting framework."
```

**Without explanation (acceptable for factual recall questions):**
```yaml
- question: "How many UN Sustainable Development Goals are there?"
  options:
    - "10"
    - "15"
    - "17"
    - "20"
  answer: 2
```

### 7.2 Schema rules

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `question` | string | Yes | The question text. End with `?`. |
| `options` | list of strings | Yes | Exactly 4 options. Each on its own line with `- ` prefix. |
| `answer` | integer | Yes | **0-based index** into options. First option = `0`, second = `1`, etc. |
| `explanation` | string | No | Shown after submission. Explain why the correct answer is right AND why the common wrong answer is wrong. |

### 7.3 Writing good questions

**Do:**
- Test understanding, not memorization of definitions
- Make all four options plausible (avoid obviously wrong distractors)
- Include at least one numerical calculation question per lesson that has numbers
- Write explanations that teach, not just confirm ("Correct! X is right because...")
- Keep options roughly the same length

**Don't:**
- Use "all of the above" or "none of the above"
- Make the correct answer noticeably longer than wrong answers
- Ask trivial recall questions ("What does ESG stand for?")
- Use double negatives ("Which of the following is NOT not required?")

### 7.4 YAML formatting rules for options

If any option contains a colon followed by a space (e.g., `Scope 1: Direct emissions`), the option must be quoted:

```yaml
  options:
    - "Scope 1: Direct emissions"          # ← must be quoted
    - "Scope 2: Indirect from purchased energy"
    - "Scope 3: Value chain emissions"
    - "Scope 4: Avoided emissions"
```

If in doubt, always quote all options — it is never wrong to quote.

---

## 8. Writing `SOURCES.md`

This file documents the intellectual provenance of the course. Create it at `src/content/<course-id>/SOURCES.md`.

```markdown
# Source Documents — ESG Fundamentals

All PDFs listed here live in `src/content/esg-fundamentals/sources/`.
They are excluded from git (see `.gitignore`) — keep them locally.

## Document → Module Map

| File | Publisher | Covers | Used in |
|------|-----------|--------|---------|
| `GRI-Universal-Standards-2021.pdf` | GRI | Universal standards for ESG reporting | Module 0 (intro), Module 1 (GRI deep-dive) |
| `SASB-Standards-2023.pdf` | SASB/ISSB | Industry-specific materiality standards | Module 1 (SASB section) |
| `TCFD-Recommendations-2017.pdf` | TCFD/FSB | Climate risk disclosure framework | Module 1 (TCFD section) |
| `CSRD-Directive-2022.pdf` | EU Commission | EU Corporate Sustainability Reporting Directive | Module 3 (regulatory landscape) |

## How Content Was Produced

1. Each PDF was reviewed section by section.
2. Lesson content was written with explicit `vmRef` fields in `course.yaml` pointing to
   the source document and section.
3. Quiz questions were cross-checked against source documents for accuracy.
4. AI-assisted factual review was run against the PDFs before finalising each lesson.

## Verification Command

```bash
gemini -p "Review src/content/esg-fundamentals/lessons/1.1.mdx against
src/content/esg-fundamentals/sources/GRI-Universal-Standards-2021.pdf.
Check all facts, thresholds, and definitions for accuracy."
```
```

---

## 9. Validation & Testing

### 9.1 After writing `course.yaml`

```bash
npm run validate
```

Expected output for a clean course:
```
✓ vm0042: 34 lessons, 34 quiz files
✓ esg-fundamentals: 10 lessons, 10 quiz files
All content valid.
```

Errors to fix:
- `Missing lesson file: lessons/0.2.mdx` → create the file
- `Invalid color: teal2` → fix the color name in course.yaml
- `Lesson ID "0.1" appears in course.yaml but not in quizzes/` → this is a warning, not an error (quizzes are optional)

### 9.2 During development

```bash
npm run dev
```

Open http://localhost:5001 and navigate to your course. Check:
- [ ] Course appears on the homepage with the right icon and color
- [ ] All modules expand in the sidebar
- [ ] All lessons are clickable and load
- [ ] MDX renders correctly (no raw tag text visible)
- [ ] Tables scroll horizontally on a narrow browser window
- [ ] Quiz appears at the bottom of lessons that have a quiz YAML
- [ ] Quiz answer selection works
- [ ] "Check Answer" shows correct/incorrect feedback
- [ ] "Mark Complete & Continue" navigates to the next lesson
- [ ] Progress is saved (lesson appears with checkmark after completing)

### 9.3 Build check before publishing

```bash
npm run build
```

All pages must generate without errors. Common build errors:
- Unescaped `<` before a number in MDX (e.g. `<5%`) → change to `&lt;5%`
- Unclosed HTML tag inside MDX → find and close it
- Non-self-closing `<br>` → change to `<br />`
- Missing MDX component close tag → check `<ExampleBox>` has `</ExampleBox>`

---

## 10. Content Quality Verification

After writing lessons, verify factual accuracy against source PDFs using AI CLI tools.

### 10.1 Using Gemini CLI

```bash
# Review a single lesson for factual accuracy
gemini -p "Review src/content/esg-fundamentals/lessons/1.1.mdx against \
src/content/esg-fundamentals/sources/GRI-Universal-Standards-2021.pdf. \
Check all facts, definitions, thresholds, and numbers. \
Identify anything missing or incorrect. Rate depth 1–10."

# Review a quiz for accuracy
gemini -p "Review src/content/esg-fundamentals/quizzes/1.1.yaml. \
Check each question against GRI Universal Standards 2021. \
Is every answer correct? Is any explanation misleading?"
```

### 10.2 Using Codex CLI

```bash
# Deeper line-by-line check with rewrite suggestions
codex exec -c 'sandbox_permissions=["disk-full-read-access"]' \
"Review src/content/esg-fundamentals/lessons/1.1.mdx against \
src/content/esg-fundamentals/sources/GRI-Universal-Standards-2021.pdf. \
Check all facts and suggest exact wording improvements for accuracy and clarity."
```

### 10.3 What to check in each lesson

- [ ] All numerical values match the source document exactly
- [ ] All thresholds and percentages are correct
- [ ] Formula variables match source document notation
- [ ] Step sequences match source document ordering
- [ ] Nothing important from the source is omitted
- [ ] Analogies don't oversimplify to the point of being misleading
- [ ] Examples use realistic numbers consistent with the field
- [ ] Quiz correct answers are unambiguously correct

---

## 11. Available Course Colors

Defined in `src/lib/colors.ts`. Each color provides consistent classes for the sidebar, progress bars, active states, and CTA buttons.

| Name | Visual | Best for |
|------|--------|---------|
| `green` | Forest green | Ecology, agriculture, land use |
| `emerald` | Bright emerald | Environmental science, nature |
| `teal` | Teal | Water, oceans, climate |
| `blue` | Medium blue | ESG, reporting, governance |
| `violet` | Purple-blue | Finance, carbon markets, uncertainty |
| `orange` | Warm orange | Energy, industry, monitoring |
| `red` | Red | Capstone, risk, high-stakes topics |
| `purple` | Deep purple | Policy, regulation, legal |
| `cyan` | Cyan | Technology, data, remote sensing |
| `rose` | Rose pink | Social impact, communities |
| `indigo` | Indigo | Standards, frameworks, compliance |

**To add a new color:** Edit `src/lib/colors.ts` and add an entry with all six keys: `bg`, `text`, `border`, `btn`, `active`, `light`. Follow the pattern of existing colors.

---

## 12. Course Categories

Used to group courses on the homepage when multiple courses exist.

| Value | Display Label | Use for |
|-------|--------------|---------|
| `methodologies` | Methodology | Verra VCS, GHG Protocol, ISO standards, carbon accounting methodologies |
| `esg` | ESG | ESG frameworks, corporate reporting, disclosure standards |
| `markets` | Carbon Markets | Voluntary and compliance carbon markets, trading, pricing |
| `fundamentals` | Fundamentals | Climate science, sustainability basics, introductory material |

If none of these fit, new categories can be added — they display as the value with hyphens replaced by spaces and capitalised (e.g. `clean-energy` → "clean energy").

---

## 13. Common Mistakes & Gotchas

### MDX compilation errors (will break the build)

| Mistake | Symptom | Fix |
|---------|---------|-----|
| `<br>` without closing slash | Build error | Change to `<br />` |
| `<5%` unescaped | Build error | Change to `&lt;5%` |
| `<ExampleBox>` not closed | Build error | Add `</ExampleBox>` |
| Mismatched component tags (e.g. close `</FormulaBox>` when inside `<ExampleBox>`) | Build error | Match every open tag to its close |
| `class=` instead of `className=` inside JSX context | Styling breaks | Use `class=` in HTML-in-MDX, `className=` in pure JSX |

> **Note:** In the existing vm0042 lessons, `class=` is used because the content is HTML-in-MDX, not JSX. This works correctly. Only use `className=` if you're writing a React component file (`.tsx`).

### course.yaml mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Lesson ID without quotes: `id: 0.1` | Parsed as float `0.1`, won't match `0.1.mdx` | Always quote: `id: "0.1"` |
| Color name not in colorMap | Silently renders as green | Check `src/lib/colors.ts` for valid names |
| `status: published ` (trailing space) | Validation error | Remove whitespace |
| Module IDs not starting at 0 | Navigation breaks | Start at `id: 0` |
| Duplicate lesson IDs | Second one silently overwrites first | All lesson IDs must be unique within a course |

### Quiz YAML mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| `answer: 4` when only 4 options exist (0-3) | Correct answer never highlights | `answer` is 0-based: valid values are 0, 1, 2, 3 |
| Option with `: ` unquoted | YAML parse error | Quote the option string |
| `explanation:` with no value | Validation error | Either add text or remove the key entirely |

### Structural mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Lesson MDX filename doesn't match lesson ID | 404 at lesson URL | File `0.1.mdx` must match `id: "0.1"` in course.yaml |
| Course folder name doesn't match `id:` in course.yaml | Course not found | Keep them identical |
| Not running `npm run validate` before testing | Silent content errors | Always validate after adding course.yaml |

---

## 14. Complete Starter Templates

### 14.1 `course.yaml` template (copy and fill in)

```yaml
id: YOUR-COURSE-ID
title: "Your Course Title"
subtitle: "One-line description of what learners get"
description: "A 2-3 sentence description of the course scope, target audience, and what it covers. Written for the course catalog."
icon: "🌿"
color: green
status: published
category: fundamentals
estimatedHours: 10
modules:
  - id: 0
    title: "Module One Title"
    subtitle: "Brief descriptor"
    icon: "🌱"
    color: green
    lessons:
      - id: "0.1"
        title: "First Lesson Title"
        duration: "45 min"
        vmRef: "Source Document, Section X"
      - id: "0.2"
        title: "Second Lesson Title"
        duration: "50 min"
        vmRef: "Source Document, Section Y"

  - id: 1
    title: "Module Two Title"
    subtitle: "Brief descriptor"
    icon: "📋"
    color: teal
    lessons:
      - id: "1.1"
        title: "Third Lesson Title"
        duration: "60 min"
        vmRef: "Source Document, Section Z"
```

### 14.2 Lesson MDX template (copy and fill in)

```mdx
{/* X.Y: Lesson Title */}

<HighlightBox>
  <p class="font-semibold text-green-800">Why this matters</p>
  <p class="text-green-900 mt-1">
    [1-3 sentences explaining why the learner needs this. What problem does it solve?
    What will they be able to do after this lesson that they couldn't before?]
  </p>
</HighlightBox>

<h3 class="text-xl font-bold mt-6 mb-3">Section One Heading</h3>
<p class="mb-4">
  [Core explanation of the first concept. Keep paragraphs short — 3-5 sentences.
  Use <strong>bold</strong> for key terms on first use.]
</p>

<AnalogyBox>
  <p class="font-semibold text-blue-800">🎯 Analogy: [Analogy Name]</p>
  <p class="mt-2 text-blue-900">
    [Connect the concept to something familiar. Start with "Think of it like..." or
    "Imagine...". Close with how the analogy maps back to the actual concept.]
  </p>
</AnalogyBox>

<h3 class="text-xl font-bold mt-6 mb-3">Section Two Heading</h3>
<p class="mb-4">[More explanation...]</p>

<ul class="list-disc ml-6 space-y-2 mb-4">
  <li>[Key point one]</li>
  <li>[Key point two]</li>
  <li>[Key point three]</li>
</ul>

<ResponsiveTable>
<table class="mb-6">
  <tr>
    <th>Column 1</th>
    <th>Column 2</th>
    <th>Column 3</th>
  </tr>
  <tr>
    <td>Row 1, Cell 1</td>
    <td>Row 1, Cell 2</td>
    <td>Row 1, Cell 3</td>
  </tr>
</table>
</ResponsiveTable>

<h3 class="text-xl font-bold mt-6 mb-3">Worked Example</h3>

<ExampleBox>
  <p class="font-semibold text-amber-800">📐 Example: [Example Title]</p>
  <p class="mt-2">[Set up the example with specific numbers or a specific scenario.]</p>
  <FormulaBox>
    [Formula or calculation here] = <strong>[Result]</strong>
  </FormulaBox>
  <p class="mt-2 text-sm text-amber-700">[Interpretation of the result.]</p>
</ExampleBox>

<div class="bg-green-50 border border-green-200 rounded p-4">
  <p class="font-semibold text-green-800">Key Takeaway</p>
  <p class="text-green-900 mt-1">
    [1-3 sentences summarising the single most important thing from this lesson.
    This is what the learner should remember after everything else fades.]
  </p>
</div>
```

### 14.3 Quiz YAML template (copy and fill in)

```yaml
- question: "[Question text ending with ?]"
  options:
    - "[Option A — make all four plausible]"
    - "[Option B]"
    - "[Option C — this is the correct answer (index 2)]"
    - "[Option D]"
  answer: 2
  explanation: "[Why C is correct. Also briefly explain why the most tempting wrong
    answer (usually A or B) is wrong. 2-4 sentences.]"

- question: "[Second question]"
  options:
    - "[Option A]"
    - "[Option B — this is correct (index 1)]"
    - "[Option C]"
    - "[Option D]"
  answer: 1
  explanation: "[Explanation...]"

- question: "[Third question — numerical if the lesson has calculations]"
  options:
    - "[Wrong number]"
    - "[Wrong number]"
    - "[Wrong number]"
    - "[Correct number]"
  answer: 3
  explanation: "[Show the calculation briefly: X × Y = Z. Explain where the wrong
    answers come from — common errors people make.]"
```

### 14.4 `SOURCES.md` template

```markdown
# Source Documents — [Course Title]

All PDFs listed here live in `src/content/[course-id]/sources/`.
They are excluded from git (see `.gitignore`) — keep them locally.

## Document → Module Map

| File | Publisher | Version | Covers | Used in |
|------|-----------|---------|--------|---------|
| `Filename.pdf` | Publisher Name | Year | Topic covered | Module X, Lesson Y.Z |

## How Content Was Produced

1. PDFs were reviewed section by section against lesson outlines.
2. Lesson content was authored with `vmRef` fields in `course.yaml` pointing to
   the exact source section.
3. Quiz questions were cross-checked against source documents.
4. AI-assisted factual review was conducted using Gemini and Codex CLIs.

## Verification Command

```bash
gemini -p "Review src/content/[course-id]/lessons/X.Y.mdx against
src/content/[course-id]/sources/Filename.pdf Section Z.
Check all facts and identify anything missing or incorrect."
```
```

---

## Quick Reference Checklist

### New course checklist

- [ ] Course ID decided (lowercase, hyphens, unique)
- [ ] Module structure planned (3–6 lessons per module)
- [ ] Source PDFs gathered into `sources/`
- [ ] `course.yaml` written and validated (`npm run validate`)
- [ ] All lesson `.mdx` files created
- [ ] All quiz `.yaml` files created (at least 2 questions per lesson)
- [ ] `SOURCES.md` written with module → PDF mapping
- [ ] `npm run build` passes with no errors
- [ ] Manual walkthrough in browser (lesson nav, quiz, complete button)
- [ ] Factual accuracy verified against source PDFs via Gemini/Codex

### New module within existing course checklist

- [ ] New module entry added to `course.yaml` with correct `id` (next integer)
- [ ] New color assigned (check existing modules to avoid adjacent repetition)
- [ ] All new lesson `.mdx` files created
- [ ] Quiz `.yaml` files created
- [ ] `npm run validate` passes
- [ ] `npm run build` passes
