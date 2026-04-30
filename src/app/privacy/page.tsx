/**
 * /privacy — Privacy Policy
 */

import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { RedesignFooter } from '@/components/redesign';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How Greentryst collects, uses, and protects your personal data.',
  alternates: { canonical: '/privacy' },
  openGraph: {
    type: 'website',
    url: '/privacy',
    title: 'Privacy Policy',
    description:
      'How Greentryst collects, uses, and protects your personal data.',
  },
};

export default function PrivacyPage() {
  return (
    <>
      <Nav />

      <main className="pt-28 pb-16 bg-[#fafbfa] min-h-[80vh]">
        <div className="max-w-[800px] mx-auto px-8">
          <h1 className="text-[32px] font-extrabold text-gt-text mb-4">
            Privacy Policy
          </h1>
          <p className="text-[13px] text-gt-text-muted mb-12">
            Last updated: April 2026
          </p>

          <div className="prose prose-gt max-w-none">
            <section className="mb-10">
              <h2 className="text-[20px] font-bold text-gt-text mb-4">
                1. What we collect
              </h2>
              <p className="text-[14px] text-gt-text-muted leading-relaxed mb-4">
                We collect information you provide directly, such as your name,
                email address, and payment details when you create an account,
                subscribe to a plan, or contact us. We also collect usage data
                — including pages viewed, features used, and query history — to
                improve the platform.
              </p>
              <p className="text-[14px] text-gt-text-muted leading-relaxed">
                For Enterprise customers, we may collect additional information
                such as team member names, roles, and workspace activity to
                support account management and billing.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-[20px] font-bold text-gt-text mb-4">
                2. How we use your data
              </h2>
              <p className="text-[14px] text-gt-text-muted leading-relaxed mb-4">
                We use your data to provide and improve Greentryst services, to
                process payments, to communicate with you about your account,
                and to send relevant product updates. We do not sell your
                personal data to third parties.
              </p>
              <p className="text-[14px] text-gt-text-muted leading-relaxed">
                Aggregated, anonymised data may be used for analytics and to
                improve our AI models, including SustainIQ responses.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-[20px] font-bold text-gt-text mb-4">
                3. Data storage and security
              </h2>
              <p className="text-[14px] text-gt-text-muted leading-relaxed">
                We use industry-standard encryption and access controls to
                protect your data. Data is stored in secure cloud infrastructure
                with regular backups. Enterprise customers may select EU or US
                data residency.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-[20px] font-bold text-gt-text mb-4">
                4. Third-party services
              </h2>
              <p className="text-[14px] text-gt-text-muted leading-relaxed">
                We use trusted third-party providers for authentication,
                payments, analytics, and email delivery. These providers are
                contractually bound to handle data only on our behalf and in
                compliance with this policy.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-[20px] font-bold text-gt-text mb-4">
                5. Cookies and tracking
              </h2>
              <p className="text-[14px] text-gt-text-muted leading-relaxed">
                We use essential cookies for authentication and session
                management. We may use analytics cookies to understand how
                visitors use the platform. You can control cookie preferences
                through your browser settings.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-[20px] font-bold text-gt-text mb-4">
                6. Your rights
              </h2>
              <p className="text-[14px] text-gt-text-muted leading-relaxed">
                Depending on your location, you may have the right to access,
                correct, delete, or export your personal data. To exercise these
                rights, contact us at{' '}
                <a
                  href="mailto:privacy@greentryst.com"
                  className="text-gt-medium hover:text-gt-dark"
                >
                  privacy@greentryst.com
                </a>
                . We will respond within 30 days.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-[20px] font-bold text-gt-text mb-4">
                7. Data retention
              </h2>
              <p className="text-[14px] text-gt-text-muted leading-relaxed">
                We retain your data for as long as your account is active or as
                needed to provide services. Workspace history is retained for
                365 days. Learning progress and certificates are retained
                permanently unless you request deletion.
              </p>
            </section>

            <section>
              <h2 className="text-[20px] font-bold text-gt-text mb-4">
                8. Contact
              </h2>
              <p className="text-[14px] text-gt-text-muted leading-relaxed">
                If you have questions about this Privacy Policy, please contact
                us at{' '}
                <a
                  href="mailto:privacy@greentryst.com"
                  className="text-gt-medium hover:text-gt-dark"
                >
                  privacy@greentryst.com
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
