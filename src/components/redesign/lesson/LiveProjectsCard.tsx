/**
 * LiveProjectsCard
 *
 * Inline MDX card that surfaces the /carbon/market catalogue from inside
 * a lesson. Only renders for whitelisted courses (vcm-101, vm0042, vm0044).
 *
 * Auto-injected after the 2nd h2 (or 1st h2 on short lessons) by the
 * server-side preprocessor in src/lib/carbon-market-banner.ts.
 * Authors can also drop <LiveProjectsCard /> manually anywhere in MDX;
 * the preprocessor skips auto-injection when it detects a manual tag.
 *
 * Numbers come from public/carbon-market-methodology-counts.json which
 * is regenerated on every build. If the count file is missing or the
 * courseId has no entry, the component renders a generic fallback
 * that still links to the catalogue.
 */

import Link from 'next/link';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Globe, Sprout, Flame, ArrowRight } from 'lucide-react';

type CourseId = 'vcm-101' | 'vm0042' | 'vm0044';

type Counts = {
  totalProjects: number;
  byMethodology: Record<string, { projects: number; countries: number }>;
};

function readCounts(): Counts | null {
  try {
    const path = join(process.cwd(), 'public', 'carbon-market-methodology-counts.json');
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, 'utf-8')) as Counts;
  } catch {
    return null;
  }
}

type Config = {
  icon: typeof Globe;
  title: string;
  body: (counts: Counts | null) => string;
  href: string;
  lesson?: string;
};

function configFor(courseId: CourseId): Config {
  switch (courseId) {
    case 'vcm-101':
      return {
        icon: Globe,
        title: 'See the live voluntary carbon market',
        body: (c) =>
          c
            ? `${c.totalProjects.toLocaleString()} registered projects right now across Verra, Gold Standard, CCB, and PWRP. Filter by methodology, country, vintage, and certification.`
            : 'Explore registered projects across Verra, Gold Standard, CCB, and PWRP. Filter by methodology, country, vintage, and certification.',
        href: '/carbon/market',
      };
    case 'vm0042':
      return {
        icon: Sprout,
        title: 'See VM0042 in the live market',
        body: (c) => {
          const stats = c?.byMethodology?.['VM0042'];
          return stats
            ? `${stats.projects.toLocaleString()} registered projects are using the Improved Agricultural Land Management methodology across ${stats.countries} countries right now.`
            : 'Explore every project using the Improved Agricultural Land Management methodology, filterable by country, status, and certification.';
        },
        href: '/carbon/market?methodology=VM0042',
      };
    case 'vm0044':
      return {
        icon: Flame,
        title: 'See VM0044 in the live market',
        body: (c) => {
          const stats = c?.byMethodology?.['VM0044'];
          return stats
            ? `${stats.projects.toLocaleString()} biochar projects are registered under VM0044 across ${stats.countries} countries right now.`
            : 'Explore every biochar project registered under VM0044, filterable by country, status, and certification.';
        },
        href: '/carbon/market?methodology=VM0044',
      };
  }
}

const WHITELIST: CourseId[] = ['vcm-101', 'vm0042', 'vm0044'];

function isWhitelisted(id: string): id is CourseId {
  return WHITELIST.includes(id as CourseId);
}

export function LiveProjectsCard({ courseId, lessonId }: { courseId: string; lessonId?: string }) {
  if (!isWhitelisted(courseId)) return null;

  const counts = readCounts();
  const cfg = configFor(courseId);
  const Icon = cfg.icon;
  const hrefWithTracking = `${cfg.href}${cfg.href.includes('?') ? '&' : '?'}from=lesson:${courseId}${lessonId ? ':' + lessonId : ''}`;

  return (
    <aside
      aria-label="Live carbon market context"
      className="not-prose my-10 rounded-2xl bg-[#0e1e1e] text-white p-6 sm:p-7 shadow-sm border-l-4 border-l-[#8cd4ca]"
    >
      <Link
        href={hrefWithTracking}
        className="group flex items-start gap-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8cd4ca] rounded-lg"
      >
        <span
          aria-hidden="true"
          className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-[#005c55]/30 text-[#8cd4ca]"
        >
          <Icon className="w-5 h-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8cd4ca]">
              From the market
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 leading-snug">
            {cfg.title}
          </h3>
          <p className="text-sm text-white/75 leading-relaxed">
            {cfg.body(counts)}
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm font-medium text-[#8cd4ca] group-hover:text-white transition-colors">
            <span>Open the carbon market</span>
            <ArrowRight
              className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
              strokeWidth={2}
            />
          </div>
        </div>
      </Link>
    </aside>
  );
}

export default LiveProjectsCard;
