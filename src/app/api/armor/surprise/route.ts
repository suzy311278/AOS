/**
 * GET /api/armor/surprise
 *
 * Returns a random ICS brief or quiz question. Powers the Surprise Me
 * floating widget on every armor page when the client-side seed is
 * exhausted (Phase 0 ships with a local seed; once the user clicks
 * Refresh more than `seed.length` times, the widget can opt into this
 * server endpoint for fresh content).
 *
 * Phase 1 implementation: returns a randomly-picked entry from the
 * static seed (`SURPRISE_BRIEFS`, `SURPRISE_QUIZZES`). Phase 5 swaps
 * the source for live data:
 *
 *   - briefs: drawn from ADVISORIES with summary truncation
 *   - quizzes: drawn from any course quiz YAML
 *
 * Cache headers
 * ─────────────
 * `Cache-Control: no-store` — every call should return fresh randomness.
 * The endpoint is cheap (no DB, no LLM), so this is fine.
 */

import { NextResponse } from 'next/server';
import { ADVISORIES } from '@/lib/armor/seed';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ──────────────────────────────────────────────────────────────────────
// Static seed — superset of the client-side widget seed. Phase 5 will
// generate these on-demand from real content.
// ──────────────────────────────────────────────────────────────────────

const STATIC_BRIEFS: { id: string; title: string; body: string }[] = [
  {
    id: 'brief.purdue.l05',
    title: 'Purdue Levels 0–5 in one breath',
    body:
      'Level 0 is the physical process. Level 1 is the controllers. Level 2 is the supervisory HMIs and historians. Level 3 is operations. Level 3.5 is the DMZ. Levels 4 and 5 are corporate IT. The conduits between them are the only thing the attacker can\u2019t avoid.',
  },
  {
    id: 'brief.iec3-3.fr',
    title: 'IEC 62443-3-3 Foundational Requirements',
    body:
      'FR1 Identification & authentication. FR2 Use control. FR3 System integrity. FR4 Data confidentiality. FR5 Restricted data flow. FR6 Timely response to events. FR7 Resource availability. Memorise these seven and most 62443 conversations become navigable.',
  },
  {
    id: 'brief.triton',
    title: 'TRITON briefly',
    body:
      'Discovered in a Saudi petrochemical plant in 2017. Targeted Schneider Triconex safety instrumented systems via the engineering workstation. Designed to disable safety functions while masking the change from operators. The reason your SIS deserves its own zone with a single, audited conduit.',
  },
  {
    id: 'brief.modbus.history',
    title: 'Modbus is from 1979',
    body:
      'Modicon shipped Modbus in 1979 — six years before TCP/IP went public. It has no authentication, no encryption, and trusts every register write. Modbus/TCP just wraps it in TCP. A typical OT pentest finding is "Modbus exposed beyond Level 2." Treat function code 5 (Force Single Coil) like rm -rf.',
  },
  {
    id: 'brief.industroyer',
    title: 'Industroyer (CrashOverride)',
    body:
      'Took down a Kyiv substation in December 2016. First malware purpose-built for grid disruption. Its IEC 60870-5-104 module spoke the protocol like a native — including switching breakers via legitimate-looking operate commands. Detection requires understanding the protocol, not just the bytes.',
  },
  {
    id: 'brief.s7.stop',
    title: 'S7comm STOP is a magic frame',
    body:
      'On a Siemens S7-300/400/1200/1500, an unauthenticated peer on TCP/102 can send a STOP_PLC PDU and the controller halts. This is not a CVE — it\u2019s the protocol working as designed. Stuxnet abused this primitive. Mitigation: program/configuration access protection, plus segmentation.',
  },
];

const STATIC_QUIZZES: {
  id: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}[] = [
  {
    id: 'quiz.purdue.hmi-level',
    question: 'Where in the Purdue model does an HMI typically live?',
    options: ['Level 0', 'Level 1', 'Level 2', 'Level 3.5'],
    answer: 2,
    explanation:
      'HMIs live at Level 2 — supervisory control. The DMZ at Level 3.5 hosts data brokers and the historian replica that talk between operations (3) and IT (4–5).',
  },
  {
    id: 'quiz.modbus.coil-write',
    question: 'Which Modbus function code forces a single coil?',
    options: ['FC 1', 'FC 3', 'FC 5', 'FC 16'],
    answer: 2,
    explanation:
      'FC 5 (Force Single Coil) writes a discrete output. On an unauthenticated bus this is the most direct path from "I see Modbus" to "I changed the plant".',
  },
  {
    id: 'quiz.iec3-3.frcount',
    question: 'How many Foundational Requirements does IEC 62443-3-3 define?',
    options: ['Five', 'Six', 'Seven', 'Twelve'],
    answer: 2,
    explanation:
      'Seven: Identification, Use control, System integrity, Confidentiality, Restricted data flow, Timely response, Resource availability.',
  },
  {
    id: 'quiz.s7comm.port',
    question: 'Which TCP port is used by Siemens S7comm?',
    options: ['102', '502', '2404', '44818'],
    answer: 0,
    explanation:
      '102 is ISO-TSAP carrying S7comm. 502 = Modbus/TCP. 2404 = IEC 104. 44818 = EtherNet/IP encapsulation.',
  },
  {
    id: 'quiz.triton.target',
    question: 'TRITON specifically targeted which kind of system?',
    options: ['HMIs', 'Historians', 'Engineering workstations for SIS', 'Domain controllers'],
    answer: 2,
    explanation:
      'TRITON pivoted from a Windows engineering workstation that had access to a Schneider Triconex Safety Instrumented System. The malware then reprogrammed the SIS controller via TriStation.',
  },
];

// ──────────────────────────────────────────────────────────────────────
// Pickers — deterministic given a seed; we just use Math.random() here.
// ──────────────────────────────────────────────────────────────────────

function pickBrief() {
  // 60% chance an advisory-derived brief, 40% a static brief.
  if (Math.random() < 0.6) {
    const a = ADVISORIES[Math.floor(Math.random() * ADVISORIES.length)];
    return {
      kind: 'brief' as const,
      id: `intel.${a.id}`,
      title: `${a.vendor} · ${a.product}`,
      body: a.summary,
      href: `/intel/${a.id}`,
    };
  }
  const b = STATIC_BRIEFS[Math.floor(Math.random() * STATIC_BRIEFS.length)];
  return {
    kind: 'brief' as const,
    id: b.id,
    title: b.title,
    body: b.body,
    href: '/knowledge',
  };
}

function pickQuiz() {
  const q = STATIC_QUIZZES[Math.floor(Math.random() * STATIC_QUIZZES.length)];
  return {
    kind: 'quiz' as const,
    id: q.id,
    question: q.question,
    options: q.options,
    answer: q.answer,
    explanation: q.explanation,
    href: '/knowledge',
  };
}

// ──────────────────────────────────────────────────────────────────────
// Handler
// ──────────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const kindParam = searchParams.get('kind'); // 'brief' | 'quiz' | null

  let payload;
  if (kindParam === 'brief') payload = pickBrief();
  else if (kindParam === 'quiz') payload = pickQuiz();
  else payload = Math.random() < 0.5 ? pickBrief() : pickQuiz();

  return NextResponse.json(
    {
      ok: true,
      generatedAt: new Date().toISOString(),
      data: payload,
    },
    {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    },
  );
}
