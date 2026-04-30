/**
 * AskClientRedesign
 *
 * Redesigned SustainIQ surface for /redesign/ask. Integrated with the
 * full streaming pipeline (intent -> plan -> retrieval -> synthesis ->
 * factcheck -> revise) exposed by POST /api/ask/stream.
 *
 * Preserves the existing layout, sidebar, empty state, floating input,
 * toast, feedback bar, and share-link auto-fire. Swaps only the data
 * layer and splices in pipeline-specific UI (research plan, grounding
 * notice, timings, source drawer, provisional/verified chip).
 */

'use client';

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  type FormEvent,
  type ReactNode,
} from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { Lock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Sparkles,
  Send,
  ArrowRight,
  Thermometer,
  Factory,
  FileText,
  Coins,
  Target,
  Landmark,
  RotateCw,
  AlertCircle,
  History,
  Search,
  X,
  Copy,
  Share2,
  ThumbsUp,
  ThumbsDown,
  Check,
  Menu,
  Trash2,
  ShieldCheck,
  Clock,
  ChevronDown,
  Download,
  type LucideIcon,
} from 'lucide-react';
import {
  loadHistory,
  addHistoryEntry,
  updateHistoryEntry,
  removeHistoryEntry,
  clearHistory,
  searchHistory,
  newHistoryId,
  formatRelativeTime,
  type HistoryEntry,
} from '../_lib/history';
import {
  QUERY_LIBRARY,
  FEATURED_QUERY_IDS,
  pickFeaturedQueries,
} from '../_lib/query-library';
import { cn } from '@/components/redesign/lib/cn';
import type {
  Phase,
  Intent,
  Topic,
  PipelineSource,
  GroundingStats,
  Timings,
  CitationParts,
} from '../_lib/pipeline-types';
import { PHASE_LABELS, PHASE_ORDER, isLoadingPhase } from '../_lib/phases';
import { parseCitation, findSentenceForCitation, renderWithCitations } from '../_lib/citations';
import { iterSSE } from '../_lib/sse';
import { useResolver } from '../_lib/resolver';
import { SourceDrawer } from './SourceDrawer';

/* ============================================================
   Data shapes
   ============================================================ */

// Source shape stored in history (backward compat - old entries use this).
interface HistoricSource {
  document: string;
  section: string;
  pages: string;
  course: string;
}

// Extended source used internally; keeps history-shape fields plus the
// pipeline-only fields (content, type, vec_score) needed for drawer
// search-hint seeding.
interface Source extends HistoricSource {
  content?: string;
  type?: string;
  vec_score?: number;
}

interface LessonLink {
  courseId: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  url: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  lessons?: LessonLink[];
  isError?: boolean;
}

function pipelineSourceToHistory(s: PipelineSource): Source {
  return {
    document: s.doc_title,
    section: s.section_title,
    pages: s.page,
    course: s.course,
    content: s.content,
    type: s.type,
    vec_score: s.vec_score,
  };
}

/* ============================================================
   Example query icons (for the empty state featured cards)
   ============================================================ */

// Icon + label per QUERY_LIBRARY category. The shuffled featured queries
// look up their tile style from here, so any query from any category
// renders with the right icon and heading — not just the original six.
const CATEGORY_META: Record<string, { Icon: LucideIcon; label: string }> = {
  'climate-science': { Icon: Thermometer, label: 'Climate Science' },
  'ghg-accounting': { Icon: Factory, label: 'GHG Accounting' },
  'esg-reporting': { Icon: FileText, label: 'ESG Reporting' },
  'carbon-markets': { Icon: Coins, label: 'Carbon Markets' },
  targets: { Icon: Target, label: 'Targets' },
  'eu-regulation': { Icon: Landmark, label: 'EU Regulation' },
};

// Reverse index so we can find the right CATEGORY_META entry for any
// query string — used by the featured tiles below.
const QUERY_TO_CATEGORY_ID: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const cat of QUERY_LIBRARY) {
    for (const q of cat.queries) out[q] = cat.id;
  }
  return out;
})();

/* ============================================================
   Loading step labels (map phases -> user-facing label).
   ============================================================ */

const LOADING_STEPS: { phase: Phase; label: string }[] = [
  { phase: 'intent', label: 'READING QUERY' },
  { phase: 'retrieval', label: 'SEARCHING 530+ DOCUMENTS' },
  { phase: 'synthesis', label: 'DRAFTING ANSWER' },
  { phase: 'factcheck', label: 'FACT-CHECKING' },
  { phase: 'revise', label: 'REVISING' },
];

/* ============================================================
   Main component
   ============================================================ */

export function AskClientRedesign() {
  // Legacy "messages" mirror kept so the existing MessageStream UI keeps
  // working during and after the pipeline swap.
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  // Pipeline state
  const [phase, setPhase] = useState<Phase>('idle');
  const [intent, setIntent] = useState<Intent | null>(null);
  const [topics, setTopics] = useState<Topic[] | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [draft, setDraft] = useState('');
  const [revised, setRevised] = useState<string | null>(null);
  const [grounding, setGrounding] = useState<GroundingStats | null>(null);
  const [timings, setTimings] = useState<Timings | null>(null);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [activeCitation, setActiveCitation] = useState<CitationParts | null>(null);

  // Server health
  const [serverHealth, setServerHealth] = useState<'checking' | 'up' | 'down'>(
    'checking'
  );
  const [healthInfo, setHealthInfo] = useState<string>('');

  // History state
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [historyQuery, setHistoryQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Featured query tiles on the empty state. Start with the deterministic
  // FEATURED_QUERY_IDS so SSR and the first client render match (no
  // hydration warning), then swap in a shuffled pick on mount so each
  // page open shows a different mix pulled from QUERY_LIBRARY.
  const [featuredQueries, setFeaturedQueries] =
    useState<string[]>(FEATURED_QUERY_IDS);
  useEffect(() => {
    setFeaturedQueries(pickFeaturedQueries());
  }, []);

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const { isLoaded: authLoaded, isSignedIn } = useUser();
  // Treat "Clerk still loading" as signed-out so the signed-in CTA never
  // briefly flashes for anonymous visitors. Signed-in users see the
  // sign-in pill for one render at most before the hook resolves.
  const requiresSignIn = !isSignedIn;
  const signInHref = `/sign-in?redirect_url=${encodeURIComponent(
    pathname || '/ask',
  )}`;

  const resolver = useResolver();

  const isLoading = isLoadingPhase(phase);
  const showText = revised ?? draft;
  const isProvisional = revised === null && draft.length > 0;

  // Load history on mount. Start with localStorage (instant render), then
  // try to hydrate from the cloud (covers cross-device + cache-clear). The
  // cloud response is merged by id so anything newer on the server wins.
  useEffect(() => {
    const local = loadHistory();
    setHistory(local);
    (async () => {
      try {
        const resp = await fetch('/api/ask/history?limit=100', {
          method: 'GET',
          cache: 'no-store',
        });
        if (!resp.ok) return;
        const { entries } = (await resp.json()) as { entries: HistoryEntry[] };
        if (!Array.isArray(entries)) return;
        const byId = new Map<string, HistoryEntry>();
        for (const e of local) byId.set(e.id, e);
        for (const e of entries) byId.set(e.id, e);
        const merged = Array.from(byId.values()).sort(
          (a, b) => b.timestamp - a.timestamp,
        );
        setHistory(merged);
      } catch {
        // silent — localStorage already rendered
      }
    })();
  }, []);

  // Health check on mount. Skip for anonymous visitors — the /api/ask
  // GET probe is gated by Clerk middleware and would 401, surfacing as
  // a misleading "Unavailable" state on a perfectly healthy pipeline.
  // Signed-out users see the sign-in CTA instead.
  useEffect(() => {
    if (!authLoaded) return;
    if (!isSignedIn) {
      // Health probe lives behind the same Clerk middleware as the
      // streaming endpoint. Anonymous probes 401, which would surface
      // as a misleading "Unavailable" pill on a healthy pipeline.
      setServerHealth('up');
      setHealthInfo('Sign in to ask');
      return;
    }
    fetch('/api/ask')
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (r.ok && data.status === 'ok') {
          setServerHealth('up');
          const c = data.chunks?.toLocaleString?.() ?? data.chunks;
          const d = data.definitions?.toLocaleString?.() ?? data.definitions;
          const f = data.formulas?.toLocaleString?.() ?? data.formulas;
          setHealthInfo(`${c} chunks · ${d} defs · ${f} formulas`);
        } else {
          setServerHealth('down');
          setHealthInfo(data.hint || 'Ask server unreachable');
        }
      })
      .catch(() => {
        setServerHealth('down');
        setHealthInfo('Ask server unreachable');
      });
  }, [authLoaded, isSignedIn]);

  // Scroll the new result into view only when the message count changes.
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages.length]);

  // Focus input on mount
  useEffect(() => {
    if (messages.length === 0) {
      inputRef.current?.focus();
    }
  }, [messages.length]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(id);
  }, [toast]);

  // Mirror pipeline state into the legacy `messages` array so the
  // existing MessageStream UI keeps rendering without a bigger rewrite.
  useEffect(() => {
    if (messages.length < 2) return;
    const assistantIdx = messages.length - 1;
    const current = messages[assistantIdx];
    if (current?.role !== 'assistant') return;
    const nextContent = pipelineError ? pipelineError : showText;
    const nextSources = sources.length > 0 ? sources : current.sources;
    if (
      current.content === nextContent &&
      current.sources === nextSources &&
      !!current.isError === !!pipelineError
    ) {
      return;
    }
    setMessages((prev) => {
      const updated = [...prev];
      updated[assistantIdx] = {
        role: 'assistant',
        content: nextContent,
        sources: nextSources,
        isError: !!pipelineError,
      };
      return updated;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showText, sources, pipelineError]);

  function resetPipelineState() {
    setPhase('idle');
    setIntent(null);
    setTopics(null);
    setSources([]);
    setDraft('');
    setRevised(null);
    setGrounding(null);
    setTimings(null);
    setPipelineError(null);
  }

  /* ==========================================================
     Query execution - new streaming pipeline
     ========================================================== */

  const runQuery = useCallback(async (query: string) => {
    const entryId = newHistoryId();
    setActiveHistoryId(entryId);
    setMessages([
      { role: 'user', content: query },
      { role: 'assistant', content: '' },
    ]);

    resetPipelineState();
    setPhase('intent');

    let finalAnswer = '';
    let finalSources: Source[] = [];

    try {
      const response = await fetch('/api/ask/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, enable_revise: true }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const msg =
          err.error || `Server returned ${response.status}. Please try again.`;
        setPipelineError(msg);
        setPhase('idle');
        return;
      }

      if (!response.body) {
        setPipelineError('No response stream from server.');
        setPhase('idle');
        return;
      }

      let draftAccum = '';
      let sourcesAccum: Source[] = [];

      for await (const evt of iterSSE(response.body)) {
        switch (evt.type) {
          case 'phase':
            setPhase(evt.phase);
            break;
          case 'intent':
            setIntent(evt.intent);
            break;
          case 'topics':
            setTopics(evt.topics);
            break;
          case 'sources': {
            const mapped = (evt.sources as PipelineSource[]).map(
              pipelineSourceToHistory
            );
            sourcesAccum = mapped;
            finalSources = mapped;
            setSources(mapped);
            break;
          }
          case 'draft_token':
            draftAccum += evt.delta;
            finalAnswer = draftAccum;
            setDraft(draftAccum);
            break;
          case 'grounding':
            setGrounding(evt.stats);
            break;
          case 'revised':
            finalAnswer = evt.answer;
            setRevised(evt.answer);
            break;
          case 'timings':
            setTimings(evt.timings);
            break;
          case 'error':
            setPipelineError(evt.message);
            setPhase('idle');
            return;
        }
      }

      setPhase('done');

      if (finalAnswer) {
        const entry: HistoryEntry = {
          id: entryId,
          query,
          answer: finalAnswer,
          sources: finalSources.map((s) => ({
            document: s.document,
            section: s.section,
            pages: s.pages,
            course: s.course,
          })),
          lessons: [],
          timestamp: Date.now(),
          feedback: null,
        };
        setHistory(addHistoryEntry(entry));
        // Persist to cloud for cross-device history + admin observability.
        // Fire-and-forget; localStorage is the fast path, DB is durable.
        void fetch('/api/ask/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: entry.id,
            query: entry.query,
            answer: entry.answer,
            sources: entry.sources,
            lessons: entry.lessons,
            status: 'success',
          }),
        }).catch(() => {
          // Silent — user still has localStorage. Retry on next query.
        });
      }
    } catch (e) {
      const msg =
        e instanceof Error
          ? `Network error: ${e.message}`
          : 'Network error. Please check your connection and try again.';
      setPipelineError(msg);
      setPhase('idle');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-fire a query from the URL on initial load (share link support).
  // Wait for Clerk to settle, and skip when signed-out — the request would
  // 401 and the user has no way to recover from a half-rendered "asking"
  // state.
  useEffect(() => {
    if (!authLoaded) return;
    if (!isSignedIn) return;
    const urlQuery = searchParams?.get('q');
    if (urlQuery && messages.length === 0 && !isLoading) {
      runQuery(urlQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, authLoaded, isSignedIn]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const query = input.trim();
    if (!query) return;
    if (isLoading) return;
    if (requiresSignIn) {
      // Preserve the typed query through sign-in by attaching it as ?q=
      // on the post-auth redirect, so the user lands back on /ask with
      // their question ready to fire.
      const dest = `${pathname || '/ask'}?q=${encodeURIComponent(query)}`;
      window.location.href = `/sign-in?redirect_url=${encodeURIComponent(dest)}`;
      return;
    }
    if (serverHealth === 'down') return;
    setInput('');
    runQuery(query);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  }

  function resetConversation() {
    setMessages([]);
    setActiveHistoryId(null);
    setInput('');
    resetPipelineState();
    inputRef.current?.focus();
  }

  function restoreHistoryEntry(entry: HistoryEntry) {
    setActiveHistoryId(entry.id);
    resetPipelineState();
    setMessages([
      { role: 'user', content: entry.query },
      {
        role: 'assistant',
        content: entry.answer,
        sources: entry.sources,
        lessons: entry.lessons,
      },
    ]);
    // Best-effort: preload the historic answer into `revised` so citation
    // rendering works on restored entries too.
    setRevised(entry.answer);
    setSources(entry.sources as Source[]);
    setPhase('done');
    setIsSidebarOpen(false);
  }

  function removeHistoryItem(id: string) {
    setHistory(removeHistoryEntry(id));
    if (activeHistoryId === id) resetConversation();
  }

  function clearAllHistory() {
    clearHistory();
    setHistory([]);
    resetConversation();
  }

  function handleFeedback(id: string | null, feedback: 'up' | 'down') {
    if (!id) return;
    const next = updateHistoryEntry(id, { feedback });
    setHistory(next);
    setToast(feedback === 'up' ? 'Thanks for the thumbs up' : 'Feedback noted');
    // Mirror the thumb into the cloud log. Fire-and-forget; localStorage
    // already carries the user-visible change.
    void fetch(`/api/ask/log/${encodeURIComponent(id)}/feedback`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback }),
    }).catch(() => {
      // Silent — next time the feedback lands the /log POST covers the row.
    });
  }

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setToast('Answer copied to clipboard');
    } catch {
      setToast('Could not copy answer');
    }
  }

  async function handleShare(query: string) {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/redesign/ask?q=${encodeURIComponent(query)}`;
    try {
      await navigator.clipboard.writeText(url);
      setToast('Share link copied to clipboard');
    } catch {
      setToast('Could not copy share link');
    }
  }

  async function handleDownloadPdf() {
    if (typeof window === 'undefined') return;
    const answerText = revised ?? draft;
    const queryText =
      messages[0]?.role === 'user' ? messages[0].content : '';
    if (!queryText || !answerText) return;
    try {
      setToast('Preparing PDF...');
      const [{ pdf }, { AnswerPdfDocument }, exportMod] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./AnswerPdfDocument'),
        import('../_lib/pdf-export'),
      ]);
      const data = await exportMod.buildPdfExportData({
        query: queryText,
        answer: answerText,
        origin: window.location.origin,
        grounding,
        resolverCache: resolver.cache,
      });
      // Verify logo is fetchable before passing to react-pdf. If it's missing
      // or blocked, react-pdf throws and aborts the whole PDF. Falling back to
      // the text wordmark keeps the export working.
      let logoUrl: string | undefined;
      try {
        const candidate = `${window.location.origin}/brand/logo-light.png`;
        const r = await fetch(candidate, { method: 'HEAD' });
        if (r.ok) logoUrl = candidate;
      } catch {
        logoUrl = undefined;
      }
      const blob = await pdf(
        <AnswerPdfDocument data={data} logoUrl={logoUrl} />
      ).toBlob();
      const filename = `greentryst-sustainiq-${exportMod.slugForFilename(
        queryText
      )}-${exportMod.todayYYYYMMDD()}.pdf`;
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
      setToast('PDF downloaded');
    } catch (err) {
      console.error('PDF export failed', err);
      setToast('Could not generate PDF');
    }
  }

  // Resolver handlers used across the answer body and sources grid.
  const handleCitationClick = useCallback(
    (cit: CitationParts) => {
      void resolver.resolveCitation(cit);
      setActiveCitation(cit);
    },
    [resolver]
  );

  const findSourceContent = useCallback(
    (cit: CitationParts): string | undefined => {
      if (!sources.length) return undefined;
      const targetDoc = cit.docTitle.toLowerCase();
      const targetPage = cit.page;
      let match = sources.find(
        (s) =>
          s.document.toLowerCase().includes(targetDoc) &&
          String(s.pages).includes(targetPage)
      );
      if (!match) match = sources.find((s) => s.document.toLowerCase().includes(targetDoc));
      return match?.content;
    },
    [sources]
  );

  const answerForClaims = showText;
  const filteredHistory = searchHistory(history, historyQuery);
  const currentAnswer =
    messages[1]?.role === 'assistant' ? messages[1] : undefined;
  const currentEntry = history.find((e) => e.id === activeHistoryId);
  const currentFeedback = currentEntry?.feedback ?? null;

  const currentLoadingStepIdx = useMemo(() => {
    const idx = LOADING_STEPS.findIndex((s) => s.phase === phase);
    if (idx >= 0) return idx;
    // "plan" falls under READING QUERY (pre-retrieval).
    if (phase === 'plan') return 0;
    return 0;
  }, [phase]);

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-gt-bg-pale">
      {/* Sidebar overlay for mobile */}
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 top-16 z-30 bg-gt-text/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* History sidebar */}
      <aside
        className={cn(
          'flex-shrink-0 w-[280px] bg-white border-r border-gt-border-light flex flex-col z-40',
          'lg:sticky lg:top-16 lg:h-[calc(100vh-64px)]',
          'fixed top-16 bottom-0 left-0 transition-transform duration-200 ease-out lg:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <HistorySidebar
          history={filteredHistory}
          totalCount={history.length}
          searchQuery={historyQuery}
          onSearchChange={setHistoryQuery}
          activeId={activeHistoryId}
          onSelect={restoreHistoryEntry}
          onRemove={removeHistoryItem}
          onClearAll={clearAllHistory}
          onNewQuery={resetConversation}
          onClose={() => setIsSidebarOpen(false)}
          serverHealth={serverHealth}
          healthInfo={healthInfo}
        />
      </aside>

      {/* Main workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-16 z-20 bg-gt-bg-pale/95 backdrop-blur-sm border-b border-gt-border-light px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white border border-gt-border-light text-gt-text hover:bg-gt-medium/[0.04]"
            aria-label="Open history"
          >
            <Menu className="w-4 h-4" strokeWidth={2} />
          </button>
          <p
            className="text-[11px] font-bold uppercase text-gt-medium"
            style={{
              letterSpacing: '0.2em',
              fontFamily:
                'var(--font-jetbrains-mono), JetBrains Mono, monospace',
            }}
          >
            SustainIQ
          </p>
          <div className="ml-auto">
            <HealthPill health={serverHealth} info={healthInfo} compact />
          </div>
        </div>

        <main className="flex-1 w-full">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-14 pb-10 lg:pt-24 lg:pb-14">
            {messages.length === 0 ? (
              <EmptyState
                onPickQuery={(q) => {
                  setInput(q);
                  inputRef.current?.focus();
                }}
                featuredQueries={featuredQueries}
              />
            ) : (
              <MessageStream
                messages={messages}
                isLoading={isLoading}
                phase={phase}
                intent={intent}
                topics={topics}
                grounding={grounding}
                timings={timings}
                isProvisional={isProvisional}
                loadingStep={currentLoadingStepIdx}
                onReset={resetConversation}
                onCopy={handleCopy}
                onShare={handleShare}
                onFeedback={(f) => handleFeedback(activeHistoryId, f)}
                currentFeedback={currentFeedback}
                onCitationClick={handleCitationClick}
                onCitationHover={resolver.handleHover}
                onDownloadPdf={handleDownloadPdf}
                canDownloadPdf={
                  !!showText && (phase === 'done' || revised !== null)
                }
              />
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Floating input bar */}
        <div className="sticky bottom-0 z-10 pb-5 pt-3 px-4 sm:px-6 pointer-events-none">
          <form
            onSubmit={handleSubmit}
            className="max-w-4xl mx-auto pointer-events-auto"
          >
            <div className="relative flex items-end gap-3 bg-white/95 backdrop-blur-md border border-gt-border-light rounded-2xl p-3 shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.12),0_4px_16px_-4px_rgba(0,0,0,0.08)] focus-within:border-gt-medium focus-within:ring-2 focus-within:ring-gt-medium/15 transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder={
                  requiresSignIn
                    ? 'Sign in to ask SustainIQ a question...'
                    : serverHealth === 'down'
                    ? 'Pipeline server unavailable...'
                    : 'Ask anything about sustainability frameworks, standards, or methodologies...'
                }
                className="flex-1 resize-none bg-transparent text-[15px] text-gt-text placeholder:text-gt-text-dim focus:outline-none px-3 py-2.5 max-h-40 overflow-y-auto"
                style={{ minHeight: '44px' }}
                disabled={isLoading || serverHealth === 'down'}
              />
              {requiresSignIn ? (
                <Link
                  href={signInHref}
                  className="flex-shrink-0 inline-flex items-center gap-2 h-11 px-4 rounded-xl bg-gt-medium text-white text-[13px] font-semibold hover:bg-gt-deepest transition-colors shadow-[0_4px_14px_-6px_rgba(11,61,46,0.6)]"
                >
                  <Lock className="w-4 h-4" strokeWidth={2.5} />
                  Sign in to ask
                </Link>
              ) : (
                <button
                  type="submit"
                  disabled={
                    !input.trim() || isLoading || serverHealth === 'down'
                  }
                  className="flex-shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gt-medium text-white hover:bg-gt-deepest disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-[0_4px_14px_-6px_rgba(11,61,46,0.6)]"
                  aria-label="Send query"
                >
                  <Send className="w-4 h-4" strokeWidth={2.5} />
                </button>
              )}
            </div>
            <div
              className="mt-2 flex items-center justify-between px-2"
              style={{
                fontFamily:
                  'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                letterSpacing: '0.06em',
              }}
            >
              <p className="text-[10px] text-gt-text-dim">
                ENTER TO SEARCH · SHIFT+ENTER FOR NEW LINE
              </p>
              {input.length > 0 && (
                <p className="text-[10px] text-gt-text-dim tabular-nums">
                  {countWords(input)} WORDS · {input.length} CHARS
                </p>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Source drawer */}
      <SourceDrawer
        citation={activeCitation}
        sourceContent={
          activeCitation ? findSourceContent(activeCitation) : undefined
        }
        claimSentence={
          activeCitation
            ? findSentenceForCitation(answerForClaims, activeCitation.raw)
            : undefined
        }
        resolveCache={resolver.cache}
        resolveCitation={resolver.resolveCitation}
        onClose={() => setActiveCitation(null)}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl bg-gt-text text-white text-[13px] font-semibold shadow-[0_16px_40px_-12px_rgba(0,0,0,0.45)] ring-1 ring-inset ring-white/10 flex items-center gap-2">
          <Check className="w-4 h-4 text-gt-leaf" strokeWidth={2.5} />
          {toast}
        </div>
      )}
    </div>
  );
}

function countWords(s: string): number {
  const trimmed = s.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/* ============================================================
   Health pill
   ============================================================ */

function HealthPill({
  health,
  info,
  compact = false,
}: {
  health: 'checking' | 'up' | 'down';
  info: string;
  compact?: boolean;
}) {
  const dot =
    health === 'up'
      ? 'bg-emerald-500'
      : health === 'down'
      ? 'bg-rose-500'
      : 'bg-gt-text-dim';
  const text =
    health === 'up' ? 'Ready' : health === 'down' ? 'Unavailable' : 'Checking';
  const tone =
    health === 'up'
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
      : health === 'down'
      ? 'text-rose-700 bg-rose-50 border-rose-200'
      : 'text-gt-text-muted bg-white border-gt-border-light';

  return (
    <span
      title={info || text}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
        tone
      )}
      style={{
        fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
        letterSpacing: '0.12em',
      }}
    >
      <span className={cn('inline-block w-1.5 h-1.5 rounded-full', dot)} />
      {compact ? text.toUpperCase() : `SERVER · ${text.toUpperCase()}`}
    </span>
  );
}

/* ============================================================
   History sidebar
   ============================================================ */

function HistorySidebar({
  history,
  totalCount,
  searchQuery,
  onSearchChange,
  activeId,
  onSelect,
  onRemove,
  onClearAll,
  onNewQuery,
  onClose,
  serverHealth,
  healthInfo,
}: {
  history: HistoryEntry[];
  totalCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeId: string | null;
  onSelect: (entry: HistoryEntry) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
  onNewQuery: () => void;
  onClose: () => void;
  serverHealth: 'checking' | 'up' | 'down';
  healthInfo: string;
}) {
  return (
    <>
      <div className="px-5 py-5 border-b border-gt-border-light flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <History className="w-4 h-4 text-gt-medium" strokeWidth={2.5} />
          <p
            className="text-[10px] font-bold uppercase text-gt-medium"
            style={{
              letterSpacing: '0.2em',
              fontFamily:
                'var(--font-jetbrains-mono), JetBrains Mono, monospace',
            }}
          >
            History · {totalCount}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sidebar"
          className="lg:hidden text-gt-text-dim hover:text-gt-text"
        >
          <X className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>

      <div className="px-5 pt-4 pb-2">
        <button
          type="button"
          onClick={onNewQuery}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gt-medium text-white text-[13px] font-bold hover:bg-gt-deepest transition-colors shadow-[0_4px_14px_-6px_rgba(11,61,46,0.6)]"
        >
          <Sparkles className="w-4 h-4" strokeWidth={2.5} />
          New query
        </button>
      </div>

      {totalCount > 0 && (
        <div className="px-5 pt-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gt-text-dim pointer-events-none"
              strokeWidth={2}
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search history"
              className="w-full pl-9 pr-8 py-2 rounded-lg bg-gt-border-light/40 border border-transparent focus:border-gt-medium focus:bg-white focus:outline-none text-[13px] text-gt-text placeholder:text-gt-text-dim transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gt-text-dim hover:text-gt-text"
              >
                <X className="w-3 h-3" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {history.length === 0 ? (
          <div className="px-3 py-6 text-center">
            <p className="text-[12px] text-gt-text-dim leading-relaxed">
              {totalCount === 0
                ? 'Your past queries will appear here.'
                : 'No matches for your search.'}
            </p>
          </div>
        ) : (
          <ul className="space-y-0.5">
            {history.map((entry) => (
              <li key={entry.id}>
                <HistoryItem
                  entry={entry}
                  isActive={activeId === entry.id}
                  onSelect={() => onSelect(entry)}
                  onRemove={() => onRemove(entry.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </nav>

      <div className="px-5 py-3 border-t border-gt-border-light flex items-center justify-between gap-2">
        <HealthPill health={serverHealth} info={healthInfo} />
        {totalCount > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex items-center gap-1 text-[10px] text-gt-text-dim hover:text-rose-600 transition-colors"
            title="Clear all history"
          >
            <Trash2 className="w-3 h-3" strokeWidth={2} />
            Clear
          </button>
        )}
      </div>
    </>
  );
}

function HistoryItem({
  entry,
  isActive,
  onSelect,
  onRemove,
}: {
  entry: HistoryEntry;
  isActive: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={cn(
        'group relative rounded-lg transition-colors',
        isActive ? 'bg-gt-medium/[0.08]' : 'hover:bg-gt-medium/[0.04]'
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="w-full text-left px-3 py-2.5 pr-9"
      >
        <p
          className={cn(
            'text-[13px] leading-snug line-clamp-2',
            isActive ? 'text-gt-deepest font-semibold' : 'text-gt-text'
          )}
        >
          {entry.query}
        </p>
        <p
          className="mt-1 text-[10px] text-gt-text-dim"
          style={{
            letterSpacing: '0.06em',
            fontFamily:
              'var(--font-jetbrains-mono), JetBrains Mono, monospace',
          }}
        >
          {formatRelativeTime(entry.timestamp)}
          {entry.feedback === 'up' && ' · 👍'}
          {entry.feedback === 'down' && ' · 👎'}
        </p>
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove from history"
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gt-text-dim opacity-0 group-hover:opacity-100 hover:text-rose-600 hover:bg-rose-50 transition-all"
      >
        <X className="w-3.5 h-3.5" strokeWidth={2.5} />
      </button>
    </div>
  );
}

/* ============================================================
   Empty state
   ============================================================ */

function EmptyState({
  onPickQuery,
  featuredQueries,
}: {
  onPickQuery: (q: string) => void;
  featuredQueries: string[];
}) {
  const [showLibrary, setShowLibrary] = useState(false);

  return (
    <div className="py-4 lg:py-12">
      <div className="text-center mb-10">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 ring-1 ring-inset ring-white/[0.06] shadow-[0_8px_24px_-8px_rgba(11,61,46,0.55)]"
          style={{
            background:
              'linear-gradient(135deg, #0B3D2E 0%, #0d2a20 100%)',
          }}
          aria-hidden
        >
          <Sparkles className="w-7 h-7 text-gt-leaf" strokeWidth={2} />
        </div>
        <p
          className="text-[10px] font-bold uppercase text-gt-medium mb-3"
          style={{
            letterSpacing: '0.22em',
            fontFamily:
              'var(--font-jetbrains-mono), JetBrains Mono, monospace',
          }}
        >
          SustainIQ
        </p>
        <h1
          className="text-3xl md:text-[36px] font-extrabold text-gt-text leading-tight tracking-tight mb-4"
          style={{ letterSpacing: '-0.02em' }}
        >
          Ask anything. Get a defensible answer.
        </h1>
        <p className="text-[15px] text-gt-text-muted leading-relaxed max-w-xl mx-auto">
          Every answer is traced back to its source document. No
          hallucinations, no plausible-sounding guesses, no claims you
          cannot defend in front of an auditor.
        </p>
      </div>

      <div>
        <p
          className="text-[10px] font-bold uppercase text-gt-text-dim mb-4 text-center"
          style={{
            letterSpacing: '0.18em',
            fontFamily:
              'var(--font-jetbrains-mono), JetBrains Mono, monospace',
          }}
        >
          Try a question
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {featuredQueries.map((q) => {
            const catId = QUERY_TO_CATEGORY_ID[q];
            const meta = catId ? CATEGORY_META[catId] : undefined;
            if (!meta) return null;
            const Icon = meta.Icon;
            return (
              <button
                key={q}
                type="button"
                onClick={() => onPickQuery(q)}
                className="group flex items-start gap-3 text-left p-4 rounded-xl bg-white border border-gt-border-light hover:border-gt-medium/40 hover:bg-gt-medium/[0.03] transition-all"
              >
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ring-1 ring-inset ring-white/[0.06] shadow-[0_4px_14px_-6px_rgba(11,61,46,0.55)]"
                  style={{
                    background:
                      'linear-gradient(135deg, #0B3D2E 0%, #0d2a20 100%)',
                  }}
                  aria-hidden
                >
                  <Icon
                    className="w-[18px] h-[18px] text-gt-leaf"
                    strokeWidth={2}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="text-[10px] font-bold uppercase text-gt-medium mb-1"
                    style={{
                      letterSpacing: '0.16em',
                      fontFamily:
                        'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                    }}
                  >
                    {meta.label}
                  </p>
                  <p className="text-[14px] font-semibold text-gt-text leading-snug group-hover:text-gt-deepest transition-colors">
                    {q}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setShowLibrary((v) => !v)}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-gt-medium hover:text-gt-deepest transition-colors"
          >
            {showLibrary ? 'Hide topic library' : 'Browse more topics'}
            <ArrowRight
              className={cn(
                'w-3.5 h-3.5 transition-transform',
                showLibrary ? 'rotate-90' : ''
              )}
              strokeWidth={2.5}
            />
          </button>
        </div>

        {showLibrary && (
          <div className="mt-8 space-y-8">
            {QUERY_LIBRARY.map((cat) => (
              <div key={cat.id}>
                <p
                  className="text-[10px] font-bold uppercase text-gt-medium mb-3"
                  style={{
                    letterSpacing: '0.18em',
                    fontFamily:
                      'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                  }}
                >
                  {cat.label}
                </p>
                <div className="space-y-1.5">
                  {cat.queries.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => onPickQuery(q)}
                      className="w-full text-left px-4 py-2.5 rounded-lg bg-white border border-gt-border-light hover:border-gt-medium/40 hover:bg-gt-medium/[0.03] text-[13px] text-gt-text leading-snug transition-all group"
                    >
                      <span className="group-hover:text-gt-deepest transition-colors">
                        {q}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Message stream
   ============================================================ */

function MessageStream({
  messages,
  isLoading,
  phase,
  intent,
  topics,
  grounding,
  timings,
  isProvisional,
  loadingStep,
  onReset,
  onCopy,
  onShare,
  onFeedback,
  currentFeedback,
  onCitationClick,
  onCitationHover,
  onDownloadPdf,
  canDownloadPdf,
}: {
  messages: Message[];
  isLoading: boolean;
  phase: Phase;
  intent: Intent | null;
  topics: Topic[] | null;
  grounding: GroundingStats | null;
  timings: Timings | null;
  isProvisional: boolean;
  loadingStep: number;
  onReset: () => void;
  onCopy: (text: string) => void;
  onShare: (query: string) => void;
  onFeedback: (f: 'up' | 'down') => void;
  currentFeedback: 'up' | 'down' | null;
  onCitationClick: (cit: CitationParts) => void;
  onCitationHover: (cit: CitationParts) => void;
  onDownloadPdf: () => void;
  canDownloadPdf: boolean;
}) {
  const userQuery =
    messages[0]?.role === 'user' ? messages[0].content : '';
  const assistantMsg =
    messages[1]?.role === 'assistant' ? messages[1] : undefined;

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-8 pb-6 border-b border-gt-border-light">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ring-1 ring-inset ring-white/[0.06] shadow-[0_4px_14px_-6px_rgba(11,61,46,0.55)]"
            style={{
              background:
                'linear-gradient(135deg, #0B3D2E 0%, #0d2a20 100%)',
            }}
            aria-hidden
          >
            <Sparkles
              className="w-[18px] h-[18px] text-gt-leaf"
              strokeWidth={2}
            />
          </div>
          <div className="min-w-0">
            <p
              className="text-[11px] font-bold uppercase text-gt-medium mb-0.5 flex items-center gap-2"
              style={{
                letterSpacing: '0.2em',
                fontFamily:
                  'var(--font-jetbrains-mono), JetBrains Mono, monospace',
              }}
            >
              SustainIQ
              {intent && (
                <span
                  className="ml-1 px-1.5 py-0.5 rounded bg-gt-medium/[0.08] text-gt-medium text-[9px]"
                  style={{ letterSpacing: '0.14em' }}
                >
                  {intent}
                </span>
              )}
            </p>
            <h2 className="text-[18px] font-bold text-gt-text leading-snug tracking-tight">
              Result
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gt-medium text-white text-[13px] font-bold hover:bg-gt-deepest transition-colors shadow-[0_4px_14px_-6px_rgba(11,61,46,0.6)]"
        >
          <RotateCw className="w-4 h-4" strokeWidth={2.5} />
          New query
        </button>
      </div>

      {/* Research plan (ADVISORY only) */}
      {topics && topics.length > 0 && <ResearchPlan topics={topics} />}

      <div className="space-y-8">
        {messages.map((msg, i) => (
          <MessageBlock
            key={i}
            message={msg}
            isLast={i === messages.length - 1}
            isLoading={isLoading}
            phase={phase}
            isProvisional={isProvisional}
            loadingStep={loadingStep}
            userQuery={userQuery}
            assistantMsg={assistantMsg}
            onCopy={onCopy}
            onShare={onShare}
            onFeedback={onFeedback}
            currentFeedback={currentFeedback}
            onCitationClick={onCitationClick}
            onCitationHover={onCitationHover}
            onDownloadPdf={onDownloadPdf}
            canDownloadPdf={canDownloadPdf}
          />
        ))}
      </div>

      {grounding && grounding.unsupported_claims.length > 0 && (
        <GroundingNotice grounding={grounding} />
      )}

      {timings && <TimingsPanel timings={timings} />}
    </div>
  );
}

function MessageBlock({
  message,
  isLast,
  isLoading,
  phase,
  isProvisional,
  loadingStep,
  userQuery,
  assistantMsg,
  onCopy,
  onShare,
  onFeedback,
  currentFeedback,
  onCitationClick,
  onCitationHover,
  onDownloadPdf,
  canDownloadPdf,
}: {
  message: Message;
  isLast: boolean;
  isLoading: boolean;
  phase: Phase;
  isProvisional: boolean;
  loadingStep: number;
  userQuery: string;
  assistantMsg?: Message;
  onCopy: (text: string) => void;
  onShare: (query: string) => void;
  onFeedback: (f: 'up' | 'down') => void;
  currentFeedback: 'up' | 'down' | null;
  onCitationClick: (cit: CitationParts) => void;
  onCitationHover: (cit: CitationParts) => void;
  onDownloadPdf: () => void;
  canDownloadPdf: boolean;
}) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] px-5 py-3.5 rounded-2xl rounded-tr-sm bg-gt-medium text-white text-[15px] leading-relaxed shadow-[0_8px_24px_-12px_rgba(45,106,79,0.55)]">
          {message.content}
        </div>
      </div>
    );
  }

  const isActive = message === assistantMsg;
  const showVerifiedChip = isActive && !!message.content && !isProvisional && !message.isError;
  const showProvisionalChip = isActive && isProvisional;

  return (
    <div className="flex gap-4 items-start">
      <div
        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ring-1 ring-inset ring-white/[0.06] shadow-[0_4px_14px_-6px_rgba(11,61,46,0.55)] mt-1"
        style={{
          background:
            'linear-gradient(135deg, #0B3D2E 0%, #0d2a20 100%)',
        }}
        aria-hidden
      >
        <Sparkles className="w-[18px] h-[18px] text-gt-leaf" strokeWidth={2} />
      </div>

      <div className="flex-1 min-w-0 space-y-4">
        {(showProvisionalChip || showVerifiedChip) && (
          <VerificationChip provisional={showProvisionalChip} />
        )}

        {!message.content && isLoading && isLast ? (
          <LoadingProgression step={loadingStep} phase={phase} />
        ) : message.isError ? (
          <div className="rounded-xl px-5 py-4 bg-rose-50 border border-rose-200 text-[14px] text-rose-800 flex items-start gap-3">
            <AlertCircle
              className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5"
              strokeWidth={2}
            />
            <div>{message.content}</div>
          </div>
        ) : (
          <div
            className={cn(
              'rounded-2xl px-6 py-5 bg-white border border-gt-border-light shadow-gt-card transition-opacity duration-300',
              showProvisionalChip ? 'opacity-80' : 'opacity-100'
            )}
          >
            <AnswerBody
              text={message.content}
              onCitationClick={onCitationClick}
              onCitationHover={onCitationHover}
            />
            {isLoading && isLast && (
              <span
                aria-hidden
                className="inline-block w-1.5 h-5 rounded-sm ml-0.5 bg-gt-medium align-middle animate-pulse"
              />
            )}

            {!isLoading && message === assistantMsg && !message.isError && (
              <div className="mt-5 pt-4 border-t border-gt-border-light flex flex-wrap items-center gap-2">
                <ActionButton
                  Icon={Copy}
                  label="Copy answer"
                  onClick={() => onCopy(message.content)}
                />
                <ActionButton
                  Icon={Share2}
                  label="Share"
                  onClick={() => onShare(userQuery)}
                />
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={onDownloadPdf}
                  disabled={!canDownloadPdf}
                  aria-label="Download answer as PDF"
                  className={cn(
                    'inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-[12px] font-medium transition-colors mr-2',
                    canDownloadPdf
                      ? 'bg-white border-gt-border-light text-gt-text-dim hover:border-gt-medium/40 hover:text-gt-medium'
                      : 'bg-white border-gt-border-light text-gt-text-dim/50 cursor-not-allowed'
                  )}
                >
                  <Download className="w-[14px] h-[14px]" strokeWidth={2} />
                  <span>Download PDF</span>
                </button>
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[10px] text-gt-text-dim mr-1"
                    style={{
                      letterSpacing: '0.12em',
                      fontFamily:
                        'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                    }}
                  >
                    HELPFUL?
                  </span>
                  <button
                    type="button"
                    onClick={() => onFeedback('up')}
                    aria-label="Thumbs up"
                    className={cn(
                      'inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-colors',
                      currentFeedback === 'up'
                        ? 'bg-gt-leaf/15 border-gt-leaf/40 text-gt-medium'
                        : 'bg-white border-gt-border-light text-gt-text-dim hover:border-gt-medium/40 hover:text-gt-medium'
                    )}
                  >
                    <ThumbsUp className="w-[14px] h-[14px]" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onFeedback('down')}
                    aria-label="Thumbs down"
                    className={cn(
                      'inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-colors',
                      currentFeedback === 'down'
                        ? 'bg-rose-50 border-rose-200 text-rose-600'
                        : 'bg-white border-gt-border-light text-gt-text-dim hover:border-rose-300 hover:text-rose-600'
                    )}
                  >
                    <ThumbsDown
                      className="w-[14px] h-[14px]"
                      strokeWidth={2}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {message.sources && message.sources.length > 0 && (
          <SourcesGrid
            sources={message.sources}
            onSourceClick={(s) => {
              const raw = `${s.document}, ${s.section}, p.${s.pages}`;
              onCitationClick(parseCitation(raw));
            }}
          />
        )}
      </div>
    </div>
  );
}

function VerificationChip({ provisional }: { provisional: boolean }) {
  if (provisional) {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-800 text-[10px] font-bold"
        style={{
          letterSpacing: '0.16em',
          fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
        }}
      >
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        PROVISIONAL · FACT-CHECKING
      </div>
    );
  }
  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 text-[10px] font-bold"
      style={{
        letterSpacing: '0.16em',
        fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
      }}
    >
      <ShieldCheck className="w-3 h-3" strokeWidth={2.5} />
      VERIFIED · UNSUPPORTED CLAIMS REMOVED
    </div>
  );
}

function ActionButton({
  Icon,
  label,
  onClick,
}: {
  Icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gt-border-light text-[12px] font-semibold text-gt-text hover:border-gt-medium/40 hover:text-gt-medium transition-colors"
    >
      <Icon className="w-[14px] h-[14px]" strokeWidth={2} />
      {label}
    </button>
  );
}

/* ============================================================
   Loading progression - event-driven
   ============================================================ */

function LoadingProgression({ step, phase }: { step: number; phase: Phase }) {
  return (
    <div className="py-4 space-y-2.5">
      <p
        className="text-[10px] font-bold uppercase text-gt-medium"
        style={{
          letterSpacing: '0.18em',
          fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
        }}
      >
        {PHASE_LABELS[phase] || 'Starting'}
      </p>
      {LOADING_STEPS.map((entry, i) => {
        const state = i < step ? 'done' : i === step ? 'active' : 'pending';
        return (
          <div
            key={entry.phase}
            className={cn(
              'flex items-center gap-3 transition-opacity',
              state === 'pending' && 'opacity-40'
            )}
          >
            <span
              className={cn(
                'flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center border',
                state === 'done'
                  ? 'bg-gt-leaf/20 border-gt-leaf/50 text-gt-medium'
                  : state === 'active'
                  ? 'border-gt-medium bg-white'
                  : 'border-gt-border-light bg-white'
              )}
            >
              {state === 'done' && (
                <Check className="w-3 h-3" strokeWidth={3} />
              )}
              {state === 'active' && (
                <span className="w-1.5 h-1.5 rounded-full bg-gt-medium animate-pulse" />
              )}
            </span>
            <span
              className={cn(
                'text-[11px] font-bold uppercase',
                state === 'done'
                  ? 'text-gt-medium'
                  : state === 'active'
                  ? 'text-gt-text'
                  : 'text-gt-text-dim'
              )}
              style={{
                letterSpacing: '0.14em',
                fontFamily:
                  'var(--font-jetbrains-mono), JetBrains Mono, monospace',
              }}
            >
              {entry.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   Research plan
   ============================================================ */

function ResearchPlan({ topics }: { topics: Topic[] }) {
  return (
    <div
      className="rounded-2xl p-5 mb-6 ring-1 ring-inset ring-white/[0.06] shadow-gt-card"
      style={{
        background:
          'linear-gradient(135deg, #0B3D2E 0%, #0d2a20 100%)',
      }}
    >
      <p
        className="text-[10px] font-bold uppercase text-gt-mint mb-3"
        style={{
          letterSpacing: '0.2em',
          fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
        }}
      >
        RESEARCH PLAN
      </p>
      <ol className="space-y-2">
        {topics.map((t, i) => (
          <li key={i} className="flex items-start gap-3">
            <span
              className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 text-gt-leaf text-[11px] font-bold flex items-center justify-center"
              style={{
                fontFamily:
                  'var(--font-jetbrains-mono), JetBrains Mono, monospace',
              }}
            >
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <span
                className="inline-block px-1.5 py-0.5 rounded bg-white/10 text-gt-leaf text-[9px] font-bold mr-2 align-middle"
                style={{
                  letterSpacing: '0.14em',
                  fontFamily:
                    'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                }}
              >
                {t.focus.toUpperCase()}
              </span>
              <span className="text-[13px] text-white/90 leading-snug">
                {t.topic}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ============================================================
   Grounding notice
   ============================================================ */

function GroundingNotice({ grounding }: { grounding: GroundingStats }) {
  return (
    <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
      <p
        className="text-[10px] font-bold uppercase text-amber-800 mb-2 flex items-center gap-1.5"
        style={{
          letterSpacing: '0.18em',
          fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
        }}
      >
        <AlertCircle className="w-3 h-3" strokeWidth={2.5} />
        FLAGGED · REMOVED IN REVISE
      </p>
      <ul className="space-y-1.5 text-[13px] text-amber-900 leading-relaxed">
        {grounding.unsupported_claims.map((c, i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden className="text-amber-600">
              •
            </span>
            <span className="flex-1">{c}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ============================================================
   Timings panel (collapsible)
   ============================================================ */

function TimingsPanel({ timings }: { timings: Timings }) {
  const [open, setOpen] = useState(false);
  const entries = Object.entries(timings).filter(([k]) => k !== 'total_ms');
  return (
    <div className="mt-6 rounded-2xl border border-gt-border-light bg-white shadow-gt-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-3 hover:bg-gt-medium/[0.03] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-gt-medium" strokeWidth={2} />
          <span
            className="text-[10px] font-bold uppercase text-gt-medium"
            style={{
              letterSpacing: '0.18em',
              fontFamily:
                'var(--font-jetbrains-mono), JetBrains Mono, monospace',
            }}
          >
            Timing · {Math.round(timings.total_ms)}ms total
          </span>
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-gt-text-dim transition-transform',
            open && 'rotate-180'
          )}
          strokeWidth={2}
        />
      </button>
      {open && (
        <div
          className="px-5 pb-4 text-[12px] text-gt-text font-mono space-y-0.5"
          style={{
            fontFamily:
              'var(--font-jetbrains-mono), JetBrains Mono, monospace',
          }}
        >
          {entries.map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-gt-text-muted">{k}</span>
              <span>{Math.round(v as number)}ms</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Answer body - ReactMarkdown + remark-gfm with citation pills
   ============================================================ */

function AnswerBody({
  text,
  onCitationClick,
  onCitationHover,
}: {
  text: string;
  onCitationClick: (cit: CitationParts) => void;
  onCitationHover: (cit: CitationParts) => void;
}) {
  if (!text) return null;

  const wrap = (children: ReactNode) =>
    renderWithCitations(children, onCitationClick, onCitationHover, 'redesign');

  return (
    <div className="font-normal">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h3
              className="text-[17px] font-extrabold text-gt-medium mt-6 mb-2 tracking-tight"
              style={{ letterSpacing: '-0.01em' }}
            >
              {wrap(children)}
            </h3>
          ),
          h2: ({ children }) => (
            <h3
              className="text-[16px] font-bold text-gt-medium mt-5 mb-1.5 tracking-tight"
              style={{ letterSpacing: '-0.005em' }}
            >
              {wrap(children)}
            </h3>
          ),
          h3: ({ children }) => (
            <h4 className="text-[14px] font-bold text-gt-medium mt-5 mb-1 tracking-tight">
              {wrap(children)}
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-[14px] text-gt-text leading-relaxed my-3">
              {wrap(children)}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="my-3 space-y-2 pl-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-3 space-y-2 pl-1 list-decimal list-inside marker:text-gt-medium">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-[14px] text-gt-text leading-relaxed flex gap-2 items-start">
              <span
                aria-hidden
                className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-gt-medium mt-[9px]"
              />
              <span className="flex-1 min-w-0">{wrap(children)}</span>
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-gt-text">{wrap(children)}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gt-text">{wrap(children)}</em>
          ),
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-2xl border border-gt-border-light">
              <table className="w-full text-[13px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gt-medium text-white">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-gt-border-light bg-white">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-gt-medium/[0.03]">{children}</tr>
          ),
          th: ({ children }) => (
            <th
              className="px-3 py-2.5 text-left font-bold tracking-wide text-[11px] uppercase"
              style={{
                letterSpacing: '0.12em',
                fontFamily:
                  'var(--font-jetbrains-mono), JetBrains Mono, monospace',
              }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2.5 align-top text-gt-text leading-relaxed">
              {wrap(children)}
            </td>
          ),
          code: ({ children }) => (
            <code
              className="px-1.5 py-0.5 rounded bg-gt-medium/[0.07] text-gt-text text-[13px] border border-gt-medium/15"
              style={{
                fontFamily:
                  'var(--font-jetbrains-mono), JetBrains Mono, monospace',
              }}
            >
              {children}
            </code>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gt-mint pl-4 my-3 text-[14px] text-gt-text-muted italic">
              {wrap(children)}
            </blockquote>
          ),
          hr: () => <hr className="my-6 border-t border-gt-border-light" />,
          a: ({ children, href }) => (
            <a
              href={href}
              className="text-gt-medium underline decoration-dotted hover:decoration-solid"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

/* ============================================================
   Sources grid (clickable)
   ============================================================ */

function SourcesGrid({
  sources,
  onSourceClick,
}: {
  sources: Source[];
  onSourceClick: (s: Source) => void;
}) {
  return (
    <div className="space-y-2.5">
      <p
        className="text-[10px] font-bold uppercase text-gt-medium"
        style={{
          letterSpacing: '0.2em',
          fontFamily:
            'var(--font-jetbrains-mono), JetBrains Mono, monospace',
        }}
      >
        Referenced sources · {sources.length}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {sources.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSourceClick(s)}
            className="relative rounded-lg p-3 ring-1 ring-inset ring-white/[0.06] shadow-[0_4px_14px_-6px_rgba(11,61,46,0.55)] overflow-hidden text-left hover:ring-white/20 transition-all"
            style={{
              background:
                'linear-gradient(135deg, #0B3D2E 0%, #0d2a20 100%)',
            }}
          >
            <p
              className="text-[9px] font-bold uppercase text-gt-mint mb-1.5"
              style={{
                letterSpacing: '0.14em',
                fontFamily:
                  'var(--font-jetbrains-mono), JetBrains Mono, monospace',
              }}
            >
              {s.course}
            </p>
            <p className="text-[12px] font-bold text-white leading-snug mb-0.5">
              {s.document}
            </p>
            {s.section && (
              <p className="text-[11px] text-white/70 leading-snug mb-1.5">
                {s.section}
              </p>
            )}
            {s.pages && (
              <p
                className="text-[9px] text-gt-leaf"
                style={{
                  letterSpacing: '0.06em',
                  fontFamily:
                    'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                }}
              >
                p.{s.pages}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   Lesson cross-link row (DORMANT - pipeline emits no `lessons` event)
   Kept in source for future reactivation.
   ============================================================ */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LessonLinksRow({ lessons }: { lessons: LessonLink[] }) {
  return (
    <div className="space-y-2.5 pt-1">
      <p
        className="text-[10px] font-bold uppercase text-gt-text-dim"
        style={{
          letterSpacing: '0.18em',
          fontFamily:
            'var(--font-jetbrains-mono), JetBrains Mono, monospace',
        }}
      >
        Related lessons
      </p>
      <div className="flex flex-wrap gap-2">
        {lessons.map((l) => (
          <Link
            key={l.url}
            href={l.url}
            className={cn(
              'group inline-flex items-center gap-2 px-3 py-2 rounded-lg',
              'bg-white border border-gt-border-light',
              'hover:border-gt-medium/40 hover:bg-gt-medium/[0.04]',
              'transition-colors'
            )}
          >
            <span className="text-[13px] font-semibold text-gt-text group-hover:text-gt-medium transition-colors">
              {l.lessonTitle}
            </span>
            <span
              className="text-[10px] text-gt-text-dim"
              style={{
                fontFamily:
                  'var(--font-jetbrains-mono), JetBrains Mono, monospace',
              }}
            >
              {l.courseTitle}
            </span>
            <ArrowRight
              className="w-3.5 h-3.5 text-gt-text-dim group-hover:text-gt-medium group-hover:translate-x-0.5 transition-all"
              strokeWidth={2}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
