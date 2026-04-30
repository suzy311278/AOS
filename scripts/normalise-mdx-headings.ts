/**
 * Codemod: convert raw HTML headings in MDX lessons to markdown headings,
 * so rehype-slug can assign anchor IDs.
 *
 * Transforms:
 *   <h2 class="...">Some Title</h2>   ->  ## Some Title
 *   <h3 class="...">Some Title</h3>   ->  ### Some Title
 *   <h4 class="...">Some Title</h4>   ->  #### Some Title
 *
 * Notes:
 * - Only single-line heading tags are rewritten (standard pattern in the
 *   legacy MDX). Multi-line heading content would require manual review,
 *   so we intentionally skip it.
 * - Inline children (<strong>, <em>, etc.) are preserved verbatim inside
 *   the resulting markdown heading — MDX accepts inline JSX in headings.
 * - Runs against all .mdx files under src/content recursively.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(process.cwd(), 'src', 'content');

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.isFile() && entry.name.endsWith('.mdx')) acc.push(full);
  }
  return acc;
}

// Only match single-line heading elements. Attributes are arbitrary
// whitespace-separated key="value" pairs; we allow any attrs and any
// inline content (no newlines) between the opening and closing tag.
const HEADING_RE = /<h([2-4])\b[^>]*>([^\n]*?)<\/h\1>/g;

let touched = 0;
let totalReplacements = 0;

for (const file of walk(ROOT)) {
  const src = fs.readFileSync(file, 'utf8');
  let count = 0;
  const next = src.replace(HEADING_RE, (_match, level: string, inner: string) => {
    count++;
    const prefix = '#'.repeat(Number(level));
    return `${prefix} ${inner.trim()}`;
  });
  if (count > 0) {
    fs.writeFileSync(file, next, 'utf8');
    touched++;
    totalReplacements += count;
    console.log(`  ✓ ${path.relative(process.cwd(), file)} (${count})`);
  }
}

console.log(`\nDone. Rewrote ${totalReplacements} headings across ${touched} files.`);
