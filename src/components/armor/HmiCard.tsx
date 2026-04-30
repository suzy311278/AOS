/**
 * HmiCard — High-performance HMI tile.
 *
 * Following ASM/HMI guidelines:
 *   - Background is muted (`ai-bg-mute` or `ai-deep-2`).
 *   - Text is high-contrast but not saturated.
 *   - Status indicator (LED) is the only saturated element.
 *   - Numbers use mono so columns align across tiles.
 */
import * as React from 'react';
import { cn } from './lib/cn';

export type HmiStatus = 'ok' | 'warn' | 'crit' | 'offline';

export interface HmiCardProps {
  /** Top-row eyebrow / tag id (e.g. "PLC-04" or "MODBUS/TCP"). */
  tag?: string;
  /** Main label (e.g. "Pump Station West"). */
  label: string;
  /** The big readout (number, code, or short string). */
  value: React.ReactNode;
  /** Unit suffix (e.g. "psi", "°C"). */
  unit?: string;
  /** Optional secondary line. */
  hint?: string;
  /** Status LED. Omit to render no LED. */
  status?: HmiStatus;
  /** Status text rendered next to LED. */
  statusLabel?: string;
  /** Visual surface. */
  tone?: 'light' | 'deep';
  /** Render value in mono (default true). */
  mono?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function HmiCard({
  tag,
  label,
  value,
  unit,
  hint,
  status,
  statusLabel,
  tone = 'light',
  mono = true,
  className,
  children,
}: HmiCardProps) {
  const isDeep = tone === 'deep';

  return (
    <div
      className={cn(
        'relative rounded-ai-tile p-4 ai-tile-inset transition-shadow',
        isDeep
          ? 'bg-ai-deep-2 text-ai-ink-on-deep border border-ai-line-deep shadow-ai-card-deep'
          : 'bg-ai-bg-mute text-ai-ink border border-ai-line shadow-ai-tile hover:shadow-ai-tile-hover',
        status === 'crit' && 'animate-ai-alarm-pulse',
        className,
      )}
    >
      {/* Header row: tag + status */}
      <div className="flex items-center justify-between gap-3 mb-3">
        {tag ? (
          <span
            className={cn(
              'text-[10px] font-bold uppercase tracking-ai-eyebrow font-ai-mono',
              isDeep ? 'text-ai-ink-on-deep-soft' : 'text-ai-ink-soft',
            )}
          >
            {tag}
          </span>
        ) : (
          <span aria-hidden />
        )}
        {status ? (
          <span className="flex items-center gap-1.5">
            <span className={cn('ai-led', `ai-led--${status}`)} aria-hidden />
            <span
              className={cn(
                'text-[10px] font-bold uppercase tracking-ai-eyebrow font-ai-mono',
                isDeep ? 'text-ai-ink-on-deep-soft' : 'text-ai-ink-soft',
              )}
            >
              {statusLabel ?? status}
            </span>
          </span>
        ) : null}
      </div>

      {/* Label */}
      <div
        className={cn(
          'text-sm font-semibold leading-snug',
          isDeep ? 'text-ai-ink-on-deep' : 'text-ai-ink',
        )}
      >
        {label}
      </div>

      {/* Big readout */}
      <div className="mt-2 flex items-baseline gap-1.5">
        <span
          className={cn(
            'text-3xl font-extrabold tracking-ai-mono leading-none',
            mono && 'font-ai-mono',
            isDeep ? 'text-ai-ink-on-deep' : 'text-ai-ink',
          )}
        >
          {value}
        </span>
        {unit ? (
          <span
            className={cn(
              'text-xs font-semibold font-ai-mono uppercase tracking-ai-mono',
              isDeep ? 'text-ai-ink-on-deep-dim' : 'text-ai-ink-dim',
            )}
          >
            {unit}
          </span>
        ) : null}
      </div>

      {hint ? (
        <p
          className={cn(
            'mt-2 text-xs leading-relaxed',
            isDeep ? 'text-ai-ink-on-deep-soft' : 'text-ai-ink-soft',
          )}
        >
          {hint}
        </p>
      ) : null}

      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}
