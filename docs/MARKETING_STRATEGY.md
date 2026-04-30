# Sustainability Academy: Marketing Strategy

## Platform Strengths (Marketing Pillars)

Every piece of marketing should lean on one or more of these differentiators:

1. **Depth over fluff.** Courses are built from primary sources (IPCC reports, GHG Protocol, Verra VM0042, GRI Standards, EU Taxonomy regulation). Real formulas, real calculations, real frameworks. Not surface-level overviews.

2. **Completely free.** No paywall, no trial period. Soft registration wall at 3 lessons per month for anonymous visitors, but registration is free and unlocks unlimited access. This removes all friction from sharing and referrals.

3. **Interactive learning.** Quizzes after every lesson, calculation exercises with progressive hints, color-coded equation breakdowns with hover interactions, hand-drawn data visualizations. Not passive reading.

4. **Audio lessons.** Podcast-style narration for every lesson, hosted on Cloudflare R2. Learn on the go. This is a feature most competitors do not offer.

5. **Glossary (190+ terms).** A standalone reference resource that serves both learners and search engines.

6. **Jobs directory.** Curated sustainability and climate career listings. Direct pipeline from learning to employment. Unique combination that no other free platform offers.

7. **Breadth of coverage.** Climate science, carbon markets, GHG accounting, ESG reporting, EU Taxonomy, biodiversity, circular economy, clean energy, and more. A single destination for sustainability education.

## Channel Strategy

### 1. LinkedIn (Primary Channel)

LinkedIn is where sustainability professionals spend their time. This is the highest-priority channel for both organic content and community engagement.

**Full details in:** `docs/LINKEDIN_CONTENT_STRATEGY.md`

**Summary:**

- Post from a Company Page (not personal profile) to build standalone brand equity
- 5 posts per week (Mon-Fri) with a rotating content mix: glossary terms, key insights, analogies, quizzes/polls, formulas, course announcements
- All content is extracted programmatically from the existing MDX lessons, quiz YAMLs, and glossary YAML in the codebase
- Existing auto-posting setup handles scheduling and publishing
- Engage in LinkedIn Groups (Sustainability Professionals, ESG & Responsible Investing, Carbon Trading, Corporate Sustainability Network, etc.)
- Build relationships with 10-15 mid-tier sustainability creators (5K-50K followers) through genuine comment engagement

**Content volume from existing material:** 6-9 months of daily posts without writing anything new.

### 2. SEO (Compounding Growth Engine)

The platform's architecture already supports strong SEO fundamentals. This channel compounds over time and becomes the largest traffic source long-term.

**What's already in place:**
- All lesson pages are statically generated and fully crawlable (soft wall does not block content from search engines)
- Structured data on every page: LearningResource, FAQPage (auto-generated from quiz Q&As), BreadcrumbList JSON-LD
- Unique meta descriptions extracted from lesson content
- Glossary with 190+ defined terms

**Actions to take:**

**Hub pages (high priority).** Create long-form comparison and guide pages that target high-intent search queries. These pages link to relevant lessons, creating internal link structures that boost the entire site.

Examples:
- "Complete Guide to Carbon Credit Methodologies" (links to VM0042, VCS, Gold Standard courses)
- "EU Taxonomy vs GRI Standards: Key Differences" (links to both course modules)
- "How to Calculate Scope 3 Emissions: Step-by-Step" (links to GHG accounting lessons)
- "ESG Reporting Frameworks Compared: GRI, SASB, TCFD, ISSB" (links across ESG courses)
- "What is Double Materiality? A Practical Guide" (links to double materiality course)

**Glossary as SEO magnet.** Each of the 190+ glossary terms targets a long-tail keyword. Queries like "what is additionality in carbon markets" or "scope 3 emissions definition" have moderate search volume and low competition. Ensure each term is deep-linkable (anchor link or dedicated page) and has enough content to satisfy the search intent.

**"How to calculate X" content.** The CalculationExercise components in the MDX content directly answer queries like:
- "how to calculate carbon intensity"
- "how to calculate CO2 equivalent"
- "how to calculate scope 3 emissions"
- "ghg emission factor formula"

These queries indicate high intent (someone trying to do the work) and the interactive exercises provide a better answer than any blog post.

**Technical SEO checklist:**
- Ensure Open Graph images are set for every lesson page (branded card with lesson title and course name). Critical for social sharing appearance.
- Add a sitemap.xml if not already present
- Ensure canonical URLs are set correctly
- Monitor Core Web Vitals (SSG pages should score well by default)

### 3. Community Distribution (Highest Leverage for Early Growth)

Communities are where the first 1,000 users come from. This requires manual effort but has the highest conversion rate of any channel.

**Sustainability-specific communities:**

| Community | Platform | Approach |
|-----------|----------|----------|
| Climate Action Tech | Slack | Share course links when relevant questions arise in channels. Do not spam. |
| CISL Alumni Network | LinkedIn/Slack | Engage as a peer. Share resources naturally. |
| GreenBiz Community | Web forum | Participate in discussions, reference specific lessons when helpful. |
| r/sustainability | Reddit | Answer questions with genuine depth. Link to lessons in comments, not titles. |
| r/climatechange | Reddit | Same approach. Focus on climate science course content. |
| r/ESG | Reddit | ESG reporting and frameworks discussions. |
| Carbon Trading Discord servers | Discord | Engage in VM0042 and carbon markets discussions. |

**Rules of engagement:**
- Never lead with promotion. Lead with value. Answer the question first, then mention the resource.
- Share specific lessons, not the homepage. "We break down exactly how to calculate this here: [link to lesson 3.1]" is useful. "Check out our platform" is spam.
- Build a reputation in each community before sharing links. Post 5-10 helpful comments before any link.
- Limit to 2-3 link shares per community per week maximum.

**Reddit strategy specifically:**
- Reddit hates self-promotion. The ratio should be 90% genuine participation, 10% linking to the platform.
- Create posts that stand on their own (e.g., "Explained: How Scope 3 Category 1 Purchased Goods emissions are calculated" with the full explanation in the post body), then mention the course at the bottom as a "if you want to go deeper" resource.
- Upvotes on Reddit drive significant traffic. A single well-received post on r/sustainability can send 500-1,000 visitors.

### 4. University Partnerships (High-Value, Slow Burn)

Professors teaching sustainability, environmental science, or ESG courses are always looking for supplementary learning resources. A free, structured, quiz-backed platform is exactly what they need.

**The pitch:**
- Completely free for students (no budgetary approval needed)
- Structured curriculum aligned with standard sustainability frameworks
- Interactive quizzes provide self-assessment without grading burden on professors
- Audio lessons accommodate different learning styles
- Progress tracking lets students (and optionally professors) see engagement

**How to reach professors:**
- Identify university programs in sustainability, environmental management, ESG, and climate science
- Email department heads or course instructors directly with a brief pitch and link to a relevant course
- Offer to create a custom "course guide" mapping Sustainability Academy lessons to their syllabus
- Attend sustainability education conferences (even virtually) and present the platform

**Expected impact:** Even one professor assigning the platform as supplementary material means 30-100 new users per semester, and those users are the exact target audience (early-career sustainability professionals).

**Timeline:** This is a slow channel. Expect 2-3 months from first outreach to classroom adoption. But each partnership compounds (professors rarely remove a resource once it's working).

### 5. Newsletter (Retention and Re-engagement)

A simple email newsletter keeps registered users engaged and brings them back to the platform.

**Frequency:** Biweekly (every two weeks). Low enough to avoid fatigue, frequent enough to stay top-of-mind.

**Content structure:**
- 1 new course or lesson highlight
- 1 sustainability industry insight or news connection
- 1 glossary term or formula spotlight
- Link to the jobs directory if relevant new listings exist

**Collection point:** Email is already collected through Clerk registration. Add an optional newsletter opt-in during sign-up or on the dashboard.

**Tool:** Any simple email service (Buttondown, Resend, ConvertKit free tier). The newsletter content can be partially auto-generated from the same extraction pipeline used for LinkedIn.

### 6. Completion Certificates (Viral Loop)

This is not a channel but a growth mechanism that amplifies every other channel.

**The mechanism:**
1. User completes a course
2. Platform generates a certificate (PDF or shareable image) with: user name, course title, completion date, Sustainability Academy branding, and a unique verification URL
3. User shares the certificate on LinkedIn (this is the most common behavior for professional certificates)
4. Every shared certificate is a free, credible endorsement visible to the sharer's entire network
5. Certificate includes a link back to the platform

**Why this works:** People share certificates because it signals competence to their professional network. Each share is an organic advertisement that carries social proof (a real person completed it and thought it was worth sharing).

**Implementation priority:** High. The viral coefficient of certificates is significant. One certificate shared to a network of 500 connections generates more qualified impressions than a week of company page posts.

**Certificate design considerations:**
- Professional, clean design that people are proud to share
- Include the specific course name and a brief description of what was covered
- Add a QR code or short URL for verification
- Make it easy to share directly to LinkedIn from the completion screen

### 7. Jobs Directory as a Growth Funnel

The jobs directory is currently a feature within the platform, but it can also serve as an independent acquisition channel.

**The strategy:**
- Promote the jobs page independently on LinkedIn and Reddit with posts like "50+ open sustainability roles this week" or "Climate risk jobs hiring now"
- People searching for sustainability jobs discover the platform through the jobs page
- Once on the platform, they see the courses and realize they can build the exact skills these jobs require
- The natural next step is enrollment

**Content tie-in:** For each job category (ESG analyst, carbon markets, climate risk), create a "skills roadmap" that maps specific courses and lessons to the skills listed in job postings. This makes the connection between learning and employment explicit.

**LinkedIn job posts format:**
```
Hiring in sustainability this week:

- ESG Analyst at [Company] (London)
- Carbon Markets Associate at [Company] (Remote)
- Climate Risk Consultant at [Company] (NYC)
- Sustainability Reporting Manager at [Company] (Berlin)

See all open roles: [jobs page link]

Not qualified yet? Our free courses cover the exact frameworks
these roles require: [platform link]

#SustainabilityJobs #ClimateJobs #ESGCareers #GreenJobs
```

## Content Marketing: Cross-Channel Repurposing

Every piece of content extracted from the codebase can be repurposed across multiple channels. Extract once, format for each platform.

| Source | LinkedIn | Reddit | Newsletter | SEO |
|--------|----------|--------|------------|-----|
| Glossary term | Term of the Day post | Answer in relevant threads | Term spotlight section | Long-tail keyword page |
| HighlightBox | Key Insight post | Standalone explanation post | Highlight of the week | Part of hub page content |
| Quiz question | Poll or engagement post | "Test yourself" post | Quiz challenge section | FAQ structured data (already in place) |
| Formula | Formula Spotlight post | Educational breakdown | Formula of the month | "How to calculate X" page |
| New course | Announcement post | Resource share (r/sustainability) | Lead story | New landing page with structured data |
| Job listings | Weekly hiring roundup | Career thread contribution | Jobs section | Jobs page SEO |

## Measurement Framework

### Key Metrics by Channel

| Channel | Primary Metric | Secondary Metric | Tool |
|---------|---------------|-----------------|------|
| LinkedIn | Follower growth + engagement rate | Link clicks to platform | LinkedIn Analytics |
| SEO | Organic search traffic | Keyword rankings for target terms | Google Search Console |
| Communities | Referral traffic from Reddit/Slack | Sign-up conversion from referral | Google Analytics (UTM) |
| Newsletter | Open rate + click rate | Re-engagement (return visits) | Email service analytics |
| Certificates | Shares on LinkedIn | New sign-ups from certificate links | UTM tracking on cert URLs |
| Jobs page | Page views + external clicks | Sign-ups from /jobs visitors | Google Analytics (funnel) |

### UTM Convention

All outbound links should carry UTM parameters for attribution:

```
?utm_source={platform}&utm_medium={type}&utm_campaign={content_type}&utm_content={specific_id}
```

- `utm_source`: `linkedin`, `reddit`, `newsletter`, `twitter`, `slack`, `certificate`
- `utm_medium`: `social`, `email`, `community`, `referral`
- `utm_campaign`: `glossary_term`, `key_insight`, `quiz`, `formula`, `course_launch`, `resource_list`, `job_roundup`
- `utm_content`: specific identifier (term slug, lesson ID, course ID)

### Monthly Review Cadence

At the end of each month, review:

1. Which LinkedIn post types got the highest engagement? Shift the content mix toward what works.
2. Which search queries are driving traffic? Create more content targeting those topics.
3. Which communities are sending the most sign-ups? Double down on those.
4. What is the certificate share rate? If low, improve the sharing UX.
5. Are newsletter subscribers returning to the platform? If not, adjust content.

## Priority Roadmap

### Immediate (Week 1-2)

1. Create the LinkedIn Company Page with the prepared description
2. Run the content extraction script to generate the initial post library
3. Load the first month of posts into the auto-posting setup
4. Set up UTM tracking on all outbound links
5. Add Open Graph images to lesson pages for better social sharing previews

### Short-term (Month 1-2)

6. Begin community engagement on Reddit and LinkedIn Groups (manual, 30 min/day)
7. Build and ship completion certificates
8. Write the first 3 SEO hub pages targeting highest-volume queries
9. Launch a simple biweekly newsletter
10. Create the first "jobs roundup" LinkedIn post series

### Medium-term (Month 2-4)

11. Reach out to 5-10 university sustainability programs
12. Publish weekly job roundup posts connecting job skills to courses
13. Analyze first 2 months of LinkedIn data and optimize content mix
14. Expand hub pages based on Search Console query data
15. Explore LinkedIn ads (small budget) to boost highest-performing organic posts

### Long-term (Month 4+)

16. Evaluate corporate/team plans based on inbound interest
17. Invite guest contributors (practitioners, auditors, analysts) to co-author lessons
18. Explore podcast distribution (the audio lessons could be syndicated as a podcast feed)
19. Consider partnerships with sustainability certification bodies (use the platform as prep material)
20. Scale what's working, cut what isn't
