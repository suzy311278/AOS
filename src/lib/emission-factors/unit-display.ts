// Formatter for the compact "value unit" display string used on cards and
// in search results: "0.207 kgCO2e/kWh".

import type { Factor } from './types';

export function formatValue(value: number): string {
  if (value === 0) return '0';
  const abs = Math.abs(value);
  // Keep 3-5 significant digits; avoid scientific notation for typical factors.
  if (abs >= 1000) return value.toFixed(0);
  if (abs >= 100) return value.toFixed(1);
  if (abs >= 1) return value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
  if (abs >= 0.001) return value.toFixed(5).replace(/0+$/, '').replace(/\.$/, '');
  return value.toExponential(2);
}

export function formatUnit(factor: Pick<Factor, 'unit_numerator' | 'unit_denominator'>): string {
  return `${factor.unit_numerator}/${factor.unit_denominator}`;
}

export function formatUnitDisplay(factor: Factor): string {
  return `${formatValue(factor.value)} ${formatUnit(factor)}`;
}
