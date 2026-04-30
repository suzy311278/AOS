/**
 * StructuralBlocks
 *
 * Phase B redesigned MDX components for the lesson page:
 *
 *   - DeepDiveRedesign       (collapsible "Want to go deeper?" section)
 *   - ResponsiveTableRedesign (horizontal-scroll table wrapper with edge fade)
 *   - FormulaBoxRedesign     (dark forest formula card with mono leaf text)
 *   - EquationBreakdownRedesign (interactive color-coded equation)
 *
 * All four follow the locked design system: dark forest tile recipe
 * for the icon containers, brand-green eyebrows in mono uppercase,
 * forest accent color (with the EquationBreakdown keeping a small
 * 7-color palette so authors can still tag inputs visually).
 */

'use client';

import {
  useState,
  useId,
  useRef,
  useEffect,
  type ReactNode,
} from 'react';
import { ChevronDown, Microscope, Sigma } from 'lucide-react';
import { cn } from '@/components/redesign/lib/cn';
import { sanitizeSymbol } from '@/lib/sanitize-symbol';

/* ============================================================
   DeepDive
   ============================================================ */

export function DeepDiveRedesign({
  title = 'Want to go deeper?',
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    if (open) {
      el.style.maxHeight = el.scrollHeight + 'px';
    } else {
      el.style.maxHeight = '0px';
    }
  }, [open]);

  return (
    <div className="my-7 border border-gt-medium/20 rounded-2xl overflow-hidden bg-gt-medium/[0.04]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={panelId}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-gt-medium/[0.07] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gt-medium"
      >
        <div className="flex items-center gap-4">
          <div
            className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ring-1 ring-inset ring-white/[0.06] shadow-[0_4px_14px_-6px_rgba(11,61,46,0.55)]"
            style={{
              background:
                'linear-gradient(135deg, #0B3D2E 0%, #0d2a20 100%)',
            }}
            aria-hidden
          >
            <Microscope
              className="w-[18px] h-[18px] text-gt-leaf"
              strokeWidth={2}
            />
          </div>
          <div>
            <p
              className="text-[10px] font-bold uppercase text-gt-medium mb-0.5"
              style={{
                letterSpacing: '0.18em',
                fontFamily:
                  'var(--font-jetbrains-mono), JetBrains Mono, monospace',
              }}
            >
              Deep dive
            </p>
            <p className="text-[14px] font-semibold text-gt-text leading-snug">
              {title}
            </p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-gt-medium flex-shrink-0 transition-transform duration-200',
            open ? 'rotate-180' : ''
          )}
          strokeWidth={2}
        />
      </button>

      <div
        id={panelId}
        ref={contentRef}
        style={{
          maxHeight: '0px',
          overflow: 'hidden',
          transition: 'max-height 0.28s ease',
        }}
        role="region"
        aria-label={title}
      >
        <div className="px-6 pt-2 pb-6 border-t border-gt-medium/15 text-[15px] text-gt-text leading-relaxed [&>p]:mb-3 [&>p:last-child]:mb-0">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ResponsiveTable
   ============================================================ */

export function ResponsiveTableRedesign({
  children,
}: {
  children: ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showFade, setShowFade] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    function check() {
      if (!el) return;
      const canScroll = el.scrollWidth > el.clientWidth;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
      setShowFade(canScroll && !atEnd);
    }

    check();
    el.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      el.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, []);

  // ResponsiveTable provides the visual chrome AND styles its inner
  // table elements via descendant selectors. We use descendant
  // selectors because many lessons author tables as raw HTML
  // (`<table><tr><th>...</th></tr></table>`) inside this wrapper, and
  // raw HTML inside a JSX component bypasses MDX's components map.
  // Component overrides never fire on those elements, so the
  // selectors here are the only way to style them.
  return (
    <div className="relative my-7">
      <div
        ref={scrollRef}
        className={
          'overflow-x-auto rounded-2xl bg-white shadow-gt-card border border-gt-border-light ' +
          // Table element
          '[&_table]:w-full [&_table]:border-collapse [&_table]:text-left ' +
          // Header row
          '[&_thead]:bg-gt-medium/[0.06] ' +
          '[&_th]:px-5 [&_th]:py-3.5 [&_th]:text-[11px] [&_th]:font-bold [&_th]:uppercase [&_th]:text-gt-deepest [&_th]:border-b [&_th]:border-gt-medium/15 [&_th]:align-middle [&_th]:whitespace-nowrap [&_th]:tracking-[0.1em] ' +
          '[&_th]:first:pl-7 [&_th]:last:pr-7 ' +
          // Body rows. The :not(:has(th)) selector targets data
          // rows specifically when an author wrote the header row
          // as `<tr><th>...</th></tr>` without an explicit <thead>.
          '[&_tbody_tr]:transition-colors [&_tbody_tr]:hover:bg-gt-medium/[0.03] ' +
          '[&_tr:has(td)]:transition-colors [&_tr:has(td)]:hover:bg-gt-medium/[0.03] ' +
          // First data row gets a subtle separation when the author
          // wrote the header as a <tr><th> without a <thead>
          '[&_tr:has(th)]:bg-gt-medium/[0.06] ' +
          // Body cells
          '[&_td]:px-5 [&_td]:py-3.5 [&_td]:text-[14px] [&_td]:text-gt-text [&_td]:leading-relaxed [&_td]:border-b [&_td]:border-gt-border-light/70 [&_td]:align-top ' +
          '[&_td]:first:pl-7 [&_td]:last:pr-7 ' +
          // Strip the border on the last row's cells so the table
          // closes cleanly into the rounded wrapper
          '[&_tr:last-child_td]:border-b-0 ' +
          // Strong text inside cells gets brand-aligned weight
          '[&_td_strong]:text-gt-deepest [&_td_strong]:font-bold'
        }
      >
        <div className="min-w-[480px]">{children}</div>
      </div>
      {showFade && (
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 right-0 w-10 h-full rounded-r-2xl"
          style={{
            background:
              'linear-gradient(to left, rgba(255,255,255,0.95), transparent)',
          }}
        />
      )}
    </div>
  );
}

/* ============================================================
   FormulaBox
   ============================================================ */

export function FormulaBoxRedesign({ children }: { children: ReactNode }) {
  return (
    <div
      role="math"
      aria-label="Formula"
      className="relative my-7 rounded-2xl overflow-hidden ring-1 ring-inset ring-white/[0.04] shadow-[0_8px_24px_-12px_rgba(11,61,46,0.55)]"
      style={{
        background: 'linear-gradient(135deg, #0B3D2E 0%, #0d2a20 100%)',
      }}
    >
      {/* Subtle dot grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />

      <div className="relative p-6 md:p-7">
        <div className="flex items-center gap-2.5 mb-3">
          <Sigma className="w-4 h-4 text-gt-leaf" strokeWidth={2} />
          <p
            className="text-[10px] font-bold uppercase text-gt-mint"
            style={{
              letterSpacing: '0.2em',
              fontFamily:
                'var(--font-jetbrains-mono), JetBrains Mono, monospace',
            }}
          >
            Formula
          </p>
        </div>

        <div
          className="text-[15px] leading-relaxed text-white/90 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_p]:text-white/90 [&_strong]:text-white [&_strong]:font-bold [&_code]:bg-white/10 [&_code]:text-gt-leaf [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_li]:text-white/90 [&_ul]:text-white/90 [&_ol]:text-white/90"
          style={{
            fontFamily:
              'var(--font-jetbrains-mono), JetBrains Mono, monospace',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   EquationBreakdown
   ============================================================ */

interface EquationBreakdownProps {
  title?: string;
  /** Pipe-delimited: "symbol|label|description|color" */
  result: string;
  /** Multiple inputs separated by ;; - each is "symbol|label|description|color" */
  inputs: string;
  operator?: string;
}

/**
 * Compact 7-color palette tuned for the redesign. Each color maps
 * to a soft tinted background, a stronger border, and a saturated
 * text color so the equation row reads as a series of distinct
 * pills against the white card.
 */
const EQ_COLORS: Record<
  string,
  { bg: string; border: string; text: string; dot: string }
> = {
  blue:   { bg: 'rgba(37,99,235,0.08)',   border: 'rgba(37,99,235,0.35)',   text: '#1d4ed8', dot: '#2563eb' },
  green:  { bg: 'rgba(45,106,79,0.10)',   border: 'rgba(45,106,79,0.45)',   text: '#1B4332', dot: '#2D6A4F' },
  amber:  { bg: 'rgba(180,83,9,0.08)',    border: 'rgba(180,83,9,0.35)',    text: '#92400e', dot: '#B45309' },
  violet: { bg: 'rgba(124,58,237,0.08)',  border: 'rgba(124,58,237,0.35)',  text: '#5b21b6', dot: '#7C3AED' },
  rose:   { bg: 'rgba(225,29,72,0.08)',   border: 'rgba(225,29,72,0.35)',   text: '#9f1239', dot: '#E11D48' },
  cyan:   { bg: 'rgba(8,145,178,0.08)',   border: 'rgba(8,145,178,0.35)',   text: '#155e75', dot: '#0891B2' },
  orange: { bg: 'rgba(234,88,12,0.08)',   border: 'rgba(234,88,12,0.35)',   text: '#9a3412', dot: '#EA580C' },
};

function parseEqPart(s: string) {
  const [symbol, label, description, color] = s.split('|').map((p) => p.trim());
  return { symbol, label, description, color: color || 'green' };
}

function getEqColor(name: string) {
  return EQ_COLORS[name] ?? EQ_COLORS.green;
}

export function EquationBreakdownRedesign({
  title,
  result,
  inputs,
  operator = '×',
}: EquationBreakdownProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const r = parseEqPart(result);
  const parts = inputs.split(';;').map((s) => parseEqPart(s.trim()));
  const allItems = [r, ...parts];

  function isActive(idx: number) {
    return hovered === idx;
  }
  function isInactive(idx: number) {
    return hovered !== null && hovered !== idx;
  }

  return (
    <div className="my-8 rounded-2xl border border-gt-border-light bg-white p-6 md:p-8 shadow-gt-card">
      <div className="flex items-center gap-2.5 mb-6">
        <Sigma className="w-4 h-4 text-gt-medium" strokeWidth={2} />
        <p
          className="text-[10px] font-bold uppercase text-gt-medium"
          style={{
            letterSpacing: '0.2em',
            fontFamily:
              'var(--font-jetbrains-mono), JetBrains Mono, monospace',
          }}
        >
          {title ?? 'Equation breakdown'}
        </p>
      </div>

      {/* Equation pill row */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
        <EqPill
          part={r}
          idx={0}
          hovered={hovered}
          setHovered={setHovered}
          isActive={isActive}
          isInactive={isInactive}
        />
        <span
          className={cn(
            'text-xl font-light transition-opacity duration-200',
            hovered !== null ? 'text-gt-text-dim/40' : 'text-gt-text-dim'
          )}
          style={{
            fontFamily:
              'var(--font-jetbrains-mono), JetBrains Mono, monospace',
          }}
        >
          =
        </span>
        {parts.map((part, i) => {
          const idx = i + 1;
          return (
            <span key={i} className="flex items-center gap-3">
              <EqPill
                part={part}
                idx={idx}
                hovered={hovered}
                setHovered={setHovered}
                isActive={isActive}
                isInactive={isInactive}
              />
              {i < parts.length - 1 && (
                <span
                  className={cn(
                    'text-xl font-light transition-opacity duration-200',
                    hovered !== null
                      ? 'text-gt-text-dim/40'
                      : 'text-gt-text-dim'
                  )}
                  style={{
                    fontFamily:
                      'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                  }}
                >
                  {operator}
                </span>
              )}
            </span>
          );
        })}
      </div>

      {/* Legend cards under the equation row. Hover/click syncs
          with the pill row. */}
      <div
        className={cn(
          'grid grid-cols-1 gap-3',
          parts.length <= 2
            ? 'sm:grid-cols-3'
            : 'sm:grid-cols-2 lg:grid-cols-4'
        )}
      >
        {allItems.map((item, idx) => {
          const c = getEqColor(item.color);
          return (
            <div
              key={idx}
              className="rounded-xl border p-4 cursor-default transition-all duration-200"
              style={{
                backgroundColor: c.bg,
                borderColor: c.border,
                opacity: isInactive(idx) ? 0.35 : 1,
                transform: isActive(idx) ? 'scale(1.02)' : 'scale(1)',
                boxShadow: isActive(idx)
                  ? `0 8px 24px -8px ${c.border}`
                  : 'none',
              }}
              onClick={() =>
                setHovered((prev) => (prev === idx ? null : idx))
              }
              onMouseEnter={() => setHovered(idx)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full transition-transform duration-200"
                  style={{
                    backgroundColor: c.dot,
                    transform: isActive(idx) ? 'scale(1.25)' : 'scale(1)',
                  }}
                />
                <span
                  className="text-sm font-bold"
                  style={{
                    color: c.text,
                    fontFamily:
                      'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                  }}
                  dangerouslySetInnerHTML={{ __html: sanitizeSymbol(item.symbol) }}
                />
              </div>
              <p
                className="text-[13px] font-semibold leading-snug"
                style={{ color: c.text }}
              >
                {item.label}
              </p>
              <p className="text-[12px] text-gt-text-muted mt-1 leading-relaxed">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Internal pill used by EquationBreakdownRedesign for the
   equation row at the top of the card. */
function EqPill({
  part,
  idx,
  hovered,
  setHovered,
  isActive,
  isInactive,
}: {
  part: { symbol: string; label: string; description: string; color: string };
  idx: number;
  hovered: number | null;
  setHovered: (v: number | null) => void;
  isActive: (i: number) => boolean;
  isInactive: (i: number) => boolean;
}) {
  const c = getEqColor(part.color);
  return (
    <span
      className="inline-flex items-center px-4 py-2.5 rounded-xl border-2 text-lg font-bold cursor-default transition-all duration-200"
      style={{
        backgroundColor: c.bg,
        borderColor: c.border,
        color: c.text,
        opacity: isInactive(idx) ? 0.35 : 1,
        transform: isActive(idx) ? 'scale(1.05)' : 'scale(1)',
        boxShadow: isActive(idx) ? `0 8px 22px -8px ${c.border}` : 'none',
        fontFamily:
          'var(--font-jetbrains-mono), JetBrains Mono, monospace',
      }}
      onClick={() => setHovered(hovered === idx ? null : idx)}
      onMouseEnter={() => setHovered(idx)}
      onMouseLeave={() => setHovered(null)}
      dangerouslySetInnerHTML={{ __html: sanitizeSymbol(part.symbol) }}
    />
  );
}
