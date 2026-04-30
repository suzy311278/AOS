/**
 * embed-jobs.ts
 *
 * Pre-compute Voyage embeddings for every job on the board and write them
 * to `public/jobs-embeddings.json`. The resume matcher cosine-matches a
 * user's resume vector against this file at query time.
 *
 * Runs in the prebuild step (see package.json). A content hash over the
 * (jobUrl + embed text) of every job is stored alongside the vectors;
 * if the next build sees the same hash, model and dim, it skips the
 * Voyage API call entirely. So the API is only hit when jobs.xlsx
 * actually changes. Also runnable manually via:
 *
 *   npx tsx scripts/embed-jobs.ts
 *
 * The output is written to TWO locations:
 *   - public/jobs-embeddings.json   (served at runtime)
 *   - .next/cache/embed-jobs/...   (Vercel persists this across builds;
 *                                   local machines usually do too)
 * On build start we check both. public/ is wiped by Vercel between
 * deploys, but .next/cache/ survives, so the hash match still triggers.
 *
 * Force a re-embed by deleting public/jobs-embeddings.json AND
 * .next/cache/embed-jobs/jobs-embeddings.json (or clearing the Vercel
 * build cache from the dashboard).
 *
 * Cost: ~400 jobs * ~800 tokens/job ≈ 320k tokens on voyage-3-large,
 * but only when inputs change. Voyage free tier is 200M tokens/model.
 *
 * Shape of the output file:
 *
 *   {
 *     "model": "voyage-3-large",
 *     "dim": 1024,
 *     "generated_at": "2026-04-17T...",
 *     "job_count": 412,
 *     "embeddings": {
 *       "<jobUrl>": [ ...1024 floats... ],
 *       ...
 *     }
 *   }
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// Load .env.local so VOYAGE_API_KEY is available when running locally.
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!process.env[key]) {
      process.env[key] = rest.join("=");
    }
  }
}

import { getAllJobsFull, type JobRow } from "../src/lib/jobs";
import { embedTexts, EMBED_MODEL, EMBED_DIM } from "../src/lib/voyage";

const OUT_PATH = path.join(process.cwd(), "public", "jobs-embeddings.json");
// Vercel persists .next/cache/ across builds, but wipes public/. Mirror
// the output into the cache so the hash check can short-circuit on the
// NEXT deploy: if the cached file's hash matches the current inputs, we
// copy it back to public/ and skip the Voyage API call entirely.
const CACHE_PATH = path.join(
  process.cwd(),
  ".next",
  "cache",
  "embed-jobs",
  "jobs-embeddings.json"
);
const BATCH_SIZE = 32; // well under Voyage's 128-input cap, easier on the network
const MAX_CHARS = 6000; // clipping is fine; the long tail of JDs is boilerplate

interface OutputFile {
  model: string;
  dim: number;
  generated_at: string;
  job_count: number;
  // sha256 over (jobUrl + embed text) for every job, so a subsequent
  // build can skip the Voyage API call when the input is unchanged.
  inputs_hash: string;
  embeddings: Record<string, number[]>;
}

function buildJobText(job: JobRow): string {
  // We don't have full JDs; concat the three detail fields we do have.
  // Title/company get included so single-line jobs still get signal.
  const parts = [
    `Title: ${job.title}`,
    `Company: ${job.company}`,
    job.location ? `Location: ${job.location}` : null,
    job.roleSummary ? `Role: ${job.roleSummary}` : null,
    job.skillsRequired ? `Skills: ${job.skillsRequired}` : null,
    job.domainContext ? `Domain: ${job.domainContext}` : null,
  ].filter((v): v is string => Boolean(v));
  return parts.join("\n\n").slice(0, MAX_CHARS);
}

async function main() {
  if (!process.env.VOYAGE_API_KEY) {
    console.error(
      "VOYAGE_API_KEY is not set. Add it to .env.local or the environment."
    );
    process.exit(1);
  }

  const jobs = getAllJobsFull();
  if (jobs.length === 0) {
    console.error(
      "No jobs loaded from src/jobs/jobs.xlsx - nothing to embed."
    );
    process.exit(1);
  }

  // Deduplicate by jobUrl. Keep the first occurrence.
  const seen = new Set<string>();
  const uniqueJobs: JobRow[] = [];
  for (const j of jobs) {
    if (seen.has(j.jobUrl)) continue;
    seen.add(j.jobUrl);
    uniqueJobs.push(j);
  }

  console.log(
    `[embed-jobs] ${uniqueJobs.length} unique jobs (from ${jobs.length} rows)`
  );
  console.log(`[embed-jobs] model=${EMBED_MODEL} dim=${EMBED_DIM}`);

  // Compute a content hash over the exact inputs Voyage would see.
  // If an existing output file has the same hash, model, and dim, we
  // can skip the API call entirely — nothing has changed.
  const hasher = crypto.createHash("sha256");
  for (const j of uniqueJobs) {
    hasher.update(j.jobUrl);
    hasher.update("\x1f"); // unit separator; avoids collision across fields
    hasher.update(buildJobText(j));
    hasher.update("\x1e"); // record separator
  }
  const inputsHash = hasher.digest("hex");

  // Try both locations. Check the Vercel-persisted cache first (survives
  // across deploys); fall back to the public file (survives on local
  // machines where nothing wipes public/).
  for (const candidate of [CACHE_PATH, OUT_PATH]) {
    if (!fs.existsSync(candidate)) continue;
    try {
      const prev = JSON.parse(fs.readFileSync(candidate, "utf8")) as Partial<OutputFile>;
      if (
        prev.inputs_hash === inputsHash &&
        prev.model === EMBED_MODEL &&
        prev.dim === EMBED_DIM &&
        prev.job_count === uniqueJobs.length
      ) {
        // Ensure BOTH locations have the file on the way out, so the
        // runtime (which reads from public/) always finds it even when
        // we restored from cache.
        if (candidate !== OUT_PATH) {
          fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
          fs.copyFileSync(candidate, OUT_PATH);
        }
        if (candidate !== CACHE_PATH) {
          fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
          fs.copyFileSync(candidate, CACHE_PATH);
        }
        console.log(
          `[embed-jobs] inputs unchanged (hash ${inputsHash.slice(0, 12)}...); restored from ${path.relative(process.cwd(), candidate)}, skipping re-embed.`
        );
        return;
      }
    } catch {
      // Corrupt/old file - try the next candidate, else fall through.
    }
  }

  const embeddings: Record<string, number[]> = {};
  let totalTokens = 0;

  const t0 = Date.now();
  for (let i = 0; i < uniqueJobs.length; i += BATCH_SIZE) {
    const batch = uniqueJobs.slice(i, i + BATCH_SIZE);
    const texts = batch.map(buildJobText);

    process.stdout.write(
      `  batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(uniqueJobs.length / BATCH_SIZE)} (${batch.length} jobs) ... `
    );

    try {
      const { vectors, totalTokens: t } = await embedTexts(texts, {
        inputType: "document",
        maxChars: MAX_CHARS,
      });
      if (vectors.length !== batch.length) {
        throw new Error(
          `got ${vectors.length} vectors for ${batch.length} inputs`
        );
      }
      for (let j = 0; j < batch.length; j++) {
        embeddings[batch[j].jobUrl] = vectors[j];
      }
      if (typeof t === "number") totalTokens += t;
      process.stdout.write("ok\n");
    } catch (err) {
      process.stdout.write("FAILED\n");
      console.error(
        `[embed-jobs] batch starting at ${i} failed:`,
        err instanceof Error ? err.message : err
      );
      process.exit(1);
    }
  }

  const output: OutputFile = {
    model: EMBED_MODEL,
    dim: EMBED_DIM,
    generated_at: new Date().toISOString(),
    job_count: Object.keys(embeddings).length,
    inputs_hash: inputsHash,
    embeddings,
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(output));
  // Mirror into the Vercel-persisted build cache so the next deploy can
  // short-circuit without hitting Voyage. No-op on local if .next/cache
  // is cleaned between builds.
  fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
  fs.copyFileSync(OUT_PATH, CACHE_PATH);

  const elapsedMs = Date.now() - t0;
  const sizeBytes = fs.statSync(OUT_PATH).size;
  const sizeMB = (sizeBytes / 1024 / 1024).toFixed(2);

  console.log(
    `[embed-jobs] wrote ${output.job_count} embeddings to ${OUT_PATH} and cache (${sizeMB} MB)`
  );
  console.log(
    `[embed-jobs] ${elapsedMs} ms, ~${totalTokens} tokens used`
  );
}

main().catch((err) => {
  console.error("[embed-jobs] fatal:", err);
  process.exit(1);
});
