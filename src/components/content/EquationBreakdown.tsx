'use client';

import { useState } from 'react';
import { sanitizeSymbol } from '@/lib/sanitize-symbol';

interface Props {
  title?: string;
  /** Pipe-delimited: "symbol|label|description|color" */
  result: string;
  /** Multiple inputs separated by ;; - each is "symbol|label|description|color" */
  inputs: string;
  operator?: string;
}

const colorMap: Record<string, {
  bg: string; border: string; text: string; dot: string;
  bgHover: string; borderHover: string; shadow: string; line: string;
}> = {
  blue:   { bg: 'bg-blue-50',    border: 'border-blue-300',    text: 'text-blue-800',    dot: 'bg-blue-400',    bgHover: 'bg-blue-100',    borderHover: 'border-blue-500',    shadow: 'shadow-blue-200/50',    line: 'bg-blue-300' },
  green:  { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-800', dot: 'bg-emerald-400', bgHover: 'bg-emerald-100', borderHover: 'border-emerald-500', shadow: 'shadow-emerald-200/50', line: 'bg-emerald-300' },
  amber:  { bg: 'bg-amber-50',   border: 'border-amber-300',   text: 'text-amber-800',   dot: 'bg-amber-400',   bgHover: 'bg-amber-100',   borderHover: 'border-amber-500',   shadow: 'shadow-amber-200/50',   line: 'bg-amber-300' },
  violet: { bg: 'bg-violet-50',  border: 'border-violet-300',  text: 'text-violet-800',  dot: 'bg-violet-400',  bgHover: 'bg-violet-100',  borderHover: 'border-violet-500',  shadow: 'shadow-violet-200/50',  line: 'bg-violet-300' },
  rose:   { bg: 'bg-rose-50',    border: 'border-rose-300',    text: 'text-rose-800',    dot: 'bg-rose-400',    bgHover: 'bg-rose-100',    borderHover: 'border-rose-500',    shadow: 'shadow-rose-200/50',    line: 'bg-rose-300' },
  cyan:   { bg: 'bg-cyan-50',    border: 'border-cyan-300',    text: 'text-cyan-800',    dot: 'bg-cyan-400',    bgHover: 'bg-cyan-100',    borderHover: 'border-cyan-500',    shadow: 'shadow-cyan-200/50',    line: 'bg-cyan-300' },
  orange: { bg: 'bg-orange-50',  border: 'border-orange-300',  text: 'text-orange-800',  dot: 'bg-orange-400',  bgHover: 'bg-orange-100',  borderHover: 'border-orange-500',  shadow: 'shadow-orange-200/50',  line: 'bg-orange-300' },
};

function parse(s: string) {
  const [symbol, label, description, color] = s.split('|').map(p => p.trim());
  return { symbol, label, description, color: color || 'blue' };
}

function getColor(name: string) {
  return colorMap[name] || colorMap.blue;
}

export default function EquationBreakdown({ title, result, inputs, operator = '×' }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const r = parse(result);
  const parts = inputs.split(';;').map(s => parse(s.trim()));
  const allItems = [r, ...parts];

  function isActive(idx: number) {
    return hovered === idx;
  }

  function isInactive(idx: number) {
    return hovered !== null && hovered !== idx;
  }

  return (
    <div className="my-8 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 md:p-8 shadow-sm">
      {title && (
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-5">{title}</p>
      )}

      {/* Equation display */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-2">
        {/* Result pill */}
        <span
          className={`inline-flex items-center px-4 py-2.5 rounded-xl border-2 font-mono text-lg font-bold cursor-default transition-all duration-200 ${
            isActive(0)
              ? `${getColor(r.color).borderHover} ${getColor(r.color).bgHover} ${getColor(r.color).text} shadow-lg ${getColor(r.color).shadow} scale-105`
              : isInactive(0)
                ? `${getColor(r.color).border} ${getColor(r.color).bg} ${getColor(r.color).text} opacity-40`
                : `${getColor(r.color).border} ${getColor(r.color).bg} ${getColor(r.color).text}`
          }`}
          onClick={() => setHovered(prev => prev === 0 ? null : 0)}
          onMouseEnter={() => setHovered(0)}
          onMouseLeave={() => setHovered(null)}
          dangerouslySetInnerHTML={{ __html: sanitizeSymbol(r.symbol) }}
        />
        <span className={`text-xl font-light transition-opacity duration-200 ${hovered !== null ? 'text-slate-300' : 'text-slate-400'}`}>=</span>

        {/* Input pills */}
        {parts.map((part, i) => {
          const c = getColor(part.color);
          const idx = i + 1;
          return (
            <span key={i} className="flex items-center gap-3">
              <span
                className={`inline-flex items-center px-4 py-2.5 rounded-xl border-2 font-mono text-lg font-bold cursor-default transition-all duration-200 ${
                  isActive(idx)
                    ? `${c.borderHover} ${c.bgHover} ${c.text} shadow-lg ${c.shadow} scale-105`
                    : isInactive(idx)
                      ? `${c.border} ${c.bg} ${c.text} opacity-40`
                      : `${c.border} ${c.bg} ${c.text}`
                }`}
                onClick={() => setHovered(prev => prev === idx ? null : idx)}
                onMouseEnter={() => setHovered(idx)}
                onMouseLeave={() => setHovered(null)}
                dangerouslySetInnerHTML={{ __html: sanitizeSymbol(part.symbol) }}
              />
              {i < parts.length - 1 && (
                <span className={`text-xl font-light transition-opacity duration-200 ${hovered !== null ? 'text-slate-300' : 'text-slate-400'}`}>{operator}</span>
              )}
            </span>
          );
        })}
      </div>

      {/* Connector dots - vertical lines from equation to cards */}
      <div className={`grid grid-cols-1 gap-3 ${parts.length <= 2 ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
        {/* Connector lines */}
        {allItems.map((item, idx) => {
          const c = getColor(item.color);
          return (
            <div key={`line-${idx}`} className="hidden sm:flex justify-center py-1">
              <div
                className={`w-0.5 h-5 rounded-full transition-all duration-200 ${
                  isActive(idx) ? `${c.line} h-5` : isInactive(idx) ? 'bg-slate-200 h-3' : `${c.line} opacity-60 h-4`
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Legend cards */}
      <div className={`grid grid-cols-1 gap-3 ${parts.length <= 2 ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
        {allItems.map((item, idx) => {
          const c = getColor(item.color);
          return (
            <div
              key={idx}
              className={`rounded-xl border p-4 cursor-default transition-all duration-200 ${
                isActive(idx)
                  ? `${c.borderHover} ${c.bgHover} shadow-lg ${c.shadow} scale-[1.02]`
                  : isInactive(idx)
                    ? `${c.border} ${c.bg} opacity-40`
                    : `${c.border} ${c.bg}`
              }`}
              onClick={() => setHovered(prev => prev === idx ? null : idx)}
              onMouseEnter={() => setHovered(idx)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`w-2.5 h-2.5 rounded-full transition-transform duration-200 ${c.dot} ${isActive(idx) ? 'scale-125' : ''}`} />
                <span className={`font-mono text-sm font-bold ${c.text}`} dangerouslySetInnerHTML={{ __html: sanitizeSymbol(item.symbol) }} />
              </div>
              <p className={`text-sm font-semibold ${c.text}`}>{item.label}</p>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
