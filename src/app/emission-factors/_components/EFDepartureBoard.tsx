/**
 * EFDepartureBoard
 *
 * Dense wall of real factor rows, rendered like an airport departure board.
 * Sits directly beneath the brutalist hero. No headline. The data is the
 * section. One row carries a subtle shimmer as a live-refresh hint.
 */

import Link from 'next/link';
import { Search, ArrowUpRight } from 'lucide-react';

interface Row {
  source: string;
  activity: string;
  value: string;
  unit: string;
  scope: string;
  vintage: string;
  methodology: string;
  shimmer?: boolean;
}

const ROWS: Row[] = [
  { source: 'DEFRA 2025',   activity: 'UK grid electricity',                  value: '0.207', unit: 'kgCO₂e/kWh',  scope: '2', vintage: '2025', methodology: 'Location-based' },
  { source: 'CEA 2024',     activity: 'India NEWNE grid electricity',         value: '0.727', unit: 'kgCO₂e/kWh',  scope: '2', vintage: '2024', methodology: 'Combined margin', shimmer: true },
  { source: 'US EPA 2025',  activity: 'US national grid average',             value: '0.389', unit: 'kgCO₂e/kWh',  scope: '2', vintage: '2024', methodology: 'Location-based' },
  { source: 'IEA 2024',     activity: 'Germany grid electricity',             value: '0.378', unit: 'kgCO₂e/kWh',  scope: '2', vintage: '2024', methodology: 'Location-based' },
  { source: 'DEFRA 2025',   activity: 'Natural gas, stationary combustion',   value: '0.203', unit: 'kgCO₂e/kWh',  scope: '1', vintage: '2025', methodology: 'Activity-based' },
  { source: 'DEFRA 2025',   activity: 'Diesel, road freight (rigid >17t)',    value: '2.680', unit: 'kgCO₂e/L',    scope: '1', vintage: '2025', methodology: 'Activity-based' },
  { source: 'MoRTH 2024',   activity: 'India diesel road freight',            value: '2.642', unit: 'kgCO₂e/L',    scope: '1', vintage: '2024', methodology: 'Activity-based' },
  { source: 'DEFRA 2025',   activity: 'Long-haul flight, business class',     value: '0.509', unit: 'kgCO₂e/p-km', scope: '3', vintage: '2025', methodology: 'Activity-based' },
  { source: 'IPCC AR6',     activity: 'Methane (CH₄), GWP100',                value: '27.9',  unit: 'kgCO₂e/kgCH₄', scope: '—', vintage: '2021', methodology: '—' },
  { source: 'IPCC AR6',     activity: 'Nitrous oxide (N₂O), GWP100',          value: '273',   unit: 'kgCO₂e/kgN₂O', scope: '—', vintage: '2021', methodology: '—' },
  { source: 'US EPA 2025',  activity: 'Refrigerant HFC-134a leakage',         value: '1430',  unit: 'kgCO₂e/kg',   scope: '1', vintage: '2024', methodology: 'Activity-based' },
  { source: 'USEEIO 2024',  activity: 'Professional services, legal',         value: '0.224', unit: 'kgCO₂e/USD',  scope: '3', vintage: '2022', methodology: 'Spend-based' },
  { source: 'USEEIO 2024',  activity: 'IT and computer systems services',     value: '0.162', unit: 'kgCO₂e/USD',  scope: '3', vintage: '2022', methodology: 'Spend-based' },
  { source: 'DEFRA 2025',   activity: 'Waste to landfill, mixed municipal',   value: '0.586', unit: 'kgCO₂e/kg',   scope: '3', vintage: '2025', methodology: 'Activity-based' },
];

const COLS = [
  { key: 'source',      label: 'Source',      width: 'w-[12%]' },
  { key: 'activity',    label: 'Activity',    width: 'w-[34%]' },
  { key: 'value',       label: 'Value',       width: 'w-[10%]' },
  { key: 'unit',        label: 'Unit',        width: 'w-[13%]' },
  { key: 'scope',       label: 'Scope',       width: 'w-[6%]'  },
  { key: 'vintage',     label: 'Vintage',     width: 'w-[8%]'  },
  { key: 'methodology', label: 'Methodology', width: 'w-[17%]' },
];

export function EFDepartureBoard() {
  return (
    <section className="relative w-full text-white">
      <div className="mx-auto max-w-6xl px-6 pt-12 pb-16">
        {/* Top strip: live status + filter */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-3">
            <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#95D5B2]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#95D5B2] animate-pulse" aria-hidden />
              Live library
            </span>
            <span className="font-mono text-[11px] text-white/40">
              211,651 factors · 41 sources · data fresh
            </span>
          </div>

          <Link
            href="/emission-factors/search"
            className="inline-flex items-center gap-2 rounded-md bg-white/5 hover:bg-white/10 px-3 py-1.5 text-[12px] text-white/80 border border-white/10 transition-colors"
          >
            <Search className="h-3.5 w-3.5" strokeWidth={2} />
            <span className="font-mono uppercase tracking-[0.14em]">Filter 211,651 factors</span>
          </Link>
        </div>

        {/* Column headers */}
        <div className="mt-6 flex w-full items-center gap-3 px-2 text-[10px] uppercase tracking-[0.14em] text-white/40 font-mono">
          {COLS.map((c) => (
            <div key={c.key} className={c.width}>{c.label}</div>
          ))}
        </div>
        <div className="h-px w-full bg-[#2D6A4F]/50 mt-2" aria-hidden />

        {/* Rows */}
        <ul className="mt-0 divide-y divide-white/5" role="list">
          {ROWS.map((row, i) => (
            <li
              key={`${row.source}-${row.activity}`}
              className={
                'flex w-full items-center gap-3 px-2 py-[11px] font-mono text-[13px] transition-colors hover:bg-white/[0.035] ' +
                (i % 2 === 0 ? 'bg-white/[0.008]' : '') +
                (row.shimmer ? ' gt-row-shimmer' : '')
              }
            >
              <div className={`${COLS[0].width} text-white/70 truncate`}>{row.source}</div>
              <div className={`${COLS[1].width} text-white/90 truncate`}>{row.activity}</div>
              <div className={`${COLS[2].width} text-[#95D5B2] font-semibold truncate`}>{row.value}</div>
              <div className={`${COLS[3].width} text-white/60 truncate`}>{row.unit}</div>
              <div className={`${COLS[4].width} text-white/60`}>{row.scope}</div>
              <div className={`${COLS[5].width} text-white/60`}>{row.vintage}</div>
              <div className={`${COLS[6].width} text-white/60 truncate`}>{row.methodology}</div>
            </li>
          ))}
        </ul>

        {/* Pagination footer */}
        <div className="mt-6 flex items-center justify-between text-[11px] font-mono text-white/40">
          <span>Page 1 of 15,118 · showing 14 of 211,651</span>
          <Link
            href="/emission-factors/search"
            className="inline-flex items-center gap-1.5 text-[#95D5B2] hover:text-white transition-colors"
          >
            Open the full library
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </section>
  );
}
