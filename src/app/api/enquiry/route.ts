/**
 * POST /api/enquiry
 *
 * Services enquiry endpoint. Stores a sales lead and fires two
 * emails:
 *   1. Lead notification to the team, formatted for fast triage
 *   2. Professional auto-response to the prospect confirming a human
 *      will reach out inside two business days
 *
 * Kept separate from /api/feedback because the fields and the tone
 * of response are different. Feedback is "we got your bug report";
 * enquiry is "we will be in touch".
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { Resend } from 'resend';
import { z } from 'zod';
import { db } from '@/lib/db';
import { serviceEnquiries } from '@/lib/schema';
import { rateLimitDurable, ipFromRequest } from '@/lib/rate-limit';
import { SITE_ORIGIN } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FROM = 'Greentryst Services <services@greentryst.com>';
const LEAD_TO = 'prajjwalkaushik08@gmail.com';

const ENGAGEMENTS: Record<string, string> = {
  'ifrs-gap-assessment': 'IFRS Gap Assessment and Reporting',
  'climate-risk': 'Climate Risk Assessment',
  'diagnostic': 'Sustainability Readiness Diagnostic',
  'net-zero-plan': 'Net Zero Transition Plan',
  'sbti-targets': 'SBTi Target Setting & Validation',
  'double-materiality': 'Double Materiality Assessment',
  'tnfd-assessment': 'TNFD Biodiversity Assessment',
  'framework-gap': 'Framework Gap Assessment & Training',
  'esg-ratings': 'ESG Ratings Submission Support',
  'scope-3': 'Scope 3 Inventory Build',
  'supplier-decarb': 'Supplier Decarbonization Strategy',
  'verra-feasibility': 'Verra Methodology Feasibility Assessment',
  'drafting': 'Disclosure Drafting Engagement',
  'personalised-training': 'Personalised Training Sessions',
  'board-briefing': 'Board & C-Suite Briefings',
  'internal-carbon-pricing': 'Internal Carbon Pricing Design',
  'shadow-water-pricing': 'Shadow Water Pricing',
  'retainer': 'Quarterly Compliance Retainer',
  'custom-tool': 'Custom Tool or Template Build',
  'ma-due-diligence': 'M&A Sustainability Due Diligence',
  'enterprise-implementation': 'Enterprise Implementation',
  'cohort-ai-climate': 'AI for Climate Work Cohort (6-week program)',
  'unsure': 'Not sure yet',
};

const TIMELINES: Record<string, string> = {
  immediate: 'Immediate (within 4 weeks)',
  '1-3m': '1 to 3 months',
  '3-6m': '3 to 6 months',
  '6m+': '6 months or more',
  flexible: 'Flexible',
};

const BUDGETS: Record<string, string> = {
  'lt-5k': 'Under $5,000',
  '5-15k': '$5,000 to $15,000',
  '15-50k': '$15,000 to $50,000',
  '50k+': '$50,000 or more',
  unsure: 'Not sure yet',
};

const BodySchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  company: z.string().min(1).max(200),
  role: z.string().max(200).optional(),
  engagement: z.string().refine((v) => v in ENGAGEMENTS, 'Invalid engagement'),
  timeline: z.string().refine((v) => v in TIMELINES, 'Invalid timeline'),
  budget: z.string().refine((v) => v in BUDGETS, 'Invalid budget').optional(),
  message: z.string().min(10).max(10_000),
  pageUrl: z.string().max(2_000).optional(),
});

export async function POST(request: Request) {
  const gate = await rateLimitDurable('enquiry', ipFromRequest(request), 5, 60 * 60 * 1000);
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

  const { name, email, company, role, engagement, timeline, budget, message, pageUrl } = parsed.data;
  const { userId } = await auth().catch(() => ({ userId: null as string | null }));
  const userAgent = request.headers.get('user-agent') ?? null;

  let inserted;
  try {
    inserted = await db
      .insert(serviceEnquiries)
      .values({
        name,
        email,
        company,
        role: role ?? null,
        engagement,
        timeline,
        budget: budget ?? null,
        message,
        userId: userId ?? null,
        pageUrl: pageUrl ?? null,
        userAgent,
      })
      .returning({ id: serviceEnquiries.id });
  } catch (err) {
    console.error('[api/enquiry] insert failed', err);
    return NextResponse.json(
      { ok: false, error: 'Could not store enquiry. Please try again.' },
      { status: 500 }
    );
  }

  const enquiryId = inserted?.[0]?.id;
  const engagementLabel = ENGAGEMENTS[engagement];
  const timelineLabel = TIMELINES[timeline];
  const budgetLabel = budget ? BUDGETS[budget] : null;

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const resend = new Resend(resendKey);

    try {
      await resend.emails.send({
        from: FROM,
        to: LEAD_TO,
        replyTo: email,
        subject: `[Greentryst Lead] ${engagementLabel} — ${company}`,
        text: [
          `New services enquiry #${enquiryId ?? '?'}`,
          '',
          `Engagement: ${engagementLabel}`,
          `Timeline: ${timelineLabel}`,
          budgetLabel ? `Budget: ${budgetLabel}` : 'Budget: not specified',
          '',
          `Name: ${name}`,
          `Email: ${email}`,
          `Company: ${company}`,
          role ? `Role: ${role}` : null,
          '',
          userId ? `Clerk user: ${userId}` : 'Anonymous visitor',
          pageUrl ? `Page: ${pageUrl}` : null,
          userAgent ? `User-Agent: ${userAgent}` : null,
          '',
          '--- Message ---',
          message,
        ]
          .filter(Boolean)
          .join('\n'),
      });
    } catch (err) {
      console.error('[api/enquiry] lead notification failed', err);
    }

    try {
      await resend.emails.send({
        from: FROM,
        to: email,
        subject: `Your Greentryst enquiry — ${engagementLabel}`,
        text: receiptBody({ name, engagementLabel, timelineLabel, budgetLabel, message }),
      });
    } catch (err) {
      console.error('[api/enquiry] receipt email failed', err);
    }
  }

  return NextResponse.json({ ok: true, id: enquiryId }, { status: 201 });
}

function receiptBody({
  name,
  engagementLabel,
  timelineLabel,
  budgetLabel,
  message,
}: {
  name: string;
  engagementLabel: string;
  timelineLabel: string;
  budgetLabel: string | null;
  message: string;
}) {
  const firstName = name.split(/\s+/)[0] || name;
  return [
    `Hi ${firstName},`,
    '',
    `Thanks for reaching out to Greentryst about ${engagementLabel}. We have your enquiry, and a member of our team will respond inside two business days with next steps, availability, and a working-session proposal.`,
    '',
    `For reference, here is what we received:`,
    '',
    `Engagement: ${engagementLabel}`,
    `Timeline: ${timelineLabel}`,
    budgetLabel ? `Budget: ${budgetLabel}` : null,
    '',
    '--- Your message ---',
    message,
    '--- End of message ---',
    '',
    `If anything is urgent in the meantime, reply to this email and it lands in the same thread.`,
    '',
    `Warm regards,`,
    `The Greentryst team`,
    SITE_ORIGIN,
  ]
    .filter((line) => line !== null)
    .join('\n');
}
