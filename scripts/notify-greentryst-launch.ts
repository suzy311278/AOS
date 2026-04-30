/**
 * Greentryst launch / rename announcement.
 *
 * One-shot broadcast to every Clerk user: announces the Sustainability
 * Academy → Greentryst rename + the broader product vision. Body is
 * hardcoded (unlike notify-new-course.ts this does not regenerate copy
 * via Claude; the founder reviewed the exact wording).
 *
 * Usage:
 *   npx tsx scripts/notify-greentryst-launch.ts --preview   # show rendered email, no fetch
 *   npx tsx scripts/notify-greentryst-launch.ts --dry-run   # fetch users, print summary, do not send
 *   npx tsx scripts/notify-greentryst-launch.ts             # LIVE send to all users
 *
 * Env: RESEND_API_KEY, CLERK_SECRET_KEY
 * Rate: 600ms sleep between sends (Resend allows ~10 rps on free tier).
 */

import { Resend } from 'resend';
import { createClerkClient } from '@clerk/backend';

const FROM_ADDRESS = 'Greentryst <hello@greentryst.com>';
const REPLY_TO = 'hello@greentryst.com';

const SUBJECT = 'We renamed Sustainability Academy (and we should have done it sooner)';

// Plain text body. Paragraph breaks are explicit "\n\n". No HTML.
// "Hi," placeholder at the top is replaced with "Hi <firstName>," per user.
const BODY = `Hi,

For a long time, we believed we were building a learning platform.

Sustainability Academy. The name tells you exactly what we thought the product was. Lessons. Courses. A quiet place to come and understand Scope 3 before your Monday meeting.

It was a nice idea.

But is it what you were actually using?

In real, no.

We started noticing small things. A reader finishing a lesson on DEFRA factors, and then coming back two hours later to search the site for one specific factor. Someone reading about BRSR Core at 11am, then messaging us at 4pm the same afternoon: "do you have the actual core template though?"

The learning was the excuse. The real job was everything that came after the learning.

And the "after" was ugly. A 300-page regulation. A 200-page DEFRA Excel. An hour of Ctrl-F just to find one emission factor. A deadline creeping in while your coffee goes cold next to three open tabs and a prayer.

This is the part we did not build for. This is the part nobody built for.

And the more we watched, the more we realised something slightly uncomfortable. The sustainability practitioner's day is not mostly learning. It is mostly lookup. It is mostly digging. It is mostly defending a number back to its source because someone in finance asked "where did this come from" and the answer cannot be "I googled it."

Learning without the lookup is an empty classroom. It prepares you for a job that does not exist.

So we stopped building a learning platform.

We started building what the day actually looks like.

That is Greentryst. A tryst is a quiet meeting you choose to show up for. We want this to be the tab you open on purpose, every workday, because the thing you need is going to be waiting there. Clean. Cited. Defensible.

The founding rule, and we will probably repeat this until you are tired of hearing it: nothing ever gets hand-waved. Every emission factor shows its source. Every answer from the intelligence layer (yes it is called SustainIQ, yes we know how that sounds) points back at the primary document. Every tool we build from here shows the method behind the number. If the number in your spreadsheet cannot be traced back to where it came from, we have not done the job.

We simplify.
We show you the source.
We make the work easy for you.

This is the whole deal.

Is it done? Not even close. Some corners are still rough. Some sources are still missing. We are writing this from a sofa while a laptop fan makes a sound that concerns us slightly.

But something has started.

Today there is a redesigned library. An emission factors reference you can cite in an assurance trail. A jobs board that understands your resume instead of making you trawl 400 irrelevant listings. SustainIQ sitting over the primary documents. A calculator, a report drafter, and a BRSR screener are on the way. Each one built on the same rule. Each one refusing to hand-wave.

Free where practitioners need it most. Paid only when a team needs shared workflow. That part is on purpose.

And the ambition, let us say the quiet part out loud.

We want Greentryst to be the tab you keep open for the rest of your career. Not because we have trapped you there. Because every time you need something, the thing is there, and it is defensible, and it was built with the way your real day actually works in mind.

That is the whole bet.

Your courses, completions, and streaks are exactly where you left them. We moved house, we did not leave anything behind.

If something is broken, if a factor is missing, if you want to push back on any direction we are taking this, write to us at hello@greentryst.com. We read everything.

Thanks for being here. For trusting something with a name as earnest as "Sustainability Academy" back when that was the only thing on offer.

The profession needs the people doing it to feel like they have been built for.

We are trying to be that.

hello@greentryst.com

P.S. If there is a practitioner in your network quietly Ctrl-F-ing their Thursday away right now, forward this. We do not have to do this alone.`;

const dryRun = process.argv.includes('--dry-run');
const preview = process.argv.includes('--preview');

function personalizeEmail(body: string, firstName: string | null): string {
  if (firstName && firstName.trim()) {
    return body.replace(/^Hi[,\s]*/m, `Hi ${firstName.trim()},\n\n`);
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
  if (preview) {
    console.log('\n--- EMAIL PREVIEW ---');
    console.log(`From: ${FROM_ADDRESS}`);
    console.log(`Reply-To: ${REPLY_TO}`);
    console.log(`Subject: ${SUBJECT}`);
    console.log('');
    console.log(personalizeEmail(BODY, 'Prajjwal'));
    console.log('\n--- END PREVIEW ---');
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set. Run: export $(grep -v "^#" .env.local | xargs)');
    process.exit(1);
  }
  if (!process.env.CLERK_SECRET_KEY) {
    console.error('CLERK_SECRET_KEY not set.');
    process.exit(1);
  }

  console.log('\nFetching users from Clerk...');
  const users = await fetchAllUserEmails();
  console.log(`Found ${users.length} users.`);
  if (users.length === 0) return;

  if (dryRun) {
    console.log(`\n[DRY RUN] Would send to ${users.length} users.`);
    console.log(`From: ${FROM_ADDRESS}`);
    console.log(`Reply-To: ${REPLY_TO}`);
    console.log(`Subject: ${SUBJECT}`);
    console.log(`\nFirst 5 recipients:`);
    users.slice(0, 5).forEach((u) => console.log(`  - ${u.email} (${u.firstName ?? 'no first name'})`));
    if (users.length > 5) console.log(`  ...and ${users.length - 5} more`);
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  let succeeded = 0;
  let failed = 0;

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  for (const user of users) {
    const personalizedBody = personalizeEmail(BODY, user.firstName);
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: user.email,
      replyTo: REPLY_TO,
      subject: SUBJECT,
      text: personalizedBody,
    });
    if (error) {
      console.error(`  Failed: ${user.email} - ${error.message}`);
      failed++;
    } else {
      succeeded++;
      if (succeeded % 25 === 0) {
        console.log(`  ... ${succeeded}/${users.length}`);
      }
    }
    await sleep(600);
  }

  console.log(`\nSent: ${succeeded}/${users.length} (${failed} failed)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
