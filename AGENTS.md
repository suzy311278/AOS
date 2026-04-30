# Agent Context — Greentryst / Sustainability Academy

## Repository

- **Primary repo**: `https://github.com/questofprajjwal/sustainabilityacademy.git`
- **Project name**: Greentryst (formerly Sustainability Academy)
- **Deploy target**: Vercel — production auto-deploys on push to `main`

> ⚠️ **Do not push to `VM0042-Learning-Module`**. That is an old fork. Always ensure `origin` points to `sustainabilityacademy`.

## Tech Stack

- Next.js 15 (App Router)
- React 19 + TypeScript
- Tailwind CSS
- Clerk (auth)
- Drizzle ORM + PostgreSQL
- MDX for lesson content
- YAML for course metadata & quizzes

## Coding Conventions

- **Metadata titles**: bare title only — root `layout.tsx` appends ` | Greentryst` via `title.template`. Never append the suffix manually in leaf pages.
- **Title length limit**: bare titles must be ≤ 59 characters so the final title (with ` | Greentryst`) stays ≤ 70 characters. Google truncates longer titles.
- **Schema (JSON-LD)**: all builders live in `src/lib/seo/schema.ts`. Import them into page components and inject via `<JsonLd data={...} />`.
- **FAQPage schema for lessons**: auto-generated from quiz Q&As (`explanation` field). See `lessonFaqPageSchema()` in `src/lib/seo/schema.ts`.
- **Footer nav**: do not link to pages blocked by `robots.txt` (e.g. `/jobs`).

## Important Files

| File | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root layout with `title.template: '%s \| Greentryst'` |
| `src/lib/seo/schema.ts` | All JSON-LD schema builders |
| `src/components/redesign/RedesignFooter.tsx` | Footer links — keep in sync with robots.txt |
| `public/robots.txt` | Crawler rules. Any `Disallow:` path should not appear in footer nav. |
| `src/content/*/course.yaml` | Course & lesson metadata, including `seoTitle` / `seoDescription` |
| `src/content/*/quizzes/*.yaml` | Quiz questions — used for FAQPage schema generation |
