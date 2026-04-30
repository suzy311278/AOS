/**
 * validate-courses.ts — Build-time course validation.
 *
 * Loads every course.yaml and reports validation failures.
 * Runs in prebuild so broken courses are visible in Vercel logs
 * before they silently disappear from the site.
 *
 * Run: npx tsx scripts/validate-courses.ts
 */

import { getAllCourseIds, getCourse } from '../src/lib/courses';

const ids = getAllCourseIds();
let failures = 0;

console.log(`[validate-courses] Checking ${ids.length} courses…\n`);

for (const id of ids) {
  try {
    getCourse(id);
  } catch (err) {
    failures++;
    const message = err instanceof Error ? err.message : String(err);
    console.error(`❌ FAILED: ${id}`);
    console.error(`   ${message}\n`);
  }
}

if (failures === 0) {
  console.log(`[validate-courses] ✅ All ${ids.length} courses passed validation.`);
} else {
  console.error(`[validate-courses] ⚠️  ${failures}/${ids.length} courses failed validation.`);
  console.error(`[validate-courses] These courses will be SKIPPED by getAllCourses() and will 404 on the site.`);
}
