/**
 * /guides/[slug] - Individual Guide Page
 *
 * Renders MDX guide content with Greentryst design system.
 * Features animated hero, floating icons, and reading aid sidebar.
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import { Nav } from '@/components/Nav';
import { RedesignFooter } from '@/components/redesign';
import { getGuide, getGuideContent, getGuideStaticParams, extractGuideFaqs } from '@/lib/guides';
import { getCourse } from '@/lib/courses';
import { JsonLd } from '@/components/seo/JsonLd';
import { articleSchema, faqPageSchema, breadcrumbList } from '@/lib/seo/schema';
import { getMDXComponents } from '@/components/content/mdx-components';
import { AnimatedHero } from './_components/AnimatedHero';
import { TableOfContents } from './_components/TableOfContents';

// Extract headings from MDX content for TOC
// Must match rehype-slug's algorithm (github-slugger style)
function extractHeadings(content: string): { id: string; text: string; level: number }[] {
  const headingRegex = /^(#{2,4})\s+(.+)$/gm;
  const headings: { id: string; text: string; level: number }[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    // Generate slug matching rehype-slug (github-slugger algorithm)
    const id = text
      .toLowerCase()
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[^\w\s-]/g, '') // Remove special chars except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Collapse multiple hyphens
      .replace(/^-|-$/g, ''); // Trim leading/trailing hyphens
    headings.push({ id, text, level });
  }

  return headings;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return getGuideStaticParams().map(({ slug }) => ({ slug: slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) {
    return { title: 'Guide Not Found' };
  }
  const path = `/guides/${slug}`;
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: path },
    openGraph: {
      type: 'article',
      url: path,
      title: guide.title,
      description: guide.description,
    },
    twitter: {
      card: 'summary_large_image',
      title: guide.title,
      description: guide.description,
    },
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuide(slug);

  if (!guide) {
    return (
      <>
        <Nav />
        <main className="min-h-[60vh] bg-[#fafbfa] pt-24 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-[24px] font-bold text-gt-text mb-4">Guide not found</h1>
            <Link href="/guides" className="text-gt-medium hover:text-gt-dark">
              Back to all guides
            </Link>
          </div>
        </main>
        <RedesignFooter />
      </>
    );
  }

  const mdxContent = getGuideContent(slug);
  const headings = extractHeadings(mdxContent);
  const faqs = extractGuideFaqs(slug);
  const article = articleSchema({
    slug: guide.slug,
    title: guide.title,
    description: guide.description,
    dateModified: guide.lastUpdated,
    readingMinutes: guide.readingMinutes,
  });
  const breadcrumbs = breadcrumbList([
    { name: 'Home', url: '/' },
    { name: 'Guides', url: '/guides' },
    { name: guide.title },
  ]);

  // Load course data for bottom cards
  const courses = guide.courses
    .map((id) => {
      try {
        return getCourse(id);
      } catch {
        return null;
      }
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  return (
    <>
      <JsonLd data={article} />
      <JsonLd data={breadcrumbs} />
      {faqs.length > 0 && <JsonLd data={faqPageSchema(guide.slug, faqs)} />}
      <Nav />

      {/* Animated Hero Header */}
      <AnimatedHero
        title={guide.title}
        description={guide.description}
        readingMinutes={guide.readingMinutes}
        lastUpdated={guide.lastUpdated}
        coursesCount={courses.length}
      />

      {/* Content with TOC Sidebar */}
      <main className="bg-[#fafbfa] py-12">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="flex gap-8">
            {/* Main Content */}
            <div className="flex-1 max-w-[900px]">
              <div className="bg-white rounded-2xl border border-[#e5e7e5] p-8 md:p-12 shadow-sm">
                {/* MDX Content */}
                <article className="guide-content lesson-content prose prose-gt max-w-none">
                  <MDXRemote
                    source={mdxContent}
                    components={getMDXComponents()}
                    options={{ mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] } }}
                  />
                </article>
              </div>

              {/* Related Courses */}
              {courses.length > 0 && (
                <div className="mt-10">
                  <h2 className="text-[20px] font-bold text-gt-text mb-6">
                    Go deeper with these courses
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {courses.map((course) => (
                      <Link
                        key={course.id}
                        href={`/courses/${course.id}`}
                        className="flex items-start gap-4 p-5 bg-white rounded-xl border border-[#e5e7e5] hover:border-gt-medium/50 hover:shadow-sm transition-all group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-gt-medium/10 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-6 h-6 text-gt-medium" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[15px] font-bold text-gt-text group-hover:text-gt-medium transition-colors">
                            {course.title}
                          </h3>
                          <p className="text-[13px] text-gt-text-muted line-clamp-2 mt-1">
                            {course.subtitle}
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gt-text-muted group-hover:text-gt-medium flex-shrink-0 mt-1" strokeWidth={2} />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Back to Guides */}
              <div className="mt-10 pt-8 border-t border-[#e5e7e5]">
                <Link
                  href="/guides"
                  className="inline-flex items-center gap-2 text-[13px] font-semibold text-gt-medium hover:text-gt-dark"
                >
                  <ArrowLeft className="w-4 h-4" strokeWidth={2} />
                  Back to all guides
                </Link>
              </div>
            </div>

            {/* Table of Contents Sidebar - Hidden on mobile, aligned with content */}
            <div className="hidden lg:block w-[260px] flex-shrink-0 pt-8 md:pt-12">
              <TableOfContents headings={headings} />
            </div>
          </div>
        </div>
      </main>

      <RedesignFooter />
    </>
  );
}
