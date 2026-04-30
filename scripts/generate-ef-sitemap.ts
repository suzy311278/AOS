/**
 * generate-ef-sitemap.ts
 *
 * Emits public/sitemap-emission-factors.xml listing every factor slug,
 * every source slug, every category landing, plus the top-level surfaces.
 *
 * Sitemap discovery: the primary site sitemap at public/sitemap.xml is a
 * flat urlset produced by scripts/generate-sitemap.ts. Rather than convert
 * it to a sitemap index (which would couple the two generators), we ship
 * a second flat urlset here and advertise it through public/robots.txt via
 * a `Sitemap:` line. Search engines honor additional Sitemap entries and
 * will crawl both.
 *
 * Run: npx tsx scripts/generate-ef-sitemap.ts
 */

import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  loadResolvedFactors,
  loadAllSources,
} from '../src/lib/emission-factors/loader';
import { ALL_CATEGORIES } from '../src/lib/emission-factors/categories';
import { SITE_ORIGIN } from '../src/lib/site';

const SITE_URL = SITE_ORIGIN;
const OUT_FILE = join(process.cwd(), 'public', 'sitemap-emission-factors.xml');

interface UrlEntry {
  loc: string;
  priority: string;
  changefreq: string;
}

function main() {
  const factors = loadResolvedFactors();
  const sources = loadAllSources();

  const today = new Date().toISOString().split('T')[0];
  const urls: UrlEntry[] = [];

  // Top-level surfaces
  urls.push({ loc: '/emission-factors', priority: '0.9', changefreq: 'weekly' });
  urls.push({ loc: '/emission-factors/sources', priority: '0.8', changefreq: 'monthly' });
  urls.push({ loc: '/emission-factors/search', priority: '0.8', changefreq: 'weekly' });
  urls.push({ loc: '/emission-factors/compare', priority: '0.6', changefreq: 'monthly' });

  // Factor pages
  for (const f of factors) {
    urls.push({
      loc: `/emission-factors/${f.slug}`,
      priority: '0.7',
      changefreq: 'yearly',
    });
  }

  // Source pages
  for (const s of sources) {
    urls.push({
      loc: `/emission-factors/sources/${s.id}`,
      priority: '0.7',
      changefreq: 'monthly',
    });
  }

  // Category landings
  for (const c of ALL_CATEGORIES) {
    urls.push({
      loc: `/emission-factors/category/${c}`,
      priority: '0.6',
      changefreq: 'monthly',
    });
  }

  const seen = new Set<string>();
  const uniqueUrls = urls.filter((u) => {
    if (seen.has(u.loc)) return false;
    seen.add(u.loc);
    return true;
  });

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

  mkdirSync(join(process.cwd(), 'public'), { recursive: true });
  writeFileSync(OUT_FILE, xml, 'utf8');
  // eslint-disable-next-line no-console
  console.log(
    `[ef-sitemap] wrote ${uniqueUrls.length} unique URLs (from ${urls.length} candidates) to ${OUT_FILE}`
  );
}

main();
