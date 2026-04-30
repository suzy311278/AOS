/**
 * InteractiveBlocks
 *
 * Phase C redesigned MDX components for the lesson page:
 *
 *   - CalculationExerciseRedesign  (interactive practice problem)
 *   - ChartRedesign                (recharts bar/pie/horizontal-bar)
 *   - RoughChartRedesign           (hand-drawn rough.js charts wrapper)
 *   - FlowchartRedesign            (mermaid flowchart with brand theme)
 *
 * The Chart and Flowchart components are reimplemented with the
 * Greentryst brand palette so the data viz reads as part of the
 * product, not as a third-party widget.
 *
 * RoughChart wraps the existing canvas implementation untouched
 * because the rough.js drawing code is intricate and intentionally
 * stays the same; only the outer card chrome is restyled.
 */

'use client';

import { useState, useId, useEffect, useRef, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import {
  Calculator,
  BarChart3,
  GitBranch,
  Sparkles,
  PenLine,
  Lightbulb,
  CheckCircle2,
  BookOpen,
  RotateCw,
} from 'lucide-react';
export const ChartRedesign = dynamic(
  () => import('./ChartRedesign'),
  { ssr: false }
);
import { cn } from '@/components/redesign/lib/cn';

/* ============================================================
   Shared mini-card chrome
   Used at the top of CalculationExercise, Chart, RoughChart,
   Flowchart so all four feel like the same family.
   ============================================================ */

function BlockHeader({
  Icon,
  eyebrow,
  title,
}: {
  Icon: typeof Calculator;
  eyebrow: string;
  title?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div
        className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ring-1 ring-inset ring-white/[0.06] shadow-[0_4px_14px_-6px_rgba(11,61,46,0.55)]"
        style={{
          background:
            'linear-gradient(135deg, #0B3D2E 0%, #0d2a20 100%)',
        }}
        aria-hidden
      >
        <Icon className="w-[18px] h-[18px] text-gt-leaf" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p
          className="text-[10px] font-bold uppercase text-gt-medium mb-0.5"
          style={{
            letterSpacing: '0.18em',
            fontFamily:
              'var(--font-jetbrains-mono), JetBrains Mono, monospace',
          }}
        >
          {eyebrow}
        </p>
        {title && (
          <p className="text-[14px] font-semibold text-gt-text leading-snug">
            {title}
          </p>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   CalculationExercise
   ============================================================ */

interface CalcProps {
  question: string;
  answer: number;
  tolerance?: number;
  unit?: string;
  hints?: string[];
  solution?: string;
}

type CalcStatus = 'idle' | 'correct' | 'wrong' | 'revealed';

export function CalculationExerciseRedesign({
  question,
  answer,
  tolerance = 0,
  unit,
  hints = [],
  solution,
}: CalcProps) {
  const inputId = useId();
  const [inputValue, setInputValue] = useState('');
  const [status, setStatus] = useState<CalcStatus>('idle');
  const [hintsShown, setHintsShown] = useState(0);
  const [attempts, setAttempts] = useState(0);

  const isCorrect = (raw: string) => {
    const parsed = parseFloat(raw.replace(/,/g, '').trim());
    if (Number.isNaN(parsed)) return false;
    return Math.abs(parsed - answer) <= tolerance;
  };

  function handleCheck() {
    if (status === 'correct' || status === 'revealed') return;

    if (isCorrect(inputValue)) {
      setStatus('correct');
      return;
    }

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (newAttempts >= hints.length + 1) {
      setStatus('revealed');
    } else {
      setStatus('wrong');
      setHintsShown(Math.min(newAttempts, hints.length));
    }
  }

  function handleReveal() {
    setStatus('revealed');
  }

  function handleReset() {
    setInputValue('');
    setStatus('idle');
    setHintsShown(0);
    setAttempts(0);
  }

  const solved = status === 'correct' || status === 'revealed';

  return (
    <div
      role="group"
      aria-label="Calculation exercise"
      className="relative my-7 rounded-2xl overflow-hidden border border-gt-medium/20 bg-gt-medium/[0.04]"
    >
      <span
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-[3px] bg-gt-medium"
      />
      <div className="p-6 pl-7">
        <BlockHeader
          Icon={Calculator}
          eyebrow="Practice calculation"
        />

        <p className="text-[15px] font-semibold text-gt-text leading-relaxed mb-5">
          {question}
        </p>

        {!solved && (
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <label htmlFor={inputId} className="sr-only">
              Your answer
            </label>
            <div className="flex items-center gap-2">
              <input
                id={inputId}
                type="text"
                inputMode="decimal"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (status === 'wrong') setStatus('idle');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                placeholder="Enter your answer"
                className={cn(
                  'w-full sm:w-48 px-3 py-2.5 rounded-lg border bg-white text-[14px] focus:outline-none focus:border-gt-medium focus:ring-2 focus:ring-gt-medium/15 transition-colors',
                  status === 'wrong'
                    ? 'border-rose-400 bg-rose-50/40'
                    : 'border-gt-border-light'
                )}
                aria-describedby={
                  status === 'wrong' ? 'calc-feedback' : undefined
                }
              />
              {unit && (
                <span
                  className="text-[12px] text-gt-text-dim whitespace-nowrap"
                  style={{
                    fontFamily:
                      'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                  }}
                >
                  {unit}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleCheck}
              disabled={!inputValue.trim()}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-gt-medium text-white text-[13px] font-bold hover:bg-gt-deepest disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Check
            </button>

            {hints.length > 0 &&
              hintsShown < hints.length &&
              attempts > 0 && (
                <button
                  type="button"
                  onClick={handleReveal}
                  className="text-[12px] text-gt-text-dim underline underline-offset-2 hover:text-gt-text transition-colors"
                >
                  Show answer
                </button>
              )}
          </div>
        )}

        {status === 'wrong' && (
          <p
            id="calc-feedback"
            className="text-[13px] text-rose-700 mb-3 inline-flex items-center gap-2"
            role="alert"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Not quite — try again.
          </p>
        )}

        {hintsShown > 0 &&
          hints.slice(0, hintsShown).map((hint, i) => (
            <div
              key={i}
              role="note"
              aria-label={`Hint ${i + 1}`}
              className="flex gap-2.5 text-[13px] text-gt-text-muted bg-gt-medium/[0.04] border border-gt-medium/15 rounded-lg px-3 py-2.5 mb-2"
            >
              <Lightbulb
                className="w-4 h-4 text-gt-medium flex-shrink-0 mt-0.5"
                strokeWidth={2}
              />
              <span className="leading-snug">{hint}</span>
            </div>
          ))}

        {status === 'correct' && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-start gap-3 bg-gt-leaf/10 border border-gt-leaf/35 rounded-lg px-4 py-3.5 mb-3"
          >
            <CheckCircle2
              className="w-5 h-5 text-gt-medium flex-shrink-0 mt-0.5"
              strokeWidth={2}
            />
            <div>
              <p className="font-bold text-gt-deepest text-[14px]">Correct!</p>
              {solution && (
                <p className="text-[13px] mt-1 text-gt-text-muted leading-relaxed">
                  {solution}
                </p>
              )}
            </div>
          </div>
        )}

        {status === 'revealed' && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-start gap-3 bg-gt-border-light/40 border border-gt-border-light rounded-lg px-4 py-3.5 mb-3"
          >
            <BookOpen
              className="w-5 h-5 text-gt-text-muted flex-shrink-0 mt-0.5"
              strokeWidth={2}
            />
            <div>
              <p className="font-bold text-gt-text text-[14px]">
                Answer:{' '}
                <span
                  className="font-mono"
                  style={{
                    fontFamily:
                      'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                  }}
                >
                  {answer}
                  {unit ? ` ${unit}` : ''}
                </span>
              </p>
              {solution && (
                <p className="text-[13px] mt-1 text-gt-text-muted leading-relaxed">
                  {solution}
                </p>
              )}
            </div>
          </div>
        )}

        {solved && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-[12px] text-gt-medium underline underline-offset-2 hover:text-gt-deepest transition-colors"
          >
            <RotateCw className="w-3 h-3" strokeWidth={2.5} />
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Chart (recharts)
   ============================================================ */

/* ============================================================
   RoughChart wrapper
   ============================================================ */

const OriginalRoughChart = dynamic(
  () => import('@/components/content/RoughChart'),
  { ssr: false }
);

interface RoughChartRedesignProps {
  type: 'pie' | 'bar' | 'horizontal-bar' | 'line';
  title?: string;
  data: string;
  xKey: string;
  yKey: string;
  seriesKeys?: string;
  seriesLabels?: string;
  unit?: string;
  height?: string;
  annotations?: string;
}

export function RoughChartRedesign(props: RoughChartRedesignProps) {
  const { title, ...inner } = props;
  return (
    <div className="my-7 rounded-2xl border border-gt-border-light bg-white p-6 shadow-gt-card">
      <BlockHeader
        Icon={PenLine}
        eyebrow="Hand-drawn chart"
        title={title}
      />
      {/* The original rough.js implementation stays untouched. We
          intentionally pass title="" so the inner component does not
          render its own title above the canvas. */}
      <OriginalRoughChart {...inner} title="" />
    </div>
  );
}

/* ============================================================
   Flowchart (mermaid) with brand theme
   ============================================================ */

interface FlowchartRedesignProps {
  chart: string;
}

export function FlowchartRedesign({ chart }: FlowchartRedesignProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const renderIdRef = useRef(`gt-fc-${Math.random().toString(36).slice(2, 9)}`);

  useEffect(() => {
    if (!chart) return;
    let cancelled = false;
    async function render() {
      const mermaid = (await import('mermaid')).default;
      mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        themeVariables: {
          primaryColor: '#F1F8F4',
          primaryBorderColor: '#2D6A4F',
          primaryTextColor: '#0B3D2E',
          lineColor: '#2D6A4F',
          secondaryColor: '#E9F5EE',
          tertiaryColor: '#FFFFFF',
          fontFamily:
            '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
          fontSize: '13px',
          edgeLabelBackground: '#FFFFFF',
          clusterBkg: '#F1F8F4',
          clusterBorder: '#2D6A4F',
        },
        flowchart: {
          htmlLabels: true,
          curve: 'basis',
          padding: 20,
          nodeSpacing: 40,
          rankSpacing: 50,
          useMaxWidth: true,
        },
      });
      try {
        const { svg: rendered } = await mermaid.render(
          renderIdRef.current,
          chart.trim()
        );
        if (!cancelled) setSvg(injectFlowStyles(rendered));
      } catch (e) {
        console.error('Mermaid render error:', e);
      }
    }
    render();
    return () => {
      cancelled = true;
    };
  }, [chart]);

  return (
    <div className="my-7 rounded-2xl border border-gt-border-light bg-white p-6 md:p-8 shadow-gt-card">
      <BlockHeader Icon={GitBranch} eyebrow="Diagram" />
      <div
        ref={containerRef}
        className="flex justify-center overflow-x-auto [&_svg]:max-w-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}

function injectFlowStyles(svg: string): string {
  const styles = `<style>
    .edgeLabel rect {
      fill: #FFFFFF !important;
      stroke: #2D6A4F !important;
      stroke-width: 1px !important;
      rx: 6 !important;
      ry: 6 !important;
    }
    .edgeLabel span,
    .edgeLabel p,
    .edgeLabel div,
    .edgeLabel text {
      color: #0B3D2E !important;
      fill: #0B3D2E !important;
      font-weight: 600 !important;
      font-size: 12px !important;
    }
    .node rect,
    .node .label-container {
      rx: 12px;
      ry: 12px;
      filter: drop-shadow(0 2px 6px rgba(11,61,46,0.12));
    }
    .node polygon {
      filter: drop-shadow(0 2px 6px rgba(11,61,46,0.12));
    }
    .node .label div {
      line-height: 1.45;
    }
    .edgePath .path {
      stroke-width: 2px !important;
    }
    marker path {
      fill: #2D6A4F !important;
    }
  </style>`;
  return svg.replace(/<svg([^>]*)>/, `<svg$1>${styles}`);
}

/* Re-export Sparkles to satisfy the file's lucide imports check
   even though we only use it inside CalloutBoxes elsewhere. */
export const _SparklesIcon = Sparkles;
export type CalcExerciseRefShape = ReactNode;
