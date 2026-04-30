/**
 * EFStatStrip
 *
 * Thin horizontal band of four numerical claims. Typography-only, no cards.
 */

interface Stat {
  value: string;
  label: string;
}

const STATS: Stat[] = [
  { value: '280', label: 'fuels factors' },
  { value: '81', label: 'unit families' },
  { value: '1', label: 'primary source (DEFRA 2025)' },
  { value: '0', label: 'hallucinations, every value cited' },
];

export function EFStatStrip() {
  return (
    <div className="mx-auto max-w-5xl">
      <dl className="grid grid-cols-2 gap-y-10 gap-x-6 md:grid-cols-4 md:gap-0">
        {STATS.map((stat, i) => (
          <div
            key={stat.label}
            className={
              'text-center md:px-6' +
              (i > 0 ? ' md:border-l md:border-gt-border-light' : '')
            }
          >
            <dt className="sr-only">{stat.label}</dt>
            <dd
              className="text-3xl md:text-4xl font-semibold text-[#2D6A4F]"
              style={{ fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace' }}
            >
              {stat.value}
            </dd>
            <div className="mt-2 text-[11px] uppercase tracking-[0.14em] text-gt-text-dim">
              {stat.label}
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}
