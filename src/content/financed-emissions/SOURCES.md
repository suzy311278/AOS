# Source Documents — Financed Emissions

All PDFs listed here live in `src/content/financed-emissions/sources/`.
They are excluded from git (see `.gitignore`). Keep them locally.

## Document to Module Map

| File | Publisher | Document | Version / Date | Covers | Used in Modules |
|------|-----------|---------|----------------|--------|-----------------| 
| `PCAF-PartA-2025-V3-15012026.pdf` | PCAF | The Global GHG Accounting and Reporting Standard Part A: Financed Emissions | Third Edition, December 2025 | 10 asset class methodologies (Listed Equity & Corporate Bonds, Business Loans & Unlisted Equity, Project Finance, Commercial Real Estate, Mortgages, Motor Vehicle Loans, Use of Proceeds, Securitizations, Sovereign Debt, Sub-sovereign Debt), attribution formulas, data quality scoring (1 to 5), GHG accounting principles, reporting requirements and metrics | All modules (primary reference) |
| `PCAF-PartB-FacilitatedEmissions-1stVersion-Dec2023.pdf` | PCAF | The Global GHG Accounting and Reporting Standard Part B: Facilitated Emissions | First Version, December 2023 | Capital market facilitation methodology, bookrunner attribution, 33% weighting factor, league table credit allocation, data quality scoring for facilitated emissions, reporting requirements | Module 0 (standards landscape), Module 4 (facilitated emissions) |
| `PCAF-PartB-ExecutiveSummary.pdf` | PCAF | Facilitated Emissions Executive Summary | December 2023 | Summary of the facilitated emissions formula, attribution factor, weighting factor, and key design choices | Module 4 (facilitated emissions overview) |
| `PCAF-PartC-InsuranceAssociatedEmissions-1stVersion-Dec2023.pdf` | PCAF | The Global GHG Accounting and Reporting Standard Part C: Insurance-Associated Emissions | First Version, December 2023 | Insurance-associated emissions methodology, "follow the risk" principle, commercial lines attribution (premium/revenue), personal motor attribution (total cost of ownership), data quality scoring | Module 0 (standards landscape), Module 4 (insurance-associated emissions) |
| `PCAF-DisclosureChecklist-PartA-May2025.pdf` | PCAF | PCAF Disclosure Checklist for Part A: Financed Emissions | May 2025 | Checklist structure (General Disclosure Criteria, Coverage, Absolute Emissions, Avoided Emissions & Removals, Recalculation & Significance Threshold), signatory disclosure process, step-by-step guide and timeline | Module 5 (disclosure checklist and process) |
| `PCAF-DisclosureChecklist-FAQs-May2025.pdf` | PCAF | Disclosure Checklist: Frequently Asked Questions | May 2025 | FAQs on the DCL template, disclosure process, confidentiality, alignment expectations, and republication guidance | Module 5 (disclosure checklist and process) |
| `PCAF-InsuranceAssociatedEmissions-FAQ.pdf` | PCAF | Insurance-Associated Emissions FAQ | December 2023 | General questions on IAE, methodology for commercial and personal motor lines, scope of emissions, attribution factors, data quality, reporting recommendations, relationship to GHG Protocol | Module 4 (insurance-associated emissions) |
| `PCAF-PersonalMotor-TotalCostOfOwnership-Dec2023.pdf` | PCAF | Personal Motor: Total Cost of Ownership Findings | December 2023 | Global weighted average attribution factor (6.99%), CPI-based methodology, regional breakdown (Advanced EMEA, CEE, North America, Latin America, APAC, Middle East), country-level data, limitations of CPI approach | Module 3 (motor vehicle loans), Module 4 (insurance-associated emissions) |

## Module to Source Map

| Module | Title | Primary Sources |
|--------|-------|----------------|
| 0: Introduction to Financed Emissions | Why financial institutions must account for portfolio carbon | PCAF Part A Chapters 1 to 3; Part B Chapter 1; Part C Chapter 1; GHG Protocol Scope 3 Standard |
| 1: The PCAF Standard | Principles, methodology, and data quality | PCAF Part A Chapters 4 and 5 (introductory sections); Chapter 6 (data quality); Annex 10.1 |
| 2: Asset Class Methodologies, Part 1 | Listed equity, business loans, project finance, real estate, mortgages | PCAF Part A Chapters 5.1 to 5.5; Annex 10.1 Tables 10.1-1 to 10.1-5 |
| 3: Asset Class Methodologies, Part 2 | Motor vehicles, use of proceeds, securitizations, sovereign debt | PCAF Part A Chapters 5.6 to 5.10; Annex 10.1 Tables 10.1-6 to 10.1-8; Motor Vehicle TCO Data |
| 4: Beyond Financed Emissions | Facilitated emissions, insurance-associated emissions, data quality | PCAF Part B (full); Part C (full); Insurance FAQ; Motor Vehicle TCO Data; Part A Chapter 5 (data options) |
| 5: Disclosure, Targets & Regulation | Reporting requirements, target-setting, regulatory landscape | PCAF Part A Chapter 6; Annex 10.2; Disclosure Checklist; Checklist FAQs; Part A Chapter 7 |

## Key Background References (Not in Sources Folder)

The following documents are referenced throughout the course content but their PDFs are not held locally:

- **GHG Protocol Corporate Accounting and Reporting Standard** (WRI/WBCSD, 2004)
- **GHG Protocol Corporate Value Chain (Scope 3) Accounting and Reporting Standard** (WRI/WBCSD, 2011)
- **Technical Guidance for Calculating Scope 3 Emissions** (WRI/WBCSD, 2013)
- **SBTi Financial Institutions Guidance** (Science Based Targets initiative)
- **TCFD Final Report and Recommendations** (Task Force on Climate-related Financial Disclosures)
- **IFRS S2 Climate-related Disclosures** (International Sustainability Standards Board)
- **EU SFDR (Regulation (EU) 2019/2088)** and associated RTS
- **EU Taxonomy Regulation (EU) 2020/852**
- **Basel III Pillar 3 ESG Risk Disclosures**

## Verification Command

```bash
# Verify lesson content against PDF sources using Gemini:
gemini -p "Review src/content/financed-emissions/lessons/2.1.mdx against \
src/content/financed-emissions/sources/PCAF-PartA-2025-V3-15012026.pdf \
Chapter 5.1. Check all attribution formulas, EVIC definition, and \
data quality scores for accuracy. Rate content depth 1-10."

# Verify facilitated emissions content:
gemini -p "Review src/content/financed-emissions/lessons/4.1.mdx against \
src/content/financed-emissions/sources/PCAF-PartB-FacilitatedEmissions-1stVersion-Dec2023.pdf. \
Verify the 33% weighting factor, league table credit, and formula accuracy."

# Verify disclosure checklist content:
gemini -p "Review src/content/financed-emissions/lessons/5.2.mdx against \
src/content/financed-emissions/sources/PCAF-DisclosureChecklist-PartA-May2025.pdf. \
Verify all checklist categories and process steps are accurately described."
```
