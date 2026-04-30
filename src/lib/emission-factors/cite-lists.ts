/**
 * Server-only helpers for cite lists - named collections of factors that a
 * signed-in user assembles for a specific report. Each list has items (factor
 * IDs). Bulk citation export composes APA strings for every item.
 *
 * NEVER import this from a client component.
 */

import 'server-only';
import { and, asc, desc, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '@/lib/db';
import { efCiteLists, efCiteListItems } from '@/lib/schema';

export async function createCiteList(
  userId: string,
  name: string,
): Promise<string> {
  const id = nanoid();
  await db.insert(efCiteLists).values({
    id,
    userId,
    name: name.trim().slice(0, 120),
  });
  return id;
}

export async function renameCiteList(
  userId: string,
  id: string,
  name: string,
): Promise<boolean> {
  const result = await db
    .update(efCiteLists)
    .set({ name: name.trim().slice(0, 120), updatedAt: new Date() })
    .where(and(eq(efCiteLists.id, id), eq(efCiteLists.userId, userId)));
  return (result as unknown as { rowsAffected?: number })?.rowsAffected !== 0;
}

export async function deleteCiteList(
  userId: string,
  id: string,
): Promise<void> {
  await db
    .delete(efCiteListItems)
    .where(eq(efCiteListItems.citeListId, id));
  await db
    .delete(efCiteLists)
    .where(and(eq(efCiteLists.id, id), eq(efCiteLists.userId, userId)));
}

export async function listUserCiteLists(userId: string) {
  return db
    .select()
    .from(efCiteLists)
    .where(eq(efCiteLists.userId, userId))
    .orderBy(desc(efCiteLists.updatedAt));
}

export async function getCiteListById(userId: string, id: string) {
  const rows = await db
    .select()
    .from(efCiteLists)
    .where(and(eq(efCiteLists.id, id), eq(efCiteLists.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getCiteListItems(userId: string, citeListId: string) {
  // Verify the parent list belongs to the caller before returning items.
  // efCiteListItems has no userId column; ownership is enforced via the
  // list's userId. Making the check mandatory here so a future caller
  // can't accidentally read another user's items.
  const list = await getCiteListById(userId, citeListId);
  if (!list) return [];
  return db
    .select()
    .from(efCiteListItems)
    .where(eq(efCiteListItems.citeListId, citeListId))
    .orderBy(asc(efCiteListItems.addedAt));
}

export async function addFactorToCiteList(
  userId: string,
  citeListId: string,
  factorId: string,
  note?: string | null,
): Promise<boolean> {
  const list = await getCiteListById(userId, citeListId);
  if (!list) return false;
  await db
    .insert(efCiteListItems)
    .values({ citeListId, factorId, note: note ?? null })
    .onConflictDoNothing();
  await db
    .update(efCiteLists)
    .set({ updatedAt: new Date() })
    .where(eq(efCiteLists.id, citeListId));
  return true;
}

export async function removeFactorFromCiteList(
  userId: string,
  citeListId: string,
  factorId: string,
): Promise<boolean> {
  const list = await getCiteListById(userId, citeListId);
  if (!list) return false;
  await db
    .delete(efCiteListItems)
    .where(
      and(
        eq(efCiteListItems.citeListId, citeListId),
        eq(efCiteListItems.factorId, factorId),
      ),
    );
  return true;
}
