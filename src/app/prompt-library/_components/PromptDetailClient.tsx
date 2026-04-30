'use client';

/**
 * PromptDetailClient
 *
 * The interactive half of /prompt-library/[slug]. Renders:
 *   1. The raw prompt with a Copy button (works anonymously)
 *   2. A personalisation form whose "Copy personalised prompt" action
 *      is gated behind Clerk auth
 *
 * Form fields are uncontrolled to keep the component cheap; we read
 * values at copy time with FormData.
 */

import { useState } from 'react';
import { useUser, SignInButton } from '@clerk/nextjs';
import { Copy, Check, Lock, ArrowUpRight } from 'lucide-react';
import type { Prompt } from '@/lib/prompt-library/types';

interface Props {
  prompt: Prompt;
}

export function PromptDetailClient({ prompt }: Props) {
  const { isSignedIn, isLoaded } = useUser();
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [copiedFilled, setCopiedFilled] = useState(false);
  const [filledError, setFilledError] = useState<string | null>(null);

  async function copyText(text: string, which: 'raw' | 'filled') {
    try {
      await navigator.clipboard.writeText(text);
      if (which === 'raw') {
        setCopiedRaw(true);
        setTimeout(() => setCopiedRaw(false), 2000);
      } else {
        setCopiedFilled(true);
        setTimeout(() => setCopiedFilled(false), 2000);
      }
    } catch {
      setFilledError('Copy failed — your browser blocked clipboard access.');
    }
  }

  function handlePersonalisedCopy(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFilledError(null);
    const formData = new FormData(e.currentTarget);
    const missing = prompt.variables
      .filter((v) => v.required)
      .filter((v) => !(formData.get(v.key) as string | null)?.trim())
      .map((v) => v.label);
    if (missing.length > 0) {
      setFilledError(`Please fill: ${missing.join(', ')}`);
      return;
    }

    let filled = prompt.prompt;
    for (const v of prompt.variables) {
      const value = ((formData.get(v.key) as string | null) ?? '').trim();
      filled = filled.split(`{${v.key}}`).join(value);
    }
    void copyText(filled, 'filled');
  }

  const hasVariables = prompt.variables.length > 0;

  return (
    <div
      className={
        hasVariables
          ? 'grid gap-6 lg:grid-cols-2 lg:gap-8'
          : 'space-y-10'
      }
    >
      {/* ===== RAW PROMPT (+ notes below it on desktop to fill the
           shorter left column without forcing the <pre> to stretch) ===== */}
      <div className="space-y-6">
      <section className="rounded-2xl bg-white border border-gt-border-light shadow-gt-card p-6 md:p-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-gt-text-dim">
              The prompt
            </div>
            <h2 className="mt-2 text-lg font-bold text-gt-text">
              Copy as-is, edit later
            </h2>
            <p className="mt-1 text-sm text-gt-text-muted max-w-xl">
              Placeholders like <code className="px-1 py-0.5 rounded bg-gt-pale font-mono text-[12px]">{'{company_name}'}</code>{' '}
              stay visible. Paste into ChatGPT or Claude and replace them by
              hand, or use the personalise form to auto-fill.
            </p>
          </div>
          <button
            type="button"
            onClick={() => copyText(prompt.prompt, 'raw')}
            className="inline-flex items-center gap-2 rounded-lg bg-[#005c55] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#003d38] transition-colors shrink-0"
          >
            {copiedRaw ? (
              <>
                <Check className="h-4 w-4" strokeWidth={2.5} />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" strokeWidth={2} />
                Copy prompt
              </>
            )}
          </button>
        </div>

        <pre className="mt-5 max-h-[480px] overflow-auto rounded-lg bg-gt-pale p-5 text-[13px] leading-relaxed text-gt-text whitespace-pre-wrap font-mono">
          {prompt.prompt}
        </pre>
      </section>

        {prompt.notes && (
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-gt-text-dim mb-3">
              Notes
            </div>
            <p className="text-sm text-gt-text-muted whitespace-pre-line">
              {prompt.notes}
            </p>
          </div>
        )}
      </div>

      {/* ===== PERSONALISE FORM ===== */}
      {hasVariables && (
        <section className="rounded-2xl bg-white border border-gt-border-light shadow-gt-card p-6 md:p-8 relative">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-gt-text-dim">
              Personalise
            </div>
            <h2 className="mt-2 text-lg font-bold text-gt-text">
              Fill in for your company, copy ready-to-run
            </h2>
            <p className="mt-1 text-sm text-gt-text-muted max-w-xl">
              Enter your context below. We substitute the placeholders and
              hand you the full prompt on your clipboard.
            </p>
          </div>

          <form
            onSubmit={handlePersonalisedCopy}
            className="mt-6 space-y-4"
            aria-disabled={!isSignedIn}
          >
            {prompt.variables.map((v) => (
              <div key={v.key}>
                <label
                  htmlFor={`f-${v.key}`}
                  className="block text-sm font-semibold text-gt-text mb-1.5"
                >
                  {v.label}
                  {v.required && (
                    <span className="text-gt-text-dim font-normal ml-1">
                      (required)
                    </span>
                  )}
                </label>
                {v.type === 'textarea' ? (
                  <textarea
                    id={`f-${v.key}`}
                    name={v.key}
                    placeholder={v.placeholder}
                    rows={4}
                    disabled={!isSignedIn}
                    className="w-full rounded-lg border border-gt-border-light bg-white px-4 py-3 text-sm text-gt-text placeholder:text-gt-text-dim focus:border-[#005c55] focus:outline-none focus:ring-2 focus:ring-[#005c55]/20 disabled:bg-gt-pale disabled:cursor-not-allowed"
                  />
                ) : (
                  <input
                    id={`f-${v.key}`}
                    name={v.key}
                    type="text"
                    placeholder={v.placeholder}
                    disabled={!isSignedIn}
                    className="w-full rounded-lg border border-gt-border-light bg-white px-4 py-3 text-sm text-gt-text placeholder:text-gt-text-dim focus:border-[#005c55] focus:outline-none focus:ring-2 focus:ring-[#005c55]/20 disabled:bg-gt-pale disabled:cursor-not-allowed"
                  />
                )}
              </div>
            ))}

            {filledError && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-800">
                {filledError}
              </div>
            )}

            <div className="pt-2">
              {isLoaded && isSignedIn ? (
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#005c55] text-white px-5 py-3 text-sm font-semibold hover:bg-[#003d38] transition-colors"
                >
                  {copiedFilled ? (
                    <>
                      <Check className="h-4 w-4" strokeWidth={2.5} />
                      Personalised prompt copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" strokeWidth={2} />
                      Copy personalised prompt
                    </>
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-3 flex-wrap">
                  <SignInButton
                    mode="modal"
                    forceRedirectUrl={
                      typeof window !== 'undefined'
                        ? window.location.pathname
                        : '/prompt-library'
                    }
                  >
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-lg bg-[#005c55] text-white px-5 py-3 text-sm font-semibold hover:bg-[#003d38] transition-colors"
                    >
                      <Lock className="h-4 w-4" strokeWidth={2} />
                      Sign in to personalise
                    </button>
                  </SignInButton>
                  <span className="text-xs text-gt-text-dim">
                    Free account. Email + password or Google. Copying the raw
                    prompt above stays open to everyone.
                  </span>
                </div>
              )}
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
