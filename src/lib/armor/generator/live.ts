/**
 * Live MCP pipeline implementation — placeholder.
 *
 * Phase 2 ships the schema, mock pipeline, writer, validator, and admin
 * UI. The live MCP wiring lands once `.mcp.json` registers the four
 * required servers (`docs.fetcher`, `content.generator`, `vuln.intel`,
 * `lab.scaffolder`).
 *
 * Until then this module preserves the contract — same async generator
 * signature as the mock — but emits a single error event and throws.
 * That keeps the CLI / SSE endpoint code path-symmetric.
 */

import type {
  GenerateCourseInput,
  GenerateCourseOutput,
  PipelineEvent,
} from '../mcp-pipeline';

export async function* runLivePipeline(
  input: GenerateCourseInput,
): AsyncGenerator<PipelineEvent, GenerateCourseOutput, void> {
  yield { type: 'pipeline.start', input };
  yield {
    type: 'pipeline.error',
    step: 'docs.search',
    message:
      'live MCP pipeline is not wired yet. Configure .mcp.json with docs.fetcher, content.generator, vuln.intel, and lab.scaffolder servers, then run with --live again.',
  };
  throw new Error('armor.generator.live: MCP servers not configured');
}
