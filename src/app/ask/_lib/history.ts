/**
 * SustainIQ query history storage
 *
 * Persists past queries and their results to localStorage so the
 * user can revisit previous answers and search through them. The
 * storage is deliberately local-only for v1 - when auth and cloud
 * progress land, the same entry shape should be writable to a
 * backend store without shape changes.
 *
 * Storage key: `greentryst_sustainiq_history`
 * Storage shape: array of HistoryEntry, newest first
 * Max entries: 100 (oldest dropped when over)
 */

export interface HistorySource {
  document: string;
  section: string;
  pages: string;
  course: string;
}

export interface HistoryLessonLink {
  courseId: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  url: string;
}

export interface HistoryEntry {
  id: string;
  query: string;
  answer: string;
  sources: HistorySource[];
  lessons: HistoryLessonLink[];
  timestamp: number;
  feedback?: 'up' | 'down' | null;
}

const STORAGE_KEY = 'greentryst_sustainiq_history';
const MAX_ENTRIES = 100;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

export function loadHistory(): HistoryEntry[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is HistoryEntry =>
        e && typeof e.id === 'string' && typeof e.query === 'string'
    );
  } catch {
    return [];
  }
}

export function saveHistory(entries: HistoryEntry[]): void {
  if (!isBrowser()) return;
  try {
    const trimmed = entries.slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    /* quota exceeded, swallow silently */
  }
}

export function addHistoryEntry(entry: HistoryEntry): HistoryEntry[] {
  const current = loadHistory();
  const next = [entry, ...current.filter((e) => e.id !== entry.id)];
  saveHistory(next);
  return next;
}

export function updateHistoryEntry(
  id: string,
  patch: Partial<HistoryEntry>
): HistoryEntry[] {
  const current = loadHistory();
  const next = current.map((e) => (e.id === id ? { ...e, ...patch } : e));
  saveHistory(next);
  return next;
}

export function removeHistoryEntry(id: string): HistoryEntry[] {
  const current = loadHistory();
  const next = current.filter((e) => e.id !== id);
  saveHistory(next);
  return next;
}

export function clearHistory(): HistoryEntry[] {
  if (!isBrowser()) return [];
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  return [];
}

/** Simple substring search across query text. Case-insensitive. */
export function searchHistory(
  entries: HistoryEntry[],
  query: string
): HistoryEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries;
  return entries.filter((e) => e.query.toLowerCase().includes(q));
}

/** Generate a compact id using timestamp + a short random suffix.
 *  Good enough for a client-only session store. */
export function newHistoryId(): string {
  return `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

/** Relative timestamp formatter used in the sidebar. */
export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const date = new Date(ts);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}
