/**
 * /terms — Terms of Service
 */

import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { RedesignFooter } from '@/components/redesign';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'The rules and obligations for using Greentryst.',
  alternates: { canonical: '/terms' },
  openGraph: {
    type: 'website',
    url: '/terms',
    title: 'Terms of Service',
    description:
      'The rules and obligations for using Greentryst.',
  },
};

export default function TermsPage() {
  return (
    <>
      <Nav />

      <main className="pt-28 pb-16 bg-[#fafbfa] min-h-[80vh]">
        <div className="max-w-[800px] mx-auto px-8">
          <h1 className="text-[32px] font-extrabold text-gt-text mb-4">
            Terms of Service
          </h1>
          <p className="text-[13px] text-gt-text-muted mb-12">
            Last updated: April 2026
          </p>

          <div className="prose prose-gt max-w-none">
            <section className="mb-10">
              <h2 className="text-[20px] font-bold text-gt-text mb-4">
                1. Acceptance of terms
              </h2>
              <p className="text-[14px] text-gt-text-muted leading-relaxed">
                By accessing or using Greentryst, you agree to be bound by these
                Terms of Service. If you do not agree, do not use the platform.
                We may update these terms from time to time. Continued use after
                changes constitutes acceptance.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-[20px] font-bold text-gt-text mb-4">
                2. Accounts and eligibility
              </h2>
              <p className="text-[14px] text-gt-text-muted leading-relaxed mb-4">
                You must be at least 18 years old to create an account. You are
                responsible for maintaining the confidentiality of your account
                credentials and for all activity under your account.
              </p>
              <p className="text-[14px] text-gt-text-muted leading-relaxed">
                Team and Enterprise accounts must be created by an authorised
                representative of the organisation.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-[20px] font-bold text-gt-text mb-4">
                3. Subscriptions and payments
              </h2>
              <p className="text-[14px] text-gt-text-muted leading-relaxed mb-4">
                Paid subscriptions are billed in advance on a monthly or annual
                basis. You may cancel at any time; cancellation takes effect at
                the end of the current billing period. No refunds for partial
                months.
              </p>
              <p className="text-[14px] text-gt-text-muted leading-relaxed">
                We reserve the right to change pricing with 30 days notice.
                Existing subscriptions continue at the current rate until renewal.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-[20px] font-bold text-gt-text mb-4">
                4. Acceptable use
              </h2>
              <p className="text-[14px] text-gt-text-muted leading-relaxed mb-4">
                You agree not to use Greentryst for any unlawful purpose, not to
                attempt to gain unauthorised access to any part of the platform,
                and not to use automated means to scrape or extract data beyond
                what is permitted by our APIs.
              </p>
              <p className="text-[14px] text-gt-text-muted leading-relaxed">
                We reserve the right to suspend or terminate accounts that
                violate these rules.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-[20px] font-bold text-gt-text mb-4">
                5. Intellectual property
              </h2>
              <p className="text-[14px] text-gt-text-muted leading-relaxed mb-4">
                Greentryst owns all rights to the platform, branding, and
                original content. You retain ownership of any data you input.
              </p>
              <p className="text-[14px] text-gt-text-muted leading-relaxed">
                Course content and generated outputs are licensed to you for
                personal or internal business use. You may not redistribute,
                resell, or publicly republish platform content without written
                permission.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-[20px] font-bold text-gt-text mb-4">
                6. Disclaimers
              </h2>
              <p className="text-[14px] text-gt-text-muted leading-relaxed">
                Greentryst is provided "as is" without warranties of any kind.
                AI-generated responses, including those from SustainIQ, should
                be independently verified before use in regulatory compliance,
                reporting, or business decisions. See our{' '}
                <a href="/disclaimer" className="text-gt-medium hover:text-gt-dark">
                  Disclaimer
                </a>{' '}
                for full details.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-[20px] font-bold text-gt-text mb-4">
                7. Limitation of liability
              </h2>
              <p className="text-[14px] text-gt-text-muted leading-relaxed">
                To the maximum extent permitted by law, Greentryst shall not be
                liable for any indirect, incidental, special, or consequential
                damages arising from your use of the platform.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-[20px] font-bold text-gt-text mb-4">
                8. Termination
              </h2>
              <p className="text-[14px] text-gt-text-muted leading-relaxed">
                Either party may terminate the agreement at any time. Upon
                termination, your right to use the platform ceases immediately.
                Data deletion is handled in accordance with our{' '}
                <a href="/privacy" className="text-gt-medium hover:text-gt-dark">
                  Privacy Policy
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-[20px] font-bold text-gt-text mb-4">
                9. Contact
              </h2>
              <p className="text-[14px] text-gt-text-muted leading-relaxed">
                For questions about these Terms, contact us at{' '}
                <a
                  href="mailto:legal@greentryst.com"
                  className="text-gt-medium hover:text-gt-dark"
                >
                  legal@greentryst.com
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </main>

      <RedesignFooter />
    </>
  );
}
