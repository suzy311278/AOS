/**
 * Notify users about new jobs added to the directory.
 * Uses Claude CLI to write the email body in Prajjwal's writing style.
 * Runs entirely locally: reads Excel, generates email via Claude, fetches users from Clerk, sends via Resend.
 *
 * Usage:
 *   npx tsx scripts/notify-new-jobs.ts [--dry-run] [--preview]
 *
 * Env vars needed: RESEND_API_KEY, CLERK_SECRET_KEY, ANTHROPIC_API_KEY (for Claude CLI)
 * --dry-run: Show what would be sent without sending
 * --preview: Generate email and print to console, don't send
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { Resend } from 'resend';
import { createClerkClient } from '@clerk/backend';

const JOBS_FILE = path.join(process.cwd(), 'src', 'jobs', 'jobs.xlsx');
const CACHE_FILE = path.join(process.cwd(), '.job-notify-cache.json');
const STYLE_GUIDE = '/Users/knowprajjwal/Documents/Notes/Claudewrites4me/Writing Style Guide.md';

const FROM_ADDRESS = 'Green Tryst Academy <jobs@greentryst.com>';

const dryRun = process.argv.includes('--dry-run');
const preview = process.argv.includes('--preview');

interface JobRow {
  title: string;
  company: string;
  location: string | null;
  jobUrl: string;
  profile: string;
  relevance: number;
}

function loadCurrentJobs(): JobRow[] {
  const buf = fs.readFileSync(JOBS_FILE);
  const workbook = XLSX.read(buf, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  return raw
    .filter((row) => String(row['Title'] ?? '').trim().length > 0)
    .map((row) => ({
      title: String(row['Title'] ?? ''),
      company: String(row['Company'] ?? ''),
      location: row['Location'] ? String(row['Location']) : null,
      jobUrl: String(row['Job URL'] ?? ''),
      profile: String(row['Profile'] ?? ''),
      relevance: Number(row['Relevance'] ?? 0),
    }));
}

function loadCache(): Set<string> {
  try {
    const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    return new Set(data.urls ?? []);
  } catch {
    return new Set();
  }
}

function saveCache(urls: string[]) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify({ urls, updatedAt: new Date().toISOString() }));
}

function pickTopJobs(jobs: JobRow[], count: number): JobRow[] {
  const sorted = [...jobs].sort((a, b) => b.relevance - a.relevance);
  const picked: JobRow[] = [];
  const seenCompanies = new Set<string>();

  for (const job of sorted) {
    if (picked.length >= count) break;
    const company = job.company.toLowerCase().trim();
    if (seenCompanies.has(company)) continue;
    seenCompanies.add(company);
    picked.push(job);
  }

  return picked;
}

function generateEmailViaClaude(newJobCount: number, topJobs: JobRow[]): { subject: string; body: string } {
  const styleGuide = fs.readFileSync(STYLE_GUIDE, 'utf-8');

  const jobDetails = topJobs
    .map((j, i) => `${i + 1}. ${j.title} at ${j.company}${j.location ? ` (${j.location})` : ''}`)
    .join('\n');

  const prompt = `You are writing a short email notification for Green Tryst Academy's jobs directory.

CONTEXT:
- ${newJobCount} new sustainability jobs were just added to the directory
- The top 3 most relevant ones are:
${jobDetails}
- The jobs page is at: https://greentryst.com/jobs

WRITING STYLE (follow this closely):
${styleGuide}

TASK:
Write a subject line and a very short plain-text email body (no HTML, no markdown formatting, no bold, no bullets).

Output in exactly this format:
SUBJECT: <your subject line here>
---
<email body here>

SUBJECT LINE rules:
- Actually funny. Dry, deadpan, or absurdist. Like the kind of subject line you forward to a friend saying "lol look at this".
- Must make it clear that new jobs have been added — that's the hook. The humor should wrap around that fact, not replace it.
- Can joke about the jobs, the companies, the industry, or the reader's life choices — but the reader should know "new jobs dropped" from the subject alone.
- No emojis, no em dashes, no salesy phrases like "don't miss out" or "act now".
- Keep it under 60 characters. Short and unexpected beats long and clever.

EMAIL BODY rules:
- Start with "Hi," (no name, we personalize later).
- Open with a one or two sentence intro about new jobs dropping. Keep it casual.
- Then write ONE short paragraph per job (so 3 separate paragraphs for 3 jobs). Each paragraph should mention the role, company, and location naturally, with a touch of personality or humor. 2-3 sentences max per job paragraph.
- After the job paragraphs, end with the link on its own line: https://greentryst.com/jobs
- Then a short funny one-liner, followed by "Team Green Tryst" on the next line.
- Make it feel like a quick note from a friend, not a newsletter.
- Do NOT use emojis, em dashes, bullet points, or "In conclusion" type endings.
- Do NOT use phrases like "check it out", "don't miss out", "act now", or any salesy language.`;

  const escaped = prompt.replace(/'/g, "'\\''");
  const result = execSync(
    `echo '${escaped}' | claude --print`,
    { encoding: 'utf-8', timeout: 30000, maxBuffer: 1024 * 1024 },
  ).trim();

  const delimiterIndex = result.indexOf('\n---\n');
  if (delimiterIndex === -1) {
    // Fallback if Claude doesn't follow the format
    return {
      subject: `${newJobCount} new sustainability job${newJobCount > 1 ? 's' : ''} just dropped`,
      body: result,
    };
  }

  const subjectLine = result.slice(0, delimiterIndex).replace(/^SUBJECT:\s*/i, '').trim();
  const body = result.slice(delimiterIndex + 5).trim();

  return { subject: subjectLine, body };
}

function personalizeEmail(body: string, firstName: string | null): string {
  if (firstName) {
    // Replace "Hi," or "Hi " at the start with personalized greeting
    return body.replace(/^Hi[,\s]*/m, `Hi ${firstName},\n\n`);
  }
  return body;
}

async function fetchAllUserEmails(): Promise<{ email: string; firstName: string | null }[]> {
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
  const users: { email: string; firstName: string | null }[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const { data } = await clerk.users.getUserList({ limit, offset });
    if (data.length === 0) break;
    for (const user of data) {
      const primary = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId);
      if (primary) {
        users.push({ email: primary.emailAddress, firstName: user.firstName });
      }
    }
    if (data.length < limit) break;
    offset += limit;
  }

  return users;
}

async function main() {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set. Run: export $(grep -v "^#" .env.local | xargs)');
    process.exit(1);
  }
  if (!process.env.CLERK_SECRET_KEY && !dryRun && !preview) {
    console.error('CLERK_SECRET_KEY not set. Run: export $(grep -v "^#" .env.local | xargs)');
    process.exit(1);
  }

  const currentJobs = loadCurrentJobs();
  const knownUrls = loadCache();
  const newJobs = currentJobs.filter((j) => j.jobUrl && !knownUrls.has(j.jobUrl));

  console.log(`Current jobs: ${currentJobs.length}`);
  console.log(`Known (cached): ${knownUrls.size}`);
  console.log(`New jobs: ${newJobs.length}`);

  if (newJobs.length === 0 && !preview) {
    console.log('No new jobs to notify about.');
    saveCache(currentJobs.map((j) => j.jobUrl).filter(Boolean));
    return;
  }

  const jobsToUse = newJobs.length > 0 ? newJobs : currentJobs;
  const topJobs = pickTopJobs(jobsToUse, 3);
  const jobCount = newJobs.length > 0 ? newJobs.length : 3;

  console.log(`\nTop 3 jobs for email:`);
  for (const j of topJobs) {
    console.log(`  - ${j.title} at ${j.company} (relevance: ${j.relevance})`);
  }

  console.log('\nGenerating email via Claude CLI...');
  const { subject, body: emailBody } = generateEmailViaClaude(jobCount, topJobs);

  // Preview mode
  if (preview) {
    console.log('\n--- EMAIL PREVIEW ---');
    console.log(`From: ${FROM_ADDRESS}`);
    console.log(`Subject: ${subject}`);
    console.log('');
    console.log(personalizeEmail(emailBody, 'Prajjwal'));
    console.log('--- END PREVIEW ---');
    return;
  }

  if (dryRun) {
    console.log(`\n[DRY RUN] Would send to all Clerk users.`);
    console.log(`From: ${FROM_ADDRESS}`);
    console.log(`Subject: ${subject}`);
    console.log('');
    console.log(emailBody);
    return;
  }

  // Fetch users and send
  console.log('\nFetching users from Clerk...');
  const users = await fetchAllUserEmails();
  console.log(`Found ${users.length} users.`);

  if (users.length === 0) {
    console.log('No users to notify.');
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  let succeeded = 0;
  let failed = 0;

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  for (const user of users) {
    const personalizedBody = personalizeEmail(emailBody, user.firstName);

    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: user.email,
      subject,
      text: personalizedBody,
    });

    if (error) {
      console.error(`  Failed: ${user.email} - ${error.message}`);
      failed++;
    } else {
      succeeded++;
    }
    await sleep(600);
  }

  console.log(`\nSent: ${succeeded}/${users.length} (${failed} failed)`);

  saveCache(currentJobs.map((j) => j.jobUrl).filter(Boolean));
  console.log('Cache updated.');
}

main().catch(console.error);
