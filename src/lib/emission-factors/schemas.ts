// Zod schemas for YAML validation of sources and factors.
// Used by scripts/validate-emission-factors.ts and the ingestion CLI.

import { z } from 'zod';

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD');
const Alpha3 = z.string().regex(/^[A-Z]{3}(-[A-Z0-9]+)?$/, 'Must be ISO 3166-1 alpha-3 or alpha-3 with region suffix');
const Slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Must be lowercase kebab-case');

export const DocumentTypeSchema = z.enum([
  'government',
  'intergovernmental',
  'industry_standard',
  'peer_reviewed',
]);

export const MethodologySchema = z.enum([
  'location_based',
  'market_based',
  'operating_margin',
  'build_margin',
  'combined_margin',
  'residual_mix',
  'supplier_specific',
  'average_data',
  'activity_based',
  'spend_based',
  'hybrid',
  'not_applicable',
]);

export const CategorySchema = z.enum([
  'electricity',
  'fuels',
  'transport',
  'refrigerants',
  'waste',
  'water',
  'agriculture',
  'lulucf',
  'construction',
  'materials',
  'sector_spend',
  'gwp',
  'other',
]);

export const ScopeSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(0)]);

export const GwpAssessmentSchema = z.enum(['AR4', 'AR5', 'AR6', 'SAR']);

export const UncertaintyUnitSchema = z.enum(['percent', 'absolute']);

export const UnitNumeratorSchema = z.enum([
  'kgCO2e',
  'tCO2e',
  'gCO2e',
  'kgCH4',
  'kgN2O',
  'kgCO2',
  'kgSF6',
  'kgHFC',
  'kgPFC',
]);

// Common denominators; extend as real factors arrive.
export const UnitDenominatorSchema = z.enum([
  'kWh',
  'MWh',
  'GJ',
  'MJ',
  'L',
  'm3',
  'kg',
  't',
  'km',
  'tkm',
  'passenger-km',
  'vehicle-km',
  'USD',
  'EUR',
  'GBP',
  'INR',
  'head',
  'ha',
  'unit',
]);

export const SourceSchema = z.object({
  id: Slug,
  name: z.string().min(1),
  publisher: z.string().min(1),
  publisher_short: z.string().min(1),
  country: Alpha3,
  document_type: DocumentTypeSchema,
  license: z.string().min(1),
  attribution_required: z.boolean(),
  source_url: z.string().url(),
  source_pdf_url: z.string().url().nullable(),
  vintage_year: z.number().int().min(1990).max(2100),
  published_date: IsoDate,
  description: z.string().min(1),
  usage_note: z.string().min(1),
  logo_path: z.string().nullable(),
});

export const FactorChangelogEntrySchema = z.object({
  date: IsoDate,
  editor_initials: z.string().min(1),
  change: z.string().min(1),
});

export const FactorSchema = z.object({
  id: Slug,
  activity: z.string().min(1),
  activity_slug: Slug,
  category: CategorySchema,
  sub_category: z.string().nullable(),
  scope: ScopeSchema,
  scope_3_category: z.number().int().min(1).max(15).nullable(),
  value: z.number().finite(),
  unit_numerator: UnitNumeratorSchema,
  unit_denominator: UnitDenominatorSchema,
  region: Alpha3,
  region_display: z.string().min(1),
  methodology: MethodologySchema,
  gwp_horizon: z.union([z.literal(20), z.literal(100)]),
  gwp_assessment: GwpAssessmentSchema.nullable(),
  vintage_year: z.number().int().min(1990).max(2100),
  published_year: z.number().int().min(1990).max(2100),
  source_id: Slug,
  source_page_ref: z.string().min(1),
  source_url: z.string().url(),
  uncertainty_low: z.number().nullable(),
  uncertainty_high: z.number().nullable(),
  uncertainty_unit: UncertaintyUnitSchema.nullable(),
  ghg_protocol_clause: z.string().nullable(),
  notes: z.string(),
  tags: z.array(z.string()).default([]),
  superseded_by: z.string().nullable(),
  last_verified_date: IsoDate,
  verifier_initials: z.array(z.string().min(1)).min(1).max(4),
  changelog: z.array(FactorChangelogEntrySchema).default([]),
});

export const FactorsFileSchema = z.array(FactorSchema);
