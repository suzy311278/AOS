/**
 * GET /api/ask/history
 *
 * Return the signed-in user's SustainIQ chat history, newest first.
 * Mirrors the HistoryEntry shape used by the localStorage store so
 * AskClientRedesign.tsx can hydrate from either source interchangeably.
 *
 * Query params:
 *   ?limit=50   (default 50, max 200)
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';

import { db } from '@/lib/db';
import { sustainiqQueries } from '@/lib/schema';

export const runtime = 'nodejs';

interface HistorySource {
  document: string;
  section: string;
  pages: string;
  course: string;
}

interface HistoryLessonLink {
  courseId: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  url: string;
}

interface HistoryEntry {
  id: string;
  query: string;
  answer: string;
  sources: HistorySource[];
  lessons: HistoryLessonLink[];
  timestamp: number;
  feedback: 'up' | 'down' | null;
}

function parseArray<T>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as T[]) : [];
  } catch {
    return [];
  }
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const limitParam = parseInt(url.searchParams.get('limit') ?? '50', 10);
  const limit = Math.max(1, Math.min(200, Number.isFinite(limitParam) ? limitParam : 50));

  try {
    const rows = await db
      .select()
      .from(sustainiqQueries)
      .where(eq(sustainiqQueries.userId, userId))
      .orderBy(desc(sustainiqQueries.createdAt))
      .limit(limit);

    const entries: HistoryEntry[] = rows.map((r) => ({
      id: r.id,
      query: r.query,
      answer: r.answer,
      sources: parseArray<HistorySource>(r.sources),
      lessons: parseArray<HistoryLessonLink>(r.lessons),
      timestamp: r.createdAt instanceof Date ? r.createdAt.getTime() : Number(r.createdAt),
      feedback: (r.feedback as 'up' | 'down' | null) ?? null,
    }));

    return NextResponse.json({ entries, count: entries.length });
  } catch (err) {
    console.error('[api/ask/history] select failed', err);
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }
}
