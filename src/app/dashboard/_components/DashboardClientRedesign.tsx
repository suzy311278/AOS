/**
 * DashboardClientRedesign - Professional Dashboard Hub
 *
 * Three tabs:
 * - Overview: Main dashboard with learning, opportunities, queries
 * - Profile: Digital resume editor (role, skills, certifications, resume upload)
 * - Settings: Subscription, billing, usage, tools, notifications
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import {
  Settings,
  BookOpen,
  Award,
  Search,
  ArrowRight,
  CheckCircle2,
  FileText,
  Upload,
  Building2,
  TrendingUp,
  FileCheck,
  Layers,
  GraduationCap,
  Brain,
  Route,
  Check,
  Circle,
  Bookmark,
  Clock,
  Bell,
  Briefcase,
  AlertCircle,
  Sparkles,
  ChevronRight,
  MapPin,
  Zap,
  User,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Calendar,
  Mail,
  Link2,
  Globe,
  CreditCard,
  Receipt,
  Download,
  Shield,
  Key,
  ToggleLeft,
  ToggleRight,
  Calculator,
  Library,
  FileSpreadsheet,
  MessageSquare,
  Crown,
  X,
} from 'lucide-react';
import { lessonIdToUrl } from '@/lib/url-helpers';
import { cn } from '@/components/redesign/lib/cn';
import { DarkUICard } from '@/components/redesign';
import { useResumeState } from '@/app/jobs/_components/useResumeState';

/* ============================================================
   Types
   ============================================================ */

interface EnrolledCourse {
  courseId: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  category: string;
  lastLesson: string | null;
  lastAccessedAt: number | null;
  completedCount: number;
  totalLessons: number;
}

interface Props {
  enrolledCourses: EnrolledCourse[];
  activityMap: Record<string, { lessonsDone: number; quizzesDone: number }>;
  totalLessonsDone: number;
  totalQuizzesDone: number;
  xp: number;
}

/* ============================================================
   Constants
   ============================================================ */

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  fundamentals: <BookOpen className="w-5 h-5" strokeWidth={1.5} />,
  esg: <FileCheck className="w-5 h-5" strokeWidth={1.5} />,
  markets: <TrendingUp className="w-5 h-5" strokeWidth={1.5} />,
  'green-finance': <Building2 className="w-5 h-5" strokeWidth={1.5} />,
  'sustainability-standards': <Layers className="w-5 h-5" strokeWidth={1.5} />,
};

const LEARNING_PATHS = [
  {
    id: 'carbon-accounting',
    title: 'Carbon Accounting Professional',
    description: 'Master GHG Protocol across all scopes',
    courses: ['ghg-scope-1-2', 'ghg-scope-3', 'sbti'],
    totalLessons: 58,
    estimatedHours: 12,
  },
  {
    id: 'eu-sustainability',
    title: 'EU Sustainability Regulations',
    description: 'CSRD, Taxonomy, SFDR, and CBAM',
    courses: ['eu-taxonomy', 'eu-sfdr', 'eu-cbam', 'csrd'],
    totalLessons: 86,
    estimatedHours: 18,
  },
];

const MARKET_SKILLS = [
  { skill: 'GHG Accounting', demandScore: 95, courses: ['ghg-scope-1-2', 'ghg-scope-3'] },
  { skill: 'ESG Reporting', demandScore: 92, courses: ['esg-reporting'] },
  { skill: 'Climate Risk', demandScore: 88, courses: ['climate-science-101', 'tcfd'] },
  { skill: 'EU Taxonomy', demandScore: 85, courses: ['eu-taxonomy'] },
  { skill: 'Carbon Markets', demandScore: 82, courses: ['vcm-101', 'article-6'] },
];

// Personalized updates - in production, this would be dynamically generated
const MOCK_WHATS_NEW = [
  {
    id: '1',
    type: 'job',
    title: '3 new jobs match your profile',
    description: 'Climate Risk Analyst at BlackRock, ESG Manager at Unilever, and more',
    date: 'Today',
    href: '/jobs',
  },
  {
    id: '2',
    type: 'course',
    title: 'New lesson added to EU Taxonomy',
    description: 'Article 8 Reporting Templates - a course you\'re enrolled in',
    date: '1 day ago',
    href: '/courses/eu-taxonomy',
  },
  {
    id: '3',
    type: 'platform',
    title: 'GHG Calculator tool is now available',
    description: 'Calculate your organization\'s carbon footprint with our new tool',
    date: '3 days ago',
    href: '/tools',
  },
];

const MOCK_SAVED_ITEMS = [
  { id: '1', type: 'lesson', title: 'Double Materiality Assessment Process', course: 'EU CSRD', href: '/courses/csrd/3_2' },
  { id: '2', type: 'job', title: 'Senior ESG Analyst', company: 'Sustainalytics', href: '/jobs' },
  { id: '3', type: 'query', title: 'What are Scope 3 Category 6 emission factors?', href: '/ask' },
];

const MOCK_RECENT_QUERIES = [
  { query: 'Scope 3 Category 6 emission factors for business travel', timestamp: '2h ago' },
  { query: 'EU Taxonomy alignment criteria for renewable energy', timestamp: 'Yesterday' },
];

const MOCK_JOB_ALERTS = {
  newThisWeek: 7,
  topMatch: { title: 'Climate Risk Manager', company: 'HSBC', location: 'London', matchScore: 92 },
};

/* ============================================================
   Matching preferences

   These fields feed the Greentryst job matching scorer. They share
   storage with /redesign/jobs so editing here updates the Matched
   for you tab and vice versa.
   ============================================================ */

const MATCH_RESUME_FLAG_KEY = 'gt-resume-uploaded-v1';
const MATCH_PROFILE_STORAGE_KEY = 'gt-match-profile-v1';

type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead' | 'director';

const LEVEL_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: 'entry', label: 'Entry' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
  { value: 'director', label: 'Director / VP' },
];

const REGION_OPTIONS = [
  'United Kingdom',
  'Germany',
  'France',
  'Netherlands',
  'Spain',
  'Switzerland',
  'Sweden',
  'Denmark',
  'United States',
  'Canada',
  'India',
  'Singapore',
  'Australia',
  'United Arab Emirates',
  'Remote only',
];

const SUGGESTED_SKILLS = [
  'Scope 3',
  'TCFD',
  'CSRD',
  'GHG Protocol',
  'CBAM',
  'SBTi',
  'PCAF',
  'SFDR',
  'ESG Ratings',
  'Climate Risk',
  'LCA',
  'BRSR',
];

interface MatchProfile {
  experienceLevel: ExperienceLevel | null;
  preferredRegion: string | null;
  skills: string[];
}

// Mock profile data
const MOCK_PROFILE = {
  headline: '',
  currentRole: '',
  company: '',
  location: '',
  linkedinUrl: '',
  websiteUrl: '',
  resumeUploaded: false,
  resumeFileName: '',
  certifications: [] as { name: string; issuer: string; date: string }[],
  experience: [] as { role: string; company: string; duration: string; description: string }[],
};

/* ============================================================
   Helpers
   ============================================================ */

function getCategoryIcon(category: string): React.ReactNode {
  return CATEGORY_ICONS[category] || <BookOpen className="w-5 h-5" strokeWidth={1.5} />;
}

/* ============================================================
   Main Component
   ============================================================ */

export function DashboardClientRedesign({
  enrolledCourses,
  activityMap,
  totalLessonsDone,
}: Props) {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'settings'>('overview');

  const inProgress = useMemo(
    () =>
      enrolledCourses
        .filter((c) => c.completedCount > 0 && c.completedCount < c.totalLessons)
        .sort((a, b) => (b.lastAccessedAt ?? 0) - (a.lastAccessedAt ?? 0)),
    [enrolledCourses]
  );

  const completed = useMemo(
    () =>
      enrolledCourses.filter(
        (c) => c.totalLessons > 0 && c.completedCount >= c.totalLessons
      ),
    [enrolledCourses]
  );

  const completedCourseIds = useMemo(
    () => new Set(completed.map((c) => c.courseId)),
    [completed]
  );

  const enrolledCourseIds = useMemo(
    () => new Set(enrolledCourses.map((c) => c.courseId)),
    [enrolledCourses]
  );

  const enrolledPaths = useMemo(
    () =>
      LEARNING_PATHS.filter((path) =>
        path.courses.some((courseId) => enrolledCourseIds.has(courseId))
      ),
    [enrolledCourseIds]
  );

  const nearestCompletion = useMemo(() => {
    if (inProgress.length === 0) return null;
    return inProgress.reduce((best, course) => {
      const remaining = course.totalLessons - course.completedCount;
      const bestRemaining = best.totalLessons - best.completedCount;
      return remaining < bestRemaining ? course : best;
    });
  }, [inProgress]);

  const fullName = user?.fullName ?? 'Sustainability Professional';
  const profileImageUrl = user?.imageUrl;
  const email = user?.primaryEmailAddress?.emailAddress ?? '';

  // Phase 1: planTier becomes dynamic once Dodo subscription state is
  // wired. For now every account is the preview free tier.
  const planTier = 'Free';

  // Phase 2: live usage counters from /api/usage. `usage` is null
  // while the initial fetch is in flight and also for anonymous users
  // (the API returns 401; we handle that silently).
  const [usage, setUsage] = useState<{
    today: Record<string, number>;
    month: Record<string, number>;
    limits: Record<string, number>;
  } | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/usage')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!cancelled && d) setUsage(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  const sustainiqQueriesToday = usage?.today?.sustainiq_query ?? 0;
  const sustainiqDailyLimit = usage?.limits?.sustainiq_query_daily ?? 5;
  const reportsThisMonth = usage?.month?.report_generated ?? 0;
  const reportsMonthlyLimit = usage?.limits?.report_generated_monthly ?? 10;

  const userSkillScores = useMemo(() => {
    return MARKET_SKILLS.map((ms) => {
      const completedRelevant = ms.courses.filter((c) => completedCourseIds.has(c)).length;
      const score = Math.round((completedRelevant / ms.courses.length) * 100);
      return { ...ms, userScore: score };
    });
  }, [completedCourseIds]);

  const overallSkillCoverage = useMemo(() => {
    const total = userSkillScores.reduce((sum, s) => sum + s.userScore, 0);
    return Math.round(total / userSkillScores.length);
  }, [userSkillScores]);

  return (
    <div className="min-h-screen bg-[#fafbfa]">
      {/* ============================================================
          Dark Header
          ============================================================ */}
      <section className="relative overflow-hidden bg-gt-text-dark pt-16">
        <div
          className="gt-ambient-glow-dark absolute -top-20 left-1/4 w-[600px] h-[600px] rounded-full"
          aria-hidden
        />
        <div
          className="gt-ambient-glow-dark absolute -bottom-40 right-0 w-[500px] h-[500px] rounded-full opacity-70"
          aria-hidden
        />
        <div
          className="gt-dot-grid absolute inset-0 opacity-40 pointer-events-none"
          aria-hidden
        />

        <div className="relative z-10 max-w-[1280px] mx-auto px-8 pt-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            {/* User info */}
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border-2 border-white/20">
                {profileImageUrl ? (
                  <Image
                    src={profileImageUrl}
                    alt={fullName}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[24px] font-bold text-white">
                    {fullName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-[24px] font-bold text-white">{fullName}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gt-leaf/20 border border-gt-leaf/30 text-[11px] font-bold text-gt-leaf uppercase"
                    style={{ letterSpacing: '0.05em' }}
                  >
                    {planTier} Plan
                  </span>
                  <Link
                    href="/user-profile"
                    className="text-[13px] text-white/50 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" strokeWidth={2} />
                    Account
                  </Link>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 md:gap-12">
              <QuickStatDark
                icon={<GraduationCap className="w-4 h-4" />}
                value={completed.length}
                label="Certificates"
              />
              <QuickStatDark
                icon={<BookOpen className="w-4 h-4" />}
                value={totalLessonsDone}
                label="Lessons"
              />
              <QuickStatDark
                icon={<Brain className="w-4 h-4" />}
                value={`${sustainiqQueriesToday}/${sustainiqDailyLimit}`}
                label="Queries Today"
              />
            </div>
          </div>

          {/* Activity Calendar - Glass style */}
          <div className="mt-6">
            <ActivityCalendarCompact activityMap={activityMap} />
          </div>

          {/* Tab Navigation - flush with bottom of header */}
          <div className="mt-6 flex items-end gap-1 -mb-px">
            <button
              onClick={() => setActiveTab('overview')}
              className={cn(
                'px-5 py-2.5 text-[13px] font-semibold rounded-t-lg transition-colors border-b-2',
                activeTab === 'overview'
                  ? 'bg-[#fafbfa] text-gt-text border-[#fafbfa]'
                  : 'text-white/60 hover:text-white border-transparent'
              )}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={cn(
                'px-5 py-2.5 text-[13px] font-semibold rounded-t-lg transition-colors border-b-2',
                activeTab === 'profile'
                  ? 'bg-[#fafbfa] text-gt-text border-[#fafbfa]'
                  : 'text-white/60 hover:text-white border-transparent'
              )}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={cn(
                'px-5 py-2.5 text-[13px] font-semibold rounded-t-lg transition-colors border-b-2',
                activeTab === 'settings'
                  ? 'bg-[#fafbfa] text-gt-text border-[#fafbfa]'
                  : 'text-white/60 hover:text-white border-transparent'
              )}
            >
              Settings
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================
          Tab Content
          ============================================================ */}
      {activeTab === 'overview' && (
        <OverviewTab
          inProgress={inProgress}
          completed={completed}
          completedCourseIds={completedCourseIds}
          enrolledCourseIds={enrolledCourseIds}
          enrolledPaths={enrolledPaths}
          nearestCompletion={nearestCompletion}
          userSkillScores={userSkillScores}
          overallSkillCoverage={overallSkillCoverage}
          planTier={planTier}
        />
      )}
      {activeTab === 'profile' && (
        <ProfileTab
          fullName={fullName}
          email={email}
          profileImageUrl={profileImageUrl}
          completed={completed}
        />
      )}
      {activeTab === 'settings' && (
        <SettingsTab
          planTier={planTier}
          sustainiqQueriesToday={sustainiqQueriesToday}
          sustainiqDailyLimit={sustainiqDailyLimit}
          reportsThisMonth={reportsThisMonth}
          reportsMonthlyLimit={reportsMonthlyLimit}
          email={email}
        />
      )}
    </div>
  );
}

/* ============================================================
   Overview Tab
   ============================================================ */

function OverviewTab({
  inProgress,
  completed,
  completedCourseIds,
  enrolledCourseIds,
  enrolledPaths,
  nearestCompletion,
  userSkillScores,
  overallSkillCoverage,
  planTier,
}: {
  inProgress: EnrolledCourse[];
  completed: EnrolledCourse[];
  completedCourseIds: Set<string>;
  enrolledCourseIds: Set<string>;
  enrolledPaths: typeof LEARNING_PATHS;
  nearestCompletion: EnrolledCourse | null;
  userSkillScores: { skill: string; demandScore: number; userScore: number }[];
  overallSkillCoverage: number;
  planTier: string;
}) {
  return (
    <div className="max-w-[1280px] mx-auto px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Today's Action */}
          {nearestCompletion && (
            <section className="p-6 bg-gradient-to-r from-gt-leaf/10 to-gt-leaf/5 border border-gt-leaf/20 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gt-leaf/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-gt-medium" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <p
                    className="text-[11px] font-bold uppercase text-gt-medium mb-1"
                    style={{ letterSpacing: '0.1em' }}
                  >
                    Pick up where you left off
                  </p>
                  <p className="text-[16px] font-semibold text-gt-text mb-1">
                    You're {nearestCompletion.totalLessons - nearestCompletion.completedCount} lessons away from completing{' '}
                    <span className="text-gt-medium">{nearestCompletion.title}</span>
                  </p>
                  <p className="text-[13px] text-gt-text-muted mb-4">
                    Finish today and earn your certificate
                  </p>
                  <Link
                    href={
                      nearestCompletion.lastLesson
                        ? `/courses/${nearestCompletion.courseId}/${lessonIdToUrl(nearestCompletion.lastLesson)}`
                        : `/courses/${nearestCompletion.courseId}`
                    }
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gt-medium text-white text-[13px] font-bold rounded-lg hover:bg-gt-dark transition-colors"
                  >
                    Continue Learning
                    <ArrowRight className="w-4 h-4" strokeWidth={2} />
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* Quick Actions */}
          <section className="flex flex-wrap gap-3">
            <Link
              href="/ask"
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#e5e7e5] rounded-lg hover:border-gt-medium/50 hover:bg-gt-leaf/5 transition-colors group"
            >
              <Brain className="w-4 h-4 text-gt-medium" strokeWidth={2} />
              <span className="text-[13px] font-semibold text-gt-text group-hover:text-gt-medium">
                Ask SustainIQ
              </span>
            </Link>
            <Link
              href="/tools/ghg-calculator"
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#e5e7e5] rounded-lg hover:border-gt-medium/50 hover:bg-gt-leaf/5 transition-colors group"
            >
              <Calculator className="w-4 h-4 text-gt-medium" strokeWidth={2} />
              <span className="text-[13px] font-semibold text-gt-text group-hover:text-gt-medium">
                GHG Calculator
              </span>
            </Link>
            <Link
              href="/redesign/dashboard/emission-factors"
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#e5e7e5] rounded-lg hover:border-gt-medium/50 hover:bg-gt-leaf/5 transition-colors group"
            >
              <Library className="w-4 h-4 text-gt-medium" strokeWidth={2} />
              <span className="text-[13px] font-semibold text-gt-text group-hover:text-gt-medium">
                Emission Factors
              </span>
            </Link>
            <Link
              href="/jobs"
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#e5e7e5] rounded-lg hover:border-gt-medium/50 hover:bg-gt-leaf/5 transition-colors group"
            >
              <Briefcase className="w-4 h-4 text-gt-medium" strokeWidth={2} />
              <span className="text-[13px] font-semibold text-gt-text group-hover:text-gt-medium">
                Browse Jobs
              </span>
            </Link>
            <Link
              href="/courses"
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#e5e7e5] rounded-lg hover:border-gt-medium/50 hover:bg-gt-leaf/5 transition-colors group"
            >
              <GraduationCap className="w-4 h-4 text-gt-medium" strokeWidth={2} />
              <span className="text-[13px] font-semibold text-gt-text group-hover:text-gt-medium">
                Explore Courses
              </span>
            </Link>
          </section>

          {/* What's New — real feed generator not yet wired (Phase 4).
              Until course-diff and job-match backends run, show a
              truthful placeholder rather than fabricated personalized
              updates. */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-gt-medium" strokeWidth={2} />
                <h2 className="text-[16px] font-bold text-gt-text">What's New</h2>
              </div>
            </div>
            <div className="p-5 bg-white rounded-xl border border-[#e5e7e5] flex items-start gap-4">
              <div className="w-9 h-9 rounded-lg bg-gt-medium/10 flex items-center justify-center flex-shrink-0">
                <Bell className="w-4 h-4 text-gt-medium" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-gt-text">
                  Personalized updates coming soon.
                </p>
                <p className="text-[12px] text-gt-text-muted mt-0.5">
                  We&apos;ll show new lessons in courses you&apos;re enrolled in, new jobs matching
                  your profile, and platform updates here once you&apos;ve set up your learning
                  path and upload a resume.
                </p>
                <div className="mt-3 flex gap-4">
                  <Link
                    href="/courses"
                    className="text-[12px] font-semibold text-gt-medium hover:text-gt-dark"
                  >
                    Browse courses →
                  </Link>
                  <Link
                    href="/jobs"
                    className="text-[12px] font-semibold text-gt-medium hover:text-gt-dark"
                  >
                    See open jobs →
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Continue Learning */}
          {inProgress.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[16px] font-bold text-gt-text">Continue Learning</h2>
                <Link
                  href="/courses"
                  className="text-[12px] font-semibold text-gt-medium hover:text-gt-dark flex items-center gap-1"
                >
                  All courses
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
                </Link>
              </div>

              <div className="space-y-3">
                {inProgress.slice(0, 3).map((course) => (
                  <CourseProgressRow key={course.courseId} course={course} />
                ))}
              </div>
            </section>
          )}

          {/* Learning Paths */}
          {enrolledPaths.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[16px] font-bold text-gt-text">Your Learning Paths</h2>
                <Link
                  href="/courses"
                  className="text-[12px] font-semibold text-gt-medium hover:text-gt-dark flex items-center gap-1"
                >
                  All paths
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
                </Link>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {enrolledPaths.slice(0, 2).map((path) => (
                  <LearningPathCard
                    key={path.id}
                    path={path}
                    completedCourseIds={completedCourseIds}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Opportunities + Skills Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* New Opportunities — resume-based match scoring not yet
                wired (Phase 5). Replaces the fabricated "Climate Risk
                Manager at HSBC 92% match" block with a truthful
                upload-to-match prompt + a direct link to the board. */}
            <section className="bg-white rounded-xl border border-[#e5e7e5] p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-gt-medium" strokeWidth={2} />
                  <h3 className="text-[14px] font-bold text-gt-text">Career board</h3>
                </div>
                <Link
                  href="/jobs"
                  className="text-[11px] font-semibold text-gt-medium hover:text-gt-dark"
                >
                  Browse all
                </Link>
              </div>

              <p className="text-[12px] text-gt-text-muted leading-relaxed mb-4">
                Upload your resume in the Profile tab to start getting personalized match
                scores on climate and sustainability jobs. Until then, browse the board.
              </p>

              <Link
                href="/jobs"
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-gt-medium hover:text-gt-dark"
              >
                Open career board
                <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
              </Link>
            </section>

            {/* Skills Coverage */}
            <section className="bg-white rounded-xl border border-[#e5e7e5] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[14px] font-bold text-gt-text">Skills Coverage</h3>
                <span
                  className="text-[14px] font-bold text-gt-medium"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                >
                  {overallSkillCoverage}%
                </span>
              </div>

              <div className="space-y-2.5">
                {userSkillScores.slice(0, 4).map((skill, i) => (
                  <SkillBarCompact key={i} skill={skill} />
                ))}
              </div>

              <Link
                href="/courses"
                className="mt-4 w-full inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-gt-medium hover:text-gt-dark"
              >
                Improve skills
                <ArrowRight className="w-3 h-3" strokeWidth={2} />
              </Link>
            </section>
          </div>
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-6">
          {/* Saved Items — bookmark feature lands in Phase 6. For
              now, show the empty state so users aren't misled into
              thinking the mock Double Materiality lesson / mock
              Sustainalytics job are theirs. */}
          <div className="bg-white rounded-xl border border-[#e5e7e5] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bookmark className="w-4 h-4 text-gt-medium" strokeWidth={2} />
              <h3 className="text-[14px] font-bold text-gt-text">Saved items</h3>
            </div>
            <p className="text-[12px] text-gt-text-muted leading-relaxed">
              Bookmark lessons, jobs, or SustainIQ answers from anywhere on the platform
              to see them here.
            </p>
          </div>

          {/* Recent Queries — real query logging lands in Phase 2.
              Until usage_events is wired, show the launch CTA
              rather than fabricated prior queries. */}
          <DarkUICard label="Recent">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-gt-leaf" strokeWidth={2} />
              <h3 className="text-[14px] font-bold text-white">SustainIQ</h3>
            </div>

            <p className="text-[12px] text-white/65 leading-relaxed">
              Verified-source answers across GHG Protocol, GRI, CSRD, TCFD, and 80+ indexed
              methodology documents. Your recent queries will appear here.
            </p>

            <Link
              href="/ask"
              className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gt-leaf text-gt-text-dark text-[12px] font-bold rounded-lg hover:bg-gt-mint transition-colors"
            >
              <Search className="w-4 h-4" strokeWidth={2} />
              Ask SustainIQ
            </Link>
          </DarkUICard>

          {/* Certificates */}
          {completed.length > 0 && (
            <div className="bg-white rounded-xl border border-[#e5e7e5] p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-gt-medium" strokeWidth={2} />
                  <h3 className="text-[14px] font-bold text-gt-text">Certificates</h3>
                </div>
                <span
                  className="text-[12px] font-bold text-gt-medium"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                >
                  {completed.length}
                </span>
              </div>

              <div className="space-y-2">
                {completed.slice(0, 3).map((course) => (
                  <div
                    key={course.courseId}
                    className="flex items-center justify-between p-2.5 -mx-2.5 rounded-lg hover:bg-[#f5f7f5] transition-colors"
                  >
                    <p className="text-[12px] font-medium text-gt-text truncate flex-1">
                      {course.title}
                    </p>
                    <button className="text-[10px] font-semibold text-gt-medium hover:text-gt-dark flex-shrink-0 ml-2">
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upgrade Banner */}
          {planTier !== 'Pro' && (
            <div className="bg-gradient-to-br from-gt-text-dark to-[#0a1a1a] rounded-xl p-5 relative overflow-hidden">
              <div
                className="absolute -right-10 -bottom-10 w-32 h-32 bg-gt-leaf/10 rounded-full blur-2xl"
                aria-hidden
              />
              <div className="relative z-10">
                <Zap className="w-5 h-5 text-gt-leaf mb-3" strokeWidth={1.5} />
                <h3 className="text-[15px] font-bold text-white mb-2">Upgrade to Pro</h3>
                <p className="text-[12px] text-white/60 mb-4">
                  Unlimited SustainIQ queries, all professional tools, and full job matching.
                </p>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-1 text-[12px] font-bold text-gt-leaf hover:text-gt-mint"
                >
                  View pricing
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Profile Tab - Digital Resume Editor
   ============================================================ */

interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

interface ExternalCert {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url?: string;
}

function ProfileTab({
  fullName,
  email,
  profileImageUrl,
  completed,
}: {
  fullName: string;
  email: string;
  profileImageUrl: string | undefined;
  completed: EnrolledCourse[];
}) {
  // Profile state (in production, this would be persisted to the database)
  const [headline, setHeadline] = useState('');
  const [location, setLocation] = useState('');
  const [currentRole, setCurrentRole] = useState<{ title: string; company: string; startDate: string } | null>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [externalCerts, setExternalCerts] = useState<ExternalCert[]>([]);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  // Real resume state from /api/resume/* (same hook the jobs page uses).
  // Replaces the old localStorage-only mock — status, filename, upload
  // date, profile, upload/replace/remove actions all come from the
  // server here.
  const resume = useResumeState();
  const resumeFile = resume.status !== 'none' && resume.fileName
    ? { name: resume.fileName, uploadedAt: resume.uploadedAt ?? new Date().toISOString() }
    : null;

  // Matching preferences — shared with /jobs via localStorage.
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | ''>('');
  const [preferredRegion, setPreferredRegion] = useState<string>('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  // Load persisted match profile once on mount.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(MATCH_PROFILE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<MatchProfile>;
        if (parsed.experienceLevel) setExperienceLevel(parsed.experienceLevel);
        if (parsed.preferredRegion) setPreferredRegion(parsed.preferredRegion);
        if (Array.isArray(parsed.skills)) setSkills(parsed.skills);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-fill skills, seniority, and region from the Groq-extracted
  // resume profile — only when the corresponding local field is empty,
  // so we never overwrite explicit user edits.
  useEffect(() => {
    if (resume.status !== 'ready' || !resume.profile) return;
    const p = resume.profile;
    setSkills((prev) => (prev.length === 0 && p.skills.length ? p.skills.slice(0, 20) : prev));
    if (p.seniority) {
      const map: Record<string, ExperienceLevel> = {
        junior: 'entry',
        mid: 'mid',
        senior: 'senior',
        lead: 'senior',
        director: 'director',
      };
      const mapped = map[p.seniority];
      if (mapped) setExperienceLevel((prev) => (prev ? prev : mapped));
    }
  }, [resume.status, resume.profile]);

  // Persist match profile whenever any of the three fields change.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const payload: MatchProfile = {
        experienceLevel: experienceLevel || null,
        preferredRegion: preferredRegion || null,
        skills,
      };
      localStorage.setItem(MATCH_PROFILE_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
  }, [experienceLevel, preferredRegion, skills]);

  // Skill chip handlers
  const addSkill = (raw: string) => {
    const s = raw.trim();
    if (!s) return;
    if (skills.includes(s)) return;
    if (skills.length >= 20) return;
    setSkills((prev) => [...prev, s]);
    setSkillInput('');
  };
  const removeSkill = (s: string) => {
    setSkills((prev) => prev.filter((x) => x !== s));
  };

  // Upload / replace / remove all go through the real pipeline via the
  // useResumeState hook. openUploader pops a file picker; removeResume
  // calls DELETE /api/resume and clears server state.
  const handleMockResumeUpload = resume.openUploader;
  const handleResumeClear = () => {
    void resume.removeResume();
  };

  // Modal states
  const [editingBasicInfo, setEditingBasicInfo] = useState(false);
  const [editingRole, setEditingRole] = useState(false);
  const [editingExperience, setEditingExperience] = useState<Experience | 'new' | null>(null);
  const [editingCert, setEditingCert] = useState<ExternalCert | 'new' | null>(null);
  const [editingLinks, setEditingLinks] = useState(false);

  // Form states for modals
  const [formHeadline, setFormHeadline] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formRoleTitle, setFormRoleTitle] = useState('');
  const [formRoleCompany, setFormRoleCompany] = useState('');
  const [formRoleStart, setFormRoleStart] = useState('');
  const [formExpTitle, setFormExpTitle] = useState('');
  const [formExpCompany, setFormExpCompany] = useState('');
  const [formExpLocation, setFormExpLocation] = useState('');
  const [formExpStart, setFormExpStart] = useState('');
  const [formExpEnd, setFormExpEnd] = useState('');
  const [formExpCurrent, setFormExpCurrent] = useState(false);
  const [formExpDesc, setFormExpDesc] = useState('');
  const [formCertName, setFormCertName] = useState('');
  const [formCertIssuer, setFormCertIssuer] = useState('');
  const [formCertDate, setFormCertDate] = useState('');
  const [formCertUrl, setFormCertUrl] = useState('');
  const [formLinkedin, setFormLinkedin] = useState('');
  const [formWebsite, setFormWebsite] = useState('');

  // Handlers
  const openBasicInfoEdit = () => {
    setFormHeadline(headline);
    setFormLocation(location);
    setEditingBasicInfo(true);
  };

  const saveBasicInfo = () => {
    setHeadline(formHeadline);
    setLocation(formLocation);
    setEditingBasicInfo(false);
  };

  const openRoleEdit = () => {
    setFormRoleTitle(currentRole?.title || '');
    setFormRoleCompany(currentRole?.company || '');
    setFormRoleStart(currentRole?.startDate || '');
    setEditingRole(true);
  };

  const saveRole = () => {
    if (formRoleTitle && formRoleCompany) {
      setCurrentRole({ title: formRoleTitle, company: formRoleCompany, startDate: formRoleStart });
    }
    setEditingRole(false);
  };

  const deleteRole = () => {
    setCurrentRole(null);
    setEditingRole(false);
  };

  const openExperienceEdit = (exp: Experience | 'new') => {
    if (exp === 'new') {
      setFormExpTitle('');
      setFormExpCompany('');
      setFormExpLocation('');
      setFormExpStart('');
      setFormExpEnd('');
      setFormExpCurrent(false);
      setFormExpDesc('');
    } else {
      setFormExpTitle(exp.title);
      setFormExpCompany(exp.company);
      setFormExpLocation(exp.location);
      setFormExpStart(exp.startDate);
      setFormExpEnd(exp.endDate);
      setFormExpCurrent(exp.current);
      setFormExpDesc(exp.description);
    }
    setEditingExperience(exp);
  };

  const saveExperience = () => {
    if (formExpTitle && formExpCompany) {
      const newExp: Experience = {
        id: editingExperience === 'new' ? Date.now().toString() : (editingExperience as Experience).id,
        title: formExpTitle,
        company: formExpCompany,
        location: formExpLocation,
        startDate: formExpStart,
        endDate: formExpEnd,
        current: formExpCurrent,
        description: formExpDesc,
      };
      if (editingExperience === 'new') {
        setExperiences([newExp, ...experiences]);
      } else {
        setExperiences(experiences.map(e => e.id === newExp.id ? newExp : e));
      }
    }
    setEditingExperience(null);
  };

  const deleteExperience = (id: string) => {
    setExperiences(experiences.filter(e => e.id !== id));
    setEditingExperience(null);
  };

  const openCertEdit = (cert: ExternalCert | 'new') => {
    if (cert === 'new') {
      setFormCertName('');
      setFormCertIssuer('');
      setFormCertDate('');
      setFormCertUrl('');
    } else {
      setFormCertName(cert.name);
      setFormCertIssuer(cert.issuer);
      setFormCertDate(cert.date);
      setFormCertUrl(cert.url || '');
    }
    setEditingCert(cert);
  };

  const saveCert = () => {
    if (formCertName && formCertIssuer) {
      const newCert: ExternalCert = {
        id: editingCert === 'new' ? Date.now().toString() : (editingCert as ExternalCert).id,
        name: formCertName,
        issuer: formCertIssuer,
        date: formCertDate,
        url: formCertUrl || undefined,
      };
      if (editingCert === 'new') {
        setExternalCerts([newCert, ...externalCerts]);
      } else {
        setExternalCerts(externalCerts.map(c => c.id === newCert.id ? newCert : c));
      }
    }
    setEditingCert(null);
  };

  const deleteCert = (id: string) => {
    setExternalCerts(externalCerts.filter(c => c.id !== id));
    setEditingCert(null);
  };

  const openLinksEdit = () => {
    setFormLinkedin(linkedinUrl);
    setFormWebsite(websiteUrl);
    setEditingLinks(true);
  };

  const saveLinks = () => {
    setLinkedinUrl(formLinkedin);
    setWebsiteUrl(formWebsite);
    setEditingLinks(false);
  };

  // Legacy names kept for the Resume section below; both route through
  // the real pipeline now.
  const handleResumeUpload = resume.openUploader;
  const removeResume = () => {
    void resume.removeResume();
  };

  return (
    <div className="max-w-[900px] mx-auto px-8 py-10">
      <div className="space-y-8">
        {/* ============================================================
            Matching Preferences — fields consumed by the jobs scorer.
            Edits here sync to /redesign/jobs via shared localStorage.
            ============================================================ */}
        <section
          className="relative overflow-hidden rounded-xl bg-gt-text-dark p-6"
          style={{
            boxShadow:
              '0 24px 48px -20px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
          }}
        >
          {/* Leaf-green top accent */}
          <span
            className="absolute top-0 left-0 right-0 h-[2px] bg-gt-leaf"
            aria-hidden
          />

          <div className="flex items-start gap-3 mb-5">
            <div className="w-9 h-9 rounded-full bg-gt-leaf/15 text-gt-leaf flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4" strokeWidth={2} />
            </div>
            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-[0.22em] text-gt-leaf mb-1.5"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                Matching preferences
              </p>
              <h2 className="text-[18px] font-bold text-white leading-tight">
                Tell us what you want to be matched against.
              </h2>
              <p className="mt-1.5 text-[12.5px] text-white/60 leading-relaxed">
                These feed the Greentryst job matching scorer. Changes
                here apply to every live role on the board and update
                your Matched for you list instantly.
              </p>
            </div>
          </div>

          {/* Resume status read-out (upload handled in the Resume
              section further down to avoid duplicate upload controls) */}
          <div className="mb-5 p-3.5 rounded-lg bg-white/[0.03] border border-white/10 flex items-center gap-3 flex-wrap">
            <span
              className={cn(
                'inline-flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0',
                resumeFile ? 'bg-gt-leaf text-gt-text-dark' : 'bg-white/10 text-white/50'
              )}
            >
              {resumeFile ? (
                <Check className="w-3 h-3" strokeWidth={3} />
              ) : (
                <Sparkles className="w-3 h-3" strokeWidth={2.5} />
              )}
            </span>
            <p className="text-[12px] text-white/75 flex-1 min-w-[200px]">
              {resumeFile
                ? 'Resume on file. Matching uses this profile for every live role.'
                : 'No resume uploaded yet. Scroll to the Resume section below to add one.'}
            </p>
          </div>

          {/* Level + Region */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <label className="flex flex-col gap-1.5">
              <span
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/55"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                Experience level
              </span>
              <select
                value={experienceLevel}
                onChange={(e) =>
                  setExperienceLevel(e.target.value as ExperienceLevel | '')
                }
                className="px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/10 text-[13px] text-white focus:outline-none focus:border-gt-leaf/60 transition-colors"
              >
                <option value="" className="text-gt-text">Select level</option>
                {LEVEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="text-gt-text">
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/55"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                Preferred region
              </span>
              <select
                value={preferredRegion}
                onChange={(e) => setPreferredRegion(e.target.value)}
                className="px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/10 text-[13px] text-white focus:outline-none focus:border-gt-leaf/60 transition-colors"
              >
                <option value="" className="text-gt-text">Any region</option>
                {REGION_OPTIONS.map((r) => (
                  <option key={r} value={r} className="text-gt-text">
                    {r}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Skills chip list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/55"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                Skills
              </span>
              <span
                className="text-[10px] text-white/40"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                {skills.length} / 20
              </span>
            </div>

            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-[12px] font-semibold text-gt-text-dark bg-gt-leaf rounded-full"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => removeSkill(s)}
                      className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-gt-text-dark/20 transition-colors"
                      aria-label={`Remove ${s}`}
                    >
                      <X className="w-2.5 h-2.5" strokeWidth={3} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Free-text add + suggested chips */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill(skillInput);
                  }
                }}
                placeholder="Add a skill and press Enter"
                className="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-[12.5px] text-white placeholder:text-white/35 focus:outline-none focus:border-gt-leaf/60"
              />
              <button
                type="button"
                onClick={() => addSkill(skillInput)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-bold text-gt-text-dark bg-gt-leaf hover:bg-white transition-colors rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <span
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35 self-center"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                Suggested
              </span>
              {SUGGESTED_SKILLS.filter((s) => !skills.includes(s)).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addSkill(s)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-white/70 border border-white/15 rounded-full hover:bg-white/[0.06] hover:border-gt-leaf/40 hover:text-white transition-colors"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Basic Info */}
        <section className="bg-white rounded-xl border border-[#e5e7e5] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[18px] font-bold text-gt-text">Basic Information</h2>
            <button
              onClick={openBasicInfoEdit}
              className="text-[12px] font-semibold text-gt-medium hover:text-gt-dark flex items-center gap-1"
            >
              <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
              Edit
            </button>
          </div>

          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-gt-leaf/10 flex items-center justify-center overflow-hidden border-2 border-[#e5e7e5]">
              {profileImageUrl ? (
                <Image
                  src={profileImageUrl}
                  alt={fullName}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-gt-medium" strokeWidth={1.5} />
              )}
            </div>

            <div className="flex-1 grid grid-cols-2 gap-6">
              <div>
                <label className="text-[11px] font-bold uppercase text-gt-text-muted" style={{ letterSpacing: '0.05em' }}>
                  Full Name
                </label>
                <p className="text-[14px] text-gt-text mt-1">{fullName}</p>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase text-gt-text-muted" style={{ letterSpacing: '0.05em' }}>
                  Email
                </label>
                <p className="text-[14px] text-gt-text mt-1">{email || 'Not set'}</p>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase text-gt-text-muted" style={{ letterSpacing: '0.05em' }}>
                  Headline
                </label>
                <p className={cn("text-[14px] mt-1", headline ? "text-gt-text" : "text-gt-text-muted italic")}>
                  {headline || 'Add a professional headline'}
                </p>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase text-gt-text-muted" style={{ letterSpacing: '0.05em' }}>
                  Location
                </label>
                <p className={cn("text-[14px] mt-1", location ? "text-gt-text" : "text-gt-text-muted italic")}>
                  {location || 'Add your location'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Current Role */}
        <section className="bg-white rounded-xl border border-[#e5e7e5] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[18px] font-bold text-gt-text">Current Role</h2>
            <button
              onClick={openRoleEdit}
              className="text-[12px] font-semibold text-gt-medium hover:text-gt-dark flex items-center gap-1"
            >
              {currentRole ? <Pencil className="w-3.5 h-3.5" strokeWidth={2} /> : <Plus className="w-3.5 h-3.5" strokeWidth={2} />}
              {currentRole ? 'Edit' : 'Add'}
            </button>
          </div>

          {currentRole ? (
            <div className="flex items-center gap-4 p-4 bg-[#f8faf8] rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-gt-medium/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-gt-medium" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-gt-text">{currentRole.title}</p>
                <p className="text-[12px] text-gt-text-muted">{currentRole.company}</p>
                {currentRole.startDate && (
                  <p className="text-[11px] text-gt-text-muted mt-1">{currentRole.startDate} - Present</p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 border-2 border-dashed border-[#e5e7e5] rounded-xl text-center">
              <Building2 className="w-8 h-8 text-gt-text-muted mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-[14px] text-gt-text-muted mb-2">No current role added</p>
              <p className="text-[12px] text-gt-text-muted mb-4">
                Add your current role for better job matching
              </p>
              <button
                onClick={openRoleEdit}
                className="px-4 py-2 bg-gt-medium text-white text-[12px] font-bold rounded-lg hover:bg-gt-dark transition-colors"
              >
                Add Current Role
              </button>
            </div>
          )}
        </section>

        {/* Resume Upload */}
        <section className="bg-white rounded-xl border border-[#e5e7e5] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[18px] font-bold text-gt-text">Resume</h2>
          </div>

          {resumeFile ? (
            <div className="flex flex-wrap items-center gap-4 p-4 bg-[#f8faf8] rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-gt-medium/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-gt-medium" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-[200px]">
                <p className="text-[14px] font-semibold text-gt-text truncate">{resumeFile.name}</p>
                <p className="text-[11px] text-gt-text-muted">
                  {resume.status === 'ready'
                    ? `Uploaded ${new Date(resumeFile.uploadedAt).toLocaleDateString()}`
                    : resume.status === 'error'
                      ? `Upload failed — ${resume.error ?? 'try again'}`
                      : resume.status === 'parsing'
                        ? 'Analyzing your skills…'
                        : 'Uploading…'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {resume.status === 'ready' && (
                  <a
                    href="/api/resume/file"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-gt-medium hover:text-gt-dark"
                  >
                    View
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleResumeUpload}
                  disabled={resume.status === 'uploading' || resume.status === 'parsing'}
                  className="text-[11px] font-semibold text-gt-medium hover:text-gt-dark disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Replace
                </button>
                <button
                  onClick={removeResume}
                  className="text-[11px] font-semibold text-red-500 hover:text-red-600 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" strokeWidth={2} />
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 border-2 border-dashed border-[#e5e7e5] rounded-xl text-center">
              <Upload className="w-8 h-8 text-gt-text-muted mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-[14px] text-gt-text-muted mb-2">No resume uploaded</p>
              <p className="text-[12px] text-gt-text-muted mb-4">
                Upload your resume to enable personalized job matching
              </p>
              <button
                type="button"
                onClick={handleResumeUpload}
                className="inline-block px-4 py-2 bg-gt-medium text-white text-[12px] font-bold rounded-lg hover:bg-gt-dark transition-colors"
              >
                Upload Resume
              </button>
              <p className="text-[10px] text-gt-text-muted mt-3">PDF or DOCX (max 5MB)</p>
              {resume.capMessage && (
                <p className="text-[11px] text-red-500 mt-3">{resume.capMessage}</p>
              )}
            </div>
          )}
        </section>

        {/* Experience */}
        <section className="bg-white rounded-xl border border-[#e5e7e5] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[18px] font-bold text-gt-text">Experience</h2>
            <button
              onClick={() => openExperienceEdit('new')}
              className="text-[12px] font-semibold text-gt-medium hover:text-gt-dark flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} />
              Add
            </button>
          </div>

          {experiences.length > 0 ? (
            <div className="space-y-4">
              {experiences.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-start gap-4 p-4 bg-[#f8faf8] rounded-lg group"
                >
                  <div className="w-10 h-10 rounded-lg bg-gt-medium/10 flex items-center justify-center mt-1">
                    <Briefcase className="w-5 h-5 text-gt-medium" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-semibold text-gt-text">{exp.title}</p>
                    <p className="text-[12px] text-gt-text-muted">{exp.company}{exp.location ? ` - ${exp.location}` : ''}</p>
                    <p className="text-[11px] text-gt-text-muted mt-1">
                      {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                    </p>
                    {exp.description && (
                      <p className="text-[12px] text-gt-text mt-2">{exp.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => openExperienceEdit(exp)}
                    className="opacity-0 group-hover:opacity-100 text-gt-medium hover:text-gt-dark transition-opacity"
                  >
                    <Pencil className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 border-2 border-dashed border-[#e5e7e5] rounded-xl text-center">
              <Briefcase className="w-8 h-8 text-gt-text-muted mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-[14px] text-gt-text-muted mb-2">No experience added</p>
              <p className="text-[12px] text-gt-text-muted mb-4">
                Add your work history to showcase your background
              </p>
              <button
                onClick={() => openExperienceEdit('new')}
                className="px-4 py-2 bg-gt-medium text-white text-[12px] font-bold rounded-lg hover:bg-gt-dark transition-colors"
              >
                Add Experience
              </button>
            </div>
          )}
        </section>

        {/* Certifications */}
        <section className="bg-white rounded-xl border border-[#e5e7e5] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[18px] font-bold text-gt-text">Certifications</h2>
            <button
              onClick={() => openCertEdit('new')}
              className="text-[12px] font-semibold text-gt-medium hover:text-gt-dark flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} />
              Add External
            </button>
          </div>

          {completed.length > 0 || externalCerts.length > 0 ? (
            <div className="space-y-4">
              {completed.length > 0 && (
                <p className="text-[12px] text-gt-text-muted">Certificates earned on Greentryst</p>
              )}
              {completed.map((course) => (
                <div
                  key={course.courseId}
                  className="flex items-center gap-4 p-4 bg-[#f8faf8] rounded-lg"
                >
                  <div className="w-10 h-10 rounded-lg bg-gt-leaf/10 flex items-center justify-center">
                    <Award className="w-5 h-5 text-gt-medium" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-gt-text">{course.title}</p>
                    <p className="text-[11px] text-gt-text-muted">Greentryst</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="text-[11px] font-semibold text-gt-medium hover:text-gt-dark">
                      View
                    </button>
                    <button className="text-[11px] font-semibold text-gt-medium hover:text-gt-dark flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" strokeWidth={2} />
                      Share
                    </button>
                  </div>
                </div>
              ))}
              {externalCerts.length > 0 && completed.length > 0 && (
                <p className="text-[12px] text-gt-text-muted pt-2">External certifications</p>
              )}
              {externalCerts.map((cert) => (
                <div
                  key={cert.id}
                  className="flex items-center gap-4 p-4 bg-[#f8faf8] rounded-lg group"
                >
                  <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                    <Award className="w-5 h-5 text-violet-600" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-gt-text">{cert.name}</p>
                    <p className="text-[11px] text-gt-text-muted">{cert.issuer}{cert.date ? ` - ${cert.date}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {cert.url && (
                      <a
                        href={cert.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-gt-medium hover:text-gt-dark flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" strokeWidth={2} />
                        View
                      </a>
                    )}
                    <button
                      onClick={() => openCertEdit(cert)}
                      className="opacity-0 group-hover:opacity-100 text-gt-medium hover:text-gt-dark transition-opacity"
                    >
                      <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 border-2 border-dashed border-[#e5e7e5] rounded-xl text-center">
              <Award className="w-8 h-8 text-gt-text-muted mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-[14px] text-gt-text-muted mb-2">No certifications yet</p>
              <p className="text-[12px] text-gt-text-muted">
                Complete courses to earn certificates
              </p>
            </div>
          )}
        </section>

        {/* Links */}
        <section className="bg-white rounded-xl border border-[#e5e7e5] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[18px] font-bold text-gt-text">Links</h2>
            <button
              onClick={openLinksEdit}
              className="text-[12px] font-semibold text-gt-medium hover:text-gt-dark flex items-center gap-1"
            >
              <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
              Edit
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border border-[#e5e7e5] rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Link2 className="w-4 h-4 text-[#0077b5]" strokeWidth={2} />
                <span className="text-[12px] font-semibold text-gt-text">LinkedIn</span>
              </div>
              {linkedinUrl ? (
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] text-gt-medium hover:underline truncate block"
                >
                  {linkedinUrl.replace(/^https?:\/\/(www\.)?/, '')}
                </a>
              ) : (
                <p className="text-[12px] text-gt-text-muted italic">Not connected</p>
              )}
            </div>
            <div className="p-4 border border-[#e5e7e5] rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-gt-medium" strokeWidth={2} />
                <span className="text-[12px] font-semibold text-gt-text">Website</span>
              </div>
              {websiteUrl ? (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] text-gt-medium hover:underline truncate block"
                >
                  {websiteUrl.replace(/^https?:\/\/(www\.)?/, '')}
                </a>
              ) : (
                <p className="text-[12px] text-gt-text-muted italic">Not added</p>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* ===== MODALS ===== */}

      {/* Basic Info Modal */}
      {editingBasicInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h3 className="text-[16px] font-bold text-gt-text mb-6">Edit Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-semibold text-gt-text block mb-1">Headline</label>
                <input
                  type="text"
                  value={formHeadline}
                  onChange={(e) => setFormHeadline(e.target.value)}
                  placeholder="e.g., Sustainability Analyst at EcoTech"
                  className="w-full px-3 py-2 border border-[#e5e7e5] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-gt-medium"
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gt-text block mb-1">Location</label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="e.g., London, UK"
                  className="w-full px-3 py-2 border border-[#e5e7e5] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-gt-medium"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingBasicInfo(false)}
                className="px-4 py-2 text-[12px] font-semibold text-gt-text hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveBasicInfo}
                className="px-4 py-2 bg-gt-medium text-white text-[12px] font-bold rounded-lg hover:bg-gt-dark transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Current Role Modal */}
      {editingRole && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h3 className="text-[16px] font-bold text-gt-text mb-6">{currentRole ? 'Edit' : 'Add'} Current Role</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-semibold text-gt-text block mb-1">Job Title *</label>
                <input
                  type="text"
                  value={formRoleTitle}
                  onChange={(e) => setFormRoleTitle(e.target.value)}
                  placeholder="e.g., Sustainability Manager"
                  className="w-full px-3 py-2 border border-[#e5e7e5] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-gt-medium"
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gt-text block mb-1">Company *</label>
                <input
                  type="text"
                  value={formRoleCompany}
                  onChange={(e) => setFormRoleCompany(e.target.value)}
                  placeholder="e.g., GreenCorp Inc."
                  className="w-full px-3 py-2 border border-[#e5e7e5] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-gt-medium"
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gt-text block mb-1">Start Date</label>
                <input
                  type="text"
                  value={formRoleStart}
                  onChange={(e) => setFormRoleStart(e.target.value)}
                  placeholder="e.g., Jan 2024"
                  className="w-full px-3 py-2 border border-[#e5e7e5] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-gt-medium"
                />
              </div>
            </div>
            <div className="flex justify-between mt-6">
              {currentRole && (
                <button
                  onClick={deleteRole}
                  className="px-4 py-2 text-[12px] font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                  Remove
                </button>
              )}
              <div className={cn("flex gap-3", !currentRole && "ml-auto")}>
                <button
                  onClick={() => setEditingRole(false)}
                  className="px-4 py-2 text-[12px] font-semibold text-gt-text hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveRole}
                  disabled={!formRoleTitle || !formRoleCompany}
                  className="px-4 py-2 bg-gt-medium text-white text-[12px] font-bold rounded-lg hover:bg-gt-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Experience Modal */}
      {editingExperience && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-[16px] font-bold text-gt-text mb-6">
              {editingExperience === 'new' ? 'Add' : 'Edit'} Experience
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-semibold text-gt-text block mb-1">Job Title *</label>
                <input
                  type="text"
                  value={formExpTitle}
                  onChange={(e) => setFormExpTitle(e.target.value)}
                  placeholder="e.g., Climate Risk Analyst"
                  className="w-full px-3 py-2 border border-[#e5e7e5] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-gt-medium"
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gt-text block mb-1">Company *</label>
                <input
                  type="text"
                  value={formExpCompany}
                  onChange={(e) => setFormExpCompany(e.target.value)}
                  placeholder="e.g., Deloitte"
                  className="w-full px-3 py-2 border border-[#e5e7e5] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-gt-medium"
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gt-text block mb-1">Location</label>
                <input
                  type="text"
                  value={formExpLocation}
                  onChange={(e) => setFormExpLocation(e.target.value)}
                  placeholder="e.g., New York, NY"
                  className="w-full px-3 py-2 border border-[#e5e7e5] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-gt-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] font-semibold text-gt-text block mb-1">Start Date</label>
                  <input
                    type="text"
                    value={formExpStart}
                    onChange={(e) => setFormExpStart(e.target.value)}
                    placeholder="e.g., Jan 2022"
                    className="w-full px-3 py-2 border border-[#e5e7e5] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-gt-medium"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-gt-text block mb-1">End Date</label>
                  <input
                    type="text"
                    value={formExpEnd}
                    onChange={(e) => setFormExpEnd(e.target.value)}
                    placeholder="e.g., Dec 2023"
                    disabled={formExpCurrent}
                    className="w-full px-3 py-2 border border-[#e5e7e5] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-gt-medium disabled:bg-gray-100"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formExpCurrent}
                  onChange={(e) => setFormExpCurrent(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-gt-medium focus:ring-gt-medium"
                />
                <span className="text-[12px] text-gt-text">I currently work here</span>
              </label>
              <div>
                <label className="text-[12px] font-semibold text-gt-text block mb-1">Description</label>
                <textarea
                  value={formExpDesc}
                  onChange={(e) => setFormExpDesc(e.target.value)}
                  placeholder="Describe your responsibilities and achievements..."
                  rows={3}
                  className="w-full px-3 py-2 border border-[#e5e7e5] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-gt-medium resize-none"
                />
              </div>
            </div>
            <div className="flex justify-between mt-6">
              {editingExperience !== 'new' && (
                <button
                  onClick={() => deleteExperience((editingExperience as Experience).id)}
                  className="px-4 py-2 text-[12px] font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                  Delete
                </button>
              )}
              <div className={cn("flex gap-3", editingExperience === 'new' && "ml-auto")}>
                <button
                  onClick={() => setEditingExperience(null)}
                  className="px-4 py-2 text-[12px] font-semibold text-gt-text hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveExperience}
                  disabled={!formExpTitle || !formExpCompany}
                  className="px-4 py-2 bg-gt-medium text-white text-[12px] font-bold rounded-lg hover:bg-gt-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Certification Modal */}
      {editingCert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h3 className="text-[16px] font-bold text-gt-text mb-6">
              {editingCert === 'new' ? 'Add' : 'Edit'} Certification
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-semibold text-gt-text block mb-1">Certification Name *</label>
                <input
                  type="text"
                  value={formCertName}
                  onChange={(e) => setFormCertName(e.target.value)}
                  placeholder="e.g., CFA ESG Investing"
                  className="w-full px-3 py-2 border border-[#e5e7e5] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-gt-medium"
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gt-text block mb-1">Issuing Organization *</label>
                <input
                  type="text"
                  value={formCertIssuer}
                  onChange={(e) => setFormCertIssuer(e.target.value)}
                  placeholder="e.g., CFA Institute"
                  className="w-full px-3 py-2 border border-[#e5e7e5] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-gt-medium"
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gt-text block mb-1">Date Earned</label>
                <input
                  type="text"
                  value={formCertDate}
                  onChange={(e) => setFormCertDate(e.target.value)}
                  placeholder="e.g., March 2024"
                  className="w-full px-3 py-2 border border-[#e5e7e5] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-gt-medium"
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gt-text block mb-1">Credential URL</label>
                <input
                  type="url"
                  value={formCertUrl}
                  onChange={(e) => setFormCertUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-[#e5e7e5] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-gt-medium"
                />
              </div>
            </div>
            <div className="flex justify-between mt-6">
              {editingCert !== 'new' && (
                <button
                  onClick={() => deleteCert((editingCert as ExternalCert).id)}
                  className="px-4 py-2 text-[12px] font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                  Delete
                </button>
              )}
              <div className={cn("flex gap-3", editingCert === 'new' && "ml-auto")}>
                <button
                  onClick={() => setEditingCert(null)}
                  className="px-4 py-2 text-[12px] font-semibold text-gt-text hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCert}
                  disabled={!formCertName || !formCertIssuer}
                  className="px-4 py-2 bg-gt-medium text-white text-[12px] font-bold rounded-lg hover:bg-gt-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Links Modal */}
      {editingLinks && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h3 className="text-[16px] font-bold text-gt-text mb-6">Edit Links</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-semibold text-gt-text block mb-1">LinkedIn URL</label>
                <input
                  type="url"
                  value={formLinkedin}
                  onChange={(e) => setFormLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="w-full px-3 py-2 border border-[#e5e7e5] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-gt-medium"
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gt-text block mb-1">Website URL</label>
                <input
                  type="url"
                  value={formWebsite}
                  onChange={(e) => setFormWebsite(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="w-full px-3 py-2 border border-[#e5e7e5] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-gt-medium"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingLinks(false)}
                className="px-4 py-2 text-[12px] font-semibold text-gt-text hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveLinks}
                className="px-4 py-2 bg-gt-medium text-white text-[12px] font-bold rounded-lg hover:bg-gt-dark transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Activity Calendar - Compact Glass Style
   ============================================================ */

function ActivityCalendarCompact({
  activityMap,
}: {
  activityMap: Record<string, { lessonsDone: number; quizzesDone: number }>;
}) {
  const weeks = useMemo(() => {
    const result: { date: string; level: number }[][] = [];
    const today = new Date();

    // Generate last 20 weeks (140 days) for compact view
    for (let w = 19; w >= 0; w--) {
      const week: { date: string; level: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(today);
        date.setDate(today.getDate() - (w * 7 + (6 - d)));
        const dateStr = date.toISOString().slice(0, 10);
        const activity = activityMap[dateStr];
        const total = activity ? activity.lessonsDone + activity.quizzesDone : 0;
        // Level: 0 = none, 1 = 1, 2 = 2-3, 3 = 4-5, 4 = 6+
        const level = total === 0 ? 0 : total === 1 ? 1 : total <= 3 ? 2 : total <= 5 ? 3 : 4;
        week.push({ date: dateStr, level });
      }
      result.push(week);
    }
    return result;
  }, [activityMap]);

  const totalActiveDays = useMemo(() => {
    return Object.keys(activityMap).length;
  }, [activityMap]);

  const currentStreak = useMemo(() => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      if (activityMap[dateStr]) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  }, [activityMap]);

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl px-5 py-4 border border-white/10">
      <div className="flex items-center justify-between gap-6">
        {/* Calendar grid */}
        <div className="flex gap-[3px] overflow-hidden">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day, di) => (
                <div
                  key={di}
                  className={cn(
                    'w-[10px] h-[10px] rounded-[2px] transition-colors',
                    day.level === 0 && 'bg-white/10',
                    day.level === 1 && 'bg-gt-leaf/30',
                    day.level === 2 && 'bg-gt-leaf/50',
                    day.level === 3 && 'bg-gt-leaf/70',
                    day.level === 4 && 'bg-gt-leaf'
                  )}
                  title={`${day.date}: ${activityMap[day.date]?.lessonsDone || 0} lessons, ${activityMap[day.date]?.quizzesDone || 0} quizzes`}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 shrink-0">
          <div className="text-center">
            <p
              className="text-[16px] font-bold text-white"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            >
              {currentStreak}
            </p>
            <p className="text-[10px] text-white/50 uppercase" style={{ letterSpacing: '0.05em' }}>
              Day Streak
            </p>
          </div>
          <div className="text-center">
            <p
              className="text-[16px] font-bold text-white"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            >
              {totalActiveDays}
            </p>
            <p className="text-[10px] text-white/50 uppercase" style={{ letterSpacing: '0.05em' }}>
              Active Days
            </p>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-1 ml-2">
            <span className="text-[9px] text-white/40">Less</span>
            <div className="w-[8px] h-[8px] rounded-[2px] bg-white/10" />
            <div className="w-[8px] h-[8px] rounded-[2px] bg-gt-leaf/30" />
            <div className="w-[8px] h-[8px] rounded-[2px] bg-gt-leaf/50" />
            <div className="w-[8px] h-[8px] rounded-[2px] bg-gt-leaf/70" />
            <div className="w-[8px] h-[8px] rounded-[2px] bg-gt-leaf" />
            <span className="text-[9px] text-white/40">More</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Settings Tab - Account Management
   ============================================================ */

interface ToolSetting {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  tier: 'free' | 'individual' | 'team';
}

function SettingsTab({
  planTier,
  sustainiqQueriesToday,
  sustainiqDailyLimit,
  reportsThisMonth,
  reportsMonthlyLimit,
  email,
}: {
  planTier: string;
  sustainiqQueriesToday: number;
  sustainiqDailyLimit: number;
  reportsThisMonth: number;
  reportsMonthlyLimit: number;
  email: string;
}) {
  // Tool toggles (SustainIQ is a service, not a tool - managed separately)
  const [tools, setTools] = useState<ToolSetting[]>([
    { id: 'ghg-calculator', name: 'GHG Calculator', description: 'Carbon footprint calculations', icon: <Calculator className="w-5 h-5" />, enabled: true, tier: 'individual' },
    { id: 'report-drafter', name: 'Report Drafter', description: 'Generate sustainability reports', icon: <FileText className="w-5 h-5" />, enabled: false, tier: 'individual' },
    { id: 'data-extractor', name: 'Data Extractor', description: 'Extract data from PDFs and reports', icon: <FileSpreadsheet className="w-5 h-5" />, enabled: true, tier: 'team' },
  ]);

  // Notification settings
  const [notifications, setNotifications] = useState({
    jobAlerts: true,
    courseUpdates: true,
    weeklyDigest: false,
    productNews: true,
  });

  // Billing state
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Phase 3: load persisted preferences on mount, save on change.
  // Errors are silent — if Turso is unreachable we fall back to the
  // defaults and let the user re-toggle once the API recovers.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/preferences')
      .then(r => (r.ok ? r.json() : null))
      .then((d: { toolsEnabled?: Record<string, boolean>; notificationPrefs?: Record<string, boolean> } | null) => {
        if (cancelled || !d) return;
        if (d.toolsEnabled) {
          setTools(prev =>
            prev.map(t =>
              t.id in d.toolsEnabled! ? { ...t, enabled: Boolean(d.toolsEnabled![t.id]) } : t,
            ),
          );
        }
        if (d.notificationPrefs) {
          setNotifications(prev => ({ ...prev, ...d.notificationPrefs }));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  function persistPreferences(patch: {
    toolsEnabled?: Record<string, boolean>;
    notificationPrefs?: Record<string, boolean>;
  }) {
    fetch('/api/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }).catch(() => {});
  }

  const toggleTool = (toolId: string) => {
    const next = tools.map(t => (t.id === toolId ? { ...t, enabled: !t.enabled } : t));
    setTools(next);
    persistPreferences({
      toolsEnabled: Object.fromEntries(next.map(t => [t.id, t.enabled])),
    });
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    const next = { ...notifications, [key]: !notifications[key] };
    setNotifications(next);
    persistPreferences({ notificationPrefs: next });
  };

  // Mock billing data
  const billingInfo = {
    plan: planTier,
    price: planTier === 'Individual' ? '$29/mo' : planTier === 'Team' ? '$79/mo' : 'Free',
    nextBilling: '2026-05-12',
    paymentMethod: '**** **** **** 4242',
    invoices: [
      { id: 'INV-2026-04', date: '2026-04-01', amount: '$29.00', status: 'Paid' },
      { id: 'INV-2026-03', date: '2026-03-01', amount: '$29.00', status: 'Paid' },
      { id: 'INV-2026-02', date: '2026-02-01', amount: '$29.00', status: 'Paid' },
    ],
  };

  return (
    <div className="max-w-[900px] mx-auto px-8 py-10">
      <div className="space-y-8">
        {/* Subscription & Plan */}
        <section className="bg-white rounded-xl border border-[#e5e7e5] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[18px] font-bold text-gt-text">Subscription & Plan</h2>
          </div>

          {/* Plan status — real subscription data comes via Dodo
              Payments once that integration lands (Phase 1). Until
              then: show the free-tier reality + link to pricing for
              everyone. Do NOT claim "Individual Plan Active $29/mo" —
              that is false for anyone who hasn't actually paid. */}
          <div className="flex items-start justify-between p-5 bg-gradient-to-r from-gt-medium/5 to-gt-leaf/5 rounded-xl border border-gt-medium/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gt-medium/10 flex items-center justify-center">
                <Crown className="w-6 h-6 text-gt-medium" strokeWidth={1.5} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[16px] font-bold text-gt-text">Free tier</h3>
                  <span className="px-2 py-0.5 bg-gt-pale text-gt-text-muted text-[10px] font-bold uppercase rounded">
                    Current
                  </span>
                </div>
                <p className="text-[13px] text-gt-text-muted mt-1">
                  Paid plans launch soon. Early access users keep free access.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/pricing"
                className="px-4 py-2 bg-gt-medium text-white text-[12px] font-bold rounded-lg hover:bg-gt-dark transition-colors"
              >
                See plans
              </Link>
            </div>
          </div>

          {/* Usage — live counters from /api/usage. Anonymous users
              (unreachable here since the dashboard is Clerk-gated)
              see zeros; signed-in users see their daily/monthly use
              against the preview-era limits. */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="p-4 bg-[#f8faf8] rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-gt-medium" strokeWidth={2} />
                <span className="text-[12px] font-semibold text-gt-text">SustainIQ Queries</span>
              </div>
              <p
                className="text-[20px] font-bold text-gt-text"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                {sustainiqQueriesToday}/{sustainiqDailyLimit}
              </p>
              <p className="text-[11px] text-gt-text-muted">Resets daily at midnight</p>
            </div>
            <div className="p-4 bg-[#f8faf8] rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-gt-medium" strokeWidth={2} />
                <span className="text-[12px] font-semibold text-gt-text">Reports Generated</span>
              </div>
              <p
                className="text-[20px] font-bold text-gt-text"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                {reportsThisMonth}/{reportsMonthlyLimit}
              </p>
              <p className="text-[11px] text-gt-text-muted">Monthly limit</p>
            </div>
          </div>
        </section>

        {/* Billing — hidden until Dodo integration lands. Showing a
            fake "Visa ending in 4242" + fake invoice list to any user
            would be a direct trust-breaker. The whole section is
            conditional on having a real payment method on file. */}
        <section className="bg-white rounded-xl border border-[#e5e7e5] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[18px] font-bold text-gt-text">Billing</h2>
          </div>
          <div className="p-6 text-center">
            <CreditCard
              className="w-8 h-8 text-gt-text-dim mx-auto mb-3"
              strokeWidth={1.5}
            />
            <p className="text-[13px] font-semibold text-gt-text">
              No payment method on file.
            </p>
            <p className="text-[12px] text-gt-text-muted mt-1 max-w-xs mx-auto">
              Billing and invoices appear here once you upgrade to a paid plan.
            </p>
            <Link
              href="/pricing"
              className="inline-block mt-4 text-[12px] font-semibold text-gt-medium hover:text-gt-dark"
            >
              See pricing →
            </Link>
          </div>
        </section>

        {/* Tools */}
        <section className="bg-white rounded-xl border border-[#e5e7e5] p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[18px] font-bold text-gt-text">Tools</h2>
              <p className="text-[12px] text-gt-text-muted">
                Enable or disable tools in your workspace. Preferences are saved
                to your account.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {tools.map((tool) => {
              const isAvailable = tool.tier === 'free' ||
                (tool.tier === 'individual' && ['Individual', 'Team', 'Enterprise'].includes(planTier)) ||
                (tool.tier === 'team' && ['Team', 'Enterprise'].includes(planTier));

              return (
                <div
                  key={tool.id}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-lg border',
                    isAvailable ? 'bg-white border-[#e5e7e5]' : 'bg-gray-50 border-gray-200'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      isAvailable ? 'bg-gt-medium/10 text-gt-medium' : 'bg-gray-200 text-gray-400'
                    )}>
                      {tool.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          'text-[13px] font-semibold',
                          isAvailable ? 'text-gt-text' : 'text-gray-400'
                        )}>
                          {tool.name}
                        </p>
                        {!isAvailable && (
                          <span className="px-2 py-0.5 bg-gray-200 text-gray-500 text-[9px] font-bold uppercase rounded">
                            {tool.tier} plan
                          </span>
                        )}
                      </div>
                      <p className={cn(
                        'text-[11px]',
                        isAvailable ? 'text-gt-text-muted' : 'text-gray-400'
                      )}>
                        {tool.description}
                      </p>
                    </div>
                  </div>
                  {isAvailable ? (
                    <button
                      onClick={() => toggleTool(tool.id)}
                      className={cn(
                        'w-11 h-6 rounded-full transition-colors relative',
                        tool.enabled ? 'bg-gt-medium' : 'bg-gray-300'
                      )}
                    >
                      <div
                        className={cn(
                          'w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm',
                          tool.enabled ? 'translate-x-5' : 'translate-x-0.5'
                        )}
                      />
                    </button>
                  ) : (
                    <button className="px-3 py-1.5 bg-gt-medium text-white text-[11px] font-bold rounded-lg hover:bg-gt-dark transition-colors">
                      Upgrade
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-white rounded-xl border border-[#e5e7e5] p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[18px] font-bold text-gt-text">Notifications</h2>
              <p className="text-[12px] text-gt-text-muted">
                Preferences are saved to your account. Email delivery turns on
                as each channel ships.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { key: 'jobAlerts' as const, label: 'Job Alerts', desc: 'Get notified about new matching jobs' },
              { key: 'courseUpdates' as const, label: 'Course Updates', desc: 'New lessons and content updates' },
              { key: 'weeklyDigest' as const, label: 'Weekly Digest', desc: 'Summary of your learning progress' },
              { key: 'productNews' as const, label: 'Product News', desc: 'New features and announcements' },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between py-3 border-b border-[#e5e7e5] last:border-0"
              >
                <div>
                  <p className="text-[13px] font-semibold text-gt-text">{item.label}</p>
                  <p className="text-[11px] text-gt-text-muted">{item.desc}</p>
                </div>
                <button
                  onClick={() => toggleNotification(item.key)}
                  className={cn(
                    'w-11 h-6 rounded-full transition-colors relative',
                    notifications[item.key] ? 'bg-gt-medium' : 'bg-gray-300'
                  )}
                >
                  <div
                    className={cn(
                      'w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm',
                      notifications[item.key] ? 'translate-x-5' : 'translate-x-0.5'
                    )}
                  />
                </button>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-gt-text-muted mt-4">
            Notifications are sent to {email}
          </p>
        </section>

        {/* Data & Privacy */}
        <section className="bg-white rounded-xl border border-[#e5e7e5] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[18px] font-bold text-gt-text">Data & Privacy</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#f8faf8] rounded-lg">
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-gt-text-muted" strokeWidth={1.5} />
                <div>
                  <p className="text-[13px] font-semibold text-gt-text">Export All Data</p>
                  <p className="text-[11px] text-gt-text-muted">Download all your data as JSON</p>
                </div>
              </div>
              <button className="px-4 py-2 border border-[#e5e7e5] text-[12px] font-semibold text-gt-text rounded-lg hover:bg-gray-50 transition-colors">
                Export
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-red-500" strokeWidth={1.5} />
                <div>
                  <p className="text-[13px] font-semibold text-red-600">Delete Account</p>
                  <p className="text-[11px] text-red-500/70">Permanently delete your account and all data</p>
                </div>
              </div>
              <button className="px-4 py-2 border border-red-200 text-[12px] font-semibold text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </section>

        {/* Help & Support */}
        <section className="bg-white rounded-xl border border-[#e5e7e5] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[18px] font-bold text-gt-text">Help & Support</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="https://docs.greentryst.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 bg-[#f8faf8] rounded-lg hover:bg-gt-leaf/5 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-gt-medium/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-gt-medium" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-gt-text group-hover:text-gt-medium">Documentation</p>
                <p className="text-[11px] text-gt-text-muted">Guides, tutorials, and API reference</p>
              </div>
              <ExternalLink className="w-4 h-4 text-gt-text-muted" strokeWidth={2} />
            </a>

            <a
              href="mailto:support@greentryst.com"
              className="flex items-center gap-4 p-4 bg-[#f8faf8] rounded-lg hover:bg-gt-leaf/5 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-gt-medium/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-gt-medium" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-gt-text group-hover:text-gt-medium">Contact Support</p>
                <p className="text-[11px] text-gt-text-muted">Get help from our team</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gt-text-muted" strokeWidth={2} />
            </a>

            <a
              href="https://greentryst.canny.io"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 bg-[#f8faf8] rounded-lg hover:bg-gt-leaf/5 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-gt-medium/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-gt-medium" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-gt-text group-hover:text-gt-medium">Feature Requests</p>
                <p className="text-[11px] text-gt-text-muted">Suggest and vote on new features</p>
              </div>
              <ExternalLink className="w-4 h-4 text-gt-text-muted" strokeWidth={2} />
            </a>

            <a
              href="https://status.greentryst.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 bg-[#f8faf8] rounded-lg hover:bg-gt-leaf/5 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-gt-text group-hover:text-gt-medium">System Status</p>
                <p className="text-[11px] text-green-600 font-medium">All systems operational</p>
              </div>
              <ExternalLink className="w-4 h-4 text-gt-text-muted" strokeWidth={2} />
            </a>
          </div>

          <div className="mt-6 p-4 bg-gt-leaf/5 border border-gt-leaf/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-gt-medium mt-0.5" strokeWidth={1.5} />
              <div>
                <p className="text-[13px] font-semibold text-gt-text">Need quick answers?</p>
                <p className="text-[12px] text-gt-text-muted mt-1">
                  Ask SustainIQ about platform features, methodology questions, or get help with calculations.
                </p>
                <Link
                  href="/ask"
                  className="inline-flex items-center gap-1 mt-2 text-[12px] font-semibold text-gt-medium hover:text-gt-dark"
                >
                  Ask SustainIQ
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-bold text-gt-text">Cancel Subscription</h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-gt-text-muted hover:text-gt-text"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>

            <p className="text-[13px] text-gt-text-muted mb-4">
              Are you sure you want to cancel your {planTier} subscription? You will lose access to:
            </p>

            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-[12px] text-gt-text">
                <X className="w-4 h-4 text-red-500" strokeWidth={2} />
                Unlimited SustainIQ queries
              </li>
              <li className="flex items-center gap-2 text-[12px] text-gt-text">
                <X className="w-4 h-4 text-red-500" strokeWidth={2} />
                Premium tools (Report Drafter, Data Extractor)
              </li>
              <li className="flex items-center gap-2 text-[12px] text-gt-text">
                <X className="w-4 h-4 text-red-500" strokeWidth={2} />
                Priority job matching
              </li>
            </ul>

            <p className="text-[11px] text-gt-text-muted mb-6">
              Your subscription will remain active until {billingInfo.nextBilling}
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-[12px] font-semibold text-gt-text hover:bg-gray-100 rounded-lg transition-colors"
              >
                Keep Subscription
              </button>
              <button className="px-4 py-2 bg-red-500 text-white text-[12px] font-bold rounded-lg hover:bg-red-600 transition-colors">
                Cancel Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Sub-components
   ============================================================ */

function QuickStatDark({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
}) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1.5 text-gt-leaf mb-1">
        {icon}
        <span
          className="text-[20px] font-bold text-white"
          style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
        >
          {value}
        </span>
      </div>
      <p className="text-[11px] text-white/50">{label}</p>
    </div>
  );
}

function CourseProgressRow({ course }: { course: EnrolledCourse }) {
  const percent =
    course.totalLessons > 0
      ? Math.round((course.completedCount / course.totalLessons) * 100)
      : 0;

  const continueHref = course.lastLesson
    ? `/courses/${course.courseId}/${lessonIdToUrl(course.lastLesson)}`
    : `/courses/${course.courseId}`;

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-[#e5e7e5] hover:border-gt-medium/30 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-gt-leaf/10 flex items-center justify-center flex-shrink-0 text-gt-medium">
        {getCategoryIcon(course.category)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-gt-text truncate">{course.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1.5 bg-[#e5e7e5] rounded-full overflow-hidden max-w-[160px]">
            <div
              className="h-full bg-gt-medium rounded-full"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span
            className="text-[10px] text-gt-text-muted"
            style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
          >
            {course.completedCount}/{course.totalLessons}
          </span>
        </div>
      </div>
      <Link
        href={continueHref}
        className="flex-shrink-0 px-3 py-1.5 bg-gt-medium text-white text-[11px] font-bold rounded-lg hover:bg-gt-dark transition-colors"
      >
        Continue
      </Link>
    </div>
  );
}

function LearningPathCard({
  path,
  completedCourseIds,
}: {
  path: {
    id: string;
    title: string;
    courses: string[];
  };
  completedCourseIds: Set<string>;
}) {
  const completedInPath = path.courses.filter((c) => completedCourseIds.has(c)).length;
  const progress = Math.round((completedInPath / path.courses.length) * 100);

  return (
    <Link
      href={`/courses?path=${path.id}`}
      className="block p-4 bg-white rounded-xl border border-[#e5e7e5] hover:border-gt-medium/30 transition-colors group"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-gt-leaf/10 flex items-center justify-center flex-shrink-0">
          <Route className="w-4 h-4 text-gt-medium" strokeWidth={1.5} />
        </div>
        <h3 className="text-[13px] font-semibold text-gt-text group-hover:text-gt-medium transition-colors truncate">
          {path.title}
        </h3>
      </div>

      <div className="flex items-center justify-between text-[10px] mb-1.5">
        <span
          className="text-gt-text-muted"
          style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
        >
          {completedInPath}/{path.courses.length} courses
        </span>
        <span
          className="font-bold text-gt-medium"
          style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
        >
          {progress}%
        </span>
      </div>
      <div className="h-1.5 bg-[#e5e7e5] rounded-full overflow-hidden">
        <div className="h-full bg-gt-medium rounded-full" style={{ width: `${progress}%` }} />
      </div>
    </Link>
  );
}

function SkillBarCompact({
  skill,
}: {
  skill: { skill: string; userScore: number };
}) {
  const hasSkill = skill.userScore >= 100;

  return (
    <div className="flex items-center gap-2">
      <div className="w-4 flex-shrink-0">
        {hasSkill ? (
          <Check className="w-3.5 h-3.5 text-gt-medium" strokeWidth={2.5} />
        ) : (
          <Circle className="w-3.5 h-3.5 text-[#d5d7d5]" strokeWidth={2} />
        )}
      </div>
      <span className="text-[11px] text-gt-text flex-1 truncate">{skill.skill}</span>
      <div className="w-16 h-1 bg-[#e5e7e5] rounded-full overflow-hidden">
        <div
          className="h-full bg-gt-medium rounded-full"
          style={{ width: `${Math.min(skill.userScore, 100)}%` }}
        />
      </div>
      <span
        className="text-[10px] text-gt-text-muted w-8 text-right"
        style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
      >
        {skill.userScore}%
      </span>
    </div>
  );
}

function SavedItemIcon({ type }: { type: string }) {
  const iconClass = 'w-4 h-4 text-gt-text-muted';
  switch (type) {
    case 'lesson':
      return <BookOpen className={iconClass} strokeWidth={2} />;
    case 'job':
      return <Briefcase className={iconClass} strokeWidth={2} />;
    case 'query':
      return <Search className={iconClass} strokeWidth={2} />;
    default:
      return <Bookmark className={iconClass} strokeWidth={2} />;
  }
}
