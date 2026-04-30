import type { ReactNode } from 'react';

export const metadata = {
  title: 'Services Enquiry',
  description:
    'Start a conversation with the Greentryst services team. IFRS gap assessments, climate risk, transition plans, SBTi validation, and custom engagements.',
  alternates: { canonical: '/services/enquire' },
  openGraph: {
    type: 'website',
    url: '/services/enquire',
    title: 'Services Enquiry',
    description:
      'Start a conversation with the Greentryst services team about IFRS, climate risk, transition plans, and custom engagements.',
  },
};

export default function EnquireLayout({ children }: { children: ReactNode }) {
  return children;
}
