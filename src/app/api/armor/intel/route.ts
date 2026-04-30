/**
 * GET /api/armor/intel
 *
 * Read-only JSON view of the vulnerability intelligence feed. Phase 1
 * uses the static seed; Phase 4 swaps for a live drizzle query against
 * `ics_advisories`.
 *
 * Query params
 * ────────────
 *   limit         (number, default 50, max 200)
 *   severity      ('crit' | 'warn' | 'ok')
 *   vendor        (case-insensitive substring match)
 *   protocol      (exact match against any of advisory.protocols[])
 *
 * Response shape
 * ──────────────
 *   {
 *     ok: true,
 *     count: number,
 *     advisories: Advisory[]
 *   }
 *
 * On bad query params the route returns 400 with `{ ok: false, error }`.
 *
 * POST is intentionally NOT implemented in Phase 1. Phase 4 adds an
 * admin-gated POST that triggers a one-shot CISA ingestion run.
 */

import { NextResponse } from 'next/server';
import {
  listAdvisories,
  type Advisory,
  type Severity,
} from '@/lib/armor/seed';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_SEVERITIES: readonly Severity[] = ['crit', 'warn', 'ok'];

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;

function parseLimit(raw: string | null): number | null {
  if (raw === null) return DEFAULT_LIMIT;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.min(Math.floor(n), MAX_LIMIT);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // ── Validation ──────────────────────────────────────────────────────
  const limit = parseLimit(searchParams.get('limit'));
  if (limit === null) {
    return NextResponse.json(
      { ok: false, error: 'limit must be a positive integer' },
      { status: 400 },
    );
  }

  const sevRaw = searchParams.get('severity');
  if (sevRaw && !VALID_SEVERITIES.includes(sevRaw as Severity)) {
    return NextResponse.json(
      { ok: false, error: `severity must be one of ${VALID_SEVERITIES.join(', ')}` },
      { status: 400 },
    );
  }
  const severity = sevRaw as Severity | null;

  const vendorRaw = searchParams.get('vendor');
  const vendor = vendorRaw ? vendorRaw.toLowerCase() : null;

  const protocol = searchParams.get('protocol');

  // ── Filter ──────────────────────────────────────────────────────────
  let advisories: readonly Advisory[] = listAdvisories();

  if (severity) {
    advisories = advisories.filter((a) => a.severity === severity);
  }
  if (vendor) {
    advisories = advisories.filter((a) =>
      a.vendor.toLowerCase().includes(vendor),
    );
  }
  if (protocol) {
    advisories = advisories.filter((a) => a.protocols.includes(protocol));
  }

  const trimmed = advisories.slice(0, limit);

  return NextResponse.json(
    {
      ok: true,
      count: trimmed.length,
      total: advisories.length,
      advisories: trimmed,
    },
    {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    },
  );
}
