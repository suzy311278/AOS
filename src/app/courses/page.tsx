/**
 * /redesign/courses — Greentryst course catalogue
 *
 * Server component that loads the full course list from the content
 * directory and hands it to the client shell for filtering and search.
 *
 * Narrative arc of the page:
 *   1. Nav
 *   2. Header band (catalogue stats)
 *   3. Sticky filter bar + course grid
 *   4. Learning Paths (curated sequences)
 *   5. Closing CTA (reused from homepage)
 *   6. Footer
 *
 * Learning path definitions live inline here so the catalogue
 * editor can tune them without touching the card component.
 * Each path references real course ids and the steps come
 * straight from the published catalogue.
 */

import type { Metadata } from 'next';
import { getAllCourses } from '@/lib/courses';
import { Nav } from '@/components/Nav';
import {
  RedesignFooter,
  LightSection,
  SectionHeading,
  CategoryLabel,
  Stat,
  LearningPathShowcase,
  ClosingCTA,
  SourceLogoCycle,
} from '@/components/redesign';
import type {
  LearningPathShowcasePath,
  LearningPathShowcaseStep,
} from '@/components/redesign/LearningPathShowcase';
import { LEARNING_PATHS } from '@/components/redesign/learning-paths-data';
import { CoursesClient, type CatalogueCourse } from './_components/CoursesClient';

export const metadata: Metadata = {
  title: 'Course Catalogue',
  description:
    '23 courses across climate science, carbon markets, ESG reporting, green finance, and regulations. Structured paths to the frameworks sustainability practitioners actually use.',
  alternates: { canonical: '/courses' },
  openGraph: {
    type: 'website',
    url: '/courses',
    title: 'Course Catalogue',
    description:
      '23 courses across climate science, carbon markets, ESG reporting, green finance, and regulations.',
  },
};

// Learning path definitions live in the shared module so the
// course detail page can import the same source of truth and
// auto-derive cross-links.

export default function CoursesPage() {
  // Load courses and pre-compute totals on the server so the client
  // does not have to iterate over modules for each card render.
  const courses = getAllCourses();
  const catalogue: CatalogueCourse[] = courses.map((course) => {
    const moduleCount = course.modules.length;
    const totalLessons = course.modules.reduce(
      (sum, m) => sum + m.lessons.length,
      0
    );
    return { course, totalLessons, moduleCount };
  });

  // Catalogue-level totals for the header band stats.
  const publishedCount = catalogue.filter(
    (c) => c.course.status === 'published'
  ).length;
  const totalLessons = catalogue.reduce((sum, c) => sum + c.totalLessons, 0);
  const totalHours = catalogue.reduce(
    (sum, c) => sum + c.course.estimatedHours,
    0
  );

  // Hydrate the learning path steps with titles and hours from the
  // real course data so we never have title drift between paths
  // and the catalogue.
  const courseById = new Map(courses.map((c) => [c.id, c]));
  const paths: LearningPathShowcasePath[] = LEARNING_PATHS.map((path) => {
    const steps: LearningPathShowcaseStep[] = path.steps
      .map((courseId) => {
        const c = courseById.get(courseId);
        if (!c) return null;
        return {
          courseId,
          title: c.title,
          hours: c.estimatedHours,
        };
      })
      .filter((s): s is LearningPathShowcaseStep => s !== null);
    return {
      id: path.id,
      role: path.role,
      navLabel: path.navLabel,
      title: path.title,
      outcomes: path.outcomes,
      steps,
      iconName: path.iconName,
    };
  });

  return (
    <>
      <Nav />

      {/* ============================================================
          Header band. Custom background so the surface reads as
          "forest-tinted dark" rather than pure charcoal. A deep
          teal-green base is combined with a radial green glow and
          a faint dot grid for texture.
          ============================================================ */}
      <section className="relative isolate overflow-hidden pt-20 md:pt-24 pb-10 md:pb-12 bg-gt-text-dark">
        {/* Dot grid texture (matches homepage hero) */}
        <div
          aria-hidden
          className="gt-dot-grid absolute inset-0 opacity-60 pointer-events-none"
        />
        {/* Ambient teal glow (matches homepage hero) */}
        <div
          aria-hidden
          className="gt-ambient-glow-dark absolute -top-32 right-1/4 w-[500px] h-[500px] rounded-full"
        />
        <div
          aria-hidden
          className="gt-ambient-glow-dark absolute -bottom-32 left-1/4 w-[500px] h-[500px] rounded-full opacity-60"
        />

        <div className="relative max-w-[1280px] mx-auto px-8 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-12 lg:gap-16 items-center">
          <div>
            <CategoryLabel tone="dark">Course Catalogue</CategoryLabel>
            <SectionHeading size="section" as="h1" tone="light" className="mt-5">
              Simplified for the practitioner.
              <br />
              Faithful to the source.
            </SectionHeading>
            <p className="mt-6 text-[15px] text-white/70 leading-relaxed max-w-2xl">
              Sustainability practitioners are expected to know the IPCC
              reports, IFRS standards, GHG Protocol, Verra methodologies,
              and EU regulations. Most run to hundreds of pages. Greentryst
              reads them so you can learn the work in evenings instead of
              months, with sources cited so the teaching is traceable.
            </p>

            {/* Inline stats row */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl">
              <Stat
                value={`${publishedCount}`}
                label="courses live"
                tone="light"
                className="[&>div]:!text-white"
              />
              <Stat
                value={`${totalLessons}+`}
                label="lessons"
                tone="light"
                className="[&>div]:!text-white"
              />
              <Stat
                value={`${totalHours}h`}
                label="total content"
                tone="light"
                className="[&>div]:!text-white"
              />
            </div>
          </div>

          {/* Right column: rotating source logos */}
          <div className="flex justify-center lg:justify-end">
            <SourceLogoCycle />
          </div>
        </div>
      </section>

      {/* ============================================================
          Catalogue (filter bar + grid)
          ============================================================ */}
      <LightSection variant="pale" padding="lg" className="!pt-14 !pb-16">
        <CoursesClient catalogue={catalogue} />
      </LightSection>

      {/* ============================================================
          Learning Paths
          ============================================================ */}
      <LightSection variant="white" padding="lg" className="!pt-16">
        <div className="max-w-3xl mb-12">
          <CategoryLabel>Learning Paths</CategoryLabel>
          <SectionHeading size="section" tone="dark" className="mt-5">
            Curated paths for the work you actually do.
          </SectionHeading>
          <p className="mt-5 text-lg text-gt-text-muted leading-relaxed">
            Each path is a sequence of five courses designed to take a
            practitioner from first principles to defensible output.
            Every milestone is a real course you can start today.
          </p>
        </div>

        <LearningPathShowcase paths={paths} />
      </LightSection>

      {/* ============================================================
          Closing CTA (reused from homepage)
          ============================================================ */}
      <ClosingCTA />

      <RedesignFooter />
    </>
  );
}
