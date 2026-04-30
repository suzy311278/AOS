/**
 * Cross-encoder reranker for SustainIQ retrieval pipeline.
 *
 * Sits between hybrid search (vector + BM25) and synthesis.
 * Takes top ~25 candidates from initial retrieval and reranks them
 * by reading query + document together (cross-attention), which is
 * much more accurate than independent scoring.
 *
 * Provider: Voyage AI rerank-2.5 (same API key as embeddings)
 * Endpoint: https://api.voyageai.com/v1/rerank
 * Fallback: if no API key, returns candidates in original order.
 */

export interface RerankCandidate {
  index: number;
  relevanceScore: number;
}

/**
 * Rerank documents against a query using Voyage AI's cross-encoder.
 *
 * @param query - The user's search query
 * @param documents - Array of document texts to rerank
 * @param topN - Number of top results to return (default 5)
 * @returns Reranked results sorted by relevance (highest first)
 */
export async function rerank(
  query: string,
  documents: string[],
  topN: number = 5
): Promise<RerankCandidate[]> {
  const apiKey = process.env.VOYAGE_API_KEY;

  if (!apiKey) {
    console.warn("[reranker] VOYAGE_API_KEY not set, skipping reranking");
    return documents
      .map((_, i) => ({ index: i, relevanceScore: 1 - i * 0.001 }))
      .slice(0, topN);
  }

  if (documents.length === 0) return [];

  try {
    const resp = await fetch("https://api.voyageai.com/v1/rerank", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "rerank-2.5",
        query,
        documents: documents.map((d) => d.slice(0, 4000)),
        top_k: topN,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      console.error(`[reranker] Voyage AI error ${resp.status}: ${errText.slice(0, 200)}`);
      return documents
        .map((_, i) => ({ index: i, relevanceScore: 1 - i * 0.001 }))
        .slice(0, topN);
    }

    const data = (await resp.json()) as {
      data?: { index: number; relevance_score: number }[];
    };

    if (!data.data || data.data.length === 0) {
      console.warn("[reranker] Voyage AI returned no results, falling back");
      return documents
        .map((_, i) => ({ index: i, relevanceScore: 1 - i * 0.001 }))
        .slice(0, topN);
    }

    return data.data
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .map((r) => ({
        index: r.index,
        relevanceScore: r.relevance_score,
      }));
  } catch (err) {
    console.error("[reranker] Error:", (err as Error).message);
    return documents
      .map((_, i) => ({ index: i, relevanceScore: 1 - i * 0.001 }))
      .slice(0, topN);
  }
}
