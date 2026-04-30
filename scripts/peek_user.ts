import { createClient } from '@libsql/client';

const USER = 'user_3CIXn1LqvgSfUeSkizmctIJ8IN0';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function q(label: string, sql: string, args: any[] = []) {
  console.log(`\n=== ${label} ===`);
  const r = await client.execute({ sql, args });
  if (r.rows.length === 0) { console.log('(no rows)'); return; }
  console.table(r.rows);
}

(async () => {
  await q('Enrollments',
    `SELECT course_id,
            datetime(started_at, 'unixepoch') AS started,
            datetime(last_accessed_at, 'unixepoch') AS last_access,
            last_lesson
     FROM enrollments WHERE user_id = ?
     ORDER BY started_at DESC`, [USER]);

  await q('Lessons completed per course',
    `SELECT course_id, COUNT(*) AS lessons_done,
            datetime(MIN(completed_at), 'unixepoch') AS first,
            datetime(MAX(completed_at), 'unixepoch') AS latest
     FROM lesson_completions WHERE user_id = ?
     GROUP BY course_id ORDER BY lessons_done DESC`, [USER]);

  await q('Full lesson completion history (chronological)',
    `SELECT course_id, lesson_id,
            datetime(completed_at, 'unixepoch') AS at
     FROM lesson_completions WHERE user_id = ?
     ORDER BY completed_at ASC`, [USER]);

  await q('Quiz activity by course',
    `SELECT course_id, COUNT(*) AS attempts,
            SUM(submitted) AS submitted,
            COUNT(DISTINCT lesson_id) AS distinct_lessons
     FROM quiz_attempts WHERE user_id = ?
     GROUP BY course_id ORDER BY attempts DESC`, [USER]);

  await q('Daily activity',
    `SELECT activity_date, lessons_done, quizzes_done
     FROM daily_activity WHERE user_id = ?
     ORDER BY activity_date DESC`, [USER]);

  await client.close();
})();
