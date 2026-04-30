/**
 * EFHeroPreviewCard
 *
 * Server wrapper. Builds an illustrative rotation of common practitioner
 * queries and their factors; hands them to the client flip-card component.
 * These are display-only snippets for the hero; real factor data lives in
 * the content pipeline.
 */

import { EFHeroPreviewCardFlip, type FlipExample } from './EFHeroPreviewCardFlip';

const EXAMPLES: FlipExample[] = [
  {
    question: 'What is the UK grid emission factor 2026?',
    activity: 'UK grid electricity',
    displayValue: '0.207 kgCO2e/kWh',
    sourceShort: 'DEFRA 2025',
    scope: 'Scope 2',
    methodology: 'Location-based',
    vintageYear: 2025,
    citation: '(DEFRA, 2025)',
  },
  {
    question: 'India NEWNE grid emission factor',
    activity: 'India NEWNE grid electricity',
    displayValue: '0.727 kgCO2e/kWh',
    sourceShort: 'CEA 2024',
    scope: 'Scope 2',
    methodology: 'Combined margin',
    vintageYear: 2024,
    citation: '(CEA, 2024)',
  },
  {
    question: 'Natural gas combustion factor UK',
    activity: 'Natural gas, stationary combustion',
    displayValue: '0.203 kgCO2e/kWh',
    sourceShort: 'DEFRA 2025',
    scope: 'Scope 1',
    methodology: 'Activity-based',
    vintageYear: 2025,
    citation: '(DEFRA, 2025)',
  },
  {
    question: 'Diesel road transport factor India',
    activity: 'Diesel, road freight (India)',
    displayValue: '2.680 kgCO2e/L',
    sourceShort: 'MoRTH 2024',
    scope: 'Scope 1',
    methodology: 'Activity-based',
    vintageYear: 2024,
    citation: '(MoRTH, 2024)',
  },
  {
    question: 'Long-haul flight business class factor',
    activity: 'Long-haul flight, business class',
    displayValue: '0.509 kgCO2e/p-km',
    sourceShort: 'DEFRA 2025',
    scope: 'Scope 3',
    methodology: 'Activity-based',
    vintageYear: 2025,
    citation: '(DEFRA, 2025)',
  },
];

export function EFHeroPreviewCard() {
  return <EFHeroPreviewCardFlip examples={EXAMPLES} />;
}
