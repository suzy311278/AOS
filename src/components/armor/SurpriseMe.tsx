/**
 * SurpriseMe — sidebar widget that pulls a random ICS security brief
 * or a quick quiz question on demand.
 *
 * In Phase 0 the data is local (zero-dep, no API). When `/api/armor/surprise`
 * lands in Phase 1, swap the local picker for a `fetch(...)`. Wire is the
 * same: kind = 'auto' | 'brief' | 'quiz'.
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, RefreshCw, X, ArrowRight } from 'lucide-react';
import { cn } from './lib/cn';
import { IconShield, IconVuln } from './ScadaIcons';

// ──────────────────────────────────────────────────────────────────────
// Local seed data (Phase 0)
// Replace with `fetch('/api/armor/surprise?kind=' + kind)` in Phase 1.
// ──────────────────────────────────────────────────────────────────────

interface BriefItem {
  kind: 'brief';
  id: string;
  title: string;
  body: string;
  source: string;
}

interface QuizItem {
  kind: 'quiz';
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

type SurpriseItem = BriefItem | QuizItem;

const BRIEFS: BriefItem[] = [
  {
    kind: 'brief',
    id: 'b1',
    title: 'Why Modbus has no built-in auth',
    body: 'Modbus was designed in 1979 for serial PLC links — confidentiality and authentication were never goals. On TCP/502, anyone routable to the slave can issue function codes 0x05 (force coil) or 0x06 (preset register). The IEC 62443-3-3 control SR 1.1 mandates compensating controls: segmentation, allowlisted masters, and DPI.',
    source: 'IEC 62443-3-3 SR 1.1 · Modbus Application Protocol v1.1b3',
  },
  {
    kind: 'brief',
    id: 'b2',
    title: 'Purdue Level 3.5 — the DMZ that keeps Stuxnet in',
    body: 'The OT/IT DMZ at L3.5 is the choke point that prevents lateral movement from corporate (L4-5) into supervisory (L3) and process (L0-2) networks. Every connection should be brokered, logged, and protocol-translated. No ICCP, OPC, or Modbus crosses L3.5 untouched.',
    source: 'Purdue Enterprise Reference Architecture · ISA-95',
  },
  {
    kind: 'brief',
    id: 'b3',
    title: 'CVE-2024-21912 · Unauth firmware overwrite',
    body: 'CompactLogix CIP processors (firmware ≤ 33.011) accept unauthenticated firmware writes via class 0x6B. CVSS 9.8. Mitigation: upgrade to 34.011, restrict CIP to allowlisted engineering workstations, and monitor for unexpected class-0x6B traffic.',
    source: 'CISA ICSA-24-009-01',
  },
  {
    kind: 'brief',
    id: 'b4',
    title: 'TRITON — when the safety system is the target',
    body: 'TRITON (2017) targeted Triconex SIS controllers in a Saudi petrochemical plant. It overwrote SIS firmware to disable the trip logic — the last barrier before a physical accident. Lesson: SIS networks must be physically separated from BPCS, with read-only diodes for any monitoring path.',
    source: 'NIST SP 800-82r3 · IEC 61511',
  },
  {
    kind: 'brief',
    id: 'b5',
    title: 'Why ICS pentesting has rules of engagement',
    body: 'Active scanning a live PLC can crash it — and crash the process it controls. ICS engagements use passive capture first (pcap on a SPAN port), then targeted active probes off-shift, with the ICS engineer present and a stop button. IEC 62443-2-4 requires documented procedures.',
    source: 'IEC 62443-2-4 · SANS ICS515',
  },
];

const QUIZZES: QuizItem[] = [
  {
    kind: 'quiz',
    id: 'q1',
    question: 'Which IEC 62443 part defines technical Security Levels (SL1–SL4) for system requirements?',
    options: ['62443-1-1', '62443-2-1', '62443-3-3', '62443-4-2'],
    correctIndex: 2,
    explanation: 'IEC 62443-3-3 specifies the foundational requirements (FR) and system requirements (SR) graduated by Security Level (SL1–SL4).',
  },
  {
    kind: 'quiz',
    id: 'q2',
    question: 'On Modbus/TCP, which port is the standard target for a discovery scan?',
    options: ['tcp/102', 'tcp/502', 'tcp/2222', 'tcp/44818'],
    correctIndex: 1,
    explanation: 'Modbus/TCP runs on tcp/502. tcp/102 is S7comm (Siemens), tcp/2222 + tcp/44818 are EtherNet/IP (CIP).',
  },
  {
    kind: 'quiz',
    id: 'q3',
    question: 'Which Purdue level hosts engineering workstations and historian servers?',
    options: ['Level 0', 'Level 2', 'Level 3', 'Level 4'],
    correctIndex: 2,
    explanation: 'Level 3 is the supervisory / site operations layer: historians, engineering workstations, batch servers. Level 4 is enterprise IT.',
  },
  {
    kind: 'quiz',
    id: 'q4',
    question: 'A TRITON-style attack on an SIS would primarily violate which IEC 62443-3-3 foundational requirement?',
    options: ['FR 1 — Identification and Authentication', 'FR 3 — System Integrity', 'FR 5 — Restricted Data Flow', 'FR 7 — Resource Availability'],
    correctIndex: 1,
    explanation: 'TRITON tampered with safety logic — a direct violation of FR 3 (System Integrity), specifically SR 3.4 (Software and Information Integrity).',
  },
];

const ALL: SurpriseItem[] = [...BRIEFS, ...QUIZZES];

function pickRandom(kind: 'auto' | 'brief' | 'quiz', exclude?: string): SurpriseItem {
  const pool =
    kind === 'brief' ? BRIEFS :
    kind === 'quiz'  ? QUIZZES :
    ALL;
  const filtered = exclude ? pool.filter((p) => p.id !== exclude) : pool;
  const idx = Math.floor(Math.random() * filtered.length);
  return filtered[idx] ?? pool[0];
}

// ──────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────

export interface SurpriseMeProps {
  /** Render mode. `floating` renders a fixed pill bottom-right; `inline` renders a static panel. */
  variant?: 'floating' | 'inline';
  className?: string;
}

export function SurpriseMe({ variant = 'floating', className }: SurpriseMeProps) {
  const [open, setOpen] = useState(variant === 'inline');
  const [item, setItem] = useState<SurpriseItem | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);

  const draw = useCallback((kind: 'auto' | 'brief' | 'quiz' = 'auto') => {
    setItem((prev) => pickRandom(kind, prev?.id));
    setPicked(null);
  }, []);

  // First draw on open.
  useEffect(() => {
    if (open && !item) draw('auto');
  }, [open, item, draw]);

  // Close on Esc when floating.
  useEffect(() => {
    if (variant !== 'floating' || !open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [variant, open]);

  const Panel = useMemo(() => {
    if (!item) return null;
    if (item.kind === 'brief') {
      return (
        <article>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-cyber">
            <IconShield className="h-3.5 w-3.5" />
            <span>ICS BRIEF</span>
          </div>
          <h3 className="mt-2 text-base font-bold leading-snug text-ai-ink">{item.title}</h3>
          <p className="mt-2 text-[13px] text-ai-ink-soft leading-relaxed">{item.body}</p>
          <p className="mt-3 text-[11px] font-ai-mono text-ai-ink-dim">{item.source}</p>
        </article>
      );
    }
    return (
      <article>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-warn">
          <IconVuln className="h-3.5 w-3.5" />
          <span>QUICK QUIZ</span>
        </div>
        <h3 className="mt-2 text-[15px] font-bold leading-snug text-ai-ink">{item.question}</h3>
        <ul className="mt-3 space-y-1.5">
          {item.options.map((opt, i) => {
            const isPicked = picked === i;
            const isCorrect = picked !== null && i === item.correctIndex;
            const isWrong = picked === i && i !== item.correctIndex;
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => picked === null && setPicked(i)}
                  disabled={picked !== null}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-ai-tile text-[13px] font-medium transition-colors border',
                    picked === null && 'border-ai-line bg-ai-bg hover:bg-ai-bg-mute hover:border-ai-primary/30 text-ai-ink',
                    isCorrect && 'border-ai-ok bg-ai-ok-soft text-ai-ok',
                    isWrong && 'border-ai-crit bg-ai-crit-soft text-ai-crit',
                    !isPicked && picked !== null && i !== item.correctIndex && 'border-ai-line bg-ai-bg text-ai-ink-dim',
                  )}
                >
                  <span className="font-ai-mono text-[11px] mr-2 opacity-70">{String.fromCharCode(65 + i)}.</span>
                  {opt}
                </button>
              </li>
            );
          })}
        </ul>
        {picked !== null && (
          <p className="mt-3 text-[12.5px] text-ai-ink-soft leading-relaxed border-l-2 border-ai-accent pl-3">
            {item.explanation}
          </p>
        )}
      </article>
    );
  }, [item, picked]);

  const controls = (
    <div className="mt-5 flex items-center justify-between gap-2">
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => draw('brief')} className="px-2.5 py-1 rounded-ai-tile text-[11px] font-ai-mono uppercase tracking-ai-mono border border-ai-line text-ai-ink-soft hover:text-ai-primary hover:border-ai-primary/40 transition-colors">
          Brief
        </button>
        <button type="button" onClick={() => draw('quiz')} className="px-2.5 py-1 rounded-ai-tile text-[11px] font-ai-mono uppercase tracking-ai-mono border border-ai-line text-ai-ink-soft hover:text-ai-primary hover:border-ai-primary/40 transition-colors">
          Quiz
        </button>
      </div>
      <button
        type="button"
        onClick={() => draw('auto')}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-ai-tile text-[11px] font-ai-mono uppercase tracking-ai-mono bg-ai-primary text-white hover:bg-ai-primary-hover transition-colors"
      >
        <RefreshCw className="h-3 w-3" />
        Another
      </button>
    </div>
  );

  if (variant === 'inline') {
    return (
      <div className={cn('rounded-ai-card border border-ai-line bg-ai-bg shadow-ai-tile p-5', className)}>
        {Panel}
        {controls}
      </div>
    );
  }

  // Floating
  return (
    <>
      {/* Trigger pill */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            'fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 px-4 py-2.5 rounded-full',
            'bg-ai-primary text-white shadow-ai-glow-primary hover:bg-ai-primary-hover transition-colors',
            'font-ai-mono text-[12.5px] font-bold uppercase tracking-ai-mono',
            className,
          )}
        >
          <Sparkles className="h-4 w-4" />
          Surprise Me
        </button>
      )}

      {/* Drawer */}
      {open && (
        <div
          ref={drawerRef}
          role="dialog"
          aria-label="Surprise Me"
          className="fixed bottom-5 right-5 z-50 w-[min(96vw,380px)] rounded-ai-card border border-ai-line bg-ai-bg shadow-ai-card-deep p-5 animate-ai-fade-up"
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Surprise Me
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 rounded-ai-tile text-ai-ink-dim hover:bg-ai-bg-mute hover:text-ai-ink transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {Panel}
          {controls}
          <div className="mt-3 pt-3 border-t border-ai-line">
            <a href="/knowledge" className="inline-flex items-center gap-1 text-[11.5px] font-ai-mono text-ai-accent hover:text-ai-primary transition-colors">
              Browse the Knowledge Base
              <ArrowRight className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}
    </>
  );
}
