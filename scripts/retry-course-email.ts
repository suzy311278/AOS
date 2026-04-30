import { Resend } from 'resend';
import { createClerkClient } from '@clerk/backend';

const FROM_ADDRESS = 'Green Tryst Academy <courses@greentryst.com>';
const COURSE_URL = 'https://www.greentryst.com/courses/carbon-taxation-and-ets';

const FAILED = [
  'madonnanagib22@gmail.com',
  'peijuancy@gmail.com',
  'eng.nadiam@gmail.com',
  'malede.gashaw77@gmail.com',
  'imnhdyh@gmail.com',
  'asaresenaza@gmail.com',
  'rasel.premierian@gmail.com',
  'vittoriopalpati911@gmail.com',
  'sellaah.sharon2001@gmail.com',
  'vinodchvn.brd@gmail.com',
];

const subject = 'we put a price on carbon (and a course on it)';
const bodyTemplate = (firstName: string | null) => {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi,';
  return `${greeting}

New course is live. It is called Carbon Taxation and ETS, which we admit is not the most creative name, but at least you know what you are getting.

We go through how the world actually decides what a tonne of carbon should cost. Taxes, trading systems, that CBAM thing your European clients keep emailing you about, and the strange parallel universe of offset markets. By the end you will know why economists argue about this at dinner parties, and you will be able to argue back.

${COURSE_URL}

We are also cooking up a few other things in the back room. Cannot say much yet. Some of it involves asking a question and having it drop you on the exact page of the exact regulation where the answer lives, highlighted, no scrolling, no Ctrl+F, no 400-page PDF pretending to be searchable. Some of it involves tools that do the boring parts of your job for you. And something that quietly matches you to the right roles in the climate world, without you having to refresh job boards at 2am. More soon.

Anyway, price yourself accordingly.

Team Green Tryst`;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
  const resend = new Resend(process.env.RESEND_API_KEY!);

  // Map emails to first names
  const nameByEmail = new Map<string, string | null>();
  let offset = 0;
  while (true) {
    const { data } = await clerk.users.getUserList({ limit: 100, offset });
    if (data.length === 0) break;
    for (const u of data) {
      const primary = u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId);
      if (primary) nameByEmail.set(primary.emailAddress, u.firstName);
    }
    if (data.length < 100) break;
    offset += 100;
  }

  let ok = 0;
  let fail = 0;
  for (const email of FAILED) {
    const firstName = nameByEmail.get(email) ?? null;
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject,
      text: bodyTemplate(firstName),
    });
    if (error) {
      console.error(`Failed: ${email} - ${error.message}`);
      fail++;
    } else {
      console.log(`Sent: ${email}`);
      ok++;
    }
    await sleep(600);
  }
  console.log(`\nRetry result: ${ok}/${FAILED.length} (${fail} failed)`);
}

main().catch(console.error);
