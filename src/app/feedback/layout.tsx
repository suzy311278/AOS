import type { ReactNode } from 'react';

export const metadata = {
  title: 'Feedback',
  description:
    'Report a bug, request a feature, or send us a note. A human on the team reads every submission.',
  alternates: { canonical: '/feedback' },
  openGraph: {
    type: 'website',
    url: '/feedback',
    title: 'Feedback',
    description:
      'Report a bug, request a feature, or send us a note. A human on the team reads every submission.',
  },
};

export default function FeedbackLayout({ children }: { children: ReactNode }) {
  return children;
}
