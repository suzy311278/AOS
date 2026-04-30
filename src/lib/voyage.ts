/**
 * Voyage AI client for embeddings (resume + job text).
 *
 * Paired with src/lib/reranker.ts (which handles rerank-2.5).
 * Same VOYAGE_API_KEY, different endpoint.
 *
 * Used by:
 *   - scripts/embed-jobs.ts        (prebuild, batch-embeds 400+ jobs)
 *   - src/app/api/resume/process/  (runtime, embeds a single resume)
 *
 * Model choice: `voyage-3-large` - 1024-dim, best general-purpose quality.
 * Resume and job vectors MUST come from the same model for the matcher's
 * cosine similarity to be meaningful.
 */

/**
 * Voyage API base URL, determined by the key prefix (mirrors how the
 * official voyageai Python SDK routes requests — see
 * voyageai/util.py::get_default_base_url):
 *
 *   - keys starting with "al-"  → https://ai.mongodb.com/v1  (MongoDB
 *     Atlas's bundled Voyage access — what this project uses)
 *   - everything else           → https://api.voyageai.com/v1  (direct)
 *
 * The embedding endpoint itself is `/embeddings` under that base.
 */
function voyageBaseFor(apiKey: string): string {
  return apiKey.startsWith("al-")
    ? "https://ai.mongodb.com/v1"
    : "https://api.voyageai.com/v1";
}

/** The embedding model used across the product. Do not change in isolation -
 *  both resume and job embeddings must be regenerated together. */
export const EMBED_MODEL = "voyage-3-large";

/** Output dimension for `voyage-3-large`. Hard-coded here so callers can
 *  pre-allocate matrices without round-tripping. */
export const EMBED_DIM = 1024;

export type InputType = "document" | "query";

export interface EmbedOptions {
  /** Override the model (default: EMBED_MODEL). */
  model?: string;
  /** Voyage-specific prefix that tunes the representation.
   *  - `document` for the thing being indexed (jobs, resume when stored)
   *  - `query`    for a live search query
   *  We use `document` for both sides of resume<->job matching since the
   *  matcher is symmetric; cosine is symmetric too. */
  inputType?: InputType;
  /** Truncate each input to this many characters before sending (default 8000).
   *  Voyage accepts far more tokens but CPU/token cost grows linearly. */
  maxChars?: number;
}

export interface EmbedResult {
  /** Vectors in the same order as the inputs. */
  vectors: number[][];
  /** Reported token usage. */
  totalTokens?: number;
}

/**
 * Embed a batch of text inputs. Voyage accepts up to 128 inputs per request
 * for voyage-3-large; callers should chunk beyond that.
 *
 * Throws on HTTP error or missing key - callers decide fallback behaviour.
 */
export async function embedTexts(
  inputs: string[],
  opts: EmbedOptions = {},
): Promise<EmbedResult> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) {
    throw new Error("VOYAGE_API_KEY is not set");
  }
  if (inputs.length === 0) {
    return { vectors: [] };
  }

  const model = opts.model ?? EMBED_MODEL;
  const inputType: InputType = opts.inputType ?? "document";
  const maxChars = opts.maxChars ?? 8000;

  const truncated = inputs.map((t) => (t ?? "").slice(0, maxChars));

  const resp = await fetch(`${voyageBaseFor(apiKey)}/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: truncated,
      input_type: inputType,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(
      `Voyage embeddings ${resp.status}: ${errText.slice(0, 300)}`,
    );
  }

  const data = (await resp.json()) as {
    data?: { embedding: number[]; index: number }[];
    usage?: { total_tokens?: number };
  };

  if (!data.data || data.data.length !== inputs.length) {
    throw new Error(
      `Voyage embeddings returned ${data.data?.length ?? 0} vectors for ${inputs.length} inputs`,
    );
  }

  // Sort by index to guarantee order matches inputs.
  const vectors = [...data.data]
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);

  return { vectors, totalTokens: data.usage?.total_tokens };
}

/**
 * Convenience: embed a single input, return the vector.
 */
export async function embedOne(
  input: string,
  opts: EmbedOptions = {},
): Promise<number[]> {
  const { vectors } = await embedTexts([input], opts);
  return vectors[0];
}

/**
 * Cosine similarity of two vectors. Returns 0 if either is zero-length.
 * Assumes inputs have the same dimension; does not validate.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
