/**
 * EFMethodologyExplainer
 *
 * Short plain-English explainer for common methodology enum values. Returns
 * null when the factor's methodology has no hard-coded explainer yet.
 */

import type { Methodology } from '@/lib/emission-factors/types';

const EXPLAINERS: Partial<Record<Methodology, { heading: string; body: string[] }>> = {
  location_based: {
    heading: 'Location-based methodology',
    body: [
      'A location-based factor reflects the average emissions intensity of the electricity grid in a defined geography. It ignores any contractual instruments (renewable certificates, PPAs) held by the reporter.',
      'Under GHG Protocol Scope 2 Guidance, organisations must report both a location-based and a market-based figure. Use this factor for the location-based view.',
    ],
  },
  market_based: {
    heading: 'Market-based methodology',
    body: [
      'A market-based factor reflects electricity that the reporter has contractually chosen (residual mix, supplier-specific, or green certificate-backed). It pairs with, not replaces, the location-based figure.',
    ],
  },
  activity_based: {
    heading: 'Activity-based methodology',
    body: [
      'Activity-based factors are derived from direct physical activity measurements (litres of fuel, kilometres driven, kilograms of material). They are the most accurate approach where activity data exists.',
    ],
  },
  spend_based: {
    heading: 'Spend-based methodology',
    body: [
      'Spend-based factors convert financial expenditure into emissions using Environmentally Extended Input-Output (EEIO) multipliers. Used when activity data is not available, typically for Scope 3 screening.',
    ],
  },
  operating_margin: {
    heading: 'Operating margin',
    body: [
      'A grid methodology that captures emissions from the plants currently dispatching electricity. Used for some offset baselines, not typical corporate Scope 2 reporting.',
    ],
  },
  build_margin: {
    heading: 'Build margin',
    body: [
      'Captures emissions from the most recent plants added to the grid. Paired with operating margin under the combined margin approach in CDM baselines.',
    ],
  },
  combined_margin: {
    heading: 'Combined margin',
    body: [
      'A weighted combination of operating margin and build margin, used in CDM and similar baseline methodologies.',
    ],
  },
  residual_mix: {
    heading: 'Residual mix',
    body: [
      'The pool of electricity remaining after contracted renewable claims are removed. Used for market-based reporting when no supplier-specific data is available.',
    ],
  },
  supplier_specific: {
    heading: 'Supplier-specific',
    body: [
      'Reflects the exact generation mix contracted from a specific electricity supplier. The preferred market-based data tier.',
    ],
  },
  average_data: {
    heading: 'Average data',
    body: [
      'Uses sector or regional average emission intensities. Typical for many Scope 3 categories.',
    ],
  },
  hybrid: {
    heading: 'Hybrid methodology',
    body: [
      'Combines activity-based and spend-based approaches, using activity data where available and financial data elsewhere.',
    ],
  },
};

export interface EFMethodologyExplainerProps {
  methodology: Methodology;
}

export function EFMethodologyExplainer({ methodology }: EFMethodologyExplainerProps) {
  const explainer = EXPLAINERS[methodology];
  if (!explainer) return null;

  return (
    <div className="rounded-2xl bg-white border border-gt-border-light shadow-gt-card p-6">
      <h3 className="font-semibold text-gt-text">{explainer.heading}</h3>
      <div className="mt-3 space-y-3 text-sm text-gt-text-muted">
        {explainer.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </div>
  );
}
