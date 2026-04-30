/**
 * /jobs - Career directory
 *
 * Server component that loads the job dataset and passes it to the
 * redesigned client.
 *
 * Auth gating:
 *   - Signed-in users see the full filtered list (all 400+ jobs).
 *   - Anonymous users see only the first 5 preview jobs, with an
 *     auth-wall CTA for the rest. Detail fetches for non-preview jobs
 *     are also gated server-side in src/app/jobs/actions.ts.
 *
 * Data comes from src/jobs/jobs.xlsx (read at request time, not build
 * time) so the Excel can be updated and changes appear on next page
 * load.
 */

import type { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import {
  getJobsFiltered,
  getJobsMeta,
  getJobsPreview,
} from '@/lib/jobs';
import { Nav } from '@/components/Nav';
import { RedesignFooter } from '@/components/redesign';
import { JobsClientRedesign } from './_components/JobsClientRedesign';

/** Number of jobs anonymous visitors see before the auth wall. */
const ANON_PREVIEW_COUNT = 5;

export const metadata: Metadata = {
  title: 'Career Directory',
  description:
    'Curated sustainability jobs across climate risk, carbon markets, ESG reporting, and green finance. Every listing verified and categorized.',
  // Career directory is for signed-in users only and carries aggregated
  // third-party data we don't want search engines or Archive.org
  // caching. Robots.txt already Disallows /jobs; this is defense in depth.
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function JobsRedesignPage({ searchParams }: Props) {
  const meta = getJobsMeta();
  const { userId } = await auth();
  const isAuthenticated = Boolean(userId);

  const params = await searchParams;
  const filters = {
    profile:
      typeof params.profile === 'string' ? params.profile : undefined,
    companyType:
      typeof params.companyType === 'string'
        ? params.companyType
        : undefined,
    country:
      typeof params.country === 'string' ? params.country : undefined,
    remote:
      typeof params.remote === 'string' ? params.remote : undefined,
    search:
      typeof params.search === 'string' ? params.search : undefined,
    sort: (typeof params.sort === 'string' ? params.sort : 'relevance') as
      | 'relevance'
      | 'latest',
    page:
      typeof params.page === 'string' &&
      Number.isFinite(parseInt(params.page, 10))
        ? parseInt(params.page, 10)
        : 1,
    perPage:
      typeof params.perPage === 'string' &&
      Number.isFinite(parseInt(params.perPage, 10))
        ? parseInt(params.perPage, 10)
        : 15,
  };

  // Anonymous visitors get only the first 5 jobs (no filters applied);
  // the auth wall takes over for the rest. Filters, search, and pagination
  // are all signed-in features.
  const result = isAuthenticated
    ? getJobsFiltered(filters)
    : {
        jobs: getJobsPreview(ANON_PREVIEW_COUNT),
        total: meta.totalJobCount,
        page: 1,
        perPage: ANON_PREVIEW_COUNT,
        totalPages: 1,
      };

  return (
    <>
      <Nav />
      <JobsClientRedesign
        jobs={result.jobs}
        total={result.total}
        page={result.page}
        perPage={result.perPage}
        totalPages={result.totalPages}
        meta={meta}
        filters={filters}
        isAuthenticated={isAuthenticated}
      />
      <RedesignFooter />
    </>
  );
}
