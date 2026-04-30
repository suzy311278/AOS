'use client';

/**
 * progress-export.ts — Export and import progress as a JSON file.
 *
 * Protects users who invest 55+ hours from losing progress on browser clear
 * or device switch. Future upgrade path: swap localStorage backend for
 * Supabase/Firebase with zero component changes.
 */

import type { PlatformProgress } from './types';

const STORAGE_KEY = 'sustainability_academy';
const SCHEMA_VERSION = 2;

export function exportProgress(): void {
  if (typeof window === 'undefined') return;
  const data = localStorage.getItem(STORAGE_KEY) ?? JSON.stringify({ version: 2, courses: {} });
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `sustainability-academy-progress-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importProgress(file: File): Promise<{ success: boolean; message: string }> {
  if (typeof window === 'undefined') {
    return { success: false, message: 'Not available on server' };
  }
  try {
    const text = await file.text();
    const parsed = JSON.parse(text) as PlatformProgress;
    if (parsed.version !== SCHEMA_VERSION) {
      return { success: false, message: `Unsupported file version: ${parsed.version}` };
    }
    if (!parsed.courses || typeof parsed.courses !== 'object') {
      return { success: false, message: 'Invalid progress file format' };
    }
    // Merge: keep existing progress for courses not in the import
    const existing: PlatformProgress = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? '{"version":2,"courses":{}}'
    );
    const merged: PlatformProgress = {
      version: 2,
      courses: { ...existing.courses, ...parsed.courses },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return { success: true, message: 'Progress imported successfully' };
  } catch (e) {
    return { success: false, message: `Failed to import: ${(e as Error).message}` };
  }
}
