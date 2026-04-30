// ─── Core domain types ────────────────────────────────────────────────────────

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  status: 'published' | 'draft' | 'coming-soon';
  category: 'methodologies' | 'markets' | 'esg' | 'fundamentals' | 'green-finance' | 'sustainability-standards';
  estimatedHours: number;
  modules: Module[];
}

export interface Module {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  lessons: LessonMeta[];
}

export interface LessonMeta {
  id: string;
  title: string;
  duration?: string;
  vmRef?: string;
  readingMinutes?: number;
  seoTitle?: string;
  seoDescription?: string;
}

interface BaseQuestion {
  question: string;
  explanation?: string;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type?: 'multiple-choice';
  options: string[];
  answer: number;
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: 'true-false';
  answer: boolean;
}

export interface MultiSelectQuestion extends BaseQuestion {
  type: 'multi-select';
  options: string[];
  answers: number[];
}

export interface MatchingQuestion extends BaseQuestion {
  type: 'matching';
  pairs: { left: string; right: string }[];
}

export type QuizQuestion =
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | MultiSelectQuestion
  | MatchingQuestion;

// ─── Progress types ───────────────────────────────────────────────────────────

export interface PlatformProgress {
  version: 2;
  courses: Record<string, CourseProgress>;
  xp?: number;
  level?: number;
  streak?: StreakData;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;   // ISO date string (YYYY-MM-DD)
}

export interface CourseProgress {
  startedAt: number;
  lastAccessedAt: number;
  lastAccessedLesson: string | null;
  completedLessons: Record<string, number>;   // lessonId → timestamp
  quizzes: Record<string, QuizState>;          // lessonId → quiz state
  scrollPositions?: Record<string, number>;   // lessonId → scrollY px
}

export interface QuizState {
  answers: Record<number, number>;
  multiSelectAnswers: Record<number, number[]>;
  matchingAnswers: Record<number, number[]>;
  submitted: Record<number, boolean>;
  score?: number;
}

// ─── Derived/computed types ───────────────────────────────────────────────────

export interface CourseStats {
  courseId: string;
  completedCount: number;
  totalLessons: number;
  percentComplete: number;
  lastAccessedLesson: string | null;
  lastAccessedAt: number | null;
}

export interface PlatformStats {
  coursesStarted: number;
  totalLessonsCompleted: number;
  totalLessons: number;
}

// ─── Navigation helpers ───────────────────────────────────────────────────────

export interface LessonNavContext {
  prevLesson: LessonMeta | null;
  nextLesson: LessonMeta | null;
  moduleTitle: string;
  lessonIndex: number;    // 1-based position within the module
  moduleLessonCount: number;
}
