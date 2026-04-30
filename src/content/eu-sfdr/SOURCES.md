# Source Documents — EU SFDR

All PDFs listed here live in `src/content/eu-sfdr/sources/`.
They are excluded from git (see `.gitignore`) — keep them locally.

## Document → Module Map

| File | Publisher | Document | Version / Date | Covers | Used in Modules |
|------|-----------|---------|----------------|--------|-----------------|
| `CELEX%3A32022R1288R%2801%29%3AEN%3ATXT.pdf` | European Commission | Commission Delegated Regulation (EU) 2022/1288 — SFDR Regulatory Technical Standards (Corrigendum) | 27 December 2022 (OJ L 332) | PAI indicator tables (Annex I), pre-contractual templates (Annexes II–V), periodic report templates (Annexes VI–IX), definitions, entity-level disclosure requirements, general provisions, website disclosure requirements | All modules — core technical reference |
| `CELEX%3A32023R0363%3AEN%3ATXT.pdf` | European Commission | Commission Delegated Regulation (EU) 2023/363 — Amendment to SFDR RTS | 20 February 2023 (in force 20 March 2023) | Technical corrections to RTS, multi-option product (MOP) disclosure requirements, template adjustments | Module 0 (timeline), Module 2 (reclassification), Module 4 (RTS overview) |
| `ESMA_Consolidated_SFDR_QAs.pdf` | ESMA / EBA / EIOPA Joint Committee | Consolidated Questions and Answers on SFDR (Regulation (EU) 2019/2088) and SFDR Delegated Regulation (EU) 2022/1288 | JC 2023 18, updated 4 November 2025 | Scope issues (Section I), sustainable investment definition (Section II), PAI calculation methodology (Sections III–IV), financial product disclosures (Section V), multi-option products (Section VI), Taxonomy-aligned disclosures (Section VII), financial advisers (Section VIII) | Modules 0, 2, 3, 4, 5 |
| `European_Commission_SFDR_FAQ_April_2023.pdf` | European Commission | SFDR FAQ — Interpretive Guidance | April 2023 | Sustainable investment definition, scope of SFDR for non-EU entities, employee headcount, Article 8 binding elements, Article 9 benchmark requirements, PAI entity-level threshold, remuneration (Article 5), interaction with other EU law | Modules 0, 1, 2, 3, 5 |

## Module → Source Map

| Module | Title | Primary Sources |
|--------|-------|----------------|
| 0 — Introduction to SFDR | Origins, scope, and regulatory context | EC FAQ; ESMA Q&As Section I; RTS 2022/1288 Chapter I (definitions); Reg. (EU) 2019/2088 recitals |
| 1 — Entity-Level Disclosures | Article 3–5 firm-level obligations | RTS 2022/1288 Chapters II–III; EC FAQ; ESMA Q&As Sections I, III–IV |
| 2 — Product-Level Classification | Article 6, 8, and 9 categories | RTS 2022/1288 Chapter V, Annexes II–V; EC FAQ; ESMA Q&As Sections II, V |
| 3 — Principal Adverse Impacts | PAI indicators and reporting | RTS 2022/1288 Chapter III, Annex I Tables 1–5; ESMA Q&As Sections III–IV |
| 4 — Regulatory Technical Standards | RTS structure and templates | RTS 2022/1288 (full text, all chapters and annexes); RTS amendment 2023/363; ESMA Q&As Sections III, VII |
| 5 — Compliance and Supervisory Guidance | ESMA Q&As, EC FAQ, greenwashing | ESMA Consolidated Q&As (all sections); EC SFDR FAQ April 2023; ESMA Greenwashing Progress Report 2023 |

## Key Background Legislation (Not in Sources Folder)

The following legislation is referenced throughout the course content but the source PDFs are not held locally. These can be accessed via EUR-Lex:

- **Regulation (EU) 2019/2088 (SFDR Level 1)** — the foundational regulation
- **Regulation (EU) 2020/852 (EU Taxonomy Regulation)** — defines environmentally sustainable activities
- **Commission Delegated Regulation (EU) 2021/2139** — Taxonomy technical screening criteria (climate change mitigation and adaptation)
- **Commission Delegated Regulation (EU) 2021/2178** — Taxonomy Article 8 corporate disclosure requirements (defines KPIs)
- **Directive 2011/61/EU (AIFMD)** — Alternative Investment Fund Managers Directive
- **Directive 2009/65/EC (UCITS Directive)** — Undertakings for Collective Investment in Transferable Securities
- **Directive 2014/65/EU (MiFID II)** — Markets in Financial Instruments Directive

## Verification Command

```bash
# Verify lesson content against PDF sources using Gemini:
gemini -p "Review src/content/eu-sfdr/lessons/3.2.mdx against \
src/content/eu-sfdr/sources/CELEX%3A32022R1288R%2801%29%3AEN%3ATXT.pdf \
Annex I Tables 1-2. Check all indicator formulas, definitions, and \
threshold values for accuracy. Rate content depth 1-10."

# Verify ESMA Q&A content:
gemini -p "Review src/content/eu-sfdr/lessons/5.1.mdx against \
src/content/eu-sfdr/sources/ESMA_Consolidated_SFDR_QAs.pdf. \
Check that all Q&A references are accurate and correctly attributed."

# Verify EC FAQ content:
gemini -p "Review src/content/eu-sfdr/lessons/5.2.mdx against \
src/content/eu-sfdr/sources/European_Commission_SFDR_FAQ_April_2023.pdf. \
Verify all factual claims and clarification references."
```
