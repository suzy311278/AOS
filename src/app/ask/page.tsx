/**
 * /redesign/ask - SustainIQ
 *
 * The SustainIQ surface is a real product page, not a content page.
 * Per the locked decision, it deliberately does NOT use a dark hero
 * band - it lands the user directly in the workspace. The page wraps
 * the redesigned client with the standard nav and footer chrome.
 *
 * The /api/ask SSE endpoint, the streaming protocol, and the
 * Source / LessonLink / Message data shapes are all preserved
 * unchanged from the production /ask client.
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Nav } from '@/components/Nav';
import {
  RedesignFooter,
} from '@/components/redesign';
import { AskClientRedesign } from './_components/AskClientRedesign';
import AskEmptyState from './_components/AskEmptyState';

export const metadata: Metadata = {
  title: 'SustainIQ',
  description:
    'Ask anything about sustainability frameworks, standards, and methodologies. GHG Protocol, CSRD, ESRS, IFRS S2, GRI, SASB, SBTi, EU Taxonomy, SFDR, CBAM, carbon markets, and more. Every answer is sourced to its primary document.',
  alternates: { canonical: '/ask' },
  openGraph: {
    type: 'website',
    url: '/ask',
    title: 'SustainIQ',
    description:
      'Ask anything about sustainability frameworks, standards, and methodologies. Every answer is sourced to its primary document.',
  },
};

export default function SustainIQPage() {
  return (
    <>
      <Nav />
      <Suspense
        fallback={
          <main className="min-h-screen bg-gt-pale">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-14 pb-10 lg:pt-24 lg:pb-14">
              <AskEmptyState />
            </div>
          </main>
        }
      >
        <AskClientRedesign />
      </Suspense>
      <RedesignFooter />
    </>
  );
}
