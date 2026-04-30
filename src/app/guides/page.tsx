/**
 * /guides - Guides Listing Page
 *
 * Uses existing guide MDX files from src/content/guides/
 * Features topic filtering capsules for fast navigation.
 * Animated header with floating icons.
 */

import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { RedesignFooter } from '@/components/redesign';
import { getAllGuides, type GuideMeta } from '@/lib/guides';
import { GuidesClient } from './_components/GuidesClient';
import { AnimatedGuidesHero } from './_components/AnimatedGuidesHero';

export const metadata: Metadata = {
  title: 'Guides',
  description:
    'Practitioner guides answering the most common sustainability, ESG, and carbon markets questions.',
  alternates: { canonical: '/guides' },
  openGraph: {
    type: 'website',
    url: '/guides',
    title: 'Guides',
    description:
      'Practitioner guides answering the most common sustainability, ESG, and carbon markets questions.',
  },
};

// Topic categories for filtering
const TOPICS = [
  { id: 'all', label: 'All Guides' },
  { id: 'ghg-accounting', label: 'GHG Accounting' },
  { id: 'climate-finance', label: 'Climate Finance' },
  { id: 'eu-regulations', label: 'EU Regulations' },
  { id: 'esg-reporting', label: 'ESG Reporting' },
  { id: 'carbon-markets', label: 'Carbon Markets' },
  { id: 'strategy', label: 'Strategy' },
];

// Map guide courses to topics
function getGuideTopics(guide: GuideMeta): string[] {
  const topicMap: Record<string, string> = {
    'financed-emissions': 'climate-finance',
    'ghg-scope-3': 'ghg-accounting',
    'ghg-scope-1-2': 'ghg-accounting',
    'ifrs-s2': 'esg-reporting',
    'sbti': 'strategy',
    'eu-taxonomy': 'eu-regulations',
    'csrd': 'eu-regulations',
    'eu-sfdr': 'eu-regulations',
    'vcm-101': 'carbon-markets',
    'esg-reporting': 'esg-reporting',
    'esg-investing': 'climate-finance',
  };

  const topics = new Set<string>();
  guide.courses.forEach(courseId => {
    const topic = topicMap[courseId];
    if (topic) topics.add(topic);
  });

  return Array.from(topics);
}

export default function GuidesPage() {
  const guides = getAllGuides().map(guide => ({
    ...guide,
    topics: getGuideTopics(guide),
  }));

  return (
    <>
      <Nav />

      {/* Animated Hero with floating icons */}
      <AnimatedGuidesHero />

      <GuidesClient guides={guides} topics={TOPICS} />

      <RedesignFooter />
    </>
  );
}
