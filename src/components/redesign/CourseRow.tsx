/**
 * CourseRow
 *
 * Documentation-style row used by the /redesign/courses page.
 * This is NOT a card. It is a single horizontal entry rendered
 * inside a grouped category section, with a hairline divider
 * underneath. The pattern is borrowed from Stripe API docs and
 * Linear changelogs: a clean, scannable, dense reference index.
 *
 * Each row shows: a small Lucide icon in an accent-tinted square,
 * the title, a one-line subtitle, 2 to 3 mono skill chips drawn
 * from the SKILL_MAP, and a mono metadata block on the right
 * (modules, lessons, hours). The whole row is a link to the
 * course detail page.
 *
 * Per the user direction, all rows use the same neutral palette
 * (no per-course colors). Differentiation comes from the icon
 * and the skill chips, not from gradient or color treatments.
 */

import Link from 'next/link';
import {
  ArrowRight,
  Globe,
  Recycle,
  Thermometer,
  Scale,
  BarChart3,
  TrendingUp,
  FileText,
  Ship,
  Landmark,
  ListTree,
  TreePine,
  Banknote,
  Factory,
  Network,
  Users,
  ShieldCheck,
  FileBarChart,
  Target,
  Leaf,
  Coins,
  Sprout,
  Flame,
  BookOpen as DefaultIcon,
  type LucideIcon,
} from 'lucide-react';
import type { Course } from '@/lib/types';
import { cn } from '@/components/redesign/lib/cn';

/**
 * Lucide icon chosen per course id. Picked to reflect the subject
 * matter (thermometer for climate science, factory for Scope 1
 * and 2, recycle for circular economy, etc.). A sensible default
 * is used so a new course will not break the row.
 *
 * Exported so other components (LearningPathRow, etc.) can reuse
 * the same icon assignment without duplicating the table.
 */
export const COURSE_ICON_MAP: Record<string, LucideIcon> = {
  'article-6': Globe,
  'circular-economy': Recycle,
  'climate-science-101': Thermometer,
  'double-materiality': Scale,
  'esg-benchmarking': BarChart3,
  'esg-investing': TrendingUp,
  'esg-reporting': FileText,
  'eu-cbam': Ship,
  'eu-sfdr': Landmark,
  'eu-taxonomy': ListTree,
  'eudr': TreePine,
  'financed-emissions': Banknote,
  'ghg-scope-1-2': Factory,
  'ghg-scope-3': Network,
  'human-rights-dd': Users,
  'ifc-performance-standards': ShieldCheck,
  'ifrs-s2': FileBarChart,
  'sbti': Target,
  'tnfd-biodiversity': Leaf,
  'vcm-101': Coins,
  'vm0042': Sprout,
  'vm0044': Flame,
};

/**
 * Two or three short skill keywords per course, chosen to surface
 * the actual concepts a learner picks up. These are deliberately
 * concrete so a practitioner sees recognizable terms (Article 6.4,
 * Scope 3 categories, ITMOs, PCAF) rather than vague slogans.
 *
 * Edited centrally here. To add a new course, drop a new entry.
 * Maximum of 3 chips per row to keep the layout clean.
 */
export const SKILL_MAP: Record<string, string[]> = {
  'article-6': ['Article 6.2', 'Article 6.4', 'ITMOs'],
  'circular-economy': ['Material flows', 'Design out waste', 'Closed loops'],
  'climate-science-101': ['IPCC AR6', 'Radiative forcing', 'Carbon cycle'],
  'double-materiality': ['Impact materiality', 'Financial materiality', 'ESRS'],
  'esg-benchmarking': ['Peer comparison', 'Score normalization', 'ESG ratings'],
  'esg-investing': ['ESG integration', 'Impact investing', 'Active ownership'],
  'esg-reporting': ['GRI', 'SASB', 'ESRS'],
  'eu-cbam': ['Embedded emissions', 'Default values', 'CBAM declarant'],
  'eu-sfdr': ['Article 8', 'Article 9', 'PAI indicators'],
  'eu-taxonomy': ['Substantial contribution', 'DNSH', 'Minimum safeguards'],
  'eudr': ['Due diligence', 'Geolocation', 'Risk assessment'],
  'financed-emissions': ['PCAF', 'Attribution factor', 'Asset class methods'],
  'ghg-scope-1-2': ['Stationary combustion', 'Location-based', 'Market-based'],
  'ghg-scope-3': ['15 categories', 'Spend-based', 'Activity-based'],
  'human-rights-dd': ['UNGPs', 'Salient risks', 'Grievance mechanisms'],
  'ifc-performance-standards': ['Land acquisition', 'Biodiversity', 'Stakeholder engagement'],
  'ifrs-s2': ['TCFD alignment', 'Climate scenarios', 'Transition plan'],
  'sbti': ['Net-zero standard', '1.5°C pathways', 'Target validation'],
  'tnfd-biodiversity': ['LEAP approach', 'Nature risk', 'Biodiversity metrics'],
  'vcm-101': ['Verra', 'Gold Standard', 'ICVCM'],
  'vm0042': ['ALM', 'SOC stocks', 'Net GHG benefit'],
  'vm0044': ['Biochar', 'Carbon storage', 'Permanence'],
};

export interface CourseRowProps {
  course: Course;
  totalLessons: number;
  moduleCount: number;
  className?: string;
}

export function CourseRow({
  course,
  totalLessons,
  moduleCount,
  className,
}: CourseRowProps) {
  const Icon = COURSE_ICON_MAP[course.id] ?? DefaultIcon;
  const skills = SKILL_MAP[course.id] ?? [];
  const isComingSoon = course.status === 'coming-soon';
  const isDraft = course.status === 'draft';
  const isMuted = isComingSoon || isDraft;

  return (
    <Link
      href={isMuted ? '#' : `/courses/${course.id}`}
      aria-disabled={isMuted}
      className={cn(
        'group relative grid grid-cols-[auto_1fr_auto] items-start gap-6 py-7 px-5 -mx-5 rounded-lg transition-colors',
        isMuted
          ? 'opacity-50 pointer-events-none'
          : 'hover:bg-gt-medium/[0.07]',
        className
      )}
    >
      {/* Left accent bar — fades in on hover */}
      <span
        aria-hidden
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-gt-medium opacity-0 group-hover:opacity-100 transition-opacity"
      />

      {/* ============================================================
          Icon (left). Dark forest tile with leaf-green stroke,
          echoing the homepage DarkUICard signature so the catalogue
          carries the same dark accent as the rest of the product.
          ============================================================ */}
      <div
        className="w-14 h-14 rounded-lg flex items-center justify-center shrink-0 ring-1 ring-inset ring-white/[0.06] shadow-[0_4px_14px_-6px_rgba(11,61,46,0.45)]"
        style={{
          background:
            'linear-gradient(135deg, #0B3D2E 0%, #0d2a20 100%)',
        }}
        aria-hidden
      >
        <Icon
          className="w-[22px] h-[22px] text-gt-leaf"
          strokeWidth={2}
        />
      </div>

      {/* ============================================================
          Title + subtitle + skill chips + inline metadata
          ============================================================ */}
      <div className="min-w-0">
        <h3 className="text-[17px] font-bold text-gt-text tracking-tight leading-snug group-hover:text-gt-deepest transition-colors">
          {course.title}
        </h3>
        <p className="mt-1 text-[14px] text-gt-text-muted leading-snug">
          {course.subtitle}
        </p>

        {skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase text-gt-medium bg-gt-medium/[0.07]"
                style={{
                  letterSpacing: '0.06em',
                  fontFamily:
                    'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Inline metadata, single mono line */}
        <p
          className="mt-3 text-[11px] text-gt-text-dim"
          style={{
            letterSpacing: '0.06em',
            fontFamily:
              'var(--font-jetbrains-mono), JetBrains Mono, monospace',
          }}
        >
          <span className="text-gt-text font-semibold">
            {course.estimatedHours}h
          </span>
          <span className="mx-2 opacity-50">·</span>
          {moduleCount} modules
          <span className="mx-2 opacity-50">·</span>
          {totalLessons} lessons
        </p>
      </div>

      {/* ============================================================
          Arrow (right). Only affordance on the right side.
          ============================================================ */}
      <ArrowRight
        className="w-4 h-4 text-gt-text-dim group-hover:text-gt-medium group-hover:translate-x-0.5 transition-all mt-2"
        strokeWidth={2}
      />
    </Link>
  );
}
