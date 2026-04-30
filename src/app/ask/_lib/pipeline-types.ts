/**
 * TypeScript types for the SustainIQ streaming pipeline contract.
 * Contract documented in SUSTAINIQ_PIPELINE_INTEGRATION_BRIEF.md.
 */

export type Phase =
  | 'idle'
  | 'intent'
  | 'plan'
  | 'retrieval'
  | 'synthesis'
  | 'factcheck'
  | 'revise'
  | 'done';

export type Intent = 'FACTUAL' | 'ADVISORY';

export interface Topic {
  topic: string;
  focus:
    | 'procedural'
    | 'decision'
    | 'definition'
    | 'risk'
    | 'example'
    | 'requirement'
    | string;
}

/** The raw source shape as emitted by the Python pipeline. */
export interface PipelineSource {
  doc_title: string;
  section_title: string;
  page: string;
  course: string;
  content?: string;
  type?: 'chunk' | 'definition' | 'formula' | string;
  vec_score?: number;
}

export interface GroundingStats {
  total_claims: number;
  grounded: number;
  partial: number;
  unsupported: number;
  unsupported_claims: string[];
  partial_claims: string[];
}

export interface Timings {
  intent_ms?: number;
  plan_ms?: number;
  retrieval_ms?: number;
  synth_ms?: number;
  synthesis_ms?: number;
  factcheck_ms?: number;
  revise_ms?: number;
  total_ms: number;
}

export interface CitationParts {
  raw: string;
  docTitle: string;
  sectionTitle: string;
  page: string;
  pagePart: string;
}

export interface ResolveResult {
  available: boolean;
  url?: string;
  fallback_url?: string;
  page?: number;
  doc_title?: string;
  course?: string;
  total_pages?: number;
  reason?: 'no_catalog_match' | 'pdf_not_found_on_disk' | 'fetch_error' | string;
}

export type SSEEvent =
  | { type: 'phase'; phase: Phase }
  | { type: 'intent'; intent: Intent }
  | { type: 'topics'; topics: Topic[] }
  | { type: 'sources'; sources: PipelineSource[] }
  | { type: 'draft_token'; delta: string }
  | { type: 'grounding'; stats: GroundingStats }
  | { type: 'revised'; answer: string }
  | { type: 'timings'; timings: Timings }
  | { type: 'error'; message: string };

export interface ServerHealth {
  status: 'checking' | 'up' | 'down';
  info: string;
}
