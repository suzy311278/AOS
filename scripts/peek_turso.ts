import { createClient } from '@libsql/client';
import 'dotenv/config';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function q(label: string, sql: string) {
  console.log(`\n=== ${label} ===`);
  const r = await client.execute(sql);
  if (r.rows.length === 0) { console.log('(no rows)'); return; }
  console.table(r.rows.slice(0, 50));
  if (r.rows.length > 50) console.log(`... +${r.rows.length - 50} more`);
}

(async () => {
  // Schema peek
  await q('Tables',
    `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`);

  // Enrollments
  await q('Total enrollments',
    `SELECT COUNT(*) AS total, COUNT(DISTINCT user_id) AS distinct_users, COUNT(DISTINCT course_id) AS distinct_courses FROM enrollments`);

  await q('Enrollments by course',
    `SELECT course_id, COUNT(*) AS enrolled
     FROM enrollments GROUP BY course_id ORDER BY enrolled DESC LIMIT 20`);

  await q('Most recent enrollments',
    `SELECT user_id, course_id, datetime(started_at, 'unixepoch') AS started, last_lesson
     FROM enrollments ORDER BY started_at DESC LIMIT 15`);

  // Lesson completions
  await q('Total lesson completions',
    `SELECT COUNT(*) AS total, COUNT(DISTINCT user_id) AS users_completing FROM lesson_completions`);

  await q('Lessons completed by course',
    `SELECT course_id, COUNT(*) AS completions, COUNT(DISTINCT user_id) AS users
     FROM lesson_completions GROUP BY course_id ORDER BY completions DESC LIMIT 15`);

  await q('Top users by lesson completions',
    `SELECT user_id, COUNT(*) AS lessons_done, COUNT(DISTINCT course_id) AS courses_touched,
            datetime(MIN(completed_at), 'unixepoch') AS first,
            datetime(MAX(completed_at), 'unixepoch') AS latest
     FROM lesson_completions GROUP BY user_id ORDER BY lessons_done DESC LIMIT 20`);

  // Quiz attempts
  await q('Quiz activity',
    `SELECT COUNT(*) AS total_attempts, SUM(submitted) AS submitted, COUNT(DISTINCT user_id) AS users FROM quiz_attempts`);

  // Daily activity
  await q('Daily activity last 30 days',
    `SELECT activity_date, COUNT(DISTINCT user_id) AS active_users,
            SUM(lessons_done) AS lessons, SUM(quizzes_done) AS quizzes
     FROM daily_activity
     WHERE activity_date >= date('now', '-30 day')
     GROUP BY activity_date ORDER BY activity_date DESC LIMIT 30`);

  await q('Most engaged users (all-time)',
    `SELECT user_id,
            COUNT(DISTINCT activity_date) AS active_days,
            SUM(lessons_done) AS total_lessons,
            SUM(quizzes_done) AS total_quizzes
     FROM daily_activity
     GROUP BY user_id ORDER BY active_days DESC LIMIT 20`);

  // Feedback
  await q('Feedback submissions',
    `SELECT type, COUNT(*) AS n FROM feedback_submissions GROUP BY type`);

  await q('Recent feedback',
    `SELECT type, email, substr(message, 1, 80) AS snippet, page_url, datetime(created_at, 'unixepoch') AS at
     FROM feedback_submissions ORDER BY created_at DESC LIMIT 10`);

  // Service enquiries
  await q('Service enquiries',
    `SELECT status, engagement, COUNT(*) AS n FROM service_enquiries GROUP BY status, engagement`);

  await q('Recent enquiries',
    `SELECT name, email, company, engagement, timeline, budget, status,
            datetime(created_at, 'unixepoch') AS at
     FROM service_enquiries ORDER BY created_at DESC LIMIT 10`);

  // Emission Factors
  await q('EF saved factors activity',
    `SELECT COUNT(*) AS total_saves, COUNT(DISTINCT user_id) AS users,
            COUNT(DISTINCT factor_id) AS distinct_factors
     FROM ef_saved_factors`);

  await q('EF search history (recent)',
    `SELECT substr(query, 1, 60) AS query, COUNT(*) AS n
     FROM ef_search_history
     WHERE searched_at > strftime('%s', 'now') - 7*86400
     GROUP BY query ORDER BY n DESC LIMIT 20`);

  // Funnel
  await q('Simple funnel',
    `SELECT
       (SELECT COUNT(DISTINCT user_id) FROM enrollments) AS enrolled,
       (SELECT COUNT(DISTINCT user_id) FROM lesson_completions) AS completed_1_lesson,
       (SELECT COUNT(user_id) FROM (SELECT user_id FROM lesson_completions GROUP BY user_id HAVING COUNT(*) >= 5)) AS completed_5plus,
       (SELECT COUNT(DISTINCT user_id) FROM quiz_attempts WHERE submitted = 1) AS submitted_quiz,
       (SELECT COUNT(DISTINCT user_id) FROM daily_activity WHERE activity_date >= date('now', '-7 day')) AS active_last_7d`);

  await client.close();
})();
