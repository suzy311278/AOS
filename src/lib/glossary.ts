/**
 * glossary.ts - Server-side glossary loader.
 * Reads glossary.yaml and returns validated entries.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';
import { GlossaryTermSchema } from './schemas';
import { z } from 'zod';

export interface GlossaryEntry {
  term: string;
  slug: string;
  definition: string;
  category: string;
  related: string[];
}

const GLOSSARY_PATH = join(process.cwd(), 'src', 'content', 'glossary.yaml');

export function getGlossary(): GlossaryEntry[] {
  if (!existsSync(GLOSSARY_PATH)) return [];
  const raw = yaml.load(readFileSync(GLOSSARY_PATH, 'utf-8'));
  if (!Array.isArray(raw)) return [];
  const result = z.array(GlossaryTermSchema).safeParse(raw);
  if (!result.success) {
    console.error('Glossary validation failed:', result.error.message);
    return [];
  }
  return result.data;
}
