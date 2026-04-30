/**
 * /redesign/feedback - Feedback Page
 *
 * User feedback submission form.
 */

'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MessageSquare, Send, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Nav } from '@/components/Nav';
import { RedesignFooter } from '@/components/redesign';

const FEEDBACK_TYPES = [
  { id: 'bug', label: 'Bug Report', description: 'Something isn\'t working correctly' },
  { id: 'feature', label: 'Feature Request', description: 'Suggest a new feature or improvement' },
  { id: 'content', label: 'Content Feedback', description: 'Feedback on courses or lessons' },
  { id: 'other', label: 'Other', description: 'General feedback or questions' },
];

const VALID_TYPES = new Set(FEEDBACK_TYPES.map((t) => t.id));

function FeedbackForm() {
  const searchParams = useSearchParams();
  const [type, setType] = useState('');

  // Preselect category from ?type=services on arrival so Services page
  // "Enquire" links land on the right form state.
  useEffect(() => {
    const initial = searchParams?.get('type');
    if (initial && VALID_TYPES.has(initial)) setType(initial);
  }, [searchParams]);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          message,
          email,
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
      <>
        <Nav />
        <main className="min-h-[80vh] bg-[#fafbfa] flex items-center justify-center px-8 pt-20">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600" strokeWidth={1.5} />
            </div>
            <h1 className="text-[24px] font-extrabold text-gt-text mb-3">
              Thank you for your feedback!
            </h1>
            <p className="text-[14px] text-gt-text-muted mb-8">
              We appreciate you taking the time to help us improve Greentryst. We'll review your feedback and get back to you if needed.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gt-medium text-white text-[14px] font-bold rounded-lg hover:bg-gt-dark transition-colors"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={2} />
              Back to Home
            </Link>
          </div>
        </main>
        <RedesignFooter />
      </>
    );
  }

  return (
    <>
      <Nav />

      <main className="pt-28 pb-16 bg-[#fafbfa] min-h-[80vh]">
        <div className="max-w-[600px] mx-auto px-8">
          <div className="text-center mb-10">
            <div className="w-14 h-14 rounded-xl bg-gt-leaf/10 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-7 h-7 text-gt-medium" strokeWidth={1.5} />
            </div>
            <h1 className="text-[28px] font-extrabold text-gt-text mb-3">
              Send us feedback
            </h1>
            <p className="text-[15px] text-gt-text-muted">
              Help us improve Greentryst. We read every piece of feedback.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-[#e5e7e5] p-8">
            {/* Feedback Type */}
            <div className="mb-6">
              <label className="block text-[13px] font-semibold text-gt-text mb-3">
                What type of feedback is this?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {FEEDBACK_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id)}
                    className={`p-4 rounded-lg border text-left transition-colors ${
                      type === t.id
                        ? 'border-gt-medium bg-gt-leaf/5'
                        : 'border-[#e5e7e5] hover:border-gt-medium/50'
                    }`}
                  >
                    <p className={`text-[13px] font-semibold ${type === t.id ? 'text-gt-medium' : 'text-gt-text'}`}>
                      {t.label}
                    </p>
                    <p className="text-[11px] text-gt-text-muted mt-0.5">{t.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="mb-6">
              <label htmlFor="message" className="block text-[13px] font-semibold text-gt-text mb-2">
                Your feedback
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what's on your mind..."
                rows={5}
                required
                className="w-full px-4 py-3 border border-[#e5e7e5] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-gt-medium focus:border-transparent resize-none"
              />
            </div>

            {/* Email */}
            <div className="mb-8">
              <label htmlFor="email" className="block text-[13px] font-semibold text-gt-text mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-[#e5e7e5] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-gt-medium focus:border-transparent"
              />
              <p className="text-[11px] text-gt-text-muted mt-2">
                We send a receipt and follow up to this address.
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!type || !message || !email || submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gt-medium text-white text-[14px] font-bold rounded-lg hover:bg-gt-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                'Sending...'
              ) : (
                <>
                  Send Feedback
                  <Send className="w-4 h-4" strokeWidth={2} />
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      <RedesignFooter />
    </>
  );
}

export default function FeedbackPage() {
  // useSearchParams must be in a Suspense boundary for SSG.
  return (
    <Suspense
      fallback={
        <main className="min-h-[80vh] bg-[#fafbfa] flex items-center justify-center">
          <h1 className="sr-only">Send us feedback</h1>
          <p className="text-[13px] text-gt-text-muted">Loading…</p>
        </main>
      }
    >
      <FeedbackForm />
    </Suspense>
  );
}
