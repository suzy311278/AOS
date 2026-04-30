'use server';

import { auth } from '@clerk/nextjs/server';
import { getJobDetail, getJobsPreview } from '@/lib/jobs';
import type { JobDetail } from '@/lib/jobs';

const PREVIEW_COUNT = 5;

/**
 * Detail fetch result. The client uses the discriminant to render three
 * states: the full detail panel, a "sign up to unlock" prompt, or a quiet
 * "not found" fallback.
 */
export type JobDetailResult =
  | { status: 'ok'; detail: JobDetail }
  | { status: 'locked' }
  | { status: 'not_found' };

export async function fetchJobDetail(jobUrl: string): Promise<JobDetailResult> {
  const { userId } = await auth();

  if (!userId) {
    // Anonymous visitors get detail for the 5 preview jobs only; the
    // rest expand into a sign-up prompt so the UX is honest instead of
    // silently blank.
    const previewUrls = new Set(
      getJobsPreview(PREVIEW_COUNT).map((j) => j.jobUrl),
    );
    if (!previewUrls.has(jobUrl)) {
      return { status: 'locked' };
    }
  }

  const detail = getJobDetail(jobUrl);
  if (!detail) return { status: 'not_found' };
  return { status: 'ok', detail };
}
