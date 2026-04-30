# Tools: ML Strategy

Working note on how the Greentryst tool suite should be built. The rule of thumb: default to deterministic code or small trained ML. Reach for an LLM only when the task genuinely requires free-form generation or novel reasoning.

## Build-type decision matrix

| Task shape | Build type | Why |
|---|---|---|
| Formula-driven calculation (GHG, Scope 1/2/3 rollups, CBAM embedded emissions, intensity ratios) | Pure deterministic code + emission-factor lookup tables | Auditable, reproducible, zero per-query cost. LLMs hallucinate factors and are a liability here. |
| Narrow classification (materiality tagging, disclosure mapping to ESRS/BRSR, sector assignment, Scope 3 category routing) | Small trained classifier over embeddings | Inference is nearly free and offline. Accuracy on narrow tasks often beats zero-shot LLM. |
| Structured extraction from known document templates (pulling metrics out of annual sustainability reports) | Hybrid: embedding search + rule-based parser, small extraction model as fallback | Templates repeat; rules cover 80%+ at zero cost. |
| Free-form drafting (Report Drafter, narrative sections of disclosures) | LLM | Generation is the task. |
| Novel question answering over primary sources | LLM with retrieval (SustainIQ) | Reasoning over passages. |

## Infrastructure we already have

1. **Voyage context-3 embeddings** are paid for and loaded in RAM on the ask-server. The same embedding space can power a dozen downstream classifiers at zero marginal cost.
2. **Primary-source corpus** (80-90 PDFs indexed, VM0042, EU CBAM, CSRD/ESRS, IPCC AR6, GHG Protocol) is usable as weak supervision signal for training data.
3. **Groq** is available for one-time bulk labeling runs when we need to bootstrap training data for a classifier.

## Cost profile by build type

- Deterministic calc: $0 per query, forever.
- Small classifier (local inference): ~$0 per query after training. Training cost is a one-time ~$10-50 of compute plus labeled-data effort.
- LLM call: ~$0.005-0.05 per query, every query, forever. At 1000 queries/day this is $5-50/day per tool.

The gap is the whole argument for ML-first tooling at scale.

## Open question on labeled data

Every classifier we build needs ~500-5000 labeled examples. Three routes:
1. Hand-label the top vendors or top N items that cover 80% of the customer's volume (Pareto approach).
2. Use an LLM once to label 10k examples, then distill into a small model (weak supervision).
3. Combine public datasets (US Census NAICS descriptions, BEA crosswalks, open procurement data) with a modest hand-labeled evaluation set.

Default to route 2 plus a hand-labeled evaluation set of ~500 for measuring quality.


# First Pilot: Scope 3 Category 1 Classifier

## Problem

A corporate customer uploads a spend ledger: hundreds of thousands of line items, each with a free-text description (e.g. `PRINTER CARTRIDGE HP 78A BLK`, `Legal retainer - Dentons Q3`, `Factory floor paint, 50L`), a vendor name, usually a GL code, and a dollar amount. We need to compute Category 1 (Purchased Goods and Services) emissions.

The economic-input-output (EEIO) method computes emissions as:

```
tCO2e_per_line = spend_usd * EF_kgCO2e_per_usd(commodity) / 1000
```

where `EF` comes from the US EPA USEEIO v2.0 dataset, keyed on BEA commodity codes (roughly 400 commodities, crosswalked to NAICS 6-digit).

The hard part is **mapping each free-text line item to the right BEA/NAICS commodity code**. That mapping is the classifier we need to build.

## Why a classifier, not an LLM

- Per-ledger volume is 10k-1M line items. LLM-calling every one is cost-prohibitive and slow.
- The label space is fixed (about 400 USEEIO commodities), ideal for a trained classifier.
- Results must be auditable and reproducible for assurance. A classifier producing consistent outputs is easier to defend than an LLM that might classify the same line two ways on two days.

## Target architecture

### Layer 1: vendor-item memory (exact or near-exact match, $0)

Keying memory on vendor alone is wrong. Large suppliers (Amazon, Grainger, generic industrial distributors, even many mid-size vendors) ship items across dozens of BEA codes. Vendor-as-key would collapse all of Amazon into one commodity, which is nonsense.

Correct design: the memory is keyed on `(vendor_normalized, item_signature)`, where `item_signature` is a normalized description string, or better, a hash of the top-K most significant tokens, or an embedding-cluster ID. For single-category vendors (a local electrician, a law firm, a utility) the memory naturally collapses to vendor-only because every item under that vendor lands in the same cluster. For multi-category vendors we keep 20-100 distinct entries.

Vendor is also kept as a **feature** passed into Layer 3, not just a memory key, because it carries real signal independent of the description.

### Layer 2: rule-based shortcuts ($0)

Dictionary lookups for unambiguous keywords:
- `electricity|kwh|power bill` -> utility commodity (also flag as potential Scope 2, not Cat 1)
- `flight|airline|hotel` -> business travel (Category 6, not Cat 1 -> route elsewhere)
- GL-code based rules (e.g. `gl=6200` -> IT services) where the customer has a consistent chart of accounts

This layer is primarily a **category router**, filtering out lines that belong to other Scope 3 categories before the classifier runs.

### Layer 3: ML classifier (the main engine)

- **Input features:** concatenated string of `vendor_name || description || gl_code_description`, plus numeric features `log(spend)`, `unit_price_if_available`.
- **Embedding:** Voyage context-3 for the text portion. This reuses existing infrastructure and gives us a 1024-dim vector per line item.
- **Model:** start with a simple head. Options in increasing complexity:
  1. **Nearest-neighbour over class prototypes.** For each BEA code, embed its official description + a handful of example line items, average into a prototype. At inference, cosine-similarity the input against all 400 prototypes. Zero training needed; accuracy probably 60-75%.
  2. **Logistic regression (or linear SVM) on embeddings.** Fast training, interpretable, ~5-10 MB model. Likely 80-88% accuracy with decent labels.
  3. **Fine-tuned DistilBERT / small transformer classifier** if we outgrow the linear model. Probably 88-93% accuracy but larger and slower.
- **Calibration:** softmax probabilities must be calibrated so a confidence threshold actually means something. Use temperature scaling or isotonic regression on a held-out set.
- **Hierarchical prediction:** classify in two stages, first to the BEA sector (about 20 classes), then to the specific commodity within that sector. Cleaner error modes and lets us report partial confidence ("we know this is manufacturing, not sure which subsector").

### Layer 4: confidence gating and review queue

Every prediction carries a confidence score. Gate:
- `confidence >= 0.85`: auto-accept, apply USEEIO factor.
- `0.60 <= confidence < 0.85`: accept but flag for review. Use in rollup, show in a review tab.
- `confidence < 0.60`: hold. Do not include in rollup until a human resolves. Offer the top 3 predictions with evidence.

This gating is the difference between a useful audit-ready tool and a liability.

### Layer 5: USEEIO factor application

Once we have a BEA code per line, the calculation is trivial multiplication. Attach a data-quality score per line based on:
- How confident the classifier was
- Whether the BEA factor is national-average or region-specific
- Whether spend-based is appropriate for this category (for some lines, average-data or supplier-specific data would be better; flag those)

Total Category 1 emissions = sum over lines. Surface the breakdown by BEA sector, top vendors by emissions, and the review-queue size.

## Training data strategy

### If we have a large pre-labeled corpus (the likely case here)

If we already hold on the order of 100k-500k hand-classified line items at roughly 90% label accuracy, the plan changes materially from the cold-start plan below.

1. **Skip LLM weak supervision entirely.** We are past the bootstrap regime.
2. **Go straight to supervised fine-tuning.** 100k+ labels is enough to fine-tune DistilBERT, or train a MiniLM classifier head on Voyage embeddings that will outperform linear models. Budget maybe a few hours on a single GPU or a CPU training run overnight.
3. **Label-noise correction is the unlock.** At 90% label accuracy, a naive model will memorize the 10% noise and plateau near 90% on the gold set. That ceiling is below what we want for an audit-grade tool. Counter-approach:
   - Train a first-pass classifier on all available labels.
   - Identify examples where the model is highly confident AND disagrees with the given label. These are the likely mislabels, typically 5-15% of the corpus.
   - Re-review that disagreement set with an analyst (or a careful LLM pass on just this subset, which is affordable because the subset is small).
   - Retrain on the cleaned corpus.
   - This is effectively the confident-learning / cleanlab pattern and routinely lifts accuracy several points above the noisy ceiling.
4. **Spend-weight the cleaning pass.** 90% accuracy on line counts could be 99% on dollars (if big tickets were labeled carefully) or 75% on dollars (if they were rushed). Prioritize mislabel review for high-spend lines first. Error in total emissions is driven by the top of the spend distribution; getting those right is worth far more than getting the long tail right.
5. **Realistic targets with this corpus after one cleaning pass:** top-1 accuracy roughly 94-96%, spend-weighted accuracy 98%+. That is defensible in an assurance context.
6. **Hold out a clean gold set from the start.** 500-1000 examples re-labeled by a senior analyst, excluded from both training and the cleaning pass, used only for final evaluation. Without this we cannot quote accuracy numbers honestly.

### Cold-start plan (if we did not have the pre-labeled corpus)

Kept here for completeness and for new tool categories where we lack labels.

1. **Bootstrap with public sources (week 1):**
   - US Census NAICS descriptions (official text for each 6-digit code).
   - BEA-to-NAICS crosswalk (ships with USEEIO).
   - Public procurement datasets (e.g. USAspending.gov has millions of line items labeled with NAICS) for supervised examples.
   - Open-source spend taxonomies (UNSPSC has crosswalks to NAICS).
2. **LLM weak supervision (week 2):**
   - Sample 10-20k line items from a real (anonymized) ledger, send to a frontier LLM with the BEA commodity list and get labels. Budget maybe $50-200 depending on model.
   - Treat these as noisy labels. Use label-model techniques (Snorkel-style) or just bag-of-classifiers to estimate per-example reliability.
3. **Hand-labeled evaluation set (week 2-3):**
   - 500-1000 line items labeled by a sustainability analyst. This is the gold set for measuring accuracy. It must NOT leak into training.
4. **Active learning loop (ongoing):**
   - As the tool is used in anger, low-confidence predictions reviewed by humans feed back into the training set. Retrain quarterly.

## Evaluation

Metrics to report to ourselves during development:
- **Top-1 accuracy** on the gold set, overall and per BEA sector.
- **Macro F1** (since class frequencies are very imbalanced in a typical ledger).
- **Weighted-by-spend accuracy.** Getting a $10M line right matters more than a $200 line. This is the only metric a finance or sustainability lead will care about.
- **Coverage at confidence gate.** What fraction of lines pass the auto-accept threshold? A good classifier should clear 70%+ at the 0.85 threshold on realistic ledgers.
- **Total-emissions error vs. a hand-classified ground truth ledger.** Ultimately the tool is judged on whether the final tCO2e number is within a few percent of a rigorous manual computation.

## Build phases

1. **Prototype (1-2 weeks).** Layer 1 vendor memory + Layer 3 option 1 (nearest-neighbour over class prototypes). Wire to USEEIO factors. Get a working end-to-end tool that produces Category 1 totals from a sample CSV.
2. **Upgrade to linear classifier (1 week).** Bootstrap training set via the public-data and LLM routes above. Train logistic regression. Measure on gold set.
3. **Ship v1 with confidence gating and review queue (1 week).** This is the minimum to put it in front of a customer.
4. **Instrument.** Capture every human correction as a labeled example.
5. **Upgrade classifier model if accuracy ceiling is hit.** Move to DistilBERT only if linear-over-embeddings plateaus below acceptable.

## Open questions

- Do we support region-specific USEEIO factors from day one or punt and use national averages?
- How do we handle multi-line invoices where the descriptions are extremely terse (e.g. just an SKU)? May need a secondary path that looks up the SKU against a product database.
- Do we offer a "supplier-specific" override pathway (GHG Protocol data-quality hierarchy) where a customer uploads actual supplier emissions data that supersedes the spend-based estimate for that vendor?
- Cross-currency ledgers: do we normalize everything to USD before applying USEEIO, or support multi-currency factor tables?
- How do we expose the methodology transparently in the output so an auditor can trace any line back to its BEA code and the exact factor used?
