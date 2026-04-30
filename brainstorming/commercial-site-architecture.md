# Commercial Platform: Site Architecture and UX (v2, Revised)

**Date:** April 2026
**Revision:** v2, incorporating Codex review feedback on feasibility, UX, and transition risk.
**Context:** The previous redesign (REDESIGN_IMPLEMENTATION_PLAN.md) was a visual refresh of a learning-only platform. With the commercial expansion (pricing tiers, practitioner tools, job matching, community), the information architecture must change. This document defines the restructured site, grounded in what can actually be built incrementally on the current stack.

## What Changed

**Before (learning platform):**
- Homepage -> Courses -> Lessons -> Dashboard
- Simple. Linear. One product.

**Now (commercial platform):**
- Learning (courses, paths, certificates)
- Tools (GHG calculator, emission factors, regulation tracker)
- Career (job board, resume matching, skill gaps)
- Community (embedded in lessons first, standalone hub later)
- Account (dashboard, profile, subscription)

Three product surfaces (Learn, Tools, Jobs), one retention layer (Community), and one personal space (Dashboard). Not five equal products. The distinction matters for nav, homepage, and build order.

## Design System: What Carries Forward

The Verdant Core design system from the previous redesign is still right for the brand. Visual tokens carry forward. Shell components and information architecture do not, because the page hierarchy, routing, and user flows are fundamentally different.

**Keep from previous redesign:**
- Color tokens (primary #00433d, surfaces, outlines)
- Typography (Manrope headlines, Inter body)
- Shape system (rounded-2xl cards, rounded-full buttons, tonal layering)
- Glass effects, card-lift hovers, gradients
- Component-level styling (callout boxes, quiz cards, audio player)
- Content component restyling (Phase 2 from redesign plan)

**Rethink entirely:**
- Navigation structure (new nav, not a reskin)
- Homepage (marketing page, not course grid)
- Dashboard (learning-focused, not a dumping ground)
- Page hierarchy and routing (new sections, but no URL migration for existing content)
- Pricing and conversion touchpoints (new)
- Community surfaces (new, embedded first)

## Navigation

### Principle: Four Items, Not Five

Every nav item is a promise. Five promises overwhelm first-time visitors. Community is a retention layer, not a product surface, and should not be top-level until it has enough activity to justify being a destination.

```
Desktop Nav:
+-----------------------------------------------------------------------+
|  [Logo]       Learn     Tools     Jobs     Pricing    [Search] [Avatar]|
+-----------------------------------------------------------------------+

Mobile Bottom Bar (3 core tabs + 1 personal):
+-----------------------------------------------------------------------+
|     Learn          Tools          Jobs          Profile                |
+-----------------------------------------------------------------------+
```

- **Learn**: Courses, learning paths, glossary
- **Tools**: Practitioner tools (calculator, emission factors, regulations)
- **Jobs**: Job board, matching, career profile
- **Pricing**: Tier comparison, conversion page
- **Avatar/Profile**: Dashboard, certificates, settings, subscription (authenticated chrome)
- **Search**: Cmd+K modal (existing, expanded to cover tools + jobs)

### Mobile Bottom Bar

Four tabs, not five. Active tab highlighted with primary color. Badge indicators for new job matches and streak reminders.

**Critical: On lesson pages, the bottom tab bar is hidden.** The audio player takes priority because it's contextually relevant. Users navigate lessons via the sidebar drawer and back button.

## Route Structure

### Key Decision: Do NOT Rename `/courses`

The current course URLs (`/courses/vm0042/0_1`) are indexed by Google and accumulate SEO value. Moving them to `/learn/courses/...` creates migration risk (redirects, canonical updates, sitemap changes, ranking loss) for zero user benefit.

**The fix:** `/learn` is a hub page that links to courses. Actual content stays at `/courses/...`.

```
/                                   Homepage (marketing)
/pricing                            Pricing page (tier comparison + For Teams)

# Learning (hub at /learn, content stays at /courses)
/learn                              Learning hub (paths, progress, course grid)
/learn/paths                        Learning paths (curated bundles)
/learn/paths/[pathId]               Individual path overview
/courses/[courseId]                  Course overview (EXISTING, unchanged)
/courses/[courseId]/[lessonId]       Lesson page (EXISTING, unchanged)
/glossary                           Glossary (EXISTING, unchanged)

# Tools (public landing pages + authenticated workspaces)
/tools                              Tools hub (overview of all tools)
/tools/emission-factors             Emission factor search (public, free lookups)
/tools/calculator                   GHG Calculator landing/demo (public)
/tools/regulations                  Regulation tracker landing (public)
  # Authenticated workspaces (separate route group)
/app/calculator/[projectId]         Saved calculation (auth required)
/app/reports/[reportId]             Saved report (auth required)

# Jobs (public board + authenticated matching)
/jobs                               Job board (EXISTING, enhanced, public)
/jobs/[jobId]                       Individual job detail (public)
  # Authenticated career features
/app/matches                        Personalized job matches
/app/career-profile                 Resume, skills, preferences

# Dashboard (authenticated, learning-focused)
/dashboard                          Personal dashboard
/dashboard/certificates             Earned certificates
/dashboard/settings                 Account + subscription management

# Public profiles
/profile/[userId]                   Public user profile

# Auth
/sign-in                            Clerk sign-in (EXISTING)
/sign-up                            Clerk sign-up (EXISTING)
/about                              About page
```

### Route Group Architecture (Next.js App Router)

Static and dynamic routes must be isolated to prevent auth/subscription state from forcing dynamic rendering on static pages.

```
src/app/
  (static)/                  # No auth checks in layout, pure SSG
    courses/[courseId]/
      page.tsx               # Course overview (static)
      [lessonId]/page.tsx    # Lesson page (static)
    glossary/page.tsx
    about/page.tsx
    tools/                   # Public tool landing pages (static or ISR)
      page.tsx               # Tools hub
      emission-factors/page.tsx
      calculator/page.tsx
      regulations/page.tsx

  (marketing)/               # Homepage, pricing (static or ISR)
    page.tsx                 # Homepage
    pricing/page.tsx

  (dynamic)/                 # Auth + subscription checks in layout
    dashboard/
    app/                     # Authenticated workspaces
      calculator/[projectId]/
      matches/
      career-profile/
    learn/                   # Learning hub (needs auth for progress)
      page.tsx
      paths/

  (auth)/                    # Clerk pages
    sign-in/
    sign-up/

  api/                       # API routes (all auth-protected)
    progress/
    activity/
    stripe/
    jobs/
    tools/
```

This ensures course pages stay statically generated even as dynamic authenticated features are added around them.

## Subscription Gating: Server-Side Enforcement

Tier checks happen in three layers:

1. **Middleware** (`src/middleware.ts`): Auth presence only. "Is this person logged in?" for `/dashboard`, `/app/*`, `/api/*`. No plan logic.
2. **Server components + route handlers**: Check the user's plan from the database before rendering premium content or returning data. This is the real enforcement.
3. **Client components** (LessonMeter, upgrade CTAs): Show the UX overlay, but purely cosmetic. Content is already gated server-side.

```ts
// src/lib/entitlements.ts (server-only)
export async function canAccess(userId: string, feature: Feature): Promise<boolean> {
  const sub = await getSubscription(userId);
  return FEATURE_GATES[feature].includes(sub?.plan ?? 'free');
}
```

Used by server components, API routes, and server actions. Never trust client-side checks alone.

## Homepage: One Promise, Then Proof

The homepage has one job: tell a first-time visitor what this platform is within 5 seconds, then give them a reason to explore.

### Principle: Lead with Identity, Not Features

Don't try to explain everything. Lead with the primary identity (sustainability learning), then show evidence that the platform goes deeper (tools, jobs).

### Structure

```
+------------------------------------------------------+
| HERO                                                  |
| "Build your sustainability career"                    |
| (or: "The learning platform for sustainability        |
|  professionals")                                      |
|                                                       |
| Subtext: Courses, tools, and career support for       |
| ESG, carbon, climate, and beyond.                     |
|                                                       |
| [Start Learning - Free]    [Browse Jobs]              |
|                                                       |
| 12 courses | 200+ lessons | 500+ jobs | Free to start |
+------------------------------------------------------+

+------------------------------------------------------+
| WHAT'S YOUR GOAL? (interactive selector, not 3 equal  |
| pillars)                                              |
|                                                       |
| [I want to learn] [I need tools] [I'm hiring/looking]|
|                                                       |
| Selected: "I want to learn"                           |
| -> Shows 3 featured learning paths with progress bars |
|    and "Start Free" CTAs                              |
|                                                       |
| Selected: "I need tools"                              |
| -> Shows emission factor search demo + calculator     |
|    preview with "Try Free" CTA                        |
|                                                       |
| Selected: "I'm looking for jobs"                      |
| -> Shows 3 live job cards + "Upload resume for        |
|    match scores" CTA                                  |
+------------------------------------------------------+

+------------------------------------------------------+
| FEATURED COURSES (3-4 cards, not the full grid)       |
| "Start with the fundamentals"                         |
| [Course card] [Course card] [Course card]             |
| [See All Courses ->]                                  |
+------------------------------------------------------+

+------------------------------------------------------+
| SOCIAL PROOF                                          |
| "Trusted by professionals at..."                      |
| [Logos] [Testimonial quote] [Stats]                   |
+------------------------------------------------------+

+------------------------------------------------------+
| PRICING TEASER                                        |
| "Free to start. Pro from $5/month."                   |
| [See Plans]                                           |
+------------------------------------------------------+

+------------------------------------------------------+
| FOOTER                                                |
| Learn | Tools | Jobs | Pricing | About | Legal        |
+------------------------------------------------------+
```

**Key differences from v1:**
- Hero has ONE primary value prop, not three competing ones
- "What's your goal?" is an interactive selector, not three equal-weight pillar cards. This respects all personas without giving them equal visual weight
- No community teaser (community doesn't exist yet at launch)
- No tools preview section (moved into the "What's your goal?" selector)
- Shorter overall (6 sections, not 9)
- Signed-in users see a personalized strip at top ("Continue: Carbon Markets, Lesson 3.2") above the marketing page, not a half-marketing/half-dashboard hybrid

## Dashboard: Learning-Focused, Not a Dumping Ground

The dashboard answers one question: "How is my learning going?" Everything else is a lightweight notification linking elsewhere.

```
/dashboard

+------------------------------------------------------+
| Welcome back, [Name]           [Pro Badge]  Level 4   |
| 7-day streak | 1,250 XP                              |
+------------------------------------------------------+

+------------------------------------------------------+
| CONTINUE LEARNING                                     |
| [Course card with progress bar + "Continue" button]   |
| [Course card with progress bar + "Continue" button]   |
+------------------------------------------------------+

+------------------------------------------------------+
| NOTIFICATIONS (lightweight, linking out)               |
| "3 new jobs match your profile" -> /app/matches       |
| "2 replies to your lesson comments" -> /courses/...   |
+------------------------------------------------------+

+------------------------------------------------------+
| STREAK CALENDAR (52-week heatmap)                     |
+------------------------------------------------------+

+------------------------------------------------------+
| CERTIFICATES (earned, with download buttons)          |
+------------------------------------------------------+

+------------------------------------------------------+
| SUBSCRIPTION                                          |
| Pro ($5/mo) | [Manage] | [Upgrade to Work]            |
+------------------------------------------------------+
```

Job matches and community replies are notification-style widgets (1-2 lines each) that link out. They are signposts, not co-equal sections competing for attention.

## Lesson Page: Mostly Unchanged + Discussions

The lesson page design from the previous redesign is still correct. The content reading experience doesn't change. Additions:

- **Discussion thread at bottom**: Free users can post (rate-limited to 3/day). Upvoting, threaded replies, pinned answers. This is the primary community entry point.
- **Certificate progress indicator**: "3 of 12 lessons complete in this path" in the sidebar
- **Related tools widget** (sidebar): "Practice this in the GHG Calculator" (only shown for relevant lessons)
- **Soft paywall overlay**: Now mentions the specific tier required ("Upgrade to Pro to continue reading")

### Discussion Schema

```ts
export const discussions = sqliteTable('discussions', {
  id: text('id').primaryKey(),            // nanoid
  userId: text('user_id').notNull(),
  courseId: text('course_id').notNull(),
  lessonId: text('lesson_id').notNull(),
  parentId: text('parent_id'),            // null = top-level, otherwise reply
  body: text('body').notNull(),
  upvotes: integer('upvotes').default(0),
  status: text('status', { enum: ['visible', 'hidden', 'flagged'] }).default('visible'),
  isPinned: integer('is_pinned').default(0),
  createdAt: integer('created_at'),
  updatedAt: integer('updated_at'),
});

export const discussionVotes = sqliteTable('discussion_votes', {
  userId: text('user_id'),
  discussionId: text('discussion_id'),
}, (t) => ({
  pk: primaryKey(t.userId, t.discussionId),
}));
```

Status field added for moderation. `hidden` = removed by moderator. `flagged` = auto-hidden after 3 community flags, pending review.

## Community: Embedded First, Hub Later

Community is NOT a top-level nav item at launch. It is embedded in existing surfaces:

**Phase 1 (launch):**
- Lesson discussions (bottom of every lesson page)
- XP system + levels (visible on profile and dashboard)
- Public user profiles (courses completed, discussion reputation)

**Phase 2 (when discussion volume justifies it):**
- Case study submissions (template-guided, peer-rated)
- Weekly challenges
- Leaderboard page

**Phase 3 (when community earns top-level status):**
- Community hub page
- Add "Community" to navigation
- Mentor matching
- Project showcase

The rule: don't promote empty containers. Graduate community to top-level only when there's enough activity to fill the page.

## Community Gating: Free Users Can Participate

Blocking free users from all community features damages the learning experience. If someone reads a lesson and can't ask a question, the platform is punishing learning to drive upgrades.

| Feature | Free | Pro ($5/mo) | Work ($29/mo) |
|---------|------|-------------|---------------|
| Read discussions | Yes | Yes | Yes |
| Post in lesson discussions | Yes (3/day limit) | Unlimited | Unlimited |
| Upvote | Yes | Yes | Yes |
| Submit case studies | No | Yes | Yes |
| Weekly challenges | No | Yes | Yes |
| Leaderboard visibility | No | Yes | Yes |
| Mentor access | No | No | Yes |
| Project showcase | No | No | Yes |

Free users participate in the core learning loop. Premium community features (case studies, challenges, mentors) are the upgrade lever.

## Pricing Page

The pricing page is a first-class route, not a modal. Three columns with a unified tier model (consistent across all docs and code):

| | **Free** | **Pro** | **Work** |
|---|---|---|---|
| **Monthly** | $0 | $5/mo | $29/mo |
| **Annual** | $0 | $39/yr ($3.25/mo) | $249/yr ($20.75/mo) |
| Lessons | 3/month | Unlimited | Unlimited |
| Cloud progress + streaks | No | Yes | Yes |
| Certificates | No | Yes | Yes |
| Lesson discussions | 3 posts/day | Unlimited | Unlimited |
| Case studies + challenges | No | Yes | Yes |
| Job board browsing | Yes | Yes | Yes |
| Resume match scores | No | 5/month | Unlimited |
| Emission factor search | 5 lookups/mo | Unlimited | Unlimited + API |
| GHG Calculator | Demo only | Full (personal) | Full + export |
| Regulation tracker | View only | Alerts | Full dashboard |

**Pro is highlighted as "Most Popular."**
Annual toggle shows savings.
"For Teams" section below with different messaging (compliance, reporting, admin dashboards). Even before building the corporate portal, signal "we serve teams."

Every feature name links to its page so users can try before buying.

## Mobile Experience

### Principles
- Students in developing countries are mobile-first
- Professionals check jobs and discussions on phones
- Daily engagement (streaks, challenges) happens on mobile

### Bottom Tab Bar
Four tabs: Learn, Tools, Jobs, Profile. Active tab highlighted with primary color.

**On lesson pages: bottom bar is hidden.** Audio player takes priority. Navigation via sidebar drawer and back button.

### Mobile Lesson Experience
- Full-width content, no sidebar (sidebar becomes slide-out drawer)
- Audio player inline (not sticky bottom, to avoid tab bar collision)
- Swipe between lessons (prev/next)

### Mobile Tools
- Calculator: full-width form, results card below
- Emission factor search: search bar at top, results as cards (not table)

## User Flows

### Flow 1: Learner -> Paying User

```
Landing page (/)
  -> "What's your goal?" -> "I want to learn"
  -> Browses courses (/courses)
  -> Reads 1-2 free lessons (/courses/[id]/[lesson])
  -> Hits lesson meter (3 free lessons used)
  -> Soft overlay: "Sign up free to continue"
  -> Signs up (free tier)
  -> Completes a course
  -> Sees certificate: "Your certificate is ready. Upgrade to Pro to download."
     (Certificate preview shown blurred behind CTA)
  -> Pricing page (/pricing) -> Converts to Pro ($5/mo)
```

### Flow 2: Practitioner Discovers Tools

```
Google search: "DEFRA emission factors 2026"
  -> Lands on /tools/emission-factors (SEO-optimized, public)
  -> Does 3-5 free lookups
  -> Hits limit: "Sign up for 5 free lookups/month, or go Pro for unlimited"
  -> Signs up, explores GHG calculator
  -> Calculator becomes essential to workflow
  -> Upgrades to Work ($29/mo) for export + API
```

### Flow 3: Job Seeker

```
Google search: "sustainability jobs ESG analyst"
  -> Lands on /jobs (public, full listings visible)
  -> Browses, sees "Match Score" teaser on each job
  -> Signs up, uploads resume
  -> Sees match scores + skill gaps
  -> "Complete GHG Accounting to improve match for 8 more roles"
  -> Starts course -> Completes -> Match scores improve
  -> Upgrades to Pro for more match scores per month
```

### Flow 4: Corporate Buyer

```
L&D manager googles "ESG training for teams"
  -> Lands on /pricing
  -> Sees "For Teams" section with compliance/reporting messaging
  -> Signs up personally for Pro to evaluate
  -> Impressed by quality -> Contacts for team pricing
  -> Buys seats
```

## Transition Strategy: Incremental, Not Big-Bang

Changing nav, homepage, routes, pricing, tools, jobs, and community all at once is how you break everything simultaneously and can't tell which change caused which problem. Each step below is independently shippable and reversible.

### Phase 1: Foundation (no user-facing changes)
- Stripe integration
- Subscriptions table + entitlements helper
- Pricing page (`/pricing`)
- Subscription management in dashboard settings

### Phase 2: First Paid Value
- Certificate generation (PDF, auto-generated on course completion)
- Certificate download gated behind Pro tier
- LinkedIn badge sharing

### Phase 3: Learning Hub
- `/learn` hub page (links to courses, shows paths and progress)
- Learning paths data model + path overview pages
- **Course URLs stay at `/courses/...`** (no migration)

### Phase 4: First Tool
- `/tools` hub page (static)
- `/tools/emission-factors` (public landing + search with free tier limits)
- Emission factor database (DEFRA, EPA, IPCC, IEA)

### Phase 5: Jobs Matching
- Normalize jobs from Excel into database (durable IDs, structured skills)
- Resume upload + parsing
- Match scoring (weighted keyword overlap, no ML yet)
- `/app/matches` and `/app/career-profile` (authenticated)

### Phase 6: Nav + Homepage Update
- New 4-item navigation (Learn, Tools, Jobs, Pricing)
- New homepage with "What's your goal?" interactive selector
- Mobile bottom tab bar (4 tabs)
- **Only do this after the sections have content to navigate to**

### Phase 7: Community (embedded)
- Lesson discussion threads
- XP system + levels
- Public user profiles

### Phase 8: Expand
- GHG Calculator
- Regulation tracker
- Case studies, challenges, leaderboard
- Evaluate whether community earns top-level nav status

### Course URL Migration (only if/when needed)
If you eventually want `/learn/courses/...`:
1. Ship aliases with canonical still pointing to `/courses/...`
2. Update sitemaps, internal links, structured data
3. Monitor Search Console for 4-6 weeks
4. Only flip canonicals after stable indexing confirmed
5. Never change path, metadata, navigation, and positioning in one release

## Decisions Made (v2)

| Decision | Rationale |
|----------|-----------|
| 4 nav items, not 5 | Community is a retention layer, not a product surface yet |
| Course URLs stay at `/courses/...` | SEO migration risk outweighs URL aesthetics |
| Community embedded in lessons first | Empty community hubs damage credibility |
| Free users can post in discussions | Blocking learning-loop participation hurts the product |
| Dashboard is learning-focused | Job matches and community are notification widgets, not sections |
| Route groups separate static/dynamic | Prevents auth state from forcing dynamic rendering on SSG pages |
| Subscription gating is server-side | Client-side checks are cosmetic, not enforcement |
| Incremental rollout, not big-bang | Each phase independently shippable and reversible |
| Mobile bottom bar hidden on lessons | Audio player takes priority in lesson context |
| Pricing tiers unified as Free/Pro/Work | One model used everywhere (docs, code, Stripe products) |

## Open Questions (Reduced)

1. **Brand name**: Is it still "Sustainability Academy" or "Greentryst"? Multi-product platform may need a name that doesn't sound like just a course website.
2. **Tool data curation**: Emission factors and regulations need a data pipeline. Who curates and updates this? What's the refresh cadence?
3. **Corporate tier**: Build self-serve team signup or wait for inbound interest? (Recommendation: wait, add "For Teams" messaging on pricing page now)
4. **Mobile app**: At what point does a PWA make sense for daily engagement? (Recommendation: not until monthly active users justify the investment)

## Summary

The platform evolves from a course website to a multi-surface commercial platform, but it does so **incrementally**, leading with the strongest wedge (courses + certificates + one tool) and earning the right to expand.

The architecture separates static content (courses, glossary, tool landing pages) from dynamic authenticated features (saved projects, matches, dashboards) to preserve build performance and SEO. Navigation stays lean (4 items). Community lives inside lessons until it earns a hub. Course URLs don't move. Each phase ships independently.

```
"A sustainability learning platform with tools and career support"
```

Not an "operating system." Not a "platform for everything." A clear, focused product that grows into breadth as each surface proves its value.
