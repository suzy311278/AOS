/**
 * Notify users about a new course added to the platform.
 * Mirrors scripts/notify-new-jobs.ts: Claude CLI writes the copy in Prajjwal's style,
 * Clerk provides the user list, Resend sends the email.
 *
 * Usage:
 *   npx tsx scripts/notify-new-course.ts [--dry-run] [--preview]
 *
 * Env vars: RESEND_API_KEY, CLERK_SECRET_KEY, ANTHROPIC_API_KEY (for Claude CLI)
 */

import * as fs from 'fs';
import { execSync } from 'child_process';
import { Resend } from 'resend';
import { createClerkClient } from '@clerk/backend';

const STYLE_GUIDE = '/Users/knowprajjwal/Documents/Notes/Claudewrites4me/Writing Style Guide.md';
const FROM_ADDRESS = 'Green Tryst Academy <courses@greentryst.com>';

const COURSE = {
  title: 'Carbon Taxation and ETS',
  url: 'https://www.greentryst.com/courses/carbon-taxation-and-ets',
  summary:
    'A ground-up course on how carbon is priced globally: carbon taxes, emissions trading systems (ETS), CBAM, offset markets, and how pricing design choices shape real-world decarbonisation outcomes. Built from World Bank, OECD, and ICAP primary sources.',
};

const COMING_AHEAD = [
  'SustainIQ: ask natural-language questions across regulations (EU CBAM, SFDR, WFD, ESRS) and get cited answers from the source text.',
  'Tools hub: a GHG footprint calculator, a BRSR disclosure screener, and a report drafter for ESG teams.',
];

const dryRun = process.argv.includes('--dry-run');
const preview = process.argv.includes('--preview');

function generateEmailViaClaude(): { subject: string; body: string } {
  const styleGuide = fs.readFileSync(STYLE_GUIDE, 'utf-8');

  const prompt = `You are writing a short email for Green Tryst Academy announcing a new course plus a teaser of what's coming next on the platform.

CONTEXT:
- New course: ${COURSE.title}
- Course URL: ${COURSE.url}
- What the course covers: ${COURSE.summary}
- Coming ahead on the platform:
${COMING_AHEAD.map((c, i) => `  ${i + 1}. ${c}`).join('\n')}

WRITING STYLE (follow closely):
${styleGuide}

TASK:
Write a subject line and a short plain-text email body. No HTML, no markdown, no bold, no bullets, no emojis, no em dashes.

Output in exactly this format:
SUBJECT: <your subject line here>
---
<email body here>

SUBJECT LINE rules:
- Actually funny. Dry, deadpan, or absurdist. Like the kind of subject line you forward to a friend saying "lol look at this".
- Must make it clear that a new course (Carbon Pricing) is out - that's the hook. The humor wraps around that fact, it doesn't replace it.
- Can joke about carbon, pricing, economists, ETS acronym soup, CBAM, or the reader's life choices.
- No emojis, no em dashes, no salesy phrases like "don't miss out" or "act now".
- Keep it under 60 characters. Short and unexpected beats long and clever.

EMAIL BODY rules:
- Start with "Hi," (we personalize the name later).
- Open with one or two sentences announcing the Carbon Pricing course with a touch of personality or humor. Keep it casual, like texting a friend.
- Write ONE short paragraph about the course itself (2-3 sentences), mentioning what it covers - carbon taxes, ETS, CBAM, offset markets - naturally, with some dry wit. Don't list them like a brochure.
- DO NOT mention source materials, publishers, institutions, or where the content was built from. No World Bank, OECD, ICAP, or any other source names. Just talk about what the learner will get out of it.
- Put the course URL on its own line: ${COURSE.url}
- Then ONE short paragraph teasing what's coming next. DO NOT name SustainIQ, the tools hub, the GHG calculator, the BRSR screener, or the report drafter. Keep it deliberately vague and mysterious, like you're hinting at something in a back room. Conspiratorial, fun, "we are building some things we cannot talk about yet" energy. Make the reader curious, not informed.
- End with a short funny one-liner, then "Team Green Tryst" on the next line.
- Feel like a quick note from a friend, not a newsletter.
- No emojis, no em dashes, no bullets, no "check it out" / "don't miss out" / "act now" phrases.`;

  const escaped = prompt.replace(/'/g, "'\\''");
  const result = execSync(`echo '${escaped}' | claude --print`, {
    encoding: 'utf-8',
    timeout: 60000,
    maxBuffer: 1024 * 1024,
  }).trim();

  const delimiterIndex = result.indexOf('\n---\n');
  if (delimiterIndex === -1) {
    return {
      subject: `New course: Carbon Pricing`,
      body: result,
    };
  }

  const subject = result.slice(0, delimiterIndex).replace(/^SUBJECT:\s*/i, '').trim();
  const body = result.slice(delimiterIndex + 5).trim();
  return { subject, body };
}

function personalizeEmail(body: string, firstName: string | null): string {
  if (firstName) {
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
  if (!preview && !process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set. Run: export $(grep -v "^#" .env.local | xargs)');
    process.exit(1);
  }
  if (!dryRun && !preview && !process.env.CLERK_SECRET_KEY) {
    console.error('CLERK_SECRET_KEY not set.');
    process.exit(1);
  }

  const subject = 'we put a price on carbon (and a course on it)';
  const body = `Hi,

New course is live. It is called Carbon Pricing, which we admit is not the most creative name, but at least you know what you are getting.

We go through how the world actually decides what a tonne of carbon should cost. Taxes, trading systems, that CBAM thing your European clients keep emailing you about, and the strange parallel universe of offset markets. By the end you will know why economists argue about this at dinner parties, and you will be able to argue back.

${COURSE.url}

We are also cooking up a few other things in the back room. Cannot say much yet. Some of it involves asking a question and having it drop you on the exact page of the exact regulation where the answer lives, highlighted, no scrolling, no Ctrl+F, no 400-page PDF pretending to be searchable. Some of it involves tools that do the boring parts of your job for you. And something that quietly matches you to the right roles in the climate world, without you having to refresh job boards at 2am. More soon.

Anyway, price yourself accordingly.

Team Green Tryst`;

  if (preview) {
    console.log('\n--- EMAIL PREVIEW ---');
    console.log(`From: ${FROM_ADDRESS}`);
    console.log(`Subject: ${subject}`);
    console.log('');
    console.log(personalizeEmail(body, 'Prajjwal'));
    console.log('--- END PREVIEW ---');
    return;
  }

  if (dryRun) {
    console.log(`\n[DRY RUN] Would send to all Clerk users.`);
    console.log(`From: ${FROM_ADDRESS}`);
    console.log(`Subject: ${subject}`);
    console.log('');
    console.log(body);
    return;
  }

  console.log('\nFetching users from Clerk...');
  const users = await fetchAllUserEmails();
  console.log(`Found ${users.length} users.`);
  if (users.length === 0) return;

  const resend = new Resend(process.env.RESEND_API_KEY);
  let succeeded = 0;
  let failed = 0;

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  for (const user of users) {
    const personalizedBody = personalizeEmail(body, user.firstName);
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
}

main().catch(console.error);
