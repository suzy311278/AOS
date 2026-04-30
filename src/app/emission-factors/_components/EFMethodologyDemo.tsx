/**
 * EFMethodologyDemo
 *
 * A confident two-column demo of how Greentryst explains methodology in
 * plain English. Pairs editorial copy (left) with a real explainer card
 * (right), reusing EFMethodologyExplainer for the card content.
 */

import { CategoryLabel, SectionHeading } from '@/components/redesign';
import { EFMethodologyExplainer } from './EFMethodologyExplainer';
import { BookOpen } from 'lucide-react';

export function EFMethodologyDemo() {
  return (
    <div className="grid gap-12 md:grid-cols-2 md:items-center">
      <div>
        <CategoryLabel>Built for assurance</CategoryLabel>
        <SectionHeading size="sub" className="mt-4">
          Methodology, explained in plain English.
        </SectionHeading>
        <p className="mt-5 text-base md:text-lg text-gt-text-muted leading-relaxed max-w-lg">
          Every factor carries the context an auditor expects. We write short
          methodology notes in language practitioners can use directly in
          disclosures, without guessing what a standard actually requires.
        </p>
        <div className="mt-6 flex items-center gap-2 text-sm text-gt-text-muted">
          <BookOpen className="h-4 w-4 text-[#2D6A4F]" />
          <span>Shown on every factor page, alongside the value.</span>
        </div>
      </div>

      <div className="relative">
        <div
          className="pointer-events-none absolute -inset-6 -z-10 blur-3xl opacity-60"
          aria-hidden
          style={{
            background:
              'radial-gradient(55% 55% at 50% 50%, rgba(140,212,202,0.35) 0%, rgba(140,212,202,0) 70%)',
          }}
        />
        <EFMethodologyExplainer methodology="location_based" />
      </div>
    </div>
  );
}
