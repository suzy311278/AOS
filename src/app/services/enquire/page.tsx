/**
 * /redesign/services/enquire
 *
 * Dedicated services enquiry form. Separate from /redesign/feedback
 * because a services enquiry is a sales lead, not a bug report.
 * Captures the fields a Greentryst analyst needs to respond with a
 * concrete proposal: company, role, engagement, timeline, budget.
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { Nav } from '@/components/Nav';
import { RedesignFooter } from '@/components/redesign';

const ENGAGEMENTS = [
  { id: 'ifrs-gap-assessment', label: 'IFRS Gap Assessment and Reporting' },
  { id: 'climate-risk', label: 'Climate Risk Assessment' },
  { id: 'diagnostic', label: 'Sustainability Readiness Diagnostic (Free)' },
  { id: 'net-zero-plan', label: 'Net Zero Transition Plan' },
  { id: 'sbti-targets', label: 'SBTi Target Setting & Validation' },
  { id: 'double-materiality', label: 'Double Materiality Assessment' },
  { id: 'tnfd-assessment', label: 'TNFD Biodiversity Assessment' },
  { id: 'framework-gap', label: 'Framework Gap Assessment & Training' },
  { id: 'esg-ratings', label: 'ESG Ratings Submission Support' },
  { id: 'scope-3', label: 'Scope 3 Inventory Build' },
  { id: 'supplier-decarb', label: 'Supplier Decarbonization Strategy' },
  { id: 'verra-feasibility', label: 'Verra Methodology Feasibility Assessment' },
  { id: 'drafting', label: 'Disclosure Drafting Engagement' },
  { id: 'personalised-training', label: 'Personalised Training Sessions' },
  { id: 'board-briefing', label: 'Board & C-Suite Briefings' },
  { id: 'internal-carbon-pricing', label: 'Internal Carbon Pricing Design' },
  { id: 'shadow-water-pricing', label: 'Shadow Water Pricing' },
  { id: 'retainer', label: 'Quarterly Compliance Retainer' },
  { id: 'custom-tool', label: 'Custom Tool or Template Build' },
  { id: 'ma-due-diligence', label: 'M&A Sustainability Due Diligence' },
  { id: 'enterprise-implementation', label: 'Enterprise Implementation' },
  { id: 'unsure', label: "I'm not sure yet" },
];

const TIMELINES = [
  { id: 'immediate', label: 'Immediate (within 4 weeks)' },
  { id: '1-3m', label: '1 to 3 months' },
  { id: '3-6m', label: '3 to 6 months' },
  { id: '6m+', label: '6 months or more' },
  { id: 'flexible', label: 'Flexible' },
];

const BUDGETS = [
  { id: 'lt-5k', label: 'Under $5,000' },
  { id: '5-15k', label: '$5,000 to $15,000' },
  { id: '15-50k', label: '$15,000 to $50,000' },
  { id: '50k+', label: '$50,000 or more' },
  { id: 'unsure', label: 'Not sure yet' },
];

function EnquireForm() {
  const searchParams = useSearchParams();
  const prefilledEngagement = searchParams?.get('engagement') ?? '';
  const { user, isLoaded } = useUser();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [engagement, setEngagement] = useState(prefilledEngagement);
  const [timeline, setTimeline] = useState('');
  const [budget, setBudget] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Track whether the user has manually edited each field, so we do
  // not overwrite their typing if Clerk resolves slowly.
  const [nameTouched, setNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  useEffect(() => {
    if (prefilledEngagement && !engagement) setEngagement(prefilledEngagement);
  }, [prefilledEngagement, engagement]);

  // Prefill name + email from Clerk once the user profile loads.
  useEffect(() => {
    if (!isLoaded || !user) return;
    if (!nameTouched) {
      const fullName = [user.firstName, user.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();
      if (fullName) setName(fullName);
    }
    if (!emailTouched) {
      const primary = user.primaryEmailAddress?.emailAddress;
      if (primary) setEmail(primary);
    }
  }, [isLoaded, user, nameTouched, emailTouched]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          company,
          role: role || undefined,
          engagement,
          timeline,
          budget: budget || undefined,
          message,
          pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error ?? 'Something went wrong. Please try again.');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-[80vh] bg-[#fafbfa] flex items-center justify-center px-8 pt-20">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-gt-leaf/15 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-gt-medium" strokeWidth={1.5} />
          </div>
          <h1 className="text-[26px] font-extrabold text-gt-text mb-3">
            Enquiry received.
          </h1>
          <p className="text-[14px] text-gt-text-muted mb-8 leading-relaxed">
            A member of our team will respond inside two business days with next steps, availability, and a working-session proposal. Check your inbox for a receipt.
          </p>
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-gt-medium hover:text-gt-dark"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Services
          </Link>
        </div>
      </main>
    );
  }

  const canSubmit =
    !!name && !!email && !!company && !!engagement && !!timeline && message.length >= 10 && !submitting;

  return (
    <main className="min-h-screen bg-[#fafbfa] pt-20 pb-20">
      {/* Hero */}
      <section className="relative bg-gt-text-dark overflow-hidden">
        <div
          className="gt-dot-grid absolute inset-0 opacity-[0.22] pointer-events-none"
          aria-hidden
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-1/3 w-[520px] h-[520px] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(82,183,136,0.16) 0%, rgba(82,183,136,0.03) 55%, transparent 75%)',
            filter: 'blur(20px)',
          }}
        />
        <div className="relative max-w-[920px] mx-auto px-8 pt-16 pb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="h-px w-8 bg-gt-leaf" aria-hidden />
            <span
              className="text-[10px] font-bold uppercase tracking-[0.28em] text-gt-leaf"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            >
              Services Enquiry
            </span>
          </div>
          <h1 className="text-[32px] md:text-[40px] font-extrabold text-white leading-[1.1] tracking-tight max-w-2xl">
            Tell us, how can we support your business?
          </h1>
          <p className="mt-5 text-[14.5px] text-white/70 leading-relaxed max-w-xl">
            Fill in what you know already, and we&rsquo;ll work out the rest
            together on a quick call. Not sure which engagement fits? Pick
            &ldquo;I&rsquo;m not sure yet&rdquo; and we&rsquo;ll recommend the
            right path for you.
          </p>
        </div>
      </section>

      {/* Form */}
      <div className="max-w-[920px] mx-auto px-8 pt-10">
        <Link
          href="/services"
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-gt-text-muted hover:text-gt-medium mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Services
        </Link>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-[#e5e7e5] rounded-2xl p-6 md:p-8 space-y-6"
        >
          {/* Name + Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldLabel label="Full name" htmlFor="name" required>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameTouched(true);
                }}
                placeholder="Jane Doe"
                className="input-base"
              />
            </FieldLabel>

            <FieldLabel label="Work email" htmlFor="email" required>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailTouched(true);
                }}
                placeholder="jane@company.com"
                className="input-base"
              />
            </FieldLabel>
          </div>

          {/* Company + Role */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldLabel label="Company" htmlFor="company" required>
              <input
                id="company"
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Your organisation"
                className="input-base"
              />
            </FieldLabel>

            <FieldLabel label="Your role" htmlFor="role">
              <input
                id="role"
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Head of Sustainability"
                className="input-base"
              />
            </FieldLabel>
          </div>

          {/* Engagement */}
          <FieldLabel label="Engagement" htmlFor="engagement" required>
            <select
              id="engagement"
              required
              value={engagement}
              onChange={(e) => setEngagement(e.target.value)}
              className="input-base"
            >
              <option value="">Select an engagement</option>
              {ENGAGEMENTS.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.label}
                </option>
              ))}
            </select>
          </FieldLabel>

          {/* Timeline + Budget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldLabel label="Timeline" htmlFor="timeline" required>
              <select
                id="timeline"
                required
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                className="input-base"
              >
                <option value="">Select a timeline</option>
                {TIMELINES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </FieldLabel>

            <FieldLabel label="Indicative budget" htmlFor="budget">
              <select
                id="budget"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="input-base"
              >
                <option value="">Optional, helps us scope faster</option>
                {BUDGETS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
            </FieldLabel>
          </div>

          {/* Message */}
          <FieldLabel label="What are you trying to accomplish?" htmlFor="message" required>
            <textarea
              id="message"
              required
              rows={6}
              minLength={10}
              maxLength={10_000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="A paragraph or two is enough. What's the business context, what's due when, and what would success look like?"
              className="input-base resize-y"
            />
          </FieldLabel>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-[11.5px] text-gt-text-muted leading-snug max-w-md">
              By submitting you agree to Greentryst contacting you about this enquiry. No marketing, no list.
            </p>
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-[13px] font-bold text-white bg-gt-medium hover:bg-gt-dark rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  Sending<span className="animate-pulse">…</span>
                </>
              ) : (
                <>
                  Send enquiry
                  <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 p-5 rounded-2xl bg-white border border-[#e5e7e5] flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-gt-medium/10 text-gt-medium flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4" strokeWidth={2} />
          </div>
          <div>
            <p className="text-[13px] font-bold text-gt-text">Prefer a quick call?</p>
            <p className="mt-1 text-[12.5px] text-gt-text-muted leading-relaxed">
              Pick the <em>Sustainability Readiness Diagnostic</em> above. It is a free sixty-minute working session; you leave with a written gap snapshot and a recommended plan.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .input-base {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #e5e7e5;
          border-radius: 0.5rem;
          background-color: #ffffff;
          font-size: 14px;
          color: #18181b;
          transition: border-color 150ms ease;
        }
        .input-base:focus {
          outline: none;
          border-color: #2d6a4f;
          box-shadow: 0 0 0 3px rgba(45, 106, 79, 0.15);
        }
      `}</style>
    </main>
  );
}

function FieldLabel({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-1.5">
      <span className="text-[12px] font-semibold text-gt-text">
        {label}
        {required && <span className="text-gt-medium ml-1">*</span>}
      </span>
      {children}
    </label>
  );
}

export default function EnquirePage() {
  return (
    <>
      <Nav />
      <Suspense
        fallback={
          <main className="min-h-[60vh] bg-[#fafbfa] flex items-center justify-center">
            <h1 className="sr-only">Services Enquiry</h1>
            <p className="text-[13px] text-gt-text-muted">Loading…</p>
          </main>
        }
      >
        <EnquireForm />
      </Suspense>
      <RedesignFooter />
    </>
  );
}
