import { sqliteTable, text, integer, primaryKey, index } from 'drizzle-orm/sqlite-core';

export const enrollments = sqliteTable(
  'enrollments',
  {
    userId: text('user_id').notNull(),
    courseId: text('course_id').notNull(),
    startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
    lastLesson: text('last_lesson'),
    lastAccessedAt: integer('last_accessed_at', { mode: 'timestamp' }),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.courseId] }),
    index('enrollments_user_idx').on(t.userId),
  ],
);

export const lessonCompletions = sqliteTable(
  'lesson_completions',
  {
    userId: text('user_id').notNull(),
    courseId: text('course_id').notNull(),
    lessonId: text('lesson_id').notNull(),
    completedAt: integer('completed_at', { mode: 'timestamp' }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.courseId, t.lessonId] }),
    index('completions_user_idx').on(t.userId),
  ],
);

export const quizAttempts = sqliteTable(
  'quiz_attempts',
  {
    userId: text('user_id').notNull(),
    courseId: text('course_id').notNull(),
    lessonId: text('lesson_id').notNull(),
    questionIdx: integer('question_idx').notNull(),
    selected: integer('selected'),
    multiSelected: text('multi_selected'),
    matching: text('matching'),
    submitted: integer('submitted', { mode: 'boolean' }).notNull().default(false),
    answeredAt: integer('answered_at', { mode: 'timestamp' }),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.courseId, t.lessonId, t.questionIdx] }),
    index('quiz_user_idx').on(t.userId),
  ],
);

export const dailyActivity = sqliteTable(
  'daily_activity',
  {
    userId: text('user_id').notNull(),
    activityDate: text('activity_date').notNull(),
    lessonsDone: integer('lessons_done').notNull().default(0),
    quizzesDone: integer('quizzes_done').notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.activityDate] }),
    index('activity_user_idx').on(t.userId),
  ],
);

// Feedback submissions — bugs, feature requests, content feedback,
// general questions. Services enquiries live in a separate table
// because they are sales leads with different fields and workflow.
export const feedbackSubmissions = sqliteTable(
  'feedback_submissions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    type: text('type').notNull(), // 'bug' | 'feature' | 'content' | 'other' | 'services'
    userId: text('user_id'),
    email: text('email').notNull(),
    message: text('message').notNull(),
    metadata: text('metadata'), // jsonb string, optional
    pageUrl: text('page_url'),
    userAgent: text('user_agent'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    handledAt: integer('handled_at', { mode: 'timestamp' }),
  },
  (t) => [
    index('feedback_created_idx').on(t.createdAt),
    index('feedback_type_idx').on(t.type),
  ],
);

// Services enquiries — sales leads for premium custom engagements
// (Climate Risk Assessment, Double Materiality, etc.). Separate from
// feedback because the fields, workflow, and response tone differ.
export const serviceEnquiries = sqliteTable(
  'service_enquiries',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    email: text('email').notNull(),
    company: text('company').notNull(),
    role: text('role'),
    // Engagement id from the Services page (e.g., 'climate-risk',
    // 'double-materiality'). 'unsure' is allowed when the prospect
    // does not yet know which engagement fits.
    engagement: text('engagement').notNull(),
    timeline: text('timeline').notNull(), // 'immediate' | '1-3m' | '3-6m' | '6m+' | 'flexible'
    budget: text('budget'), // 'lt-5k' | '5-15k' | '15-50k' | '50k+' | 'unsure'
    message: text('message').notNull(),
    userId: text('user_id'),
    pageUrl: text('page_url'),
    userAgent: text('user_agent'),
    status: text('status').notNull().default('new'), // 'new' | 'contacted' | 'qualified' | 'closed'
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    handledAt: integer('handled_at', { mode: 'timestamp' }),
  },
  (t) => [
    index('enquiry_created_idx').on(t.createdAt),
    index('enquiry_status_idx').on(t.status),
    index('enquiry_engagement_idx').on(t.engagement),
  ],
);

// ─── Emission Factors product ─────────────────────────────────────────────────
// Factor content itself lives as YAML in src/content/emission-factors/.
// Turso holds only dynamic signed-in and public-submission state.

export const efIssueReports = sqliteTable(
  'ef_issue_reports',
  {
    id: text('id').primaryKey(),
    factorId: text('factor_id').notNull(),
    submittedAt: integer('submitted_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    reporterEmail: text('reporter_email'),
    description: text('description').notNull(),
    status: text('status').notNull().default('open'), // 'open' | 'triaged' | 'resolved' | 'wontfix'
    editorNote: text('editor_note'),
    resolvedAt: integer('resolved_at', { mode: 'timestamp' }),
  },
  (t) => [
    index('ef_issues_factor_idx').on(t.factorId),
    index('ef_issues_status_idx').on(t.status),
  ],
);

export const efSavedFactors = sqliteTable(
  'ef_saved_factors',
  {
    userId: text('user_id').notNull(),
    factorId: text('factor_id').notNull(),
    savedAt: integer('saved_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    folder: text('folder'),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.factorId] }),
    index('ef_saved_user_idx').on(t.userId),
  ],
);

export const efCiteLists = sqliteTable(
  'ef_cite_lists',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    name: text('name').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index('ef_cite_lists_user_idx').on(t.userId)],
);

export const efCiteListItems = sqliteTable(
  'ef_cite_list_items',
  {
    citeListId: text('cite_list_id').notNull(),
    factorId: text('factor_id').notNull(),
    addedAt: integer('added_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    note: text('note'),
  },
  (t) => [
    primaryKey({ columns: [t.citeListId, t.factorId] }),
    index('ef_cite_list_items_list_idx').on(t.citeListId),
  ],
);

export const efSearchHistory = sqliteTable(
  'ef_search_history',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    query: text('query').notNull(),
    searchedAt: integer('searched_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index('ef_search_user_idx').on(t.userId)],
);

/**
 * SustainIQ query log. One row per successfully streamed answer.
 *
 * Dual purpose:
 *   1. User-visible history — replaces / mirrors the localStorage store at
 *      src/app/ask/_lib/history.ts so chat history is cross-device and
 *      survives cache clears.
 *   2. Admin observability — question trends, answer quality, latency,
 *      token consumption, thumbs feedback. Feeds a future analytics page.
 *
 * Populated by the client: POST /api/ask/log after the stream closes. The
 * Vercel stream route is a pure passthrough to the HF ask-server and
 * cannot see the final text, so the browser (which assembled the full
 * answer) is the only place with the complete record.
 */
export const sustainiqQueries = sqliteTable(
  'sustainiq_queries',
  {
    // Client-generated UUID — same id as the HistoryEntry.id in
    // localStorage, so the two stores stay in lockstep.
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    query: text('query').notNull(),
    answer: text('answer').notNull(),
    // JSON-stringified arrays of {document, section, pages, course} and
    // {courseId, courseTitle, lessonId, lessonTitle, url}.
    sources: text('sources'),
    lessons: text('lessons'),
    // Generation metadata.
    model: text('model'),
    reviseCount: integer('revise_count').default(0),
    latencyMs: integer('latency_ms'),
    tokensIn: integer('tokens_in'),
    tokensOut: integer('tokens_out'),
    // Cap / tier snapshot at query time.
    tier: text('tier'),
    // 'success' | 'error' | 'aborted' (client stopped the stream early).
    status: text('status').notNull().default('success'),
    errorMessage: text('error_message'),
    // 'up' | 'down' | null. Mutable after insert via PATCH.
    feedback: text('feedback'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index('sustainiq_user_idx').on(t.userId, t.createdAt),
    index('sustainiq_created_idx').on(t.createdAt),
  ],
);

/**
 * LLM Governor usage counters.
 *
 * One row per (feature, subject, period). `used` is incremented
 * atomically via INSERT ... ON CONFLICT DO UPDATE so parallel requests
 * and cold-start instances cannot both pass a cap that has been hit.
 * This is the durable source of truth for freemium caps; the previous
 * in-memory Map was effectively unenforceable on Vercel.
 *
 * period_key format:
 *   monthly -> YYYY-MM
 *   daily   -> YYYY-MM-DD
 * Old rows stay in the table (historical counts); they're simply ignored
 * once the period_key rolls over.
 */
export const llmUsage = sqliteTable(
  'llm_usage',
  {
    feature: text('feature').notNull(),
    subject: text('subject').notNull(),
    periodKey: text('period_key').notNull(),
    used: integer('used').notNull().default(0),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    primaryKey({ columns: [t.feature, t.subject, t.periodKey] }),
    index('llm_usage_subject_idx').on(t.subject),
  ],
);

// ─── Phase 3: User preferences ─────────────────────────────────────────────
// One row per Clerk user, holding workspace-scoped toggles (which tools
// are enabled, which email notifications to send). Read from the
// dashboard Settings tab; written through /api/preferences.
export const userPreferences = sqliteTable(
  'user_preferences',
  {
    userId: text('user_id').primaryKey(),
    // JSON string: { "ghg-calculator": true, "report-drafter": false, ... }
    toolsEnabled: text('tools_enabled').notNull().default('{}'),
    // JSON string: { jobAlerts: bool, courseUpdates: bool, weeklyDigest: bool, productNews: bool }
    notificationPrefs: text('notification_prefs').notNull().default('{}'),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
);

// ─── Phase 2: Usage events ─────────────────────────────────────────────────
// Append-only log of metered actions. Dashboard tile reads today/month
// counts. SustainIQ / Report endpoints check quota before proceeding.
// Kind values:
//   'sustainiq_query'   — one SustainIQ question answered
//   'report_generated'  — one Report Drafter export completed
//   'export_csv'        — a CSV download from /carbon/market or similar
//   'watchlist_created' — a saved filter/retirer in the carbon market
// metadata JSON carries kind-specific details (e.g., query text, report type).
export const usageEvents = sqliteTable(
  'usage_events',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: text('user_id').notNull(),
    kind: text('kind').notNull(),
    metadata: text('metadata'),
    ts: integer('ts', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index('usage_user_ts_idx').on(t.userId, t.ts),
    index('usage_kind_ts_idx').on(t.kind, t.ts),
  ],
);

export const userResumes = sqliteTable(
  'user_resumes',
  {
    userId: text('user_id').primaryKey(),
    fileName: text('file_name').notNull(),
    mimeType: text('mime_type').notNull(),
    // Key of the object in the private greentryst-resumes R2 bucket.
    // The raw PDF/DOCX is stored there permanently (until the user deletes
    // their resume) so we can re-parse, let the user re-download, or
    // diagnose failures without re-upload.
    fileR2Key: text('file_r2_key').notNull(),
    // 'uploading' | 'scanning' | 'parsing' | 'ready' | 'error' | 'infected'
    // 'infected' is a terminal state set by the ClamAV scan step in
    // /api/resume/process. Infected rows are never promoted to 'ready',
    // and /api/resume/file refuses to serve anything that isn't 'ready'.
    // No schema migration needed (text column, no enum constraint).
    status: text('status').notNull().default('uploading'),
    extractedText: text('extracted_text'),
    embedding: text('embedding'), // JSON stringified Float32Array
    profile: text('profile'), // JSON: {skills, frameworks, seniority, domains}
    error: text('error'), // For storing failure reasons
    uploadedAt: integer('uploaded_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    processedAt: integer('processed_at', { mode: 'timestamp' }),
  },
  (t) => [index('resumes_uploaded_idx').on(t.uploadedAt)],
);

// ─── Assessor (Gap Assessment tools) ─────────────────────────────────────
// Product: Greentryst Assessor. Per-clause structured self-check with a
// deterministic slot-filled draft disclosure. One org per account in v1.
// Tool identity is carried as a slug (e.g. 'ifrs-s2-gap-assessment') that
// matches the authored YAML file; no DB-level tool registry in v1.
// Full spec: brainstorming/ASSESSOR_PRODUCT_DEFINITION.md.

export const assessments = sqliteTable(
  'assessments',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    // Slug of the Assessor tool (e.g. 'ifrs-s2-gap-assessment'). Matches
    // the key used to load authored YAML content.
    toolSlug: text('tool_slug').notNull(),
    reportingYear: integer('reporting_year').notNull(),
    // ISO dates (YYYY-MM-DD) for reporting period bounds.
    reportingPeriodStart: text('reporting_period_start'),
    reportingPeriodEnd: text('reporting_period_end'),
    // Assessment-level metadata, captured once at bootstrap.
    companyName: text('company_name').notNull(),
    sector: text('sector'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index('assessments_user_idx').on(t.userId),
    index('assessments_user_tool_year_idx').on(t.userId, t.toolSlug, t.reportingYear),
  ],
);

// One row per question per assessment. Keyed on questionId (not clauseId)
// so the shape stays forward-compatible with a future CanonicalQuestion
// layer enabling cross-framework answer reuse.
// value shape by question type:
//   yes_no            -> text: 'yes' | 'no'
//   year              -> integer stored as text
//   named_entity      -> free text
//   number_with_unit  -> number stored as text
//   multi_select      -> JSON array of option keys
//   qualitative_verdict -> verdict + rationaleText (see columns below)
export const assessmentResponses = sqliteTable(
  'assessment_responses',
  {
    assessmentId: text('assessment_id').notNull(),
    questionId: text('question_id').notNull(),
    clauseRef: text('clause_ref').notNull(),
    value: text('value'),
    // Only set on qualitative_verdict questions or user-chosen clause verdicts.
    // One of: 'met' | 'not_met' | 'partially_met' | 'not_applicable'.
    verdict: text('verdict'),
    rationaleText: text('rationale_text'),
    // Optional per-answer document reference. JSON:
    //   { label: string, pageOrSection: string, fileRef?: string }
    documentReference: text('document_reference'),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    primaryKey({ columns: [t.assessmentId, t.questionId] }),
    index('assessment_responses_assessment_idx').on(t.assessmentId),
    index('assessment_responses_clause_idx').on(t.assessmentId, t.clauseRef),
  ],
);

// Derived cache. One row per (assessment, clause). Recomputed server-side
// whenever any response under the clause changes. Verdict values:
//   'met' | 'not_met' | 'auto_not_met' | 'partially_met' | 'not_applicable' | 'empty'
export const clauseVerdictRollups = sqliteTable(
  'clause_verdict_rollups',
  {
    assessmentId: text('assessment_id').notNull(),
    clauseRef: text('clause_ref').notNull(),
    verdict: text('verdict').notNull(),
    // Question id of the gateway that blocked the clause, if verdict is
    // 'auto_not_met'. Powers the "Blocked by" tag in the gap list.
    blockedByQuestionId: text('blocked_by_question_id'),
    lastComputedAt: integer('last_computed_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    primaryKey({ columns: [t.assessmentId, t.clauseRef] }),
    index('clause_rollups_assessment_idx').on(t.assessmentId),
  ],
);

// Derived cache. One row per (assessment, clause) that has a rendered
// draft. Suppressed for clauses where verdict is not 'met' -- those render
// the illustrative fallback from disclosures.yaml instead.
export const draftDisclosures = sqliteTable(
  'draft_disclosures',
  {
    assessmentId: text('assessment_id').notNull(),
    clauseRef: text('clause_ref').notNull(),
    // 'draft_available' | 'blocked_illustrative_only'.
    status: text('status').notNull(),
    renderedText: text('rendered_text'),
    renderedAt: integer('rendered_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    primaryKey({ columns: [t.assessmentId, t.clauseRef] }),
    index('draft_disclosures_assessment_idx').on(t.assessmentId),
  ],
);

// Stub. Buttons are wired in v1 but the export format is TBD; rows
// record that a user requested an export so demand can be measured.
export const assessmentExportJobs = sqliteTable(
  'assessment_export_jobs',
  {
    id: text('id').primaryKey(),
    assessmentId: text('assessment_id').notNull(),
    // 'csv' | 'pdf'.
    format: text('format').notNull(),
    // 'requested' | 'processing' | 'ready' | 'error'.
    status: text('status').notNull().default('requested'),
    requestedAt: integer('requested_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    completedAt: integer('completed_at', { mode: 'timestamp' }),
    // R2 object key for the generated file, once export format is locked.
    fileR2Key: text('file_r2_key'),
  },
  (t) => [
    index('export_jobs_assessment_idx').on(t.assessmentId),
    index('export_jobs_requested_idx').on(t.requestedAt),
  ],
);
