/**
 * POST /api/supplier-sbti-tracker/match
 *
 * Matches a user-supplied supplier list against the SBTi companies
 * dataset (src/data/sbti-companies.json). Per-record lookup, no
 * persistence, no Clerk auth required. Rate-limit is the shared
 * in-memory burst-protection helper.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimitDurable, ipFromRequest } from '@/lib/rate-limit';
import { matchBatch, getDatasetMeta } from '@/lib/sbti-matcher';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  suppliers: z
    .array(
      z.object({
        name: z.string().min(1).max(300),
        country: z.string().max(100).optional(),
        spend: z.number().nonnegative().finite().optional(),
      }),
    )
    .min(1)
    .max(1000),
});

export async function POST(request: Request) {
  const gate = await rateLimitDurable(
    'supplier-sbti-tracker',
    ipFromRequest(request),
    20,
    60 * 1000,
  );
  if (!gate.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Too many requests. Please wait a moment and try again.',
        retryAfterMs: gate.retryAfterMs,
      },
      { status: 429 },
    );
  }

  let parsed;
  try {
    const body = await request.json();
    parsed = BodySchema.safeParse(body);
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Malformed JSON body' },
      { status: 400 },
    );
  }

  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const supplierErrs = flat.fieldErrors.suppliers ?? [];
    let friendly: string | null = null;
    if (supplierErrs.some((m) => m.includes('at most'))) {
      friendly = 'Max 1000 suppliers per request.';
    } else if (supplierErrs.some((m) => m.includes('at least'))) {
      friendly = 'At least one supplier is required.';
    }
    return NextResponse.json(
      {
        ok: false,
        error: friendly ?? 'Invalid input',
        details: flat,
      },
      { status: 400 },
    );
  }

  const meta = getDatasetMeta();
  const { results, summary } = matchBatch(parsed.data.suppliers);

  return NextResponse.json(
    {
      ok: true,
      snapshot: meta.snapshot_date,
      source: meta.source,
      source_url: meta.source_url,
      dataset_count: meta.count,
      summary,
      results,
    },
    { status: 200 },
  );
}
