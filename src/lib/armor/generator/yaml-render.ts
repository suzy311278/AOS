/**
 * YAML rendering helpers for the MCP pipeline.
 *
 * Produces deterministic, human-readable YAML using `js-yaml`'s dump
 * with a fixed style so diffs in PR review are tight and reviewable.
 *
 * The renderers do **not** validate. They take typed inputs that match
 * the Zod schemas in `../schemas`; the writer / validator runs the
 * schema check before content lands on disk.
 */

import * as yaml from 'js-yaml';

const DUMP_OPTS: yaml.DumpOptions = {
  indent: 2,
  lineWidth: 100,
  noRefs: true,
  sortKeys: false,
  quotingType: '"',
  forceQuotes: false,
};

export function renderCourseYaml(course: Record<string, unknown>): string {
  return yaml.dump(course, DUMP_OPTS);
}

export function renderQuizYaml(questions: unknown[]): string {
  return yaml.dump(questions, DUMP_OPTS);
}

export function renderLabYaml(lab: Record<string, unknown>): string {
  return yaml.dump(lab, DUMP_OPTS);
}
