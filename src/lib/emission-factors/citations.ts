// Citation formatters for emission factors.
// Four deterministic formats driven from factor + source metadata.
//
// Attribution suffix uses " - via Greentryst" (space hyphen space) per the
// global no-em-dash rule.

import type { Factor, Source } from './types';
import { formatUnit } from './unit-display';

export type CitationFormat = 'inline' | 'apa' | 'harvard' | 'copy_value';

const VIA = ' - via Greentryst';

export function sourceShortCitation(source: Source): string {
  return `${source.publisher_short} ${source.vintage_year}`;
}

export function formatCitation(
  factor: Factor,
  source: Source,
  format: CitationFormat,
  options: { attribution?: boolean } = {}
): string {
  const attribution = options.attribution ?? true;
  const unit = formatUnit(factor);
  const short = sourceShortCitation(source);
  const pageRef = factor.source_page_ref ? `, ${factor.source_page_ref}` : '';

  switch (format) {
    case 'inline': {
      // "DEFRA 2024, UK grid electricity, Table 3.4"
      return `${short}, ${factor.activity}${pageRef}`;
    }
    case 'apa': {
      // "UK Department for Environment, Food & Rural Affairs (2024). UK Government
      //  GHG Conversion Factors for Company Reporting 2024. Retrieved from <url>."
      return `${source.publisher} (${source.vintage_year}). ${source.name}. Retrieved from ${source.source_url}.`;
    }
    case 'harvard': {
      // "Publisher (Year) Title. Available at: URL (Accessed: date)."
      const accessed = factor.last_verified_date;
      return `${source.publisher} (${source.vintage_year}) ${source.name}. Available at: ${source.source_url} (Accessed: ${accessed}).`;
    }
    case 'copy_value': {
      const value = `${factor.value} ${unit}`;
      const suffix = attribution ? VIA : '';
      return `${value} (${short}, ${factor.activity}${pageRef})${suffix}`;
    }
  }
}
