/**
 * Server-only helpers for the signed-in "saved factors" + "recent searches"
 * surfaces. Writes and reads go through Drizzle against Turso.
 *
 * NEVER import this from a client component.
 */

import 'server-only';
import { and, desc, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '@/lib/db';
import {
  efSavedFactors,
  efSearchHistory,
} from '@/lib/schema';

export async function saveFactor(
  userId: string,
  factorId: string,
  folder?: string | null,
): Promise<void> {
  await db
    .insert(efSavedFactors)
    .values({ userId, factorId, folder: folder ?? null })
    .onConflictDoNothing();
}

export async function unsaveFactor(
  userId: string,
  factorId: string,
): Promise<void> {
  await db
    .delete(efSavedFactors)
    .where(
      and(eq(efSavedFactors.userId, userId), eq(efSavedFactors.factorId, factorId)),
    );
}

export async function isFactorSaved(
  userId: string,
  factorId: string,
): Promise<boolean> {
  const rows = await db
    .select({ factorId: efSavedFactors.factorId })
    .from(efSavedFactors)
    .where(
      and(eq(efSavedFactors.userId, userId), eq(efSavedFactors.factorId, factorId)),
    )
    .limit(1);
  return rows.length > 0;
}

export async function listSavedFactors(userId: string) {
  return db
    .select()
    .from(efSavedFactors)
    .where(eq(efSavedFactors.userId, userId))
    .orderBy(desc(efSavedFactors.savedAt));
}

export async function logSearch(userId: string, query: string): Promise<void> {
  const trimmed = query.trim();
  if (!trimmed) return;
  await db.insert(efSearchHistory).values({
    id: nanoid(),
    userId,
    query: trimmed.slice(0, 500),
  });
}

export async function listRecentSearches(userId: string, limit = 10) {
  return db
    .select()
    .from(efSearchHistory)
    .where(eq(efSearchHistory.userId, userId))
    .orderBy(desc(efSearchHistory.searchedAt))
    .limit(limit);
}
