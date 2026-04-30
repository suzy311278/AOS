/**
 * validate-emission-factors.ts
 *
 * Content-integrity checks for the Emission Factors product:
 * - Validates every source.yaml and factors.yaml against Zod schemas
 * - Referential integrity: every factor's source_id resolves to a real source folder
 * - Slug uniqueness across all factors
 * - No duplicate (activity_slug, region, source_id, vintage_year) tuples
 * - Freshness warning for last_verified_date older than 13 months
 * - Superseded_by references exist
 *
 * Run: npx tsx scripts/validate-emission-factors.ts
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';
import {
  SourceSchema,
  FactorsFileSchema,
} from '../src/lib/emission-factors/schemas';

const CONTENT_ROOT = join(process.cwd(), 'src', 'content', 'emission-factors');

type Problem = { level: 'error' | 'warning'; path: string; message: string };
const problems: Problem[] = [];

function err(path: string, message: string) {
  problems.push({ level: 'error', path, message });
}

function warn(path: string, message: string) {
  problems.push({ level: 'warning', path, message });
}

// js-yaml parses ISO dates into Date objects. Coerce them back to YYYY-MM-DD strings
// so the Zod string-date schemas validate cleanly.
function coerceDates<T>(value: T): T {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map(coerceDates) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = coerceDates(v);
    }
    return out as unknown as T;
  }
  return value;
}

function listSourceFolders(): string[] {
  if (!existsSync(CONTENT_ROOT)) return [];
  return readdirSync(CONTENT_ROOT).filter((entry) => {
    const full = join(CONTENT_ROOT, entry);
    return statSync(full).isDirectory() && !entry.startsWith('.');
  });
}

function monthsSince(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map(Number);
  const then = new Date(Date.UTC(y, m - 1, d));
  const now = new Date();
  return (now.getFullYear() - then.getFullYear()) * 12 + (now.getMonth() - then.getMonth());
}

// ─── Collect ──────────────────────────────────────────────────────────────────

const folders = listSourceFolders();
if (folders.length === 0) {
  console.log('No source folders found under', CONTENT_ROOT);
  process.exit(0);
}

const sourceIds = new Set<string>();
const factorIds = new Set<string>();
const factorTuples = new Set<string>();
const allFactors: Array<{ id: string; source_id: string; superseded_by: string | null }> = [];

for (const folder of folders) {
  const sourcePath = join(CONTENT_ROOT, folder, 'source.yaml');
  const factorsPath = join(CONTENT_ROOT, folder, 'factors.yaml');

  if (!existsSync(sourcePath)) {
    err(folder, 'source.yaml not found');
    continue;
  }

  let sourceRaw: unknown;
  try {
    sourceRaw = coerceDates(yaml.load(readFileSync(sourcePath, 'utf8')));
  } catch (e) {
    err(sourcePath, `YAML parse error: ${(e as Error).message}`);
    continue;
  }

  const sourceResult = SourceSchema.safeParse(sourceRaw);
  if (!sourceResult.success) {
    for (const issue of sourceResult.error.issues) {
      err(sourcePath, `${issue.path.join('.')} — ${issue.message}`);
    }
    continue;
  }

  const source = sourceResult.data;

  if (source.id !== folder) {
    err(sourcePath, `source.id "${source.id}" must match folder name "${folder}"`);
  }
  if (sourceIds.has(source.id)) {
    err(sourcePath, `Duplicate source id "${source.id}"`);
  }
  sourceIds.add(source.id);

  if (!existsSync(factorsPath)) {
    warn(folder, 'factors.yaml not found (source has no factors yet)');
    continue;
  }

  let factorsRaw: unknown;
  try {
    factorsRaw = coerceDates(yaml.load(readFileSync(factorsPath, 'utf8')));
  } catch (e) {
    err(factorsPath, `YAML parse error: ${(e as Error).message}`);
    continue;
  }

  const factorsResult = FactorsFileSchema.safeParse(factorsRaw);
  if (!factorsResult.success) {
    for (const issue of factorsResult.error.issues) {
      err(factorsPath, `${issue.path.join('.')} — ${issue.message}`);
    }
    continue;
  }

  for (const factor of factorsResult.data) {
    if (factor.source_id !== source.id) {
      err(factorsPath, `factor "${factor.id}": source_id "${factor.source_id}" does not match containing folder "${source.id}"`);
    }

    if (factorIds.has(factor.id)) {
      err(factorsPath, `Duplicate factor id "${factor.id}"`);
    } else {
      factorIds.add(factor.id);
    }

    const tuple = `${factor.activity_slug}|${factor.region}|${factor.source_id}|${factor.vintage_year}`;
    if (factorTuples.has(tuple)) {
      err(factorsPath, `factor "${factor.id}": duplicate (activity, region, source, vintage) tuple "${tuple}"`);
    }
    factorTuples.add(tuple);

    if (factor.verifier_initials.length < 2) {
      warn(factorsPath, `factor "${factor.id}": only ${factor.verifier_initials.length} verifier initials (production requires 2)`);
    }

    const age = monthsSince(factor.last_verified_date);
    if (age > 13) {
      warn(factorsPath, `factor "${factor.id}": last_verified_date is ${age} months old (re-verify)`);
    }

    allFactors.push({
      id: factor.id,
      source_id: factor.source_id,
      superseded_by: factor.superseded_by,
    });
  }
}

// Post-pass: referential integrity

for (const f of allFactors) {
  if (!sourceIds.has(f.source_id)) {
    err(f.id, `source_id "${f.source_id}" does not resolve to any source folder`);
  }
  if (f.superseded_by && !factorIds.has(f.superseded_by)) {
    err(f.id, `superseded_by "${f.superseded_by}" does not resolve to any factor`);
  }
}

// ─── Report ───────────────────────────────────────────────────────────────────

const errors = problems.filter((p) => p.level === 'error');
const warnings = problems.filter((p) => p.level === 'warning');

console.log('\nEmission Factors validation');
console.log('───────────────────────────');
console.log(`Sources: ${sourceIds.size}`);
console.log(`Factors: ${factorIds.size}`);
console.log(`Errors:  ${errors.length}`);
console.log(`Warnings: ${warnings.length}\n`);

for (const p of problems) {
  const prefix = p.level === 'error' ? '❌' : '⚠️ ';
  console.log(`${prefix} ${p.path}`);
  console.log(`   ${p.message}`);
}

if (errors.length > 0) {
  console.log('\nValidation FAILED.');
  process.exit(1);
}

console.log('\nValidation passed.');
process.exit(0);
