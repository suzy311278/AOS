# Source Documents — VM0042 v2.2

All PDFs listed here live in `src/content/vm0042/sources/`.
They are excluded from git (see `.gitignore`) — keep them locally.

## Document → Module Map

| File | Covers | Used in |
|------|--------|---------|
| `VM0042v2.2.pdf` | Full methodology: scope, definitions, boundary, baseline, additionality, quantification, monitoring | Modules 0–5 (all core ALM content) |
| `VT0008-Additionality-Assessment-v1.0.pdf` | Four-step additionality framework; barrier, investment, common practice tests | Module 7 (Additionality in Depth) |
| `VMD0053v2.1_BIOGEOCHEMICAL_MODEL_CALIBRATION_VALIDATION_AND_UNCERTAINTY_GUIDANCE_FOR_ALM_clean.pdf` | Biogeochemical model calibration, validation, bias tests, MVR | Module 8 (Model Calibration & Validation) |
| `AFOLU-Non-Permanence-Risk-Tool-v4.2-last-updated-May-3-2024.pdf` | Risk scoring tables, internal/external/natural risk factors, buffer determination | Module 9 (Non-Permanence Risk) |
| `Registration-and-Issuance-Process-v5.0.pdf` | Pipeline listing, project registration steps, VCU issuance | Module 6.1 (The Registration Journey) |
| `VCS-Program-Guide-v5.0.pdf` | VCU lifecycle, buffer pool, retirement, ongoing obligations | Module 6.2 (VCU Lifecycle) |
| `Clarification-Verra-Program-Fee-Schedule-April-2025.pdf` | Fee schedule for registration, verification, issuance | Module 6.1 (fees sidebar) |

## How Content Was Produced

1. PDFs were reviewed section-by-section.
2. Lesson content was authored in MDX (`lessons/<id>.mdx`) with explicit `vmRef` fields in `course.yaml` pointing to the exact section of the source document.
3. Quiz questions (`quizzes/<id>.yaml`) were cross-checked against the source PDFs for accuracy.
4. AI-assisted review was run against the PDFs using `gemini` and `codex` CLIs for factual accuracy before finalising each lesson.

## Verification Command

```bash
# Run against a specific lesson and PDF to check accuracy
gemini -p "Review lessons/3.1.mdx against VM0042v2.2.pdf Section 8.1. Check all formulas, thresholds, and tables."
```
