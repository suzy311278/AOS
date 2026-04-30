/**
 * generate-sitemap.ts - Build-time sitemap generator.
 * Produces public/sitemap.xml covering all indexable routes.
 *
 * Run: npx tsx scripts/generate-sitemap.ts
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import { SITE_ORIGIN } from '../src/lib/site';

const SITE_URL = SITE_ORIGIN;
const PUBLIC_DIR = join(__dirname, '..', 'public');

// Data sources
const { getAllCourses, getAllLessons } = require('../src/lib/courses');
const { getAllGuides } = require('../src/lib/guides');
const { getFrameworkStaticParams, getFrameworkPillarStaticParams } = require('../src/lib/frameworks');
const { TOOL_GROUPS } = require('../src/lib/tools-catalog');

interface UrlEntry {
  loc: string;
  priority: string;
  changefreq: string;
}

const urls: UrlEntry[] = [];

/* ==================================================================
   Static pages
   ================================================================== */
const staticPages: UrlEntry[] = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/about', priority: '0.6', changefreq: 'monthly' },
  { loc: '/ask', priority: '0.7', changefreq: 'weekly' },
  { loc: '/courses', priority: '0.9', changefreq: 'weekly' },
  { loc: '/dashboard', priority: '0.6', changefreq: 'weekly' },
  { loc: '/disclaimer', priority: '0.3', changefreq: 'yearly' },
  { loc: '/fair-use', priority: '0.3', changefreq: 'yearly' },
  { loc: '/feedback', priority: '0.3', changefreq: 'yearly' },
  { loc: '/frameworks', priority: '0.9', changefreq: 'weekly' },
  { loc: '/glossary', priority: '0.7', changefreq: 'monthly' },
  { loc: '/guides', priority: '0.8', changefreq: 'weekly' },
  { loc: '/pricing', priority: '0.7', changefreq: 'monthly' },
  { loc: '/prompt-library', priority: '0.7', changefreq: 'monthly' },
  { loc: '/services', priority: '0.7', changefreq: 'monthly' },
  { loc: '/services/enquire', priority: '0.6', changefreq: 'monthly' },
  { loc: '/tools', priority: '0.8', changefreq: 'weekly' },
  { loc: '/carbon/market', priority: '0.8', changefreq: 'daily' },
  { loc: '/carbon/retirements', priority: '0.7', changefreq: 'daily' },
];
urls.push(...staticPages);

/* ==================================================================
   Guides
   ================================================================== */
const guides = getAllGuides();
for (const guide of guides) {
  urls.push({
    loc: `/guides/${guide.slug}`,
    priority: '0.8',
    changefreq: 'monthly',
  });
}

/* ==================================================================
   Courses + lessons
   ================================================================== */
const courses = getAllCourses();
for (const course of courses) {
  urls.push({
    loc: `/courses/${course.id}`,
    priority: '0.8',
    changefreq: 'weekly',
  });

  const lessons = getAllLessons(course);
  for (const lesson of lessons) {
    const lessonUrl = lesson.id.replace('.', '_');
    urls.push({
      loc: `/courses/${course.id}/${lessonUrl}`,
      priority: '0.7',
      changefreq: 'monthly',
    });
  }
}

/* ==================================================================
   Frameworks + pillars
   ================================================================== */
const frameworkParams = getFrameworkStaticParams();
for (const { frameworkId } of frameworkParams) {
  urls.push({
    loc: `/frameworks/${frameworkId}`,
    priority: '0.9',
    changefreq: 'weekly',
  });
}

const pillarParams = getFrameworkPillarStaticParams();
for (const { frameworkId, pillarId } of pillarParams) {
  urls.push({
    loc: `/frameworks/${frameworkId}/${pillarId}`,
    priority: '0.8',
    changefreq: 'monthly',
  });
}

/* ==================================================================
   Tools — only live entries with a real href
   ================================================================== */
for (const group of TOOL_GROUPS) {
  for (const tool of group.tools) {
    if (tool.status === 'live' && tool.href) {
      urls.push({
        loc: tool.href,
        priority: '0.8',
        changefreq: 'weekly',
      });
    }
  }
}

/* ==================================================================
   Deduplicate and emit
   ================================================================== */
const seen = new Set<string>();
const uniqueUrls = urls.filter((u) => {
  if (seen.has(u.loc)) return false;
  seen.add(u.loc);
  return true;
});

const today = new Date().toISOString().split('T')[0];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueUrls
  .map(
    (u) => `  <url>
    <loc>${SITE_URL}${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

writeFileSync(join(PUBLIC_DIR, 'sitemap.xml'), xml);
console.log(`Sitemap: ${uniqueUrls.length} unique URLs written to public/sitemap.xml`);
