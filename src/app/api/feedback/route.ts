/**
 * POST /api/feedback
 *
 * Single endpoint behind every feedback + enquiry form on the site.
 * Flow:
 *   1. Validate input
 *   2. Insert row into feedback_submissions
 *   3. Email the team (notification)
 *   4. Email the submitter (receipt)
 *
 * Emails go via Resend. If RESEND_API_KEY is missing the row is still
 * stored and the route returns success — so local dev without a key
 * still produces data, and a Resend outage does not lose submissions.
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { Resend } from 'resend';
import { z } from 'zod';
import { db } from '@/lib/db';
import { feedbackSubmissions } from '@/lib/schema';
import { rateLimitDurable, ipFromRequest } from '@/lib/rate-limit';
import { SITE_ORIGIN } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FROM = 'Greentryst Feedback <feedback@greentryst.com>';
const NOTIFICATION_TO = 'prajjwalkaushik08@gmail.com';

const BodySchema = z.object({
  type: z.enum(['bug', 'feature', 'content', 'other', 'services']),
  email: z.string().email().max(320),
  message: z.string().min(10).max(10_000),
  metadata: z.record(z.unknown()).optional(),
  pageUrl: z.string().max(2_000).optional(),
});

export async function POST(request: Request) {
  const gate = await rateLimitDurable('feedback', ipFromRequest(request), 10, 60 * 60 * 1000);
  if (!gate.ok) {
    return NextResponse.json(
      { ok: false, error: 'Too many submissions. Please try again later.', retryAfterMs: gate.retryAfterMs },
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
      { status: 400 }
    );
  }

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { type, email, message, metadata, pageUrl } = parsed.data;
  const { userId } = await auth().catch(() => ({ userId: null as string | null }));
  const userAgent = request.headers.get('user-agent') ?? null;

  // 1. Persist first. If email fails afterwards, the submission is
  //    still retained and the team can follow up manually.
  let inserted;
  try {
    inserted = await db
      .insert(feedbackSubmissions)
      .values({
        type,
        userId: userId ?? null,
        email,
        message,
        metadata: metadata ? JSON.stringify(metadata) : null,
        pageUrl: pageUrl ?? null,
        userAgent,
      })
      .returning({ id: feedbackSubmissions.id });
  } catch (err) {
    console.error('[api/feedback] insert failed', err);
    return NextResponse.json(
      { ok: false, error: 'Could not store submission. Please try again.' },
      { status: 500 }
    );
  }

  const submissionId = inserted?.[0]?.id;

  // 2. Fire-and-forget email. We do not fail the request if Resend
  //    has a hiccup; the row is already stored.
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const resend = new Resend(resendKey);

    try {
      await resend.emails.send({
        from: FROM,
        to: NOTIFICATION_TO,
        replyTo: email,
        subject: `[Greentryst ${labelForType(type)}] ${truncate(message, 60)}`,
        text: [
          `New ${labelForType(type)} submission #${submissionId ?? '?'}`,
          '',
          `From: ${email}`,
          userId ? `Clerk user: ${userId}` : 'Anonymous visitor',
          pageUrl ? `Page: ${pageUrl}` : null,
          metadata ? `Metadata: ${JSON.stringify(metadata, null, 2)}` : null,
          userAgent ? `User-Agent: ${userAgent}` : null,
          '',
          '---',
          message,
        ]
          .filter(Boolean)
          .join('\n'),
      });
    } catch (err) {
      console.error('[api/feedback] notification email failed', err);
    }

    try {
      await resend.emails.send({
        from: FROM,
        to: email,
        subject: 'We received your feedback',
        text: receiptBody({ type, message }),
      });
    } catch (err) {
      console.error('[api/feedback] receipt email failed', err);
    }
  }

  return NextResponse.json({ ok: true, id: submissionId }, { status: 201 });
}

function labelForType(type: string): string {
  switch (type) {
    case 'bug': return 'Bug Report';
    case 'feature': return 'Feature Request';
    case 'content': return 'Content Feedback';
    case 'services': return 'Services Enquiry';
    case 'other': return 'Feedback';
    default: return 'Feedback';
  }
}

function truncate(s: string, n: number): string {
  const trimmed = s.trim().replace(/\s+/g, ' ');
  return trimmed.length > n ? `${trimmed.slice(0, n - 1)}\u2026` : trimmed;
}

function receiptBody({ type, message }: { type: string; message: string }) {
  const kind = labelForType(type).toLowerCase();
  return [
    `Hi,`,
    '',
    `Got your ${kind}. It landed safely in our inbox, which is already more than most feedback gets online.`,
    '',
    `Here is what we have on file, in case you want to double-check we heard you right:`,
    '',
    '---',
    message,
    '---',
    '',
    `A human on our team reads every submission — we know, surprising for 2026 — and will follow up if there is anything to do about it.`,
    '',
    `If you remembered one more thing the second after you hit send (always happens), just reply to this email and it lands in the same thread.`,
    '',
    `The Greentryst team`,
    SITE_ORIGIN,
  ].join('\n');
}
