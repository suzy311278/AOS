'use client';

/**
 * EFIssueReportButton
 *
 * Opens a modal with a textarea for reporting an issue with a factor.
 * Phase B: submits to a stub endpoint (/api/emission-factors/issues) and
 * logs to console. The real endpoint is built in Phase E.
 */

import { useState } from 'react';
import { Flag, X } from 'lucide-react';

export interface EFIssueReportButtonProps {
  factorId: string;
}

export function EFIssueReportButton({ factorId }: EFIssueReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/emission-factors/issues', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          factorId,
          description,
          reporterEmail: email || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(
          data?.error ??
            'Something went wrong. Please try again in a moment.',
        );
        return;
      }
      setDone(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setDone(false);
    setDescription('');
    setEmail('');
    setError(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-gt-border-light bg-white px-3 py-1.5 text-xs font-semibold text-gt-text-muted hover:border-[#95D5B2] hover:text-[#2D6A4F]"
      >
        <Flag className="h-3.5 w-3.5" aria-hidden />
        Report an issue
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ef-issue-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-gt-card-lg">
            <div className="flex items-center justify-between border-b border-gt-border-light px-5 py-3">
              <h2 id="ef-issue-title" className="font-semibold text-gt-text">
                Report an issue
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={handleClose}
                className="text-gt-text-muted hover:text-[#2D6A4F]"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            {done ? (
              <div className="px-5 py-8 text-center">
                <div className="font-semibold text-gt-text">Thanks, this is logged.</div>
                <p className="mt-1 text-sm text-gt-text-muted">
                  Our editors will review and respond if needed.
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-4 rounded-full bg-[#2D6A4F] text-white text-sm font-semibold px-4 py-2"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
                {error && (
                  <div
                    role="alert"
                    className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800"
                  >
                    {error}
                  </div>
                )}
                <div>
                  <label className="text-xs uppercase tracking-[0.08em] text-gt-text-dim">
                    What is wrong or unclear?
                  </label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    className="mt-1 w-full rounded-lg border border-gt-border-light bg-white px-3 py-2 text-sm text-gt-text outline-none focus:border-[#2D6A4F]"
                    placeholder="Describe the issue, including any sources or corrections."
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.08em] text-gt-text-dim">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gt-border-light bg-white px-3 py-2 text-sm text-gt-text outline-none focus:border-[#2D6A4F]"
                    placeholder="you@example.com"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-full border border-gt-border-light bg-white px-4 py-2 text-sm font-semibold text-gt-text"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-full bg-[#2D6A4F] text-white text-sm font-semibold px-4 py-2 disabled:opacity-60"
                  >
                    {submitting ? 'Submitting.' : 'Submit'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
