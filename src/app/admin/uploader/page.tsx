'use client';

/**
 * /admin/uploader — ArmorInnovate course generation UI.
 *
 * Lets an admin specify a topic + track → triggers the MCP pipeline via
 * POST /api/armor/generate (SSE stream), renders real-time progress, and
 * shows a summary when the bundle is written.
 *
 * Phase 2: wired to the mock pipeline. Phase 3+ swaps for live MCP.
 */

import { useState, useRef, useCallback } from 'react';

// ── Types ──────────────────────────────────────────────────────────────

type Track =
  | 'foundations'
  | 'risk-assessment'
  | 'design'
  | 'maintenance'
  | 'capstone'
  | 'ics-pentest'
  | 'ot-defense';

type Difficulty = 'intro' | 'intermediate' | 'advanced';

interface LogEntry {
  id: number;
  ts: string;
  event: string;
  data: Record<string, unknown>;
}

const TRACKS: { value: Track; label: string }[] = [
  { value: 'foundations', label: 'Foundations' },
  { value: 'risk-assessment', label: 'Risk Assessment' },
  { value: 'design', label: 'Design' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'capstone', label: 'Expert Capstone' },
  { value: 'ics-pentest', label: 'ICS Pentest' },
  { value: 'ot-defense', label: 'OT Defense' },
];

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'intro', label: 'Intro' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

// ── Component ──────────────────────────────────────────────────────────

export default function AdminUploaderPage() {
  const [topic, setTopic] = useState('');
  const [track, setTrack] = useState<Track>('foundations');
  const [difficulty, setDifficulty] = useState<Difficulty>('intro');
  const [mode, setMode] = useState<'mock' | 'live'>('mock');
  const [dryRun, setDryRun] = useState(false);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const logIdRef = useRef(0);
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((event: string, data: Record<string, unknown>) => {
    const entry: LogEntry = {
      id: logIdRef.current++,
      ts: new Date().toLocaleTimeString(),
      event,
      data,
    };
    setLogs((prev) => [...prev, entry]);
    setTimeout(() => logEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) return;
    setRunning(true);
    setLogs([]);
    setError(null);
    setResult(null);
    setStatus('Connecting…');

    try {
      const params = new URLSearchParams({ mode });
      if (dryRun) params.set('dry', '1');

      const res = await fetch(`/api/armor/generate?${params}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), track, difficulty }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(`HTTP ${res.status}: ${body.error ?? 'unknown error'}`);
        setRunning(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setError('No response stream');
        setRunning(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Parse SSE frames
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        let currentEvent = 'message';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              addLog(currentEvent, data);

              if (currentEvent === 'status') {
                setStatus(data.message ?? 'Processing…');
              } else if (currentEvent === 'error') {
                setError(data.message);
              } else if (currentEvent === 'done') {
                setResult(data);
                setStatus('Done');
              } else if (currentEvent === 'written') {
                setStatus(`Written ${data.files?.length ?? 0} files to ${data.slug}/`);
              }
            } catch {
              // skip malformed data
            }
            currentEvent = 'message';
          }
        }
      }
    } catch (err: any) {
      setError(err.message ?? 'fetch failed');
    } finally {
      setRunning(false);
    }
  }, [topic, track, difficulty, mode, dryRun, addLog]);

  return (
    <div className="min-h-screen bg-ai-bg text-ai-ink">
      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold font-mono text-ai-primary">
            ArmorInnovate Course Generator
          </h1>
          <p className="mt-1 text-ai-ink-soft text-sm">
            Admin tool — generates a course bundle via the MCP pipeline.
          </p>
        </div>

        {/* Form */}
        <div className="rounded-lg border border-ai-line bg-ai-bg-soft p-6 space-y-4">
          {/* Topic */}
          <div>
            <label className="block text-sm font-medium mb-1">Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Modbus Protocol Pentesting"
              disabled={running}
              className="w-full rounded border border-ai-line bg-white px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-ai-accent disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Track */}
            <div>
              <label className="block text-sm font-medium mb-1">Track</label>
              <select
                value={track}
                onChange={(e) => setTrack(e.target.value as Track)}
                disabled={running}
                className="w-full rounded border border-ai-line bg-white px-3 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-ai-accent disabled:opacity-50"
              >
                {TRACKS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium mb-1">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                disabled={running}
                className="w-full rounded border border-ai-line bg-white px-3 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-ai-accent disabled:opacity-50"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            {/* Mode */}
            <div>
              <label className="block text-sm font-medium mb-1">Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as 'mock' | 'live')}
                disabled={running}
                className="w-full rounded border border-ai-line bg-white px-3 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-ai-accent disabled:opacity-50"
              >
                <option value="mock">Mock (no API keys)</option>
                <option value="live">Live MCP (requires keys)</option>
              </select>
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                disabled={running}
              />
              Dry run (don't write files)
            </label>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={running || !topic.trim()}
            className="rounded bg-ai-primary px-6 py-2 text-sm font-semibold text-white
              hover:bg-ai-primary-hover disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors"
          >
            {running ? 'Generating…' : 'Generate Course'}
          </button>
        </div>

        {/* Status bar */}
        {status && (
          <div className={`mt-4 rounded px-4 py-2 text-sm font-mono ${
            error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-ai-primary border border-blue-200'
          }`}>
            {error ? `✗ ${error}` : `⟩ ${status}`}
          </div>
        )}

        {/* Result summary */}
        {result && (
          <div className="mt-4 rounded border border-ai-ok/30 bg-green-50 px-4 py-3 text-sm">
            <p className="font-semibold text-ai-ok">Pipeline complete</p>
            <ul className="mt-1 text-ai-ink-soft space-y-0.5">
              {'slug' in result && result.slug ? <li>Slug: <code className="text-xs">{String(result.slug)}</code></li> : null}
              {'dryRun' in result && result.dryRun ? <li className="text-amber-600">Dry run — no files written</li> : null}
            </ul>
          </div>
        )}

        {/* Event log */}
        {logs.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold mb-2">Pipeline Log</h2>
            <div className="max-h-96 overflow-y-auto rounded border border-ai-line bg-ai-deep text-ai-mono-on-deep p-3 font-mono text-xs space-y-0.5">
              {logs.map((l) => (
                <div key={l.id} className="flex gap-2">
                  <span className="text-ai-ink-dim shrink-0">{l.ts}</span>
                  <span className={eventColor(l.event)}>[{l.event}]</span>
                  <span className="text-ai-mono-on-deep truncate">
                    {summarize(l.event, l.data)}
                  </span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────

function eventColor(event: string): string {
  if (event === 'error') return 'text-ai-crit';
  if (event === 'done' || event === 'written') return 'text-ai-ok';
  if (event === 'status') return 'text-ai-cyber';
  return 'text-ai-warn';
}

function summarize(event: string, data: Record<string, unknown>): string {
  if (event === 'pipeline') {
    const type = data.type as string;
    if (type === 'step.start') return `starting ${data.step}`;
    if (type === 'step.done') return `${data.step} done (${data.durationMs}ms)`;
    if (type === 'source.found') return `source: ${data.title}`;
    if (type === 'lesson.draft') return `lesson ${data.index}: ${data.title}`;
    if (type === 'validation') return `validation ${data.ok ? '✓' : '✗'}`;
    return type;
  }
  if (data.message) return String(data.message);
  return JSON.stringify(data);
}
