/**
 * /redesign/courses/[courseId] - Course detail page
 *
 * Server component that loads a single course by id and renders the
 * full detail layout: persistent left sidebar, dark forest hero,
 * about section, "what you will learn" outcomes, vertical module
 * timeline with clickable lesson rows, and a "continue your path"
 * cross-link to any learning path that includes this course.
 *
 * No progress states for v1. Authentication and cloud progress
 * integration is deferred per the homepage and catalogue specs.
 */

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import {
  RedesignFooter,
  CourseDetailHero,
  CourseDetailSidebar,
  CourseModuleTimeline,
  RelatedLearningPaths,
  ClosingCTA,
  COURSE_OUTCOMES_MAP,
  DEFAULT_COURSE_OUTCOMES,
} from '@/components/redesign';
import { COURSE_ICON_MAP } from '@/components/redesign/CourseRow';
import {
  getCourse,
  getAllCourseIds,
} from '@/lib/courses';
import { lessonIdToUrl } from '@/lib/url-helpers';
import { BookOpen, Check } from 'lucide-react';
import CourseProgressSummary from './_components/CourseProgressSummary';
import { JsonLd } from '@/components/seo/JsonLd';
import { courseSchema, breadcrumbList } from '@/lib/seo/schema';

interface PageParams {
  params: { courseId: string };
}

export function generateStaticParams() {
  return getAllCourseIds().map((courseId) => ({ courseId }));
}

export function generateMetadata({ params }: PageParams): Metadata {
  try {
    const course = getCourse(params.courseId);
    const path = `/courses/${params.courseId}`;
    const description = course.subtitle ?? course.description ?? course.title;
    return {
      title: course.title,
      description,
      alternates: { canonical: path },
      openGraph: {
        type: 'website',
        url: path,
        title: course.title,
        description,
      },
      twitter: {
        card: 'summary_large_image',
        title: course.title,
        description,
      },
    };
  } catch {
    return { title: 'Course' };
  }
}

export default function CourseDetailPage({ params }: PageParams) {
  let course;
  try {
    course = getCourse(params.courseId);
  } catch {
    notFound();
  }

  const moduleCount = course.modules.length;
  const totalLessons = course.modules.reduce(
    (sum, m) => sum + m.lessons.length,
    0
  );

  const firstLesson = course.modules[0]?.lessons[0];
  const startHref = firstLesson
    ? `/courses/${course.id}/${lessonIdToUrl(firstLesson.id)}`
    : `/courses/${course.id}`;

  const Icon = COURSE_ICON_MAP[course.id] ?? BookOpen;
  const outcomes =
    COURSE_OUTCOMES_MAP[course.id] ?? DEFAULT_COURSE_OUTCOMES;

  const courseLd = courseSchema({
    id: course.id,
    title: course.title,
    description: course.description ?? course.subtitle ?? course.title,
    totalLessons,
    estimatedHours: course.estimatedHours,
  });
  const breadcrumbs = breadcrumbList([
    { name: 'Home', url: '/' },
    { name: 'Courses', url: '/courses' },
    { name: course.title },
  ]);

  return (
    <>
      <JsonLd data={courseLd} />
      <JsonLd data={breadcrumbs} />
      <Nav />

      {/* ============================================================
          Two-column body: persistent sidebar + main column
          ============================================================ */}
      <div className="lg:flex">
        {/* Sticky sidebar (desktop only). The sidebar is its own
            scroll container so the main column scrolls independently. */}
        <div className="hidden lg:block w-[300px] flex-shrink-0 sticky top-16 h-[calc(100vh-64px)] z-10">
          <CourseDetailSidebar
            courseId={course.id}
            courseTitle={course.title}
            category={course.category}
            modules={course.modules}
            className="h-full"
          />
        </div>

        {/* Main column */}
        <main className="flex-1 min-w-0">
          {/* Hero */}
          <CourseDetailHero
            courseId={course.id}
            category={course.category}
            title={course.title}
            subtitle={course.subtitle}
            moduleCount={moduleCount}
            totalLessons={totalLessons}
            estimatedHours={course.estimatedHours}
            Icon={Icon}
            ctaHref={startHref}
          />

          <CourseProgressSummary
            courseId={course.id}
            modules={course.modules}
          />

          {/* Body sections */}
          <section className="bg-gt-bg-pale">
            <div className="max-w-[1100px] px-8 lg:px-12 py-16 lg:py-20">
              {/* About this course + What you will learn, paired
                  side by side. The two blocks answer two halves of
                  the same question and read better in one beat than
                  in two. Stacks on mobile. */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 mb-20 items-start">
                {/* About this course */}
                <div>
                  <p
                    className="text-[10px] font-bold uppercase text-gt-medium mb-2"
                    style={{
                      letterSpacing: '0.2em',
                      fontFamily:
                        'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                    }}
                  >
                    About this course
                  </p>
                  <h2 className="text-2xl font-bold text-gt-text leading-snug tracking-tight mb-4">
                    Why this course exists
                  </h2>
                  <p className="text-[16px] text-gt-text-muted leading-relaxed">
                    {course.description}
                  </p>
                </div>

                {/* What you will learn */}
                <div>
                  <p
                    className="text-[10px] font-bold uppercase text-gt-medium mb-2"
                    style={{
                      letterSpacing: '0.2em',
                      fontFamily:
                        'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                    }}
                  >
                    What you will learn
                  </p>
                  <h2 className="text-2xl font-bold text-gt-text leading-snug tracking-tight mb-6">
                    After this course you will be able to
                  </h2>
                  <ul className="space-y-3.5">
                    {outcomes.map((outcome) => (
                      <li
                        key={outcome}
                        className="flex items-start gap-3 text-[15px] text-gt-text leading-snug"
                      >
                        <span
                          className="flex-shrink-0 w-5 h-5 rounded-full bg-gt-medium/[0.10] flex items-center justify-center mt-0.5"
                          aria-hidden
                        >
                          <Check
                            className="w-3 h-3 text-gt-medium"
                            strokeWidth={3}
                          />
                        </span>
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Course content (module timeline) */}
              <div>
                <p
                  className="text-[10px] font-bold uppercase text-gt-medium mb-2"
                  style={{
                    letterSpacing: '0.2em',
                    fontFamily:
                      'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                  }}
                >
                  Course content
                </p>
                <h2 className="text-2xl font-bold text-gt-text leading-snug tracking-tight mb-2">
                  {moduleCount} modules · {totalLessons} lessons
                </h2>
                <p className="text-[14px] text-gt-text-muted leading-relaxed mb-10 max-w-2xl">
                  Walk through the modules in order or jump to a
                  specific lesson. Each lesson is a real chapter you
                  can open and start reading immediately.
                </p>

                <CourseModuleTimeline
                  courseId={course.id}
                  modules={course.modules}
                />
              </div>

              {/* Related learning paths */}
              <RelatedLearningPaths courseId={course.id} />
            </div>
          </section>
        </main>
      </div>

      <ClosingCTA />

      <RedesignFooter />
    </>
  );
}
