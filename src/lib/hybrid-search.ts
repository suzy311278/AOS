/**
 * Hybrid Search: Vector (BGE) + BM25 Keyword with Reciprocal Rank Fusion
 *
 * At query time:
 * 1. Embed the query via Cloudflare Workers AI (bge-base-en-v1.5)
 * 2. Cosine similarity against pre-computed section embeddings (vector search)
 * 3. Keyword match against technical_index fields (BM25-like scoring)
 * 4. Reciprocal Rank Fusion to merge both ranked lists
 * 5. Return top-K sections
 */

import fs from "fs";
import path from "path";
import { rerank } from "./reranker";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SectionEmbedding {
  node_id: string;
  doc_title: string;
  course: string;
  section_title: string;
  start_page: number;
  end_page: number;
  technical_index: string;
  embed_text: string;
  bm25_text: string;  // Chunk/section text for keyword search
  chunk_index?: number;
  total_chunks?: number;
  full_tree_path: string;
  embedding: number[];
}

interface EmbeddingsIndex {
  model: string;
  dimensions: number;
  count: number;
  chunk_level?: boolean;
  sections: SectionEmbedding[];
}

export interface SearchResult {
  node_id: string;
  doc_title: string;
  course: string;
  section_title: string;
  start_page: number;
  end_page: number;
  full_tree_path: string;
  score: number;
}

// ---------------------------------------------------------------------------
// Voyage AI embedding
// ---------------------------------------------------------------------------

const VOYAGE_MODEL = "voyage-4-lite";

async function embedQuery(text: string): Promise<number[]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error("VOYAGE_API_KEY not set");

  const resp = await fetch("https://ai.mongodb.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: [text],
      model: VOYAGE_MODEL,
      input_type: "query",
    }),
  });

  const data = (await resp.json()) as {
    data?: { embedding: number[] }[];
    detail?: string;
  };

  if (!data.data || data.data.length === 0) {
    // Fallback: try via fetch with different auth if Bearer fails
    throw new Error(`Voyage AI embedding failed: ${data.detail || "unknown error"}`);
  }
  return data.data[0].embedding;
}

// ---------------------------------------------------------------------------
// Load pre-computed embeddings
// ---------------------------------------------------------------------------

const EMBEDDINGS_PATH = path.join(
  process.cwd(),
  "data/page-indexes/section-embeddings.json"
);

let cachedIndex: EmbeddingsIndex | null = null;
let cacheTime = 0;
const CACHE_TTL = 60_000; // reload every 60s to pick up new embeddings

function loadEmbeddings(): EmbeddingsIndex | null {
  const now = Date.now();
  if (cachedIndex && now - cacheTime < CACHE_TTL) return cachedIndex;

  if (!fs.existsSync(EMBEDDINGS_PATH)) return null;
  cachedIndex = JSON.parse(fs.readFileSync(EMBEDDINGS_PATH, "utf-8"));
  cacheTime = now;
  return cachedIndex;
}

// ---------------------------------------------------------------------------
// Vector search (cosine similarity)
// ---------------------------------------------------------------------------

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom > 0 ? dot / denom : 0;
}

function vectorSearch(
  queryVec: number[],
  sections: SectionEmbedding[]
): { idx: number; score: number }[] {
  return sections
    .map((s, idx) => ({ idx, score: cosine(queryVec, s.embedding) }))
    .sort((a, b) => b.score - a.score);
}

// ---------------------------------------------------------------------------
// Keyword search (BM25-like scoring on technical_index + title)
// ---------------------------------------------------------------------------

// Sections to exclude from results (never contain answers)
const EXCLUDED_TITLES = new Set([
  "references",
  "document history",
]);

function isExcluded(title: string): boolean {
  return EXCLUDED_TITLES.has(title.toLowerCase().trim());
}

function keywordSearch(
  query: string,
  sections: SectionEmbedding[]
): { idx: number; score: number }[] {
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower
    .replace(/[^\w\s.]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);

  // Detect equation/table number patterns for heavy boosting
  const eqMatch = queryLower.match(/(?:equation|eq\.?)\s*(\d+)/i);
  const tableMatch = queryLower.match(/(?:table)\s*(\d+)/i);
  const targetEq = eqMatch ? eqMatch[1] : null;
  const targetTable = tableMatch ? tableMatch[1] : null;

  return sections
    .map((s, idx) => {
      // Search against full text (bm25_text) + title + technical_index
      const titleAndIndex = `${s.section_title} ${s.technical_index} ${s.doc_title}`.toLowerCase();
      const fullText = (s.bm25_text || "").toLowerCase();
      let score = 0;

      // Equation/table number exact match (massive boost)
      if (targetEq) {
        const eqPatterns = [`eq ${targetEq}`, `eq. ${targetEq}`, `eqs ${targetEq}`, `equation ${targetEq}`];
        for (const p of eqPatterns) {
          if (s.technical_index.toLowerCase().includes(p)) {
            score += 20;
            break;
          }
        }
        // Also check ranges like "Eqs 16-25" containing "eq 18"
        const rangeMatch = s.technical_index.match(/[Ee]qs?\s+(\d+)[-–](\d+)/g);
        if (rangeMatch) {
          for (const rm of rangeMatch) {
            const nums = rm.match(/(\d+)[-–](\d+)/);
            if (nums) {
              const lo = parseInt(nums[1]), hi = parseInt(nums[2]);
              if (parseInt(targetEq) >= lo && parseInt(targetEq) <= hi) {
                score += 20;
              }
            }
          }
        }
      }
      if (targetTable && s.technical_index.toLowerCase().includes(`table ${targetTable}`)) {
        score += 20;
      }

      // Term matching with tiered scoring:
      // - Title/technical_index match: highest signal (3 points)
      // - Full text match: good signal (1 point)
      for (const term of queryTerms) {
        if (titleAndIndex.includes(term)) {
          score += 3;
        } else if (fullText.includes(term)) {
          score += 1;
        }
      }

      // Multi-word phrase matches (strong signal)
      const phrases = queryLower.match(/\b\w+\s+\w+\b/g) || [];
      for (const phrase of phrases) {
        if (titleAndIndex.includes(phrase)) {
          score += 5;
        } else if (fullText.includes(phrase)) {
          score += 2;
        }
      }

      return { idx, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

// ---------------------------------------------------------------------------
// Reciprocal Rank Fusion
// ---------------------------------------------------------------------------

function reciprocalRankFusion(
  vectorRanked: { idx: number; score: number }[],
  keywordRanked: { idx: number; score: number }[],
  k: number = 60 // RRF constant
): { idx: number; score: number }[] {
  const scores = new Map<number, number>();

  vectorRanked.forEach((item, rank) => {
    const prev = scores.get(item.idx) || 0;
    scores.set(item.idx, prev + 1 / (k + rank + 1));
  });

  keywordRanked.forEach((item, rank) => {
    const prev = scores.get(item.idx) || 0;
    scores.set(item.idx, prev + 1 / (k + rank + 1));
  });

  return [...scores.entries()]
    .map(([idx, score]) => ({ idx, score }))
    .sort((a, b) => b.score - a.score);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function hybridSearch(
  query: string,
  topK: number = 5
): Promise<SearchResult[]> {
  const index = loadEmbeddings();
  if (!index || index.sections.length === 0) {
    return [];
  }

  // 1. Embed query via Voyage AI
  const queryVec = await embedQuery(query);

  // 2. Vector search (over all chunks)
  const vectorResults = vectorSearch(queryVec, index.sections);

  // 3. Keyword search (over all chunks)
  const keywordResults = keywordSearch(query, index.sections);

  // 4. Reciprocal Rank Fusion
  const fused = reciprocalRankFusion(vectorResults, keywordResults);

  // 5. Filter excluded sections
  const filtered = fused.filter((r) => !isExcluded(index.sections[r.idx].section_title));

  // 6. Collapse chunks by section: keep only the best-scoring chunk per node_id
  const bestBySection = new Map<string, { idx: number; score: number }>();
  for (const r of filtered) {
    const s = index.sections[r.idx];
    const key = `${s.full_tree_path}::${s.node_id}`;
    const existing = bestBySection.get(key);
    if (!existing || r.score > existing.score) {
      bestBySection.set(key, r);
    }
  }

  // Sort collapsed results by score
  const collapsed = [...bestBySection.values()].sort((a, b) => b.score - a.score);

  // 7. Reranker: take top 25 candidates, rerank with cross-encoder, return top K
  const RERANK_POOL = 25;
  const candidates = collapsed.slice(0, RERANK_POOL);

  if (candidates.length === 0) return [];

  // Build document texts for the reranker (bm25_text has the actual chunk content)
  const rerankerDocs = candidates.map((r) => {
    const s = index.sections[r.idx];
    // Provide hierarchy context + content for cross-encoder scoring
    return `${s.doc_title} > ${s.section_title}. ${s.bm25_text}`;
  });

  const reranked = await rerank(query, rerankerDocs, topK);

  return reranked.map((rr) => {
    const candidate = candidates[rr.index];
    const s = index.sections[candidate.idx];
    return {
      node_id: s.node_id,
      doc_title: s.doc_title,
      course: s.course,
      section_title: s.section_title,
      start_page: s.start_page,
      end_page: s.end_page,
      full_tree_path: s.full_tree_path,
      score: rr.relevanceScore,
    };
  });
}

/**
 * Check if the embeddings index exists and has data.
 */
export function hasEmbeddings(): boolean {
  const index = loadEmbeddings();
  return !!index && index.sections.length > 0;
}
