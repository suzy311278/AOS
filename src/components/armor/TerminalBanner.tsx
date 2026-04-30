/**
 * TerminalBanner — interactive command-line hero.
 *
 * Acts like a polished marketing element while staying authentic to OT
 * pentesters: a real, typed-in CLI with a small command set.
 *
 * Behavior
 * ────────
 * 1. On mount, autotypes a cinematic session (~2.5 s).
 * 2. After autotype, the caret blinks; the input field accepts:
 *      help | scan | cve | cert | lab | clear
 * 3. Each command renders color-coded, mono output.
 * 4. Honors `prefers-reduced-motion`: skips autotype, renders final state.
 * 5. ARIA: output region is `aria-live="polite"`, input has `aria-label`.
 *
 * No external dependencies (no xterm.js for the marketing hero — keeps
 * the page weight low; xterm.js is reserved for the live lab runner).
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from './lib/cn';

// ──────────────────────────────────────────────────────────────────────
// Output line model
// ──────────────────────────────────────────────────────────────────────

type LineKind =
  | 'prompt'   // `armor@ot:~$ <cmd>`
  | 'info'     // neutral text
  | 'ok'       // green
  | 'warn'     // amber
  | 'crit'     // red
  | 'cyber'    // cyan accent
  | 'dim'      // muted secondary
  | 'banner';  // rendered as ASCII banner

interface Line {
  id: number;
  kind: LineKind;
  text: string;
}

let __id = 0;
const mkLine = (kind: LineKind, text: string): Line => ({ id: ++__id, kind, text });

// ──────────────────────────────────────────────────────────────────────
// Cinematic autotype script
// ──────────────────────────────────────────────────────────────────────

const AUTOTYPE_SCRIPT: { cmd: string; output: Line[] }[] = [
  {
    cmd: 'armor scan --target 10.10.4.0/24 --protocol modbus',
    output: [
      mkLine('dim',  '[*] Initializing OT discovery on tcp/502 ...'),
      mkLine('info', '[+] 10.10.4.12  Schneider M340 PLC      | fw 2.70'),
      mkLine('info', '[+] 10.10.4.18  Siemens S7-1500          | fw 2.9.5'),
      mkLine('info', '[+] 10.10.4.31  Allen-Bradley CompactLogix| fw 33.011'),
      mkLine('warn', '[!] 10.10.4.18  CVE-2023-44319  CVSS 8.6  Authentication bypass'),
      mkLine('crit', '[!] 10.10.4.31  CVE-2024-21912  CVSS 9.8  Unauth firmware overwrite'),
      mkLine('ok',   '[✓] 3 assets fingerprinted · 2 advisories matched · IEC 62443-3-3 SR 1.1 violated'),
    ],
  },
  {
    cmd: 'armor cert --track foundations',
    output: [
      mkLine('cyber', 'AI-CSP-FND  IEC 62443 Cybersecurity Fundamentals Specialist'),
      mkLine('info',  'Modules:    8     Lessons:    32     Hands-on labs:    6'),
      mkLine('info',  'Estimated:  30h   Pass score: 75%    ISA equivalent:   Yes'),
      mkLine('dim',   '──────────────────────────────────────────────────────────'),
      mkLine('ok',    'Type `armor cert --start foundations` to begin.'),
    ],
  },
];

// ──────────────────────────────────────────────────────────────────────
// Interactive command set
// ──────────────────────────────────────────────────────────────────────

const HELP_TEXT: Line[] = [
  mkLine('cyber', 'ArmorInnovate OS · CLI v1.0 · Available commands'),
  mkLine('dim',   '──────────────────────────────────────────────────'),
  mkLine('info',  'help          Show this list'),
  mkLine('info',  'scan          Run a mock OT discovery scan'),
  mkLine('info',  'cve           Pull a recent ICS-CERT advisory'),
  mkLine('info',  'cert          List the IEC 62443 specialist tracks'),
  mkLine('info',  'lab           Open a sample terminal lab'),
  mkLine('info',  'clear         Reset the terminal'),
];

function runCommand(raw: string): Line[] {
  const cmd = raw.trim().toLowerCase();
  if (!cmd) return [];
  if (cmd === 'help')  return HELP_TEXT;
  if (cmd === 'clear') return [];
  if (cmd.startsWith('scan')) {
    return [
      mkLine('dim',  '[*] mock-scan 10.10.4.0/24 ...'),
      mkLine('info', '[+] 4 OT assets fingerprinted'),
      mkLine('warn', '[!] 1 advisory: CVE-2023-44319 (Siemens S7-1500)'),
      mkLine('crit', '[!] 1 critical: CVE-2024-21912 (CompactLogix)'),
      mkLine('ok',   '[✓] Defenders: see /knowledge/iec-62443-3-3 → SR 1.1, SR 3.4.'),
    ];
  }
  if (cmd.startsWith('cve')) {
    return [
      mkLine('cyber', 'ICSA-24-191-04  Rockwell Automation FactoryTalk View ME'),
      mkLine('info',  'Severity: HIGH (CVSS 8.6)   Vector: AV:N/AC:L/PR:N/UI:N'),
      mkLine('info',  'Impact:   Authenticated remote code execution'),
      mkLine('warn',  'Mitigation: Patch v14.00 + segment HMI from L3.5'),
      mkLine('dim',   'Source: CISA ICS-CERT · 2024-07-09'),
    ];
  }
  if (cmd.startsWith('cert')) {
    return [
      mkLine('cyber', 'IEC 62443 Certification Path'),
      mkLine('info',  '  1. AI-CSP-FND  Fundamentals       30h'),
      mkLine('info',  '  2. AI-CSP-RA   Risk Assessment    35h'),
      mkLine('info',  '  3. AI-CSP-DSN  Design             40h'),
      mkLine('info',  '  4. AI-CSP-MNT  Maintenance        30h'),
      mkLine('ok',    '  ──> AI-CSE-EXP Cybersecurity Expert (capstone, 40h)'),
    ];
  }
  if (cmd.startsWith('lab')) {
    return [
      mkLine('cyber', 'lab://modbus-pentest · pymodbus simulator booting ...'),
      mkLine('dim',   '   container: armor-lab-runner:0.4'),
      mkLine('info',  '   target:    plc.lab.local:502'),
      mkLine('info',  '   tools:     mbtget, modbus-cli, scapy, wireshark'),
      mkLine('ok',    '[✓] Hit Enter in the lab page to drop into the shell.'),
    ];
  }
  return [
    mkLine('warn', `command not found: ${raw}`),
    mkLine('dim',  'type "help" for the command list.'),
  ];
}

// ──────────────────────────────────────────────────────────────────────
// Color map per LineKind (Tailwind classes)
// ──────────────────────────────────────────────────────────────────────

const LINE_CLASS: Record<LineKind, string> = {
  prompt: 'text-ai-ink-on-deep',
  info:   'text-ai-ink-on-deep',
  ok:     'text-emerald-400',
  warn:   'text-amber-300',
  crit:   'text-red-400',
  cyber:  'text-ai-cyber-glow',
  dim:    'text-ai-ink-on-deep-dim',
  banner: 'text-ai-cyber-glow',
};

// ──────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────

export interface TerminalBannerProps {
  className?: string;
  /** Disable autotype regardless of motion preference. */
  noAutoType?: boolean;
}

export function TerminalBanner({ className, noAutoType }: TerminalBannerProps) {
  const [lines, setLines] = useState<Line[]>([]);
  const [typingCmd, setTypingCmd] = useState<string>('');
  const [done, setDone] = useState(false);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Cinematic autotype on mount (skipped when reduced-motion or prop set).
  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced || noAutoType) {
      const flat: Line[] = [];
      for (const step of AUTOTYPE_SCRIPT) {
        flat.push(mkLine('prompt', step.cmd));
        flat.push(...step.output);
      }
      setLines(flat);
      setDone(true);
      return;
    }

    let cancelled = false;
    let buffer: Line[] = [];

    async function play() {
      for (const step of AUTOTYPE_SCRIPT) {
        // Type the command letter by letter
        for (let i = 1; i <= step.cmd.length; i++) {
          if (cancelled) return;
          setTypingCmd(step.cmd.slice(0, i));
          await wait(18 + Math.random() * 22);
        }
        await wait(220);
        buffer = [...buffer, mkLine('prompt', step.cmd)];
        setLines([...buffer]);
        setTypingCmd('');

        // Reveal output lines with a brief delay between them
        for (const out of step.output) {
          await wait(80 + Math.random() * 60);
          if (cancelled) return;
          buffer = [...buffer, out];
          setLines([...buffer]);
        }
        await wait(380);
      }
      if (!cancelled) setDone(true);
    }

    play();
    return () => {
      cancelled = true;
    };
  }, [noAutoType]);

  // Auto-scroll to the bottom whenever new content arrives.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [lines, typingCmd]);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const raw = input;
      const result = runCommand(raw);
      if (raw.trim().toLowerCase() === 'clear') {
        setLines([]);
      } else {
        setLines((prev) => [...prev, mkLine('prompt', raw || ''), ...result]);
      }
      setInput('');
    },
    [input],
  );

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const promptHint = useMemo(() => 'try: scan · cve · cert · lab · help', []);

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-ai-card',
        'bg-ai-deep-2 ring-1 ring-ai-line-deep shadow-ai-card-deep',
        'ai-crt ai-scanlines',
        className,
      )}
      onClick={focusInput}
    >
      {/* Window chrome */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-ai-line-deep bg-black/30">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" aria-hidden />
        </div>
        <div className="flex items-center gap-2 text-[11px] font-ai-mono uppercase tracking-ai-eyebrow text-ai-ink-on-deep-soft">
          <span className="ai-led ai-led--ok" aria-hidden />
          <span>armor@ot · session 0x4f1a</span>
        </div>
        <div className="text-[11px] font-ai-mono text-ai-ink-on-deep-dim">
          {done ? 'READY' : 'STREAMING'}
        </div>
      </div>

      {/* Terminal body */}
      <div
        ref={scrollRef}
        className="relative h-[360px] sm:h-[400px] overflow-y-auto px-5 py-4 font-ai-mono text-[13.5px] leading-[1.55] selection:bg-ai-cyber/30"
        role="log"
        aria-live="polite"
        aria-label="ArmorInnovate terminal output"
      >
        {lines.map((ln) => (
          <div key={ln.id} className={cn('whitespace-pre-wrap', LINE_CLASS[ln.kind])}>
            {ln.kind === 'prompt' ? (
              <>
                <span className="text-ai-cyber-glow">armor@ot</span>
                <span className="text-ai-ink-on-deep-dim">:</span>
                <span className="text-ai-accent">~</span>
                <span className="text-ai-ink-on-deep-dim">$ </span>
                <span className="text-ai-ink-on-deep">{ln.text}</span>
              </>
            ) : (
              ln.text
            )}
          </div>
        ))}

        {/* Currently being typed */}
        {!done && typingCmd && (
          <div className="whitespace-pre-wrap text-ai-ink-on-deep">
            <span className="text-ai-cyber-glow">armor@ot</span>
            <span className="text-ai-ink-on-deep-dim">:</span>
            <span className="text-ai-accent">~</span>
            <span className="text-ai-ink-on-deep-dim">$ </span>
            <span>{typingCmd}</span>
            <span className="ai-caret align-baseline text-ai-cyber-glow" />
          </div>
        )}

        {/* Live input — only after autotype completes */}
        {done && (
          <form onSubmit={handleSubmit} className="mt-1 flex items-center gap-0">
            <span className="text-ai-cyber-glow">armor@ot</span>
            <span className="text-ai-ink-on-deep-dim">:</span>
            <span className="text-ai-accent">~</span>
            <span className="text-ai-ink-on-deep-dim">$&nbsp;</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              aria-label="Terminal input. Type help for commands."
              className={cn(
                'flex-1 bg-transparent outline-none border-0 p-0 m-0',
                'font-ai-mono text-[13.5px] leading-[1.55] text-ai-ink-on-deep',
                'placeholder:text-ai-ink-on-deep-dim/70',
                'caret-ai-cyber-glow',
              )}
              placeholder={promptHint}
            />
          </form>
        )}
      </div>

      {/* Subtle bottom status bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-2 border-t border-ai-line-deep bg-black/30 text-[11px] font-ai-mono text-ai-ink-on-deep-dim">
        <span className="flex items-center gap-2">
          <span className="ai-led ai-led--ok" aria-hidden />
          <span>OT-MON</span>
        </span>
        <span className="hidden sm:inline">IEC 62443-3-3 · SL2 · zone:enterprise→cell</span>
        <span>{lines.length} ln</span>
      </div>
    </div>
  );
}

function wait(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}
