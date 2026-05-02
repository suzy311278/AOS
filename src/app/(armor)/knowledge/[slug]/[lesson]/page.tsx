/**
 * /knowledge/[slug]/[lesson] — ArmorInnovate lesson page.
 *
 * Renders the lesson MDX content, navigation (prev/next), quiz if present,
 * and module context. Falls back to a placeholder when the MDX file hasn't
 * been written yet.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Clock, BookOpen, CheckCircle2 } from 'lucide-react';
import {
  getArmorCourse,
  getAllArmorCourses,
  getAllArmorLessons,
  getArmorLessonNavContext,
  getArmorLessonMdx,
  getArmorQuiz,
} from '@/lib/armor/courses';

interface PageProps {
  params: Promise<{ slug: string; lesson: string }>;
}

export function generateStaticParams() {
  const courses = getAllArmorCourses();
  const params: { slug: string; lesson: string }[] = [];
  for (const course of courses) {
    for (const lesson of getAllArmorLessons(course)) {
      params.push({ slug: course.id, lesson: lesson.id });
    }
  }
  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, lesson: lessonId } = await params;
  try {
    const course = getArmorCourse(slug);
    const lesson = getAllArmorLessons(course).find((l) => l.id === lessonId);
    if (!lesson) return { title: 'Lesson not found' };
    return {
      title: `${lesson.title} — ${course.shortTitle ?? course.title}`,
      description: `${course.title}: ${lesson.title}`,
      alternates: { canonical: `/knowledge/${slug}/${lessonId}` },
    };
  } catch {
    return { title: 'Lesson not found' };
  }
}

export default async function LessonPage({ params }: PageProps) {
  const { slug, lesson: lessonId } = await params;

  let course;
  try {
    course = getArmorCourse(slug);
  } catch {
    notFound();
  }

  const allLessons = getAllArmorLessons(course);
  const lesson = allLessons.find((l) => l.id === lessonId);
  if (!lesson) notFound();

  const nav = getArmorLessonNavContext(course, lessonId);
  const mdxContent = getArmorLessonMdx(slug, lessonId);
  const quiz = getArmorQuiz(slug, lessonId);

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-ai-bg-soft border-b border-ai-line">
        <div className="max-w-[960px] mx-auto px-6 sm:px-8 py-3 flex items-center gap-2 text-[12px] font-ai-mono text-ai-ink-dim">
          <Link href="/knowledge" className="hover:text-ai-primary transition-colors">
            Knowledge
          </Link>
          <span>/</span>
          <Link href={`/knowledge/${slug}`} className="hover:text-ai-primary transition-colors">
            {course.shortTitle ?? course.title}
          </Link>
          <span>/</span>
          <span className="text-ai-ink">{lessonId}</span>
        </div>
      </div>

      <article className="bg-ai-bg">
        <div className="max-w-[960px] mx-auto px-6 sm:px-8 py-12">
          {/* Module context */}
          {nav && (
            <p className="font-ai-mono text-[11px] tracking-ai-mono text-ai-primary mb-2">
              Module {nav.module.id}: {nav.module.title}
              <span className="text-ai-ink-dim ml-2">
                ({nav.position.lessonIndex}/{nav.position.moduleLessonCount})
              </span>
            </p>
          )}

          {/* Title */}
          <h1 className="text-[28px] sm:text-[36px] font-extrabold leading-tight tracking-tight text-ai-ink">
            {lesson.title}
          </h1>

          {/* Meta row */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-[13px] text-ai-ink-soft">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {lesson.durationMin} min
            </span>
            {lesson.readingMinutes && (
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                {lesson.readingMinutes} min read
              </span>
            )}
            {lesson.vmRef && (
              <span className="font-ai-mono text-[11px] text-ai-ink-dim">
                Ref: {lesson.vmRef}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="mt-10">
            {mdxContent ? (
              <div className="prose prose-ai max-w-none
                prose-headings:font-ai-mono prose-headings:tracking-tight
                prose-code:bg-ai-bg-mute prose-code:rounded prose-code:px-1.5 prose-code:py-0.5
                prose-pre:bg-ai-deep prose-pre:text-ai-mono-on-deep prose-pre:rounded-ai-card
                prose-a:text-ai-accent prose-a:no-underline hover:prose-a:underline
                text-[15.5px] leading-relaxed text-ai-ink-soft"
              >
                {/* Phase 2: MDX content rendered as plain text for now.
                    Full MDX compilation (next-mdx-remote) will be added when
                    lesson content is fleshed out. */}
                <div className="whitespace-pre-wrap font-sans">
                  {mdxContent}
                </div>
              </div>
            ) : (
              <div className="rounded-ai-card border border-ai-line bg-ai-bg-soft p-8 text-center">
                <p className="text-ai-ink-dim font-ai-mono text-[13px]">
                  Lesson content is being prepared.
                </p>
                <p className="mt-2 text-[14px] text-ai-ink-soft">
                  This lesson&apos;s material is currently under development. Check back soon
                  or explore other available lessons.
                </p>
                <Link
                  href={`/knowledge/${slug}`}
                  className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold font-ai-mono text-ai-primary hover:text-ai-primary-hover"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to course
                </Link>
              </div>
            )}
          </div>

          {/* Quiz section */}
          {quiz.length > 0 && (
            <section className="mt-14 border-t border-ai-line pt-10">
              <h2 className="text-xl font-extrabold tracking-tight text-ai-ink">
                Knowledge Check
              </h2>
              <p className="mt-1 text-[14px] text-ai-ink-soft">
                {quiz.length} question{quiz.length === 1 ? '' : 's'} — test your understanding before moving on.
              </p>
              <ol className="mt-6 space-y-6">
                {quiz.map((q, qi) => (
                  <li key={qi} className="rounded-ai-card border border-ai-line bg-ai-bg-soft p-5">
                    <p className="text-[15px] font-bold text-ai-ink">
                      <span className="font-ai-mono text-ai-primary mr-2">Q{qi + 1}.</span>
                      {q.question}
                    </p>
                    {'options' in q && Array.isArray(q.options) && (
                      <ul className="mt-3 space-y-2">
                        {(q.options as string[]).map((opt: string, oi: number) => {
                          const isAnswer = 'answer' in q && typeof q.answer === 'number' && oi === q.answer;
                          return (
                            <li
                              key={oi}
                              className={`flex items-start gap-2.5 rounded-md px-3 py-2 text-[14px] border ${
                                isAnswer
                                  ? 'border-ai-ok/30 bg-emerald-50 text-ai-ink'
                                  : 'border-ai-line bg-white text-ai-ink-soft'
                              }`}
                            >
                              {isAnswer && (
                                <CheckCircle2 className="h-4 w-4 text-ai-ok shrink-0 mt-0.5" />
                              )}
                              <span>{opt}</span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    {'answer' in q && typeof q.answer === 'boolean' && (
                      <p className="mt-3 text-[14px] text-ai-ink">
                        Answer: <span className="font-bold">{q.answer ? 'True' : 'False'}</span>
                      </p>
                    )}
                    {'explanation' in q && q.explanation && (
                      <p className="mt-3 text-[13px] text-ai-ink-soft leading-relaxed border-l-2 border-ai-primary pl-3">
                        {q.explanation}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Prev / Next navigation */}
          <nav className="mt-14 border-t border-ai-line pt-8 grid grid-cols-2 gap-4">
            {nav?.prev ? (
              <Link
                href={`/knowledge/${slug}/${nav.prev.id}`}
                className="group flex items-center gap-3 rounded-ai-card border border-ai-line bg-ai-bg-soft p-4 hover:border-ai-primary/30 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 text-ai-ink-dim group-hover:text-ai-primary" />
                <div>
                  <p className="text-[10.5px] font-ai-mono uppercase tracking-ai-eyebrow text-ai-ink-dim">
                    Previous
                  </p>
                  <p className="text-[14px] font-bold text-ai-ink mt-0.5">{nav.prev.title}</p>
                </div>
              </Link>
            ) : (
              <div />
            )}
            {nav?.next ? (
              <Link
                href={`/knowledge/${slug}/${nav.next.id}`}
                className="group flex items-center justify-end gap-3 rounded-ai-card border border-ai-line bg-ai-bg-soft p-4 hover:border-ai-primary/30 transition-colors text-right"
              >
                <div>
                  <p className="text-[10.5px] font-ai-mono uppercase tracking-ai-eyebrow text-ai-ink-dim">
                    Next
                  </p>
                  <p className="text-[14px] font-bold text-ai-ink mt-0.5">{nav.next.title}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-ai-ink-dim group-hover:text-ai-primary" />
              </Link>
            ) : (
              <Link
                href={`/knowledge/${slug}`}
                className="group flex items-center justify-end gap-3 rounded-ai-card border border-ai-ok/30 bg-emerald-50 p-4 hover:border-ai-ok/50 transition-colors text-right"
              >
                <div>
                  <p className="text-[10.5px] font-ai-mono uppercase tracking-ai-eyebrow text-ai-ok">
                    Course complete
                  </p>
                  <p className="text-[14px] font-bold text-ai-ink mt-0.5">Back to overview</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-ai-ok" />
              </Link>
            )}
          </nav>
        </div>
      </article>
    </>
  );
}
