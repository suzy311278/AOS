# Greentryst Dashboard Page, Locked Specification

Status: LOCKED on 2026-04-12
Branch: `redesign` (local only, never pushed)
Live at: `/redesign/dashboard`
Target production route: `/dashboard` once the redesign branch is cut over

This document is the single source of truth for the Greentryst Dashboard. The dashboard is the professional operating system hub for sustainability practitioners.

## 1. Core Vision

The Dashboard is the central command center for practitioners. No gamification (no XP, badges, leaderboards). Professional, data-driven, action-oriented. Three tabs organize all user management: Overview (daily work), Profile (digital resume), Settings (account management).

Design principles:
- **PROFESSIONAL**: No gamification, no playful elements
- **ACTION-ORIENTED**: Quick actions, clear next steps
- **PERSONALIZED**: Updates relevant to user's courses and profile
- **DATA-DRIVEN**: Usage stats, progress metrics, activity calendar

## 2. Page Structure

1. RedesignNav (sticky top)
2. Dark header band with user info, stats, activity calendar, tabs
3. Tab content (Overview | Profile | Settings)
4. RedesignFooter

## 3. Dark Header Band

### 3.1 User Info (left side)
- Profile image (64px circle, fallback to initial)
- Full name (24px, bold, white)
- Plan badge (e.g., "Individual Plan" in gt-leaf pill)
- Account settings link

### 3.2 Stats (right side)
Three QuickStatDark components:
- Certificates earned (count)
- Lessons completed (count)
- Queries remaining today (X/Y format)

### 3.3 Activity Calendar (below stats row)
Glass-style GitHub contribution calendar:
- `bg-white/5 backdrop-blur-sm` with `border-white/10`
- 20 weeks of activity (compact view)
- 5 intensity levels (white/10 to gt-leaf solid)
- Day streak and total active days stats
- Legend: Less to More

### 3.4 Tab Navigation (flush with bottom)
Three tabs with `rounded-t-lg`:
- Overview (default)
- Profile
- Settings

Active tab: `bg-[#fafbfa]` matching content background
Inactive: `text-white/60 hover:text-white`

## 4. Overview Tab

### 4.1 Layout
Two-column grid on desktop (2/3 + 1/3), single column on mobile.

### 4.2 Left Column Sections

**Today's Action** (conditional, shows if courses in progress)
- Gradient background (gt-leaf/10 to gt-leaf/5)
- Shows nearest course to completion
- "X lessons away from completing [Course]"
- Continue Learning CTA button

**Quick Actions Bar**
Horizontal row of action buttons:
- Ask SustainIQ (Brain icon)
- GHG Calculator (Calculator icon)
- Browse Jobs (Briefcase icon)
- Explore Courses (GraduationCap icon)

**What's New** (personalized)
Shows user-relevant updates with typed icons:
- `job`: Green icon, job matches
- `course`: Blue icon, course updates for enrolled courses
- `platform`: Violet icon, new features/tools
- `regulation`: Amber icon, regulatory updates

**Continue Learning**
Cards for courses in progress, sorted by last accessed.

**Learning Paths**
Only shows paths where user is enrolled in at least one course.

**Opportunities + Skills** (side-by-side grid)
- Left: New job opportunities summary with "View all jobs" link
- Right: Skills coverage meter with market demand comparison

### 4.3 Right Column (Sidebar)

**Saved Items**
Bookmarked lessons, jobs, queries.

**Recent Queries**
Last SustainIQ questions with quick re-ask.

**Certificates**
Completed course certificates with download/share.

**Upgrade Banner** (for non-premium users)
Dark gradient card with upgrade CTA.

## 5. Profile Tab

Digital resume editor for job matching. All sections have edit/add functionality with modals.

### 5.1 Sections

**Basic Information**
- Profile image (from Clerk, read-only)
- Full name (from Clerk, read-only)
- Email (from Clerk, read-only)
- Headline (editable)
- Location (editable)

**Current Role**
- Job title, company, start date
- Add/edit/delete functionality

**Resume**
- File upload (PDF, DOC, DOCX, max 5MB)
- Replace/remove functionality

**Experience**
- Multiple entries: title, company, location, dates, description
- Add/edit/delete with modal forms

**Certifications**
- Greentryst certificates (auto-populated from completed courses)
- External certifications (user-added)
- View/share for Greentryst certs, edit for external

**Links**
- LinkedIn URL
- Website URL

### 5.2 Modal Pattern
All edit modals:
- Fixed overlay with `bg-black/50`
- White rounded card, max-width constrained
- Form fields with labels
- Cancel/Save buttons (Delete for existing items)
- Required field validation

## 6. Settings Tab

Account and subscription management.

### 6.1 Subscription & Plan
- Current plan display with active badge
- Price and renewal date
- Upgrade/Cancel buttons
- Usage meters (2-column grid):
  - SustainIQ Queries (X/Y, resets daily)
  - Reports Generated (X/Y monthly)

### 6.2 Billing
- Payment method on file (masked card number)
- Update payment method button
- Recent invoices list with download buttons

### 6.3 Tools
Toggle switches for available tools:
- GHG Calculator
- Report Drafter
- Data Extractor

Locked tools show tier requirement and Upgrade button.
SustainIQ is NOT a tool (it's a service, shown in usage).

### 6.4 Notifications
Toggle switches:
- Job Alerts
- Course Updates
- Weekly Digest
- Product News

Shows email address receiving notifications.

### 6.5 Data & Privacy
- Export All Data (JSON download)
- Delete Account (danger zone styling)

### 6.6 Help & Support
2x2 grid of support options:
- Documentation (external link)
- Contact Support (email)
- Feature Requests (Canny)
- System Status (with live indicator)

Plus SustainIQ prompt card for quick answers.

### 6.7 Cancel Subscription Modal
- Lists features user will lose
- Shows subscription end date
- Keep/Cancel buttons

## 7. Data Flow

### 7.1 Server Component (page.tsx)
Loads from Turso:
- Enrolled courses with progress
- Daily activity for calendar (last 365 days)
- Aggregate stats

### 7.2 Client Component Props
```typescript
interface Props {
  enrolledCourses: EnrolledCourse[];
  activityMap: Record<string, { lessonsDone: number; quizzesDone: number }>;
  totalLessonsDone: number;
  totalQuizzesDone: number;
  xp: number; // Not displayed (no gamification), but passed
}
```

### 7.3 Preview Mode
When not authenticated, shows mock data for design preview.

## 8. Key Components

- `DashboardClientRedesign` - Main client component with all three tabs
- `ActivityCalendarCompact` - Glass-style GitHub calendar
- `OverviewTab` - Main dashboard content
- `ProfileTab` - Digital resume editor with modals
- `SettingsTab` - Account management
- `QuickStatDark` - Header stat display

## 9. Files

- Server page: `src/app/redesign/dashboard/page.tsx`
- Client component: `src/app/redesign/dashboard/_components/DashboardClientRedesign.tsx`

## 10. Design Tokens

Colors:
- Dark header: `bg-gt-text-dark`
- Content background: `bg-[#fafbfa]`
- Cards: `bg-white` with `border-[#e5e7e5]`
- Glass effect: `bg-white/5 backdrop-blur-sm border-white/10`
- Activity levels: `bg-white/10`, `bg-gt-leaf/30`, `bg-gt-leaf/50`, `bg-gt-leaf/70`, `bg-gt-leaf`

Typography:
- Section headings: 18px bold
- Card titles: 13-14px semibold
- Labels: 11-12px, uppercase with letter-spacing
- Monospace for data: JetBrains Mono

## 11. No Gamification Rule

The following are explicitly NOT included:
- XP points display
- Streak flames or celebratory icons
- Badges or achievements
- Leaderboards
- Level indicators
- Progress "games"

The activity calendar shows engagement data professionally, without gamification framing.
