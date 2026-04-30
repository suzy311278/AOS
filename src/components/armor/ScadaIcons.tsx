/**
 * SCADA-inspired iconography for ArmorInnovate.
 *
 * Design rules:
 *   - 1.5 px stroke, currentColor, square-cap line work.
 *   - Geometry inspired by P&ID / ISA-5.1 instrument symbols, simplified
 *     for UI density (no fill, all strokes).
 *   - Default size = 1em; consumer controls dimension via `className`
 *     (`h-5 w-5`) and color via `text-ai-*`.
 */
import * as React from 'react';

type IconProps = React.SVGProps<SVGSVGElement> & {
  title?: string;
};

function Base({ title, children, className, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      className={className}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

/** Programmable Logic Controller — chassis with I/O blocks and status LED. */
export function IconPLC(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="8" y1="5" x2="8" y2="19" />
      <line x1="14" y1="9" x2="14" y2="19" />
      <circle cx="5.5" cy="7" r="0.6" fill="currentColor" stroke="none" />
      <line x1="10" y1="12" x2="12" y2="12" />
      <line x1="10" y1="15" x2="12" y2="15" />
      <line x1="16" y1="12" x2="19" y2="12" />
      <line x1="16" y1="15" x2="19" y2="15" />
    </Base>
  );
}

/** Human-Machine Interface — display screen with bezel and status row. */
export function IconHMI(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="2.5" y="4" width="19" height="13" rx="1" />
      <rect x="4.5" y="6" width="15" height="9" rx="0.5" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="17" x2="12" y2="20" />
      <circle cx="6" cy="9" r="0.4" fill="currentColor" stroke="none" />
      <line x1="8" y1="9" x2="14" y2="9" />
      <line x1="6" y1="11.5" x2="18" y2="11.5" />
    </Base>
  );
}

/** Actuator — valve symbol (two opposing triangles). */
export function IconActuator(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 8 L12 13 L4 18 Z" />
      <path d="M20 8 L12 13 L20 18 Z" />
      <line x1="12" y1="3" x2="12" y2="13" />
      <rect x="9" y="3" width="6" height="3" rx="0.5" />
    </Base>
  );
}

/** Sensor — circle with cross-hair (instrument bubble). */
export function IconSensor(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="7" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="12" y1="2" x2="12" y2="22" />
    </Base>
  );
}

/** Remote Terminal Unit — rugged chassis with antenna. */
export function IconRTU(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="9" width="18" height="11" rx="1" />
      <line x1="3" y1="13" x2="21" y2="13" />
      <line x1="6" y1="16" x2="9" y2="16" />
      <line x1="11" y1="16" x2="14" y2="16" />
      <line x1="16" y1="16" x2="19" y2="16" />
      <line x1="12" y1="9" x2="12" y2="3" />
      <line x1="9" y1="5" x2="15" y2="5" />
      <line x1="10.5" y1="3" x2="13.5" y2="3" />
    </Base>
  );
}

/** Modbus / serial bus — daisy-chained nodes. */
export function IconModbus(props: IconProps) {
  return (
    <Base {...props}>
      <line x1="2" y1="12" x2="22" y2="12" />
      <rect x="3" y="9.5" width="3.5" height="5" rx="0.5" />
      <rect x="10.25" y="9.5" width="3.5" height="5" rx="0.5" />
      <rect x="17.5" y="9.5" width="3.5" height="5" rx="0.5" />
      <line x1="4.75" y1="9.5" x2="4.75" y2="7" />
      <line x1="12" y1="9.5" x2="12" y2="7" />
      <line x1="19.25" y1="9.5" x2="19.25" y2="7" />
    </Base>
  );
}

/** Substation / power asset — transmission tower silhouette. */
export function IconSubstation(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M5 21 L9 4 L15 4 L19 21" />
      <line x1="7" y1="13" x2="17" y2="13" />
      <line x1="8.5" y1="9" x2="15.5" y2="9" />
      <line x1="9" y1="4" x2="15" y2="4" />
      <line x1="6.5" y1="17" x2="17.5" y2="17" />
    </Base>
  );
}

/** Shield — defensive posture, used for IEC 62443 references. */
export function IconShield(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3 L20 6 L20 12 C20 17 16 20 12 21 C8 20 4 17 4 12 L4 6 Z" />
      <path d="M9 12 L11 14 L15 10" />
    </Base>
  );
}

/** Terminal — angle bracket + cursor. */
export function IconTerminal(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M7 10 L10 12 L7 14" />
      <line x1="12" y1="14.5" x2="17" y2="14.5" />
    </Base>
  );
}

/** Network / packet — three-tier comms diagram. */
export function IconNetwork(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="4" r="1.8" />
      <circle cx="5"  cy="20" r="1.8" />
      <circle cx="12" cy="20" r="1.8" />
      <circle cx="19" cy="20" r="1.8" />
      <line x1="12" y1="6" x2="5"  y2="18" />
      <line x1="12" y1="6" x2="12" y2="18" />
      <line x1="12" y1="6" x2="19" y2="18" />
    </Base>
  );
}

/** Vulnerability / bug-shield. */
export function IconVuln(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="13" r="5" />
      <line x1="9" y1="9.5" x2="7" y2="7.5" />
      <line x1="15" y1="9.5" x2="17" y2="7.5" />
      <line x1="7" y1="13" x2="4" y2="13" />
      <line x1="17" y1="13" x2="20" y2="13" />
      <line x1="7.5" y1="17" x2="5.5" y2="19" />
      <line x1="16.5" y1="17" x2="18.5" y2="19" />
      <line x1="12" y1="18" x2="12" y2="21" />
    </Base>
  );
}

export type ScadaIcon =
  | typeof IconPLC
  | typeof IconHMI
  | typeof IconActuator
  | typeof IconSensor
  | typeof IconRTU
  | typeof IconModbus
  | typeof IconSubstation
  | typeof IconShield
  | typeof IconTerminal
  | typeof IconNetwork
  | typeof IconVuln;
