# Source Documents - TNFD & Biodiversity

All PDFs listed here live in `src/content/tnfd-biodiversity/sources/`.
They are excluded from git (see `.gitignore`), keep them locally.

## Document Map

| File | Covers | Used in |
|------|--------|---------|
| `TNFD-Final-Recommendations-v1.0.pdf` | Full TNFD framework: governance, strategy, risk management, metrics and targets, 14 recommended disclosures | Modules 1, 4, 5 |
| `TNFD-LEAP-Guidance-v2.pdf` | The LEAP approach (Locate, Evaluate, Assess, Prepare), scoping guidance, sector-specific application, data and analytics | Modules 1, 2, 3 |
| `IPBES-Global-Assessment-2019.pdf` | State of biodiversity, five direct drivers of loss, ecosystem services, nature's contributions to people | Module 0 |
| `Kunming-Montreal-GBF-2022.pdf` | Kunming-Montreal Global Biodiversity Framework, 23 targets, monitoring framework, resource mobilisation | Modules 5.2, 5.3, 5.4 |
| `SBTN-Initial-Guidance-2023.pdf` | Science Based Targets for Nature, AR3T framework (Avoid, Reduce, Restore/Regenerate, Transform), freshwater and land targets | Module 3.3 |
| `ENCORE-Methodology.pdf` | ENCORE tool methodology, natural capital dependencies and impacts by sector, materiality mapping | Module 3.2 |

## Additional References

| Resource | Type | Used in |
|----------|------|---------|
| TNFD Sector Guidance (Agriculture, Mining, Financial Institutions) | Sector supplements | Module 4 |
| IBAT (Integrated Biodiversity Assessment Tool) documentation | Tool reference | Module 3.2 |
| EU Deforestation Regulation (EUDR) | Regulatory text | Module 5.4 |
| GRI 304: Biodiversity 2016 | Reporting standard | Module 1.4 |

## How Content Was Produced

1. PDFs were reviewed section by section.
2. Lesson content was authored in MDX (`lessons/<id>.mdx`) with explicit `vmRef` fields in `course.yaml` pointing to the exact section of the source document.
3. Quiz questions (`quizzes/<id>.yaml`) were cross-checked against the source PDFs for accuracy.
4. AI-assisted review was run against the PDFs using `gemini` and `codex` CLIs for factual accuracy before finalising each lesson.

## Verification Command

```bash
# Run against a specific lesson and PDF to check accuracy
gemini -p "Review lessons/1.3.mdx against TNFD-LEAP-Guidance-v2.pdf. Check all framework steps, definitions, and process descriptions."
```
