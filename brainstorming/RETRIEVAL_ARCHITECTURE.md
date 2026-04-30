# SustainIQ Retrieval Architecture: Design for Maximum Precision

**Date:** April 2026
**Status:** Architectural decision, pre-implementation
**Context:** Defines the retrieval pipeline for SustainIQ, Greentryst's verified knowledge engine. The goal is maximum retrieval precision over 80+ sustainability source documents (methodologies, regulations, standards, frameworks). The synthesis model (Gemma 4 26B MoE) is capable enough that retrieval quality is the binding constraint on answer quality.

## 1. Design Principle

The model is smart enough. The question is whether we feed it the right information.

Every layer of this pipeline exists to ensure that when a user asks "What is the baseline period for VM0042 and how does it affect additionality?", the model receives exactly the right chunks from exactly the right sections, with full source metadata, in the right order, with enough surrounding context to synthesize a defensible, cited answer.

## 2. The Five-Layer Pipeline

### Layer 1: Document Parsing (PDF to Structured Text)

**Tool:** Docling (IBM, open source) or LlamaParse (commercial alternative)

**What it does:** Layout-aware extraction that preserves document structure. Not just raw text extraction.

**Requirements:**
- Preserve heading hierarchy (Section, Subsection, Paragraph)
- Extract tables as structured data (not flattened text)
- Extract formulas with variable definitions
- Identify cross-references ("as defined in Section 5.1")
- Identify definitions ("'Project Area' means...")
- Preserve list/requirement numbering
- Output: structured JSON with hierarchy, not flat text

**Why it matters:** Parsing quality sets the ceiling for everything downstream. If table structure is lost at parsing, no amount of embedding sophistication recovers it. Most RAG pipelines silently fail here.

### Layer 2: Chunking (Structured Text to Retrievable Units)

**Method:** Multi-resolution hierarchical chunking with parent-child relationships

**Not:** Fixed-size token splitting with overlap. This cuts sentences mid-thought, separates requirements from context, and splits tables from headers.

**How it works:** For each document, create chunks at four levels of granularity simultaneously:

```
Level 1 (Document): "VM0042 v2.2 - Methodology for Improved 
         Agricultural Land Management"
    |
Level 2 (Section): "Section 3: Applicability Conditions"
    |               Full text of section (~2000 tokens)
    |
Level 3 (Subsection): "Section 3.1.2: Baseline Period Requirements"  
    |                  Full text of subsection (~300 tokens)
    |
Level 4 (Atomic): "The baseline period shall be the 10 years 
                   prior to the project start date."
                   Single requirement (~30 tokens)
```

**Every chunk carries:**
- Its full text
- Its parent chunk ID (so 3.1.2 knows it belongs to Section 3)
- Its children chunk IDs
- Document metadata (source name, version, page numbers)
- Any cross-references it contains

**Retrieval strategy:** Search at the atomic level (Level 4) for precision, return the parent chunk (Level 3 or 2) for context. This is "small-to-big retrieval." The small chunk matches the query precisely. The big chunk gives the model enough surrounding context to answer correctly.

### Layer 3: Embedding (Chunks to Vectors)

**Model:** BGE-M3 (open source, supports dense + sparse + multi-vector simultaneously) or Cohere embed-v4 (commercial)

**Multiple embeddings per chunk:**

For each chunk, generate and store three embeddings:

1. **Raw text embedding:** Catches exact terminology matches
2. **Hypothetical question embeddings (HyDE):** Generate 2-3 questions this chunk would answer. "What is the baseline period for VM0042?" is semantically closer to a hypothetical question than to the raw statement text. Generated once at index time using a model.
3. **Summary embedding:** A one-line abstract of what this chunk is about

**Domain vocabulary alignment (optional, Phase 2):**

Fine-tune the embedding model on sustainability text pairs:
- Term + definition pairs from the glossary (190+ terms)
- Question + answer pairs from course content
- 1000-2000 pairs, trains in minutes, near-zero cost
- Reorganizes the vector space so domain-specific relationships are captured precisely

### Layer 4: Indexing and Retrieval

**Architecture:** Hybrid index with metadata filtering, graph-based connections, and cross-encoder re-ranking.

```
User Query
    |
    v
Query Understanding (decomposition + expansion)
    |
    v
+------------------+------------------+------------------+
|  Dense Vector    |  Sparse BM25/    |  Graph           |
|  Search          |  SPLADE Search   |  Traversal       |
|  (semantic)      |  (keyword/exact) |  (cross-refs)    |
+--------+---------+--------+---------+--------+---------+
         |                  |                  |
         +--------+---------+                  |
                  |                             |
         Hybrid Fusion (RRF)                    |
                  |                             |
                  +-------------+---------------+
                                |
                         Cross-Encoder Re-Ranker
                         (bge-reranker-v2-m3)
                                |
                         Parent Chunk Expansion
                                |
                         Ordered Context Assembly
```

**Dense vector search:** Finds semantically similar chunks. Good for natural language: "how do I handle uncertainty in carbon credit projects" matches uncertainty analysis chunks even without exact word overlap.

**Sparse keyword search (BM25 or SPLADE):** Finds exact term matches. Critical for technical queries: "VM0042 Section 3.1.2" needs exact matching, not semantic similarity.

**Hybrid fusion (Reciprocal Rank Fusion):** Merges results from both searches. Chunks ranking highly in both get boosted. Catches queries that mix natural language with technical terms.

**Graph traversal:** When a retrieved chunk contains a cross-reference ("as defined in Section 5.1"), the system automatically follows that reference and pulls in the referenced chunk. Sustainability documents are dense with cross-references. Without graph traversal, the model sees "apply the criteria from Section 5.1" but never sees Section 5.1.

**Cross-encoder re-ranker:** Takes the top 20-30 candidates and re-scores using a cross-encoder model. Cross-encoders see the query AND the chunk together and reason about their relationship. Dramatically more accurate than embedding-based scoring. Too slow for full-index search, perfect for re-scoring candidates.

**Parent chunk expansion:** After re-ranking, expand top 5-10 atomic chunks to their parent chunks. The model gets precise, relevant chunks with full surrounding context.

### Layer 5: Query Processing

**Query decomposition:** Complex queries are split into sub-queries, retrieved separately, then merged.

```
User: "How does CSRD affect Indian companies doing BRSR?"

Decomposed:
  Q1: "CSRD scope and applicability to non-EU companies"
  Q2: "BRSR and CSRD alignment and differences"
  Q3: "Indian companies subject to CSRD reporting"

Retrieve for each -> merge -> re-rank -> synthesize
```

**Query expansion:** Add synonyms and related terms from the glossary. "GHG emissions" also searches for "greenhouse gas," "carbon emissions," "Scope 1 2 3."

**HyDE at query time:** Generate a hypothetical answer to the query, embed that, and use it as an additional search vector. The hypothetical answer is closer in vector space to the real answer chunks than the question itself is.

## 3. Context Assembly and Synthesis

After retrieval, the context is assembled for the synthesis model:

```
System prompt: citation format, tone, domain rules, 
               "say I don't know" behavior

Retrieved chunks (ordered by document structure, 
                  not retrieval score):
  [Chunk 1] VM0042 v2.2, Section 3.1.2, p.14
  [Chunk 2] VM0042 v2.2, Section 5.1, p.23
  [Chunk 3] VM0042 v2.2, Section 5.1.3, p.25

User query: original question
```

Ordering by document structure (section 3 before section 5) rather than retrieval score helps the model follow the logical flow of the source document.

## 4. Synthesis Model

**Primary:** Gemma 4 26B MoE (local, Q4 quantization, 32GB Mac)
- 3.8B active parameters per token (efficient)
- 256K context window (fits rich retrieval context + detailed system prompt)
- No fine-tuning needed (MoE architecture not suited for QLoRA)
- ~40-50 tok/s locally at Q4

**Fallback for complex queries:** Groq/Llama 70B or Claude API
- Route by estimated query complexity
- Simple lookups (single-source) go to local 26B MoE
- Complex multi-framework reasoning goes to cloud model
- Expected split: 90% local, 10% cloud

## 5. Implementation Priority

| Priority | Component | Effort | Impact |
|----------|-----------|--------|--------|
| 1 | Better PDF parsing (Docling) | 2-3 days | Huge |
| 2 | Section-aware hierarchical chunking | 2-3 days | Huge |
| 3 | Hybrid search (dense + BM25) | 1-2 days | Large |
| 4 | Cross-encoder re-ranking | 1 day | Large |
| 5 | Parent chunk expansion | 1 day | Medium |
| 6 | HyDE embeddings | 2-3 days | Medium |
| 7 | Query decomposition | 2-3 days | Medium |
| 8 | Graph traversal (cross-references) | 3-5 days | Medium |
| 9 | Domain embedding fine-tuning | 1-2 days | Small-medium |

Items 1-4 deliver 80% of the quality improvement. Items 5-9 are the remaining 20%. Build incrementally.

## 6. What This Achieves

A user asking "What is the baseline period for VM0042 and how does it affect additionality?" gets:

"The baseline period for VM0042 is the 10 years prior to the project start date (VM0042 v2.2, Section 3.1.2, p.14). This directly impacts additionality demonstration because the baseline scenario must reflect land management practices during this period (Section 5.1, p.23). If practices changed significantly within the baseline period, the project must demonstrate that the change would not have occurred without carbon credit revenue (Section 5.1.3, p.25)."

Every claim cited. Every source verifiable. The trust principle holds.

## 7. Future: Agentic Retrieval

The frontier beyond this pipeline is agentic retrieval, where the synthesis model itself decides mid-generation that it needs more information and triggers additional retrievals. "I'm writing about the additionality requirements but I need to check the leakage provisions too" triggers an automatic second retrieval pass. This is the current edge of RAG research and would be a Phase 3+ consideration.

## 8. Relationship to Tools Layer

The tools (GHG Calculator, Report Drafter, BRSR Screener) use the same indexed document store but through a different model:

- **Tools:** Gemma 4 E4B (fine-tuned with LoRA adapters, ~4 GB RAM)
- **SustainIQ:** Gemma 4 26B MoE (no fine-tuning, prompt-engineered, ~16-18 GB RAM)
- **Both run locally** on a 32GB Mac (~20-22 GB total)
- **Both query the same retrieval engine** for source documents and emission factors
- **Both enforce the trust principle:** every output is sourced and citable
