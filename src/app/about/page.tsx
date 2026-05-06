/**
 * /redesign/about - About Page
 *
 * Company mission, vision, and team information.
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import { Target, Eye, Shield, ArrowRight, Terminal, Users, Globe, Award, FileCheck, LineChart } from 'lucide-react';
import { ArmorNav, ArmorFooter } from '@/components/armor';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbList, DESKS, ORG_ID, EDITORIAL_ID, SITE_URL } from '@/lib/seo/schema';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Built by ICS/OT security professionals with deep expertise in IEC 62443, SCADA defense, and industrial control system pentesting. Every lab and course verified against real-world attack surfaces.',
  alternates: { canonical: '/about' },
  openGraph: {
    type: 'website',
    url: '/about',
    title: 'About ArmorInnovate',
    description:
      'Built by ICS/OT security professionals with deep expertise in IEC 62443, SCADA defense, and industrial control system pentesting.',
  },
};

const ABOUT_PAGE_LD = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  '@id': `${SITE_URL}/about#aboutpage`,
  url: `${SITE_URL}/about`,
  name: 'About ArmorInnovate',
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
      <ArmorNav />

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
            className="text-[11px] font-bold uppercase text-cyan-400 mb-4"
            style={{ letterSpacing: '0.25em' }}
          >
            About ArmorInnovate
          </p>
          <h1 className="text-[40px] md:text-[52px] font-extrabold text-white leading-[1.1] mb-6">
            The operating system for
            <br />
            OT defenders.
          </h1>
          <p className="text-[17px] text-white/60 max-w-2xl mx-auto">
            Industrial infrastructure is under attack. ArmorInnovate gives ICS/SCADA security professionals the training, labs, and intelligence they need to protect critical systems.
          </p>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="py-20 bg-[#fafbfa]">
        <div className="max-w-[1100px] mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-white rounded-xl border border-[#e5e7e5]">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-cyan-600" strokeWidth={1.5} />
              </div>
              <h3 className="text-[18px] font-bold text-gray-900 mb-3">Mission</h3>
              <p className="text-[14px] text-gray-500 leading-relaxed">
                To arm ICS/OT security professionals with hands-on training, real-world labs, and actionable intelligence to defend critical infrastructure.
              </p>
            </div>

            <div className="p-8 bg-white rounded-xl border border-[#e5e7e5]">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-6">
                <Eye className="w-6 h-6 text-cyan-600" strokeWidth={1.5} />
              </div>
              <h3 className="text-[18px] font-bold text-gray-900 mb-3">Vision</h3>
              <p className="text-[14px] text-gray-500 leading-relaxed">
                A world where every industrial control system is defended by professionals trained on realistic attack scenarios and hardened with IEC 62443.
              </p>
            </div>

            <div className="p-8 bg-white rounded-xl border border-[#e5e7e5]">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-cyan-600" strokeWidth={1.5} />
              </div>
              <h3 className="text-[18px] font-bold text-gray-900 mb-3">Values</h3>
              <p className="text-[14px] text-gray-500 leading-relaxed">
                Offense informs defense. Real PLCs over simulations. Hands-on labs over slide decks. Threat-driven over compliance-driven.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-20 bg-white border-y border-[#e5e7e5]">
        <div className="max-w-[900px] mx-auto px-8">
          <h2 className="text-[28px] font-extrabold text-gray-900 text-center mb-12">
            What we do
          </h2>

          <div className="space-y-8">
            <div className="flex items-start gap-6">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                <Terminal className="w-5 h-5 text-cyan-600" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-gray-900 mb-2">Hands-on OT Labs</h3>
                <p className="text-[14px] text-gray-500 leading-relaxed">
                  Interactive labs with real Modbus, S7comm, EtherNet/IP, and DNP3 traffic. Attack and defend simulated SCADA systems, HMIs, and PLCs in a safe sandboxed environment.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                <Globe className="w-5 h-5 text-cyan-600" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-gray-900 mb-2">Threat Intelligence</h3>
                <p className="text-[14px] text-gray-500 leading-relaxed">
                  Real-time ICS-CERT advisories, CVE tracking for industrial protocols, and curated threat feeds so you know what adversaries are targeting right now.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                <Users className="w-5 h-5 text-cyan-600" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-gray-900 mb-2">Career Directory</h3>
                <p className="text-[14px] text-gray-500 leading-relaxed">
                  Curated ICS/OT security jobs fetched from LinkedIn. Positions at energy companies, defense contractors, and critical infrastructure operators — matched to skills you build on the platform.
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
              className="text-[11px] font-bold uppercase text-cyan-600 mb-3"
              style={{ letterSpacing: '0.25em' }}
            >
              Our expertise
            </p>
            <h2 className="text-[28px] font-extrabold text-gray-900 mb-4 leading-tight">
              Built by practitioners, not academics.
            </h2>
            <p className="text-[15px] text-gray-500 leading-relaxed">
              Every lab, course, and intelligence feed on ArmorInnovate is developed by active ICS/OT security professionals who have hardened real plants, responded to real incidents, and tested real PLCs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-xl border border-[#e5e7e5]">
              <h3 className="text-[15px] font-bold text-gray-900 mb-2">IEC 62443 & Standards</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed">
                Zone and conduit modeling, security levels, IACS component requirements, and compliance mapping across the full IEC 62443 series.
              </p>
            </div>
            <div className="p-6 bg-white rounded-xl border border-[#e5e7e5]">
              <h3 className="text-[15px] font-bold text-gray-900 mb-2">Protocol Analysis</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed">
                Deep-dive coverage of Modbus TCP/RTU, S7comm, EtherNet/IP (CIP), DNP3, OPC UA, and BACnet protocol security.
              </p>
            </div>
            <div className="p-6 bg-white rounded-xl border border-[#e5e7e5]">
              <h3 className="text-[15px] font-bold text-gray-900 mb-2">OT Pentesting</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed">
                Realistic attack scenarios against simulated SCADA/DCS environments including PLC exploitation, HMI manipulation, and lateral movement.
              </p>
            </div>
            <div className="p-6 bg-white rounded-xl border border-[#e5e7e5]">
              <h3 className="text-[15px] font-bold text-gray-900 mb-2">Incident Response</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed">
                OT-specific IR playbooks, forensic analysis of industrial protocols, and tabletop exercises based on real-world incidents like TRITON and Industroyer.
              </p>
            </div>
            <div className="p-6 bg-white rounded-xl border border-[#e5e7e5]">
              <h3 className="text-[15px] font-bold text-gray-900 mb-2">Vulnerability Intelligence</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed">
                Live ICS-CERT advisory tracking, CVE analysis for industrial vendors, and risk scoring tailored to OT environments.
              </p>
            </div>
            <div className="p-6 bg-white rounded-xl border border-[#e5e7e5]">
              <h3 className="text-[15px] font-bold text-gray-900 mb-2">Network Defense</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed">
                Purdue model segmentation, industrial DMZ design, OT firewall rules, and monitoring strategies using tools like Zeek and Suricata.
              </p>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[900px]">
            <div className="flex items-start gap-3">
              <Award className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" strokeWidth={1.75} />
              <div>
                <div className="text-[14px] font-bold text-gray-900">Real-world tested</div>
                <div className="text-[13px] text-gray-500">Labs built from actual ICS environments.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileCheck className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" strokeWidth={1.75} />
              <div>
                <div className="text-[14px] font-bold text-gray-900">Standards-aligned</div>
                <div className="text-[13px] text-gray-500">IEC 62443, NIST 800-82, NERC CIP.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <LineChart className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" strokeWidth={1.75} />
              <div>
                <div className="text-[14px] font-bold text-gray-900">Threat-driven</div>
                <div className="text-[13px] text-gray-500">Content shaped by real adversary TTPs.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#fafbfa]">
        <div className="max-w-[700px] mx-auto px-8 text-center">
          <h2 className="text-[28px] font-extrabold text-gray-900 mb-4">
            Ready to defend what matters?
          </h2>
          <p className="text-[15px] text-gray-500 mb-8">
            Join OT security professionals training on ArmorInnovate to protect critical infrastructure.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 text-white text-[14px] font-bold rounded-lg hover:bg-cyan-700 transition-colors"
            >
              Create Free Account
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </Link>
            <Link
              href="/labs"
              className="inline-flex items-center gap-2 px-6 py-3 border border-[#e5e7e5] text-gray-900 text-[14px] font-semibold rounded-lg hover:bg-white transition-colors"
            >
              Explore Labs
            </Link>
          </div>
        </div>
      </section>

      <ArmorFooter />
    </>
  );
}
