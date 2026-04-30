#!/usr/bin/env python3
"""
Batch 2: Index next 25 PDFs with zero-LLM Docling
Runs in parallel with batch 1.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import from the main script
from pathlib import Path
import json
import time

# Reuse functions from main script
exec(open('scripts/index-docling-zero-llm.py').read())

BATCH2_PDFS = [
    "src/content/vm0042/sources/Clarification-Verra-Program-Fee-Schedule-April-2025.pdf",
    "src/content/eu-cbam/sources/EC-CBAM-Developing-Countries.pdf",
    "src/content/esg-investing/sources/2021-Contents.pdf",
    "src/content/circular-economy/sources/EU_Waste_Framework_Directive_2008_98_EC.pdf",
    "src/content/eu-cbam/sources/EC-CBAM-Guidelines-Operational-Procedures-2026.pdf",
    "src/content/eu-sfdr/sources/European_Commission_SFDR_FAQ_April_2023.pdf",
    "src/content/financed-emissions/sources/PCAF-DCL-Part-A-FAQs-May2025.pdf",
    "src/content/financed-emissions/sources/20221212_faq-insurance-associated-emissions.pdf",
    "src/content/ifrs-s2/sources/issb-2023-b-ifrs-s2-climate-related-disclosures-illustrative-guidance-part-b.pdf",
    "src/content/human-rights-dd/sources/ILO-Just-Transition-Guidelines-2015.pdf",
    "src/content/eu-cbam/sources/EC-CBAM-NCA-List.pdf",
    "src/content/ifrs-s2/sources/issb-2025-1-amendments-ifrs-s2.pdf",
    "src/content/tnfd-biodiversity/sources/Kunming-Montreal-GBF-2022.pdf",
    "src/content/financed-emissions/sources/20231211-PCAF-personal-motor-industry-attribution-factor-approach.pdf",
    "src/content/ifrs-s2/sources/issb-2025-c-basis-for-conclusions-on-ifrs-s2-climate-related-disclosures-part-c.pdf",
    "src/content/human-rights-dd/sources/ILO-MNE-Tripartite-Declaration-2022.pdf",
    "src/content/vcm-101/sources/VCMI-Claims-Code-Explanatory-Notes-Nov-2023.pdf",
    "src/content/ghg-scope-1-2/sources/electricityemissions.pdf",
    "src/content/eu-cbam/sources/EC-CBAM-Default-Values-Transitional.pdf",
    "src/content/vcm-101/sources/GoldStandard-Stakeholder-Consultation-v2.1.pdf",
    "src/content/eu-sfdr/sources/EC_2023_SFDR_Targeted_Consultation.pdf",
    "src/content/eu-sfdr/sources/ESAs_Joint_Opinion_JC_2024_06.pdf",
    "src/content/vcm-101/sources/GoldStandard-Claims-Guidelines-v2.0.pdf",
    "src/content/vcm-101/sources/Verra-VCS-Program-Definitions-v4.5.pdf",
    "src/content/article-6/sources/paris-agreement.pdf",
]

if __name__ == "__main__":
    print(f"BATCH 2: Indexing {len(BATCH2_PDFS)} PDFs (parallel with batch 1)")
    print(f"Output: {OUTPUT_DIR}")

    success = 0
    failed = 0

    for i, pdf_path in enumerate(BATCH2_PDFS, 1):
        print(f"\n[B2 {i}/{len(BATCH2_PDFS)}] {pdf_path}")
        if os.path.exists(pdf_path):
            if index_pdf(pdf_path):
                success += 1
            else:
                failed += 1
        else:
            print(f"  SKIP: File not found")
            failed += 1

    print(f"\n{'='*60}")
    print(f"BATCH 2 COMPLETE: {success} success, {failed} failed")
    print(f"{'='*60}")
