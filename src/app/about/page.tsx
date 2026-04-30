/**
 * /redesign/about - About Page
 *
 * Company mission, vision, and team information.
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import { Target, Eye, Heart, ArrowRight, Leaf, Users, Globe, Award, FileCheck, LineChart } from 'lucide-react';
import { Nav } from '@/components/Nav';
import { RedesignFooter } from '@/components/redesign';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbList, DESKS, ORG_ID, EDITORIAL_ID, SITE_URL } from '@/lib/seo/schema';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Built by consultants from top consulting firms with 10+ years across Finance, Environmental Science, Energy Efficiency, and Renewable Energy. Every page reviewed against primary sources.',
  alternates: { canonical: '/about' },
  openGraph: {
    type: 'website',
    url: '/about',
    title: 'About Greentryst',
    description:
      'Built by consultants from top consulting firms with 10+ years across Finance, Environmental Science, Energy Efficiency, and Renewable Energy.',
  },
};

const ABOUT_PAGE_LD = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  '@id': `${SITE_URL}/about#aboutpage`,
  url: `${SITE_URL}/about`,
  name: 'About Greentryst',
  mainEntity: { '@id': ORG_ID },
  mentions: [{ '@id': EDITORIAL_ID }, ...Object.values(DESKS).map((d) => ({ '@id': d.id }))],
};

export default function AboutPage() {
  return (
    <>
      <JsonLd data={ABOUT_PAGE_LD} />
      <JsonLd
        data={breadcrumbList([
          { name: 'Home', url: '/' },
          { name: 'About' },
        ])}
      />
      <Nav />

      {/* Hero - pt-32 accounts for fixed nav */}
      <section className="relative overflow-hidden bg-gt-text-dark pt-32 pb-20">
        <div
          className="gt-ambient-glow-dark absolute -top-20 left-1/4 w-[600px] h-[600px] rounded-full"
          aria-hidden
        />
        <div
          className="gt-ambient-glow-dark absolute -bottom-40 right-0 w-[500px] h-[500px] rounded-full opacity-70"
          aria-hidden
        />
        <div
          className="gt-dot-grid absolute inset-0 opacity-40 pointer-events-none"
          aria-hidden
        />

        <div className="relative z-10 max-w-[900px] mx-auto px-8 text-center">
          <p
            className="text-[11px] font-bold uppercase text-gt-leaf mb-4"
            style={{ letterSpacing: '0.25em' }}
          >
            About Greentryst
          </p>
          <h1 className="text-[40px] md:text-[52px] font-extrabold text-white leading-[1.1] mb-6">
            Building the professional home
            <br />
            for sustainability.
          </h1>
          <p className="text-[17px] text-white/60 max-w-2xl mx-auto">
            We believe sustainability expertise should be accessible to everyone working to build a better future. Greentryst is where practitioners learn, verify, execute, and advance.
          </p>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="py-20 bg-[#fafbfa]">
        <div className="max-w-[1100px] mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-white rounded-xl border border-[#e5e7e5]">
              <div className="w-12 h-12 rounded-xl bg-gt-leaf/10 flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-gt-medium" strokeWidth={1.5} />
              </div>
              <h3 className="text-[18px] font-bold text-gt-text mb-3">Mission</h3>
              <p className="text-[14px] text-gt-text-muted leading-relaxed">
                To democratize sustainability knowledge by making professional-grade learning and tools accessible to practitioners worldwide.
              </p>
            </div>

            <div className="p-8 bg-white rounded-xl border border-[#e5e7e5]">
              <div className="w-12 h-12 rounded-xl bg-gt-leaf/10 flex items-center justify-center mb-6">
                <Eye className="w-6 h-6 text-gt-medium" strokeWidth={1.5} />
              </div>
              <h3 className="text-[18px] font-bold text-gt-text mb-3">Vision</h3>
              <p className="text-[14px] text-gt-text-muted leading-relaxed">
                A world where every sustainability professional has the knowledge and tools to drive meaningful environmental and social impact.
              </p>
            </div>

            <div className="p-8 bg-white rounded-xl border border-[#e5e7e5]">
              <div className="w-12 h-12 rounded-xl bg-gt-leaf/10 flex items-center justify-center mb-6">
                <Heart className="w-6 h-6 text-gt-medium" strokeWidth={1.5} />
              </div>
              <h3 className="text-[18px] font-bold text-gt-text mb-3">Values</h3>
              <p className="text-[14px] text-gt-text-muted leading-relaxed">
                Accuracy over speed. Depth over breadth. Real practitioners over theoretical experts. Citations over opinions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-20 bg-white border-y border-[#e5e7e5]">
        <div className="max-w-[900px] mx-auto px-8">
          <h2 className="text-[28px] font-extrabold text-gt-text text-center mb-12">
            What we do
          </h2>

          <div className="space-y-8">
            <div className="flex items-start gap-6">
              <div className="w-10 h-10 rounded-lg bg-gt-leaf/10 flex items-center justify-center flex-shrink-0 mt-1">
                <Leaf className="w-5 h-5 text-gt-medium" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-gt-text mb-2">Professional Learning</h3>
                <p className="text-[14px] text-gt-text-muted leading-relaxed">
                  23 courses covering climate science, carbon markets, ESG frameworks, sustainable finance, and regulatory compliance. Every lesson is sourced from primary documents and verified by domain experts.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-10 h-10 rounded-lg bg-gt-leaf/10 flex items-center justify-center flex-shrink-0 mt-1">
                <Globe className="w-5 h-5 text-gt-medium" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-gt-text mb-2">Intelligence Layer</h3>
                <p className="text-[14px] text-gt-text-muted leading-relaxed">
                  SustainIQ provides instant answers to complex methodology questions, with citations to primary sources like IPCC reports, GHG Protocol, and regulatory documents. No hallucinations, just verified information.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-10 h-10 rounded-lg bg-gt-leaf/10 flex items-center justify-center flex-shrink-0 mt-1">
                <Users className="w-5 h-5 text-gt-medium" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-gt-text mb-2">Career Advancement</h3>
                <p className="text-[14px] text-gt-text-muted leading-relaxed">
                  Our career directory connects practitioners with opportunities at leading organizations. Jobs are categorized by domain and matched to the skills you build on the platform.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who writes this content */}
      <section className="py-20 bg-[#fafbfa] border-y border-[#e5e7e5]">
        <div className="max-w-[1100px] mx-auto px-8">
          <div className="max-w-[720px] mb-12">
            <p
              className="text-[11px] font-bold uppercase text-gt-medium mb-3"
              style={{ letterSpacing: '0.25em' }}
            >
              Who writes this content
            </p>
            <h2 className="text-[28px] font-extrabold text-gt-text mb-4 leading-tight">
              Topical desks, not anonymous copy.
            </h2>
            <p className="text-[15px] text-gt-text-muted leading-relaxed">
              Every guide, course, and reference entry on Greentryst is produced by a named topical desk and reviewed by the Greentryst Editorial Board against the primary source document before publication. Our team brings more than a decade of experience from top management consulting firms across Finance, Environmental Science, Energy Efficiency, and Renewable Energy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-xl border border-[#e5e7e5]">
              <h3 className="text-[15px] font-bold text-gt-text mb-2">Carbon Markets Desk</h3>
              <p className="text-[13px] text-gt-text-muted leading-relaxed">
                CBAM, EU ETS, voluntary carbon markets, Article 6, Verra and Gold Standard methodologies (VM0042, VM0044), registry retirements.
              </p>
            </div>
            <div className="p-6 bg-white rounded-xl border border-[#e5e7e5]">
              <h3 className="text-[15px] font-bold text-gt-text mb-2">Climate Disclosure Desk</h3>
              <p className="text-[13px] text-gt-text-muted leading-relaxed">
                IFRS S1/S2, TCFD, CDP, SFDR, CSRD and ESRS, double materiality assessments.
              </p>
            </div>
            <div className="p-6 bg-white rounded-xl border border-[#e5e7e5]">
              <h3 className="text-[15px] font-bold text-gt-text mb-2">GHG Accounting Desk</h3>
              <p className="text-[13px] text-gt-text-muted leading-relaxed">
                GHG Protocol Corporate Standard, Scope 1/2/3, financed emissions (PCAF), emission factors, ISO 14064, SBTi target setting.
              </p>
            </div>
            <div className="p-6 bg-white rounded-xl border border-[#e5e7e5]">
              <h3 className="text-[15px] font-bold text-gt-text mb-2">Nature & Supply Chain Desk</h3>
              <p className="text-[13px] text-gt-text-muted leading-relaxed">
                EUDR, TNFD, biodiversity accounting, human rights due diligence, IFC Performance Standards.
              </p>
            </div>
            <div className="p-6 bg-white rounded-xl border border-[#e5e7e5]">
              <h3 className="text-[15px] font-bold text-gt-text mb-2">Sustainable Finance Desk</h3>
              <p className="text-[13px] text-gt-text-muted leading-relaxed">
                EU Taxonomy, green and sustainability-linked bonds, ESG investing, PRI integration.
              </p>
            </div>
            <div className="p-6 bg-white rounded-xl border border-[#e5e7e5]">
              <h3 className="text-[15px] font-bold text-gt-text mb-2">Editorial Board</h3>
              <p className="text-[13px] text-gt-text-muted leading-relaxed">
                Reviews every published page against the primary source document. Verifies citations, dates, thresholds, and worked examples before release.
              </p>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[900px]">
            <div className="flex items-start gap-3">
              <Award className="w-5 h-5 text-gt-medium flex-shrink-0 mt-0.5" strokeWidth={1.75} />
              <div>
                <div className="text-[14px] font-bold text-gt-text">10+ years experience</div>
                <div className="text-[13px] text-gt-text-muted">Top management consulting firms.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileCheck className="w-5 h-5 text-gt-medium flex-shrink-0 mt-0.5" strokeWidth={1.75} />
              <div>
                <div className="text-[14px] font-bold text-gt-text">Source-checked</div>
                <div className="text-[13px] text-gt-text-muted">Every figure traced to a primary document.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <LineChart className="w-5 h-5 text-gt-medium flex-shrink-0 mt-0.5" strokeWidth={1.75} />
              <div>
                <div className="text-[14px] font-bold text-gt-text">Cross-disciplinary</div>
                <div className="text-[13px] text-gt-text-muted">Finance, Environmental Science, Energy Efficiency, Renewable Energy.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#fafbfa]">
        <div className="max-w-[700px] mx-auto px-8 text-center">
          <h2 className="text-[28px] font-extrabold text-gt-text mb-4">
            Ready to get started?
          </h2>
          <p className="text-[15px] text-gt-text-muted mb-8">
            Join thousands of sustainability professionals building expertise on Greentryst.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gt-medium text-white text-[14px] font-bold rounded-lg hover:bg-gt-dark transition-colors"
            >
              Create Free Account
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </Link>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 px-6 py-3 border border-[#e5e7e5] text-gt-text text-[14px] font-semibold rounded-lg hover:bg-white transition-colors"
            >
              Explore Courses
            </Link>
          </div>
        </div>
      </section>

      <RedesignFooter />
    </>
  );
}
