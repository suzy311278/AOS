/**
 * /redesign/courses/[courseId]/[lessonId] - Lesson page
 *
 * Server route that loads a lesson's MDX content and renders it
 * through the redesigned component map. Layout:
 *
 *   1. Persistent CourseDetailSidebar on the left (desktop only)
 *   2. Dark forest LessonDetailHero with image background, breadcrumb,
 *      module/lesson position, reading time, lesson title
 *   3. (Conditional) Floating LessonGlassAudio that straddles the
 *      bottom edge of the dark hero. Triggered when the lesson MDX
 *      starts with an <AudioPlayer ... /> tag.
 *   4. Article reading column with the redesigned MDX components
 *   5. Bottom prev/next lesson nav
 *   6. Closing CTA + footer
 *
 * Audio detection: the page regex-matches a leading <AudioPlayer ... />
 * tag in the MDX, extracts the `src` and `title`, strips it from the
 * MDX so it does not render twice, and renders it in the floating
 * glass position. Any AudioPlayer that appears mid-content (not at
 * the top) renders inline through the redesigned MDX component map.
 */

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Nav } from '@/components/Nav';
import LessonMeter from '@/components/platform/LessonMeter';
import {
  RedesignFooter,
  CourseDetailSidebar,
  LessonDetailHero,
  ClosingCTA,
} from '@/components/redesign';
import { LessonGlassAudio } from '@/components/redesign/lesson/LessonGlassAudio';
import { QuizRedesign } from '@/components/redesign/lesson/QuizRedesign';
import { getRedesignMDXComponents } from '@/components/redesign/lesson/mdx-components-redesign';
import { injectCarbonMarketBanner } from '@/lib/carbon-market-banner';
import LessonProgressClient from '@/components/redesign/lesson/LessonProgressClient';
import {
  getCourse,
  getLessonNavContext,
  getLessonStaticParams,
  getQuiz,
} from '@/lib/courses';
import { urlToLessonId, lessonIdToUrl } from '@/lib/url-helpers';
import { JsonLd } from '@/components/seo/JsonLd';
import { learningResourceSchema, breadcrumbList, lessonFaqPageSchema } from '@/lib/seo/schema';

interface PageParams {
  params: { courseId: string; lessonId: string };
}

export function generateStaticParams() {
  return getLessonStaticParams();
}

export function generateMetadata({ params }: PageParams): Metadata {
  try {
    const course = getCourse(params.courseId);
    const lessonId = urlToLessonId(params.lessonId);
    const lesson = course.modules
      .flatMap((m) => m.lessons)
      .find((l) => l.id === lessonId);

    // Bare title. Root layout's title.template appends ' | Greentryst'.
    // Do NOT manually append it here — that produces ' | Greentryst | Greentryst'.
    const title = lesson?.seoTitle ?? lesson?.title ?? lessonId;
    const description =
      lesson?.seoDescription ??
      `${lesson?.title ?? 'Lesson'} — a lesson from the Greentryst course "${course.title}".`;
    const canonicalPath = `/courses/${params.courseId}/${params.lessonId}`;

    return {
      title,
      description,
      alternates: { canonical: canonicalPath },
      openGraph: {
        title,
        description,
        type: 'article',
        url: canonicalPath,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
    };
  } catch {
    return { title: 'Lesson' };
  }
}

/**
 * Detect a leading <AudioPlayer ... /> tag in the MDX source.
 * Returns the extracted src and title plus the MDX with the tag
 * removed, OR null if no leading audio tag is present.
 */
function extractLeadingAudio(mdxSource: string): {
  src?: string;
  title?: string;
  spotifyId?: string;
  remainingMdx: string;
} | null {
  // Look for an AudioPlayer tag within the first 600 characters of
  // the source (after any leading comment or whitespace). Allows
  // self-closing or paired tags.
  const head = mdxSource.slice(0, 600);
  const match = head.match(/<AudioPlayer\s+([^>]*?)\/?\s*>(?:[\s\S]*?<\/AudioPlayer>)?/i);
  if (!match) return null;

  const attrs = match[1];
  const srcMatch = attrs.match(/src="([^"]+)"/);
  const titleMatch = attrs.match(/title="([^"]+)"/);
  const spotifyMatch = attrs.match(/spotifyId="([^"]+)"/);

  // Strip the matched tag from the original source (not just the
  // 600-char head) so the MDX rendered below does not include it.
  const remainingMdx = mdxSource.replace(match[0], '').trimStart();

  return {
    src: srcMatch?.[1],
    title: titleMatch?.[1],
    spotifyId: spotifyMatch?.[1],
    remainingMdx,
  };
}

export default function LessonRedesignPage({ params }: PageParams) {
  const { courseId, lessonId: urlLessonId } = params;
  let course;
  try {
    course = getCourse(courseId);
  } catch {
    notFound();
  }

  const lessonId = urlToLessonId(urlLessonId);
  const lesson = course.modules
    .flatMap((m) => m.lessons)
    .find((l) => l.id === lessonId);
  if (!lesson) notFound();

  const moduleForLesson = course.modules.find((m) =>
    m.lessons.some((l) => l.id === lessonId)
  );
  const navCtx = getLessonNavContext(course, lessonId);

  // Load MDX from disk
  const contentPath = join(
    process.cwd(),
    'src',
    'content',
    courseId,
    'lessons',
    `${lessonId}.mdx`
  );
  const rawContent = existsSync(contentPath)
    ? readFileSync(contentPath, 'utf-8')
    : '';
  // Strip the leading MDX comment header if present
  let mdxSource = rawContent.replace(/^\{\/\*.*?\*\/\}\n\n/, '');

  // Detect a leading AudioPlayer and lift it into the floating
  // glass position above the article.
  const leadingAudio = extractLeadingAudio(mdxSource);
  if (leadingAudio) {
    mdxSource = leadingAudio.remainingMdx;
  }

  // For whitelisted carbon-markets courses (vcm-101, vm0042, vm0044),
  // inject a LiveProjectsCard inline after the 2nd h2 so learners see
  // a direct bridge into /carbon/market at a natural reading break.
  // See src/lib/carbon-market-banner.ts for the placement rule.
  mdxSource = injectCarbonMarketBanner(mdxSource, courseId, lessonId);

  // Load the quiz YAML for this lesson if one exists. Returns []
  // when the file is missing, in which case the Quiz block is not
  // rendered at all.
  const quizQuestions = getQuiz(courseId, lessonId);
  const faqLd = lessonFaqPageSchema(courseId, lessonId, quizQuestions);

  // Soft registration wall: anonymous visitors can read 3 lessons per
  // calendar month (cookie-tracked). The 4th lesson mounts the dimmed-
  // overlay CTA. Signed-in users bypass this entirely. See
  // src/components/platform/LessonMeter.tsx. The slug below is what
  // identifies the lesson for the monthly read tally — course+lesson
  // keeps it unique across the catalog.
  const meterSlug = `${courseId}/${lessonId}`;

  const lessonLd = learningResourceSchema({
    courseId,
    lessonId,
    title: lesson.seoTitle ?? lesson.title,
    description:
      lesson.seoDescription ??
      `Lesson from ${course.title}: ${lesson.title}.`,
    courseTitle: course.title,
  });
  const breadcrumbs = breadcrumbList([
    { name: 'Home', url: '/' },
    { name: 'Courses', url: '/courses' },
    { name: course.title, url: `/courses/${courseId}` },
    { name: lesson.title },
  ]);

  return (
    <>
      <JsonLd data={lessonLd} />
      <JsonLd data={breadcrumbs} />
      {faqLd && <JsonLd data={faqLd} />}
      <Nav />
      <LessonMeter lessonSlug={meterSlug} />

      <div className="lg:flex">
        {/* Sticky sidebar (desktop only) */}
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
        <main className="flex-1 min-w-0 bg-white">
          {/* Hero + (conditional) floating glass audio */}
          <div className="relative">
            <LessonDetailHero
              courseId={course.id}
              courseTitle={course.title}
              category={course.category}
              moduleNumber={(moduleForLesson?.id ?? 0) + 1}
              moduleTitle={moduleForLesson?.title ?? ''}
              lessonNumber={navCtx?.lessonIndex ?? 1}
              moduleLessonCount={navCtx?.moduleLessonCount ?? 1}
              lessonId={lessonId}
              lessonTitle={lesson.title}
              readingMinutes={lesson.readingMinutes}
              reserveAudioSlot={Boolean(leadingAudio)}
            />

            {/* Floating glass audio: positioned absolutely so it
                straddles the boundary between the dark hero (above)
                and the white reading area (below). The hero already
                reserves a tall bottom area when an audio is present
                so the glass card has somewhere to land. */}
            {leadingAudio && (
              <div className="absolute bottom-0 left-0 right-0 translate-y-1/2 px-6 lg:px-12 z-20">
                <LessonGlassAudio
                  src={leadingAudio.src}
                  title={leadingAudio.title}
                  spotifyId={leadingAudio.spotifyId}
                />
              </div>
            )}
          </div>

          <article
            className={
              // Reading column sizing:
              // 760px on tablet keeps an ideal 65-ch prose line; desktop
              // gets 920px so the page doesn't feel thin next to the
              // 300px sidebar + generous whitespace. Tables, charts, and
              // diagrams breathe; plain prose still lands close to
              // 75-80 characters per line.
              'max-w-[760px] xl:max-w-[920px] mx-auto px-6 lg:px-10 xl:px-12 ' +
              // When the floating glass audio is present, the
              // article needs extra top padding to clear it.
              (leadingAudio ? 'pt-28 lg:pt-32 pb-12' : 'pt-12 lg:pt-16 pb-12')
            }
          >
            {/* MDX body */}
            <div className="gt-lesson-prose">
              <MDXRemote
                source={mdxSource}
                components={getRedesignMDXComponents()}
                options={{
                  mdxOptions: {
                    remarkPlugins: [remarkGfm],
                    rehypePlugins: [
                      rehypeSlug,
                      [
                        rehypeAutolinkHeadings,
                        { behavior: 'wrap', properties: { className: ['heading-anchor'] } },
                      ],
                    ],
                  },
                }}
              />
            </div>

            {/* Knowledge check (only if a quiz YAML exists for this lesson) */}
            {quizQuestions.length > 0 && (
              <QuizRedesign
                questions={quizQuestions}
                lessonId={lessonId}
              />
            )}

            {/* Bottom lesson nav */}
            <div className="mt-16 pt-10 border-t border-gt-border-light grid grid-cols-1 md:grid-cols-2 gap-4">
              {navCtx?.prevLesson ? (
                <Link
                  href={`/courses/${course.id}/${lessonIdToUrl(
                    navCtx.prevLesson.id
                  )}`}
                  className="group flex items-start gap-4 p-5 rounded-xl border border-gt-border-light bg-white hover:bg-gt-medium/[0.04] transition-colors"
                >
                  <ArrowLeft
                    className="w-5 h-5 text-gt-medium mt-0.5 flex-shrink-0 group-hover:-translate-x-0.5 transition-transform"
                    strokeWidth={2}
                  />
                  <div className="min-w-0">
                    <p
                      className="text-[10px] font-bold uppercase text-gt-text-dim mb-1"
                      style={{
                        letterSpacing: '0.16em',
                        fontFamily:
                          'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                      }}
                    >
                      Previous lesson
                    </p>
                    <p className="text-[14px] font-semibold text-gt-text leading-snug">
                      {navCtx.prevLesson.title}
                    </p>
                  </div>
                </Link>
              ) : (
                <div />
              )}

              <LessonProgressClient
                courseId={course.id}
                lessonId={lessonId}
                nextLesson={navCtx?.nextLesson ?? null}
                quizQuestionCount={quizQuestions.length}
              />
            </div>
          </article>
        </main>
      </div>

      <ClosingCTA />
      <RedesignFooter />
    </>
  );
}
