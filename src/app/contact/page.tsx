/**
 * /contact — Contact Page
 *
 * Simple contact page with email addresses and a link to the feedback form.
 * Supports ?topic=enterprise from pricing CTAs.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArmorNav, ArmorFooter } from '@/components/armor';
import { Mail, MessageSquare, ArrowRight, HelpCircle, Briefcase } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with the ArmorInnovate team. Support, sales, and general enquiries.',
  alternates: { canonical: '/contact' },
  openGraph: {
    type: 'website',
    url: '/contact',
    title: 'Contact',
    description:
      'Get in touch with the ArmorInnovate team. Support, sales, and general enquiries.',
  },
};

const CONTACT_OPTIONS = [
  {
    icon: HelpCircle,
    title: 'Support & Feedback',
    description:
      'Questions about your account, feature requests, or bug reports.',
    cta: 'Send feedback',
    href: '/feedback',
  },
  {
    icon: Briefcase,
    title: 'Enterprise & Training',
    description:
      'Talk to our team about custom OT security training, lab environments, or enterprise licensing.',
    cta: 'Get in touch',
    href: 'mailto:enterprise@armorinnovate.com',
    isExternal: true,
  },
  {
    icon: Mail,
    title: 'Email us directly',
    description:
      'For anything else, reach out by email and we will respond within one business day.',
    cta: 'hello@armorinnovate.com',
    href: 'mailto:hello@armorinnovate.com',
    isExternal: true,
  },
];

export default function ContactPage() {
  return (
    <>
      <ArmorNav />

      <main className="pt-28 pb-16 bg-[#fafbfa] min-h-[80vh]">
        <div className="max-w-[800px] mx-auto px-8">
          <div className="text-center mb-12">
            <h1 className="text-[32px] font-extrabold text-gt-text mb-4">
              Contact us
            </h1>
            <p className="text-[15px] text-gt-text-muted max-w-lg mx-auto">
              We read every message. Choose the option that best fits your
              question and we will get back to you as soon as possible.
            </p>
          </div>

          <div className="space-y-4">
            {CONTACT_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <Link
                  key={option.title}
                  href={option.href}
                  className="group flex items-start gap-5 bg-white rounded-xl border border-[#e5e7e5] p-6 hover:border-gt-medium/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-gt-leaf/10 flex items-center justify-center shrink-0">
                    <Icon
                      className="w-6 h-6 text-gt-medium"
                      strokeWidth={1.5}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[16px] font-bold text-gt-text mb-1">
                      {option.title}
                    </h2>
                    <p className="text-[14px] text-gt-text-muted leading-relaxed mb-3">
                      {option.description}
                    </p>
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-gt-medium group-hover:text-gt-dark transition-colors">
                      {option.cta}
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <p className="text-[13px] text-gt-text-muted">
              Prefer email? Reach us at{' '}
              <a
                href="mailto:hello@armorinnovate.com"
                className="text-gt-medium hover:text-gt-dark font-semibold"
              >
                hello@armorinnovate.com
              </a>
            </p>
          </div>
        </div>
      </main>

      <ArmorFooter />
    </>
  );
}
