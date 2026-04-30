/**
 * Prompt Library — server-only loader.
 *
 * Reads every YAML file under src/content/prompt-library/ and returns
 * the parsed Prompt records. Cached in module scope. Never import this
 * file from a client component.
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';
import type { Prompt } from './types';

const CONTENT_ROOT = join(process.cwd(), 'src', 'content', 'prompt-library');

let CACHE: Prompt[] | null = null;

function parsePromptFile(path: string): Prompt {
  const raw = readFileSync(path, 'utf8');
  // The YAML files use a `---` trailer to separate the notes field; take
  // the first document only. js-yaml's loadAll handles multi-doc files.
  const docs = yaml.loadAll(raw) as unknown[];
  const first = docs[0] as Record<string, unknown>;
  const trailer = (docs[1] as { notes?: string } | undefined) ?? undefined;

  const out: Prompt = {
    id: String(first.id),
    slug: String(first.slug ?? first.id),
    title: String(first.title),
    framework: String(first.framework ?? 'General'),
    category: String(first.category ?? 'other'),
    short_description: String(first.short_description ?? ''),
    description: String(first.description ?? ''),
    variables: Array.isArray(first.variables)
      ? (first.variables as Prompt['variables']).map((v) => ({
          key: String(v.key),
          label: String(v.label),
          placeholder: String(v.placeholder ?? ''),
          type: v.type === 'textarea' ? 'textarea' : 'text',
          required: Boolean(v.required),
        }))
      : [],
    prompt: String(first.prompt ?? ''),
    notes: trailer?.notes ?? (first.notes as string | undefined),
  };
  return out;
}

export function loadAllPrompts(): Prompt[] {
  if (CACHE) return CACHE;
  if (!existsSync(CONTENT_ROOT)) {
    CACHE = [];
    return CACHE;
  }
  const files = readdirSync(CONTENT_ROOT).filter((f) =>
    f.endsWith('.yaml') || f.endsWith('.yml'),
  );
  const prompts = files.map((f) => parsePromptFile(join(CONTENT_ROOT, f)));
  // Stable sort: by framework, then title.
  prompts.sort((a, b) => {
    const byFw = a.framework.localeCompare(b.framework);
    if (byFw !== 0) return byFw;
    return a.title.localeCompare(b.title);
  });
  CACHE = prompts;
  return CACHE;
}

export function getPromptBySlug(slug: string): Prompt | undefined {
  return loadAllPrompts().find((p) => p.slug === slug);
}
