/**
 * useResumeState — single source of truth for the resume + match flow
 * on the Jobs page.
 *
 * Handles: initial status fetch, polling while processing, upload (file
 * picker + POST multipart), delete, and lazy-fetching match scores once
 * status === 'ready'.
 *
 * Separated from JobsClientRedesign so the 1600-line component stays
 * focused on presentation; the hook is the only place that knows the
 * /api/resume/* surface.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type ResumeStatus =
  | 'none'
  | 'uploading'
  | 'parsing'
  | 'ready'
  | 'error';

/** Shape of the extracted profile stored in user_resumes.profile (JSON).
 *  Only populated when status === 'ready'. */
export interface ResumeProfile {
  skills: string[];
  frameworks: string[];
  seniority: 'junior' | 'mid' | 'senior' | 'lead' | 'director' | null;
  domains: string[];
}

interface StatusResponse {
  status: Exclude<ResumeStatus, 'none'>;
  fileName?: string;
  uploadedAt?: string;
  processedAt?: string | null;
  profile?: ResumeProfile | null;
  error?: string | null;
}

interface MatchRow {
  jobUrl: string;
  total: number;
}

interface MatchesResponse {
  jobs: MatchRow[];
  count: number;
  top: number;
}

export interface ResumeState {
  /** Derived status of the user's resume on the server. 'none' = not uploaded. */
  status: ResumeStatus;
  /** User-facing error message when status === 'error'. */
  error: string | null;
  /** Filename shown in the UI when a resume is present. */
  fileName: string | null;
  /** Server timestamp (ISO) when the user uploaded their resume, if any. */
  uploadedAt: string | null;
  /** Groq-extracted profile: skills / frameworks / seniority / domains.
   *  Populated only when status === 'ready'; null otherwise. */
  profile: ResumeProfile | null;
  /** `{jobUrl: total}` once status is 'ready'. Empty Map otherwise. */
  matchesByJob: Map<string, number>;
  /** Cap-exceeded response body from /api/resume/upload, if any. */
  capMessage: string | null;
  /** Initial status fetch complete — lets the UI avoid flashing the wrong state. */
  hydrated: boolean;
  /** Open a file picker and upload whatever the user chose. */
  openUploader: () => void;
  /** DELETE the resume. Clears local state on success. */
  removeResume: () => Promise<void>;
}

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const POLL_INTERVAL_MS = 3000;

export function useResumeState(): ResumeState {
  const [status, setStatus] = useState<ResumeStatus>('none');
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadedAt, setUploadedAt] = useState<string | null>(null);
  const [profile, setProfile] = useState<ResumeProfile | null>(null);
  const [matchesByJob, setMatchesByJob] = useState<Map<string, number>>(
    () => new Map(),
  );
  const [capMessage, setCapMessage] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);

  // Track the ready "fingerprint" so we only fetch matches once per
  // ready-transition (avoids spamming /api/resume/matches on re-renders).
  const matchesLoadedForRef = useRef<string | null>(null);

  // --- lazy-mount hidden file input -------------------------------------
  useEffect(() => {
    unmountedRef.current = false;
    if (!inputRef.current) {
      const el = document.createElement('input');
      el.type = 'file';
      el.accept =
        'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,.docx';
      el.style.display = 'none';
      el.addEventListener('change', (e) => {
        const f = (e.target as HTMLInputElement).files?.[0];
        if (f) void handleFileSelected(f);
        // Reset so the same file can be picked again after a delete.
        (e.target as HTMLInputElement).value = '';
      });
      document.body.appendChild(el);
      inputRef.current = el;
    }
    return () => {
      unmountedRef.current = true;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      if (inputRef.current) {
        inputRef.current.remove();
        inputRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- polling -----------------------------------------------------------
  const schedulePoll = useCallback(() => {
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    pollTimerRef.current = setTimeout(() => void fetchStatus(), POLL_INTERVAL_MS);
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
  }, []);

  const fetchStatus = useCallback(async () => {
    if (unmountedRef.current) return;
    try {
      const resp = await fetch('/api/resume/status', {
        method: 'GET',
        cache: 'no-store',
      });
      if (resp.status === 401) {
        // Anonymous visitor. Leave status='none'; no polling.
        if (!unmountedRef.current) {
          setStatus('none');
          setHydrated(true);
        }
        return;
      }
      if (resp.status === 404) {
        if (!unmountedRef.current) {
          setStatus('none');
          setError(null);
          setFileName(null);
          setUploadedAt(null);
          setProfile(null);
          setHydrated(true);
        }
        return;
      }
      if (!resp.ok) {
        // Transient — back off one tick without surfacing to the user.
        if (!unmountedRef.current) {
          setHydrated(true);
          schedulePoll();
        }
        return;
      }
      const data = (await resp.json()) as StatusResponse;
      if (unmountedRef.current) return;
      setStatus(data.status);
      setFileName(data.fileName ?? null);
      setUploadedAt(data.uploadedAt ?? null);
      setProfile(data.profile ?? null);
      setError(data.status === 'error' ? data.error ?? 'unknown error' : null);
      setHydrated(true);

      if (data.status === 'uploading' || data.status === 'parsing') {
        schedulePoll();
      }
    } catch (err) {
      console.error('[useResumeState] status fetch failed', err);
      if (!unmountedRef.current) {
        setHydrated(true);
        schedulePoll();
      }
    }
  }, [schedulePoll]);

  // Initial fetch on mount
  useEffect(() => {
    void fetchStatus();
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [fetchStatus]);

  // --- match scores on transition into 'ready' ---------------------------
  useEffect(() => {
    if (status !== 'ready') return;
    const fingerprint = `${fileName}:ready`;
    if (matchesLoadedForRef.current === fingerprint) return;
    matchesLoadedForRef.current = fingerprint;

    (async () => {
      try {
        const resp = await fetch('/api/resume/matches', {
          method: 'POST',
          cache: 'no-store',
        });
        if (!resp.ok) {
          console.error('[useResumeState] /matches returned', resp.status);
          return;
        }
        const data = (await resp.json()) as MatchesResponse;
        if (unmountedRef.current) return;
        const next = new Map<string, number>();
        for (const row of data.jobs) next.set(row.jobUrl, row.total);
        setMatchesByJob(next);
      } catch (err) {
        console.error('[useResumeState] /matches fetch failed', err);
      }
    })();
  }, [status, fileName]);

  // --- upload ------------------------------------------------------------
  const openUploader = useCallback(() => {
    setCapMessage(null);
    inputRef.current?.click();
  }, []);

  const handleFileSelected = async (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      setError(
        `file is ${Math.round(file.size / 1024 / 1024)} MB; max is 5 MB`,
      );
      setStatus('error');
      return;
    }

    setStatus('uploading');
    setError(null);
    setCapMessage(null);
    setFileName(file.name);
    // Reset the matches-loaded guard so we re-fetch after the new upload
    // lands at 'ready'.
    matchesLoadedForRef.current = null;
    setMatchesByJob(new Map());

    try {
      const body = new FormData();
      body.append('file', file);
      const resp = await fetch('/api/resume/upload', {
        method: 'POST',
        body,
      });
      if (resp.status === 401) {
        setStatus('none');
        setError('sign in to upload your resume');
        return;
      }
      if (resp.status === 429) {
        const data = (await resp.json().catch(() => ({}))) as {
          error?: string;
          cap?: { limit?: number; period?: string };
        };
        setStatus('error');
        setError(null);
        setCapMessage(
          data.error ??
            `monthly limit reached (${data.cap?.limit ?? ''} uploads per ${data.cap?.period ?? 'month'}).`,
        );
        return;
      }
      if (!resp.ok) {
        const data = (await resp.json().catch(() => ({}))) as {
          error?: string;
        };
        setStatus('error');
        setError(data.error ?? `upload failed (HTTP ${resp.status})`);
        return;
      }
      // 202 Accepted — background /process is running. Poll for state.
      schedulePoll();
    } catch (err) {
      console.error('[useResumeState] upload threw', err);
      setStatus('error');
      setError('upload failed; please try again');
    }
  };

  // --- delete ------------------------------------------------------------
  const removeResume = useCallback(async () => {
    try {
      const resp = await fetch('/api/resume', { method: 'DELETE' });
      if (!resp.ok && resp.status !== 404) {
        console.error('[useResumeState] delete returned', resp.status);
      }
    } catch (err) {
      console.error('[useResumeState] delete failed', err);
    } finally {
      if (!unmountedRef.current) {
        setStatus('none');
        setError(null);
        setFileName(null);
        setUploadedAt(null);
        setProfile(null);
        setMatchesByJob(new Map());
        matchesLoadedForRef.current = null;
      }
    }
  }, []);

  return {
    status,
    error,
    fileName,
    uploadedAt,
    profile,
    matchesByJob,
    capMessage,
    hydrated,
    openUploader,
    removeResume,
  };
}
