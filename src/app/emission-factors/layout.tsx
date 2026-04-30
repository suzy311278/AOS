/**
 * /emission-factors layout.
 *
 * Shares redesign chrome (Nav top, RedesignFooter bottom) with every
 * EF surface. Page-specific metadata lives in each child page.
 */

import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { RedesignFooter } from '@/components/redesign';

export const metadata: Metadata = {
  title: {
    default: 'Emission Factors',
    template: '%s - Emission Factors',
  },
  description:
    'Every emission factor. Sourced. Dated. Free. A reference library of greenhouse-gas emission factors with full provenance, citation formats, and vintage tracking.',
};

export default function EmissionFactorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav />
      <main className="min-h-screen bg-gt-pale text-gt-text">{children}</main>
      <RedesignFooter />
    </>
  );
}
