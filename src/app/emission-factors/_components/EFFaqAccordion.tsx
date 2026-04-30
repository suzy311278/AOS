'use client';

/**
 * EFFaqAccordion
 *
 * Single-open accordion for the Emission Factors FAQ. Subtle dividers,
 * no card chrome, chevron toggles. Keyboard accessible.
 */

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: 'Is it really free?',
    a: 'Yes. The reference is free with no sign-up. Optional account features (saved factors, cite lists, search history) are also free. Paid tools sit in a separate workspace product, not here.',
  },
  {
    q: 'How often are factors verified?',
    a: 'Every factor is dual-verified by two editors at ingestion. Each is re-checked against its source annually. The last verified date is shown on every factor page and must be under 13 months old to be marked current.',
  },
  {
    q: 'What if I find an error?',
    a: 'Every factor page has a Report an issue button. We respond within five business days. Confirmed corrections are logged in the public changelog on the factor page with a timestamp and editor note. We never silently edit values.',
  },
  {
    q: 'Why do you keep old versions of factors?',
    a: 'Auditability. If you reported using DEFRA 2023 last year, that factor must remain accessible at the same URL forever so an auditor can verify your prior inventory. New versions sit alongside the old ones with a supersession banner.',
  },
  {
    q: 'My source is not here. Will you add it?',
    a: 'Probably. We prioritise sources that real practitioner search demand surfaces. Suggest a source through the Report an issue button on any page and we will weigh it in the next sprint.',
  },
];

export function EFFaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl">
      <ul className="divide-y divide-gt-border-light">
        {FAQS.map((item, i) => {
          const isOpen = open === i;
          return (
            <li key={item.q}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-6 py-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F]/40 rounded-md"
              >
                <span className="text-base font-semibold text-gt-text">
                  {item.q}
                </span>
                <ChevronDown
                  className={
                    'h-5 w-5 flex-shrink-0 text-gt-text-dim transition-transform duration-200 ' +
                    (isOpen ? 'rotate-180' : '')
                  }
                  strokeWidth={2}
                />
              </button>
              <div
                className={
                  'grid transition-all duration-200 ease-out ' +
                  (isOpen
                    ? 'grid-rows-[1fr] opacity-100 pb-5'
                    : 'grid-rows-[0fr] opacity-0')
                }
              >
                <div className="overflow-hidden">
                  <p className="text-gt-text-muted leading-relaxed pr-10">
                    {item.a}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
