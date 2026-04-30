/**
 * /redesign/disclaimer - Disclaimer Page
 *
 * Legal disclaimer and terms of use information.
 */

import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { RedesignFooter } from '@/components/redesign';

export const metadata: Metadata = {
  title: 'Disclaimer',
  description: 'Legal disclaimer and terms of use for Greentryst.',
  alternates: { canonical: '/disclaimer' },
  openGraph: {
    type: 'website',
    url: '/disclaimer',
    title: 'Disclaimer',
    description: 'Legal disclaimer and terms of use for Greentryst.',
  },
};

export default function DisclaimerPage() {
  return (
    <>
      <Nav />

      <main className="pt-28 pb-16 bg-[#fafbfa] min-h-[80vh]">
        <div className="max-w-[800px] mx-auto px-8">
          <h1 className="text-[32px] font-extrabold text-gt-text mb-4">
            Disclaimer
          </h1>
          <p className="text-[13px] text-gt-text-muted mb-12">
            Last updated: April 2026
          </p>

          <div className="prose prose-gt max-w-none">
            <section className="mb-10">
              <h2 className="text-[20px] font-bold text-gt-text mb-4">Educational Purpose</h2>
              <p className="text-[14px] text-gt-text-muted leading-relaxed mb-4">
                The content provided on Greentryst, including courses, lessons, articles, and responses from SustainIQ, is for educational and informational purposes only. This content does not constitute professional advice, including but not limited to legal, financial, accounting, environmental consulting, or regulatory compliance advice.
              </p>
              <p className="text-[14px] text-gt-text-muted leading-relaxed">
                While we strive to provide accurate and up-to-date information sourced from authoritative documents and standards, sustainability regulations and methodologies evolve rapidly. Users should verify all information against current official sources and consult qualified professionals for specific guidance.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-[20px] font-bold text-gt-text mb-4">No Professional Relationship</h2>
              <p className="text-[14px] text-gt-text-muted leading-relaxed">
                Use of Greentryst does not create a professional relationship between you and Greentryst or any of our team members. The platform is a learning and productivity tool, not a substitute for professional consulting services.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-[20px] font-bold text-gt-text mb-4">SustainIQ and AI-Generated Content</h2>
              <p className="text-[14px] text-gt-text-muted leading-relaxed mb-4">
                SustainIQ uses artificial intelligence to provide responses to user queries. While SustainIQ is designed to cite primary sources and provide accurate information, AI systems can make errors. All responses should be independently verified, especially for regulatory compliance, reporting, or business decisions.
              </p>
              <p className="text-[14px] text-gt-text-muted leading-relaxed">
                Citations provided by SustainIQ reference specific documents and sections. Users are encouraged to consult the original source documents directly for authoritative guidance.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-[20px] font-bold text-gt-text mb-4">Third-Party Content and Links</h2>
              <p className="text-[14px] text-gt-text-muted leading-relaxed">
                Greentryst may contain links to third-party websites, documents, or resources. We do not control these external resources and are not responsible for their content, accuracy, or availability. Inclusion of a link does not imply endorsement.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-[20px] font-bold text-gt-text mb-4">Career Directory</h2>
              <p className="text-[14px] text-gt-text-muted leading-relaxed">
                Job listings in our Career Directory are aggregated from various sources and employer postings. Greentryst does not guarantee the accuracy of job listings, the legitimacy of employers, or the outcome of any job application. Users should conduct their own due diligence before applying to any position.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-[20px] font-bold text-gt-text mb-4">Limitation of Liability</h2>
              <p className="text-[14px] text-gt-text-muted leading-relaxed">
                To the maximum extent permitted by law, Greentryst shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from your use of the platform, reliance on any content provided, or any decisions made based on such content.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-[20px] font-bold text-gt-text mb-4">Changes to This Disclaimer</h2>
              <p className="text-[14px] text-gt-text-muted leading-relaxed">
                We may update this disclaimer from time to time. Continued use of the platform after changes constitutes acceptance of the updated disclaimer.
              </p>
            </section>

            <section>
              <h2 className="text-[20px] font-bold text-gt-text mb-4">Contact</h2>
              <p className="text-[14px] text-gt-text-muted leading-relaxed">
                If you have questions about this disclaimer, please contact us at{' '}
                <a href="mailto:legal@greentryst.com" className="text-gt-medium hover:text-gt-dark">
                  legal@greentryst.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>

      <RedesignFooter />
    </>
  );
}
