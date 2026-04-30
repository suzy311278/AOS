# ArmorInnovate OS — Refactor Plan

> Repo pivot: **Greentryst (Sustainability Academy) → ArmorInnovate OS** — a one-stop ICS/SCADA security operating system for IEC 62443, ICS pentesting, and OT security.
>
> ⚠️ **Production guardrail**: this repo deploys to Vercel on push to `main` as Greentryst. Do **not** push this refactor to `main` until either (a) the IA migration is complete, or (b) the project is forked to a dedicated `armorinnovate` repo. Recommended: cut a long-lived branch `armor/refactor` and stack PRs against it.

---

## 0. Architectural decisions (locked)

| Concern | Decision |
|---|---|
| Migration shape | **In-place additive**. Keep `gt-*` Tailwind tokens during transition; introduce parallel `ai-*` tokens. Keep `src/components/redesign/*` for legacy pages until each is migrated. |
| New component namespace | `src/components/armor/*` |
| New domain code | `src/lib/armor/*` (certification, MCP pipeline, vuln intel, lab orchestration) |
| New content namespace | `src/content/armor/*` (do not co-mingle with sustainability courses) |
| Routing | New routes under `/knowledge`, `/labs`, `/certification`, `/intel`. The home `/` is rewritten to ArmorInnovate. Greentryst-specific routes (`/carbon`, `/emission-factors`, `/ask`, `/jobs`, `/glossary`, `/frameworks`, `/guides`, `/services`, `/prompt-library`) get archived behind `/legacy/*` or removed in Phase 9. |
| Theme | White & Blue with professional grey accents; mono-first typography; high-performance HMI muted palette with high-contrast alarm states. |

---

## 1. File-by-file refactor plan

### Phase 0 — Foundation (this PR)

| # | File | Action | Notes |
|---|------|--------|-------|
| 0.1 | `tailwind.config.ts` | **modify** | Add `ai-*` token namespace, mono-first font default, HMI shadows, terminal animations. Keep `gt-*` tokens. |
| 0.2 | `src/app/globals.css` | **modify** | Append `@layer base` HMI body, scanline overlay utility, terminal glow keyframes, blink caret, alarm pulse. |
| 0.3 | `src/components/armor/lib/cn.ts` | **create** | Re-export `cn` so armor components do not depend on `redesign/lib`. |
| 0.4 | `src/components/armor/ScadaIcons.tsx` | **create** | PLC, HMI, Actuator, Sensor, RTU, Modbus, Substation icons as flat 1.5-stroke SVGs. |
| 0.5 | `src/components/armor/TerminalBanner.tsx` | **create** | Interactive CLI hero. Auto-types a `armor-cli scan` session, shows mock vuln output, accepts user commands (`help`, `cve`, `scan`, `cert`, `lab`). |
| 0.6 | `src/components/armor/HmiCard.tsx` | **create** | High-contrast HMI tile with status LED (`ok` / `warn` / `crit` / `offline`). |
| 0.7 | `src/components/armor/ArmorNav.tsx` | **create** | Top nav: Knowledge Base, Lab Environment, Certification Path, Vulnerability Intelligence + Sign in. |
| 0.8 | `src/components/armor/ArmorFooter.tsx` | **create** | Minimal mono footer; links comply with `robots.txt`. |
| 0.9 | `src/components/armor/SurpriseMe.tsx` | **create** | Sidebar widget that fetches `/api/armor/surprise` and renders either an ICS brief or a quiz Q. |
| 0.10 | `src/components/armor/index.ts` | **create** | Barrel export. |
| 0.11 | `src/app/page.tsx` | **rewrite** | ArmorInnovate landing. Sections: Terminal Hero → Capability Pillars → Certification Track → Live Vuln Intel Strip → Lab Preview → CTA → Footer. |
| 0.12 | `src/lib/armor/certification.ts` | **create** | TS schema for IEC 62443 4-specialist → Cybersecurity Expert track. |
| 0.13 | `src/lib/armor/mcp-pipeline.ts` | **create** | Topic → (5 lessons + 1 quiz + 1 lab) MCP workflow contract + dry-run executor. |
| 0.14 | `docs/armor-refactor-plan.md` | **create** | This file. |

### Phase 1 — Information architecture

| # | File | Action |
|---|------|--------|
| 1.1 | `src/app/knowledge/page.tsx` | **create** index of knowledge base (replaces `/courses` list semantics) |
| 1.2 | `src/app/knowledge/[slug]/page.tsx` | **create** course detail rendered with HMI tiles |
| 1.3 | `src/app/knowledge/[slug]/[lesson]/page.tsx` | **create** lesson view with terminal-style code blocks |
| 1.4 | `src/app/labs/page.tsx` | **create** lab catalog |
| 1.5 | `src/app/labs/[slug]/page.tsx` | **create** lab launcher (xterm.js + sandboxed runtime) |
| 1.6 | `src/app/certification/page.tsx` | **create** the 4-specialist + expert track visualizer |
| 1.7 | `src/app/intel/page.tsx` | **create** vulnerability intelligence dashboard |
| 1.8 | `src/app/intel/[cve]/page.tsx` | **create** CVE detail |
| 1.9 | `src/app/api/armor/surprise/route.ts` | **create** GET → random brief or quiz |
| 1.10 | `src/app/api/armor/intel/route.ts` | **create** ingestion of CISA ICS-CERT advisories |
| 1.11 | `src/app/layout.tsx` | **modify** Update `metadata.title.default`, `template: '%s \| ArmorInnovate'`, default description, keywords. Replace `MigrationBanner` import with armor variant. |
| 1.12 | `public/robots.txt` | **modify** Adjust disallow list for new IA |
| 1.13 | `public/sitemap.xml` (generated) | **regenerate** via existing scripts |

### Phase 2 — Course engine + MCP integration

| # | File | Action |
|---|------|--------|
| 2.1 | `src/lib/armor/certification.ts` | **expand** Add specialist-track lookup, progress aggregation |
| 2.2 | `src/lib/armor/courses.ts` | **create** Mirror of `src/lib/courses.ts` but loads from `src/content/armor/*` and validates against new schema (lab, certificationTrack, threatModel, isaLevels) |
| 2.3 | `scripts/armor/generate-course.ts` | **create** CLI: `npx tsx scripts/armor/generate-course.ts --topic "Modbus Pentesting" --track ics-pentest`. Calls MCP servers (docs fetcher, lesson generator, quiz generator, lab generator). Writes a fully-formed course folder. |
| 2.4 | `scripts/armor/validate-armor-content.ts` | **create** Schema validator for armor courses |
| 2.5 | `src/app/admin/uploader/page.tsx` | **create** UI form: topic + track → triggers MCP pipeline, streams progress, previews diff, commits on confirm |
| 2.6 | `src/app/api/armor/generate/route.ts` | **create** POST endpoint that fronts `mcp-pipeline.ts` (auth-gated to admin Clerk role) |
| 2.7 | `src/content/armor/iec-62443-foundations/course.yaml` | **create** seed Specialist 1 |
| 2.8 | `src/content/armor/iec-62443-risk-assessment/course.yaml` | **create** seed Specialist 2 |
| 2.9 | `src/content/armor/iec-62443-design/course.yaml` | **create** seed Specialist 3 |
| 2.10 | `src/content/armor/iec-62443-maintenance/course.yaml` | **create** seed Specialist 4 |
| 2.11 | `src/content/armor/iec-62443-expert-capstone/course.yaml` | **create** Cybersecurity Expert capstone |

### Phase 3 — Lab environment

| # | File | Action |
|---|------|--------|
| 3.1 | `src/components/armor/lab/Terminal.tsx` | **create** xterm.js wrapper |
| 3.2 | `src/lib/armor/lab-runtime.ts` | **create** WebSocket bridge to sandboxed runner (server-side) |
| 3.3 | `src/app/api/armor/lab/[id]/socket/route.ts` | **create** WS upgrade handler |
| 3.4 | `infra/lab-runner/` | **create** Dockerfile + entrypoint for ephemeral container with mock PLC (e.g. `pymodbus` simulator) |

### Phase 4 — Vulnerability intelligence

| # | File | Action |
|---|------|--------|
| 4.1 | `scripts/armor/ingest-cisa.ts` | **create** Fetch CISA ICS-CERT JSON feed → normalize → write to DB |
| 4.2 | `drizzle/0001_armor_intel.sql` | **create** Migration: `ics_advisories`, `ics_assets`, `ics_protocols` tables |
| 4.3 | `src/lib/armor/intel.ts` | **create** Query helpers, severity scoring, asset matching |

### Phase 5 — Surprise Me

| # | File | Action |
|---|------|--------|
| 5.1 | `src/lib/armor/surprise.ts` | **create** Pull random brief from intel + random Q from any quiz |
| 5.2 | `src/components/armor/SurpriseMe.tsx` | **already in Phase 0** Wire to API |

### Phase 6 — Brand + SEO finalisation

| # | File | Action |
|---|------|--------|
| 6.1 | `package.json` | **modify** name → `armorinnovate-os`, scripts updated |
| 6.2 | `src/lib/seo/schema.ts` | **modify** Add `iso27001SoftwareApplication`, `cybersecurityCourse`, `professionalCertification` builders. Update `siteGraph()`. |
| 6.3 | `src/components/seo/JsonLd.tsx` | **review** No changes expected; just verify import paths. |
| 6.4 | `public/robots.txt` | **modify** |
| 6.5 | `AGENTS.md` | **modify** Update product name, deploy guardrails, conventions table. |
| 6.6 | `README.md` (or `CLAUDE.md`) | **modify** New mission statement. |

### Phase 7 — Legacy archival

| # | File / dir | Action |
|---|------|--------|
| 7.1 | `src/app/carbon/`, `/emission-factors/`, `/ask/`, `/jobs/`, `/glossary/`, `/frameworks/`, `/guides/`, `/services/`, `/prompt-library/` | **archive or delete** (decision per route). If archived, move to `src/app/legacy/<name>/` and gate behind a feature flag. |
| 7.2 | `src/content/<sustainability-courses>/*` | **archive** Move to `src/content/_legacy-greentryst/` or delete. |
| 7.3 | `scripts/embed-jobs.ts`, `scripts/generate-ef-*.ts`, `scripts/generate-carbon-market-index.ts` | **remove from prebuild** |
| 7.4 | `src/components/redesign/*` | **delete** (after every page migrates off) |
| 7.5 | `src/components/Nav.tsx` | **delete** (replaced by `ArmorNav`) |

---

## 2. IEC 62443 Certification Series — schema design

The track is **4 specialist certificates → 1 expert capstone**. Lifted from the IEC 62443 standard structure (foundations, risk assessment, design, maintenance) and the ISA/IEC Cybersecurity Expert designation requirements.

```ts
// src/lib/armor/certification.ts

export type SpecialistTrack =
  | 'foundations'        // 62443-1-1, 62443-2-1
  | 'risk-assessment'    // 62443-3-2
  | 'design'             // 62443-3-3, 62443-4-2
  | 'maintenance';       // 62443-2-3, 62443-2-4

export interface Specialist {
  id: SpecialistTrack;
  code: string;             // e.g. "AI-CSP-FND"
  name: string;             // "ICS Cybersecurity Fundamentals Specialist"
  isaEquivalent: string;    // mapping to ISA/IEC 62443 Cybersecurity Specialist
  prereqs: SpecialistTrack[];
  domains: string[];        // canonical IEC 62443 part references
  hours: number;            // estimated study hours
  passingScore: number;     // % out of 100
  courses: string[];        // course slug refs
}

export interface ExpertCapstone {
  id: 'cybersecurity-expert';
  name: 'IEC 62443 Cybersecurity Expert';
  requiresAll: SpecialistTrack[];   // ['foundations','risk-assessment','design','maintenance']
  capstoneCourse: string;
  practicalLabHours: number;        // ≥ 40
  practicalExamSlug: string;        // a multi-stage lab
  validityYears: number;            // 3
}

export const CERTIFICATION_TRACK = {
  specialists: [
    { id: 'foundations',      code: 'AI-CSP-FND', name: 'Cybersecurity Fundamentals Specialist',  prereqs: [], hours: 30, passingScore: 75, courses: ['iec-62443-foundations'],          domains: ['62443-1-1','62443-2-1'], isaEquivalent: 'ISA/IEC 62443 Cybersecurity Fundamentals Specialist' },
    { id: 'risk-assessment',  code: 'AI-CSP-RA',  name: 'Risk Assessment Specialist',            prereqs: ['foundations'], hours: 35, passingScore: 75, courses: ['iec-62443-risk-assessment'], domains: ['62443-3-2'], isaEquivalent: 'ISA/IEC 62443 Cybersecurity Risk Assessment Specialist' },
    { id: 'design',           code: 'AI-CSP-DSN', name: 'Design Specialist',                      prereqs: ['foundations'], hours: 40, passingScore: 75, courses: ['iec-62443-design'], domains: ['62443-3-3','62443-4-2'], isaEquivalent: 'ISA/IEC 62443 Cybersecurity Design Specialist' },
    { id: 'maintenance',      code: 'AI-CSP-MNT', name: 'Maintenance Specialist',                 prereqs: ['foundations'], hours: 30, passingScore: 75, courses: ['iec-62443-maintenance'], domains: ['62443-2-3','62443-2-4'], isaEquivalent: 'ISA/IEC 62443 Cybersecurity Maintenance Specialist' },
  ],
  expert: {
    id: 'cybersecurity-expert',
    name: 'IEC 62443 Cybersecurity Expert',
    requiresAll: ['foundations','risk-assessment','design','maintenance'],
    capstoneCourse: 'iec-62443-expert-capstone',
    practicalLabHours: 40,
    practicalExamSlug: 'capstone-pentest-multistage',
    validityYears: 3,
  },
} as const;
```

### Course YAML extensions for ArmorInnovate

```yaml
# src/content/armor/iec-62443-foundations/course.yaml
id: iec-62443-foundations
title: "IEC 62443 Cybersecurity Fundamentals"
certification:
  track: foundations
  code: AI-CSP-FND
  passingScore: 75
isaLevels: [SL1, SL2]
threatModel: ["Stuxnet", "Industroyer", "TRITON"]
modules:
  - id: 0
    title: "ICS vs IT Security Mindset"
    lessons:
      - id: "0.1"
        title: "Purdue Model: Levels 0-5"
        kind: lesson           # lesson | quiz | lab
        durationMin: 35
      - id: "0.2"
        title: "Modbus Protocol Pentesting"
        kind: lab
        labRuntime: pymodbus-simulator
        objectives:
          - "Enumerate Modbus function codes 0x01-0x06"
          - "Identify slave IDs on TCP/502"
          - "Inject a forced coil write and detect via Wireshark"
        successCriteria:
          - "captured.pcap shows function 0x05 to coil 0x0001"
```

---

## 3. MCP content-pipeline workflow

**Topic in → 5 lessons + 1 quiz + 1 terminal lab out.**

### 3.1 MCP server contract

The pipeline assumes 4 MCP servers (registered in `.mcp.json`):

| Server | Purpose |
|---|---|
| `docs.fetcher` | Tools: `search_docs(query)`, `fetch_url(url)`, `extract_pdf(url)`. Sources: NIST SP 800-82r3, IEC 62443 parts, CISA ICS-CERT, ICSCorsair, vendor advisories. |
| `content.generator` | Tools: `generate_lesson(topic, sources[], style)`, `generate_quiz(lesson_md[], n_questions)`, `generate_lab(topic, runtime, difficulty)`. Returns MDX + YAML conformant to our schema. |
| `vuln.intel` | Tools: `search_cve(keyword)`, `cisa_advisory(id)`. Used to anchor lessons on current threats. |
| `lab.scaffolder` | Tools: `create_runtime(spec)`. Generates a Dockerfile + setup script for the lab. |

### 3.2 Workflow (high level)

```
INPUT: topic = "Modbus Protocol Pentesting"
       track = "ics-pentest"

STEP 1  docs.fetcher.search_docs("Modbus pentesting IEC 62443 Modbus security")
        → list of 8-15 source URLs
STEP 2  for each source: docs.fetcher.fetch_url(url) → markdown corpus
STEP 3  vuln.intel.search_cve("Modbus") → top 5 relevant CVEs
STEP 4  content.generator.generate_lesson(...) × 5
        - L1: "Modbus 101: ADU/PDU and function codes"
        - L2: "Threat surface: TCP/502, RTU framing, register attacks"
        - L3: "Reconnaissance: nmap NSE, modbus-cli, mbtget"
        - L4: "Exploitation: forced coil writes, holding-register manipulation"
        - L5: "Defense: deep-packet inspection, allowlisting, IEC 62443-4-2 hardening"
STEP 5  content.generator.generate_quiz(L1..L5, n=10) → quizzes/quiz.yaml
STEP 6  content.generator.generate_lab("modbus-pentest", "pymodbus-simulator", "intermediate")
        → labs/modbus-pentest.yaml + Dockerfile
STEP 7  Validator: scripts/armor/validate-armor-content.ts
        - schema check
        - prereqs resolved
        - all citations present
STEP 8  Write to src/content/armor/<slug>/
STEP 9  Open PR (or stage in-app diff for admin approval)
```

### 3.3 Pipeline TypeScript contract

```ts
// src/lib/armor/mcp-pipeline.ts

export interface GenerateCourseInput {
  topic: string;
  track: 'foundations' | 'risk-assessment' | 'design' | 'maintenance' | 'ics-pentest' | 'ot-defense';
  difficulty: 'intro' | 'intermediate' | 'advanced';
  isaLevels?: ('SL1'|'SL2'|'SL3'|'SL4')[];
}

export interface GenerateCourseOutput {
  slug: string;
  courseYaml: string;
  lessons: { id: string; mdx: string; sources: string[] }[];
  quiz:    { id: string; yaml: string };
  lab:     { id: string; yaml: string; dockerfile: string };
  diagnostics: { warnings: string[]; tokenUsage: number; latencyMs: number };
}

export interface McpPipeline {
  run(input: GenerateCourseInput): AsyncGenerator<PipelineEvent, GenerateCourseOutput>;
}

export type PipelineEvent =
  | { type: 'step.start'; step: string }
  | { type: 'step.done';  step: string; durationMs: number }
  | { type: 'source.found'; url: string; title: string }
  | { type: 'lesson.draft'; index: number; title: string; tokens: number }
  | { type: 'validation';   ok: boolean; messages: string[] };
```

The admin UI at `/admin/uploader` consumes these events over an SSE stream.

---

## 4. Visual & UX system

### 4.1 Color tokens (Tailwind, prefix `ai-`)

| Token | Hex | Use |
|---|---|---|
| `ai-bg`              | `#FFFFFF` | Primary surface |
| `ai-bg-soft`         | `#F4F6F8` | Alternating sections |
| `ai-bg-mute`         | `#E8ECF1` | HMI panel background |
| `ai-ink`             | `#0B1220` | Primary text |
| `ai-ink-soft`        | `#3D4A5F` | Secondary text |
| `ai-ink-dim`         | `#6B7A90` | Tertiary text |
| `ai-line`            | `#D7DEE8` | Borders |
| `ai-primary`         | `#1E3A8A` | Primary CTAs (deep industrial blue) |
| `ai-primary-hover`   | `#1E40AF` | Hover state |
| `ai-accent`          | `#2563EB` | Links / focused state |
| `ai-cyber`           | `#06B6D4` | Terminal accent / live signal |
| `ai-deep`            | `#0B1F3A` | Dark surface (terminal bg, hero) |
| `ai-deep-2`          | `#0F172A` | Deeper terminal |
| `ai-grid`            | `#1F2937` | Terminal grid lines |
| `ai-ok`              | `#16A34A` | Status nominal |
| `ai-warn`            | `#D97706` | Warning (saturated amber, HMI principle) |
| `ai-crit`            | `#DC2626` | Critical alarm (saturated red) |
| `ai-offline`         | `#6B7280` | Offline state |
| `ai-mono-on-deep`    | `#E2E8F0` | Mono text on dark |
| `ai-cyan-glow`       | `#67E8F9` | Cyan glow accent |

> **High-performance HMI principle**: muted backgrounds (`ai-bg-mute`, `ai-deep`) keep the eye calm; only alarms (`ai-crit`, `ai-warn`) are saturated. Never use `ai-crit` for a CTA.

### 4.2 Typography

- **Display**: JetBrains Mono 700 (already loaded) — for hero, headings, terminal.
- **Body**: Inter 400/500/600 (already loaded) — for prose.
- **Code / data**: JetBrains Mono 400/500.

### 4.3 Iconography

Custom SVG set (`src/components/armor/ScadaIcons.tsx`): `IconPLC`, `IconHMI`, `IconActuator`, `IconSensor`, `IconRTU`, `IconModbus`, `IconSubstation`, `IconShield`, `IconTerminal`. Stroke 1.5, square caps, `currentColor`.

### 4.4 Terminal banner behavior

1. On mount: types out a cinematic command session (auto-types ~2.5 s).
2. After autotype: caret blinks; user can type `help`, `cve`, `scan`, `cert`, `lab`, `clear`.
3. Each command returns formatted, color-coded output.
4. Reduced motion: skips autotype, renders final state.
5. ARIA: live region announces command output; input has `aria-label`.

---

## 5. Surprise Me

- Sidebar drawer slides in from the right.
- Picks at random from:
  - **ICS Brief**: a 90-word security note pulled from `intel` table or static seed.
  - **Quick Quiz**: random Q from any course quiz YAML.
- API: `GET /api/armor/surprise?kind=auto|brief|quiz`.
- Cached for 60 s per IP via Upstash to keep it cheap; user can click "Another".

---

## 6. Acceptance for this PR (Phase 0)

- [x] Tailwind compiles with both `gt-*` and `ai-*` namespaces.
- [x] `globals.css` has no breaking changes for legacy pages.
- [x] `/` renders the new ArmorInnovate landing.
- [x] Every other route still works (Greentryst nav/footer remain intact).
- [x] No new `npm` dependencies introduced (Phase 0 stays zero-dep).
- [x] All new files typecheck.

---

## 7. Phase order, dependency-aware

```
Phase 0 (foundation, this PR)
  ↓
Phase 1 (IA & routes) ── parallel ──> Phase 6 (brand/SEO)
  ↓
Phase 2 (course engine + MCP)
  ↓
Phase 3 (lab) ── parallel ──> Phase 4 (vuln intel)
  ↓
Phase 5 (Surprise Me wiring)
  ↓
Phase 7 (legacy archival) ← only after all routes migrated
```
