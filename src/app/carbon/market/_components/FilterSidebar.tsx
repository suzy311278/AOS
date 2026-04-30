'use client';

import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { CERTIFICATION_OPTIONS, REGISTRY_LABEL, STATUS_ORDER, COURSE_METHODOLOGIES } from './types';
import type { Registry, StatusBucket } from './types';

export interface FilterState {
  registries: Registry[];
  methodologies: string[];
  countries: string[];
  statuses: StatusBucket[];
  certifications: string[];
  corsia: 'any' | 'eligible' | 'ineligible';
}

interface Props {
  facets: {
    registry: Record<string, number>;
    methodology: Record<string, number>;
    country: Record<string, number>;
    statusBucket: Record<string, number>;
    corsia?: {
      eligible: number;
      pilot: number;
      first: number;
      second: number;
      conditional: number;
    };
  };
  state: FilterState;
  setState: (s: FilterState) => void;
  onClose?: () => void;
}

const REGISTRIES: Registry[] = [
  'verra_vcs',
  'verra_ccb',
  'verra_pwrp',
  'verra_jnr',
  'verra_fcpf',
  'goldstandard',
  'acr',
  'car',
  'car_compliance',
  'art',
  'gcc',
];

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-bold tracking-[0.22em] uppercase text-gt-text-dim mb-3">
      {children}
    </h3>
  );
}

function Checkbox({
  label,
  count,
  checked,
  onChange,
  suffix,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
  suffix?: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-gt-text-muted cursor-pointer hover:text-gt-text py-1">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 accent-gt-medium rounded"
      />
      <span className="flex-1 truncate">{label}</span>
      {suffix}
      {count != null ? (
        <span className="font-['JetBrains_Mono'] text-[11px] text-gt-text-dim">{count}</span>
      ) : null}
    </label>
  );
}

export default function FilterSidebar({ facets, state, setState, onClose }: Props) {
  const [methodQuery, setMethodQuery] = useState('');
  const [countryQuery, setCountryQuery] = useState('');
  const [showAllMethods, setShowAllMethods] = useState(false);

  const methodologies = useMemo(() => {
    const entries = Object.entries(facets.methodology).sort((a, b) => b[1] - a[1]);
    const filtered = methodQuery
      ? entries.filter(([m]) => m.toLowerCase().includes(methodQuery.toLowerCase()))
      : entries;
    return showAllMethods ? filtered : filtered.slice(0, 10);
  }, [facets.methodology, methodQuery, showAllMethods]);

  const countries = useMemo(() => {
    const entries = Object.entries(facets.country).sort((a, b) => b[1] - a[1]);
    const filtered = countryQuery
      ? entries.filter(([c]) => c.toLowerCase().includes(countryQuery.toLowerCase()))
      : entries;
    return filtered.slice(0, 50);
  }, [facets.country, countryQuery]);

  const clearAll = () =>
    setState({
      registries: [],
      methodologies: [],
      countries: [],
      statuses: [],
      certifications: [],
      corsia: 'any',
    });

  const totalActive =
    state.registries.length +
    state.methodologies.length +
    state.countries.length +
    state.statuses.length +
    state.certifications.length +
    (state.corsia !== 'any' ? 1 : 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between lg:hidden">
        <span className="text-sm font-semibold text-gt-text">Filters</span>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gt-pale"
            aria-label="Close filters"
          >
            <X className="w-5 h-5 text-gt-text-muted" />
          </button>
        ) : null}
      </div>

      <section>
        <SectionHeading>Registry</SectionHeading>
        <div className="flex flex-col">
          {[...REGISTRIES]
            .sort((a, b) => (facets.registry[b] ?? 0) - (facets.registry[a] ?? 0))
            .map(r => (
            <Checkbox
              key={r}
              label={REGISTRY_LABEL[r]}
              count={facets.registry[r] ?? 0}
              checked={state.registries.includes(r)}
              onChange={() => setState({ ...state, registries: toggle(state.registries, r) })}
            />
          ))}
        </div>
      </section>

      <section>
        <SectionHeading>Status</SectionHeading>
        <select
          value={state.statuses[0] ?? ''}
          onChange={e =>
            setState({
              ...state,
              statuses: e.target.value ? [e.target.value as StatusBucket] : [],
            })
          }
          className="w-full text-sm bg-white border border-gt-border-light rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gt-medium/20 focus:border-gt-medium"
        >
          <option value="">Any status</option>
          {STATUS_ORDER.map(s => (
            <option key={s} value={s}>
              {s} ({(facets.statusBucket[s] ?? 0).toLocaleString('en-US')})
            </option>
          ))}
        </select>
      </section>

      <section>
        <SectionHeading>Methodology</SectionHeading>
        <div className="relative mb-3">
          <Search
            className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gt-text-dim"
            strokeWidth={2}
          />
          <input
            type="text"
            placeholder="Search methodologies"
            value={methodQuery}
            onChange={e => setMethodQuery(e.target.value)}
            className="w-full pl-8 pr-2 py-1.5 text-xs border border-gt-border-light rounded-md focus:outline-none focus:ring-2 focus:ring-gt-medium/20 focus:border-gt-medium"
          />
        </div>
        <div className="flex flex-col max-h-64 overflow-auto pr-1">
          {methodologies.map(([m, count]) => (
            <Checkbox
              key={m}
              label={m}
              count={count}
              checked={state.methodologies.includes(m)}
              onChange={() =>
                setState({ ...state, methodologies: toggle(state.methodologies, m) })
              }
              suffix={
                COURSE_METHODOLOGIES[m] ? (
                  <a
                    href={`/courses/${COURSE_METHODOLOGIES[m]}`}
                    className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#005c55]/10 text-[#005c55] hover:bg-[#005c55]/20"
                    onClick={e => e.stopPropagation()}
                  >
                    Course
                  </a>
                ) : null
              }
            />
          ))}
        </div>
        {!methodQuery && Object.keys(facets.methodology).length > 10 ? (
          <button
            type="button"
            onClick={() => setShowAllMethods(v => !v)}
            className="mt-2 text-xs font-semibold text-gt-medium hover:text-gt-dark"
          >
            {showAllMethods ? 'Show fewer' : `Show all (${Object.keys(facets.methodology).length})`}
          </button>
        ) : null}
      </section>

      <section>
        <SectionHeading>Country</SectionHeading>
        <div className="relative mb-3">
          <Search
            className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gt-text-dim"
            strokeWidth={2}
          />
          <input
            type="text"
            placeholder="Search countries"
            value={countryQuery}
            onChange={e => setCountryQuery(e.target.value)}
            className="w-full pl-8 pr-2 py-1.5 text-xs border border-gt-border-light rounded-md focus:outline-none focus:ring-2 focus:ring-gt-medium/20 focus:border-gt-medium"
          />
        </div>
        <div className="flex flex-col max-h-64 overflow-auto pr-1">
          {countries.map(([c, count]) => (
            <Checkbox
              key={c}
              label={c}
              count={count}
              checked={state.countries.includes(c)}
              onChange={() => setState({ ...state, countries: toggle(state.countries, c) })}
            />
          ))}
        </div>
      </section>

      <section>
        <SectionHeading>Additional Certifications</SectionHeading>
        <div className="flex flex-col">
          {CERTIFICATION_OPTIONS.map(c => (
            <Checkbox
              key={c}
              label={c}
              checked={state.certifications.includes(c)}
              onChange={() =>
                setState({ ...state, certifications: toggle(state.certifications, c) })
              }
            />
          ))}
        </div>
      </section>

      {facets.corsia ? (
        <section>
          <SectionHeading>CORSIA (Aviation Offsets)</SectionHeading>
          <div className="flex flex-col">
            {(
              [
                { value: 'any', label: 'All projects', count: undefined },
                { value: 'eligible', label: 'CORSIA eligible', count: facets.corsia.eligible },
                {
                  value: 'ineligible',
                  label: 'Not eligible',
                  count: undefined,
                },
              ] as const
            ).map(opt => (
              <label
                key={opt.value}
                className="flex items-center gap-2 text-sm text-gt-text-muted cursor-pointer hover:text-gt-text py-1"
              >
                <input
                  type="radio"
                  name="corsia-filter"
                  checked={state.corsia === opt.value}
                  onChange={() => setState({ ...state, corsia: opt.value })}
                  className="w-4 h-4 accent-gt-medium"
                />
                <span className="flex-1 truncate">{opt.label}</span>
                {opt.count != null ? (
                  <span className="font-['JetBrains_Mono'] text-[11px] text-gt-text-dim">
                    {opt.count.toLocaleString()}
                  </span>
                ) : null}
              </label>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-gt-text-dim">
            Eligible under ICAO's Programme Eligibility table (Apr 2026).
            Matches registry plus crediting-period overlap with an approved
            compliance phase.
          </p>
        </section>
      ) : null}

      <button
        type="button"
        onClick={clearAll}
        disabled={totalActive === 0}
        className="text-sm font-semibold text-gt-medium hover:text-gt-dark disabled:text-gt-text-dim disabled:cursor-not-allowed self-start"
      >
        Clear all filters {totalActive > 0 ? `(${totalActive})` : ''}
      </button>
    </div>
  );
}
