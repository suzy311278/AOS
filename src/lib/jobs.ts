import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

export interface JobRow {
  datePosted: string | null;
  profile: string;
  title: string;
  company: string;
  companyType: string;
  location: string | null;
  jobType: string | null;
  jobLevel: string | null;
  remote: boolean;
  experience: string | null;
  roleSummary: string | null;
  skillsRequired: string | null;
  domainContext: string | null;
  relevance: number;
  jobUrl: string;
}

export interface JobFilters {
  profile?: string;
  companyType?: string;
  country?: string;
  remote?: string;
  search?: string;
  sort?: 'relevance' | 'latest';
  page?: number;
  perPage?: number;
}

/** Summary row sent in page payload (no heavy detail fields) */
export type JobSummary = Omit<JobRow, 'roleSummary' | 'skillsRequired' | 'domainContext'>;

/** Detail fields fetched on-demand when user expands a row */
export interface JobDetail {
  roleSummary: string | null;
  skillsRequired: string | null;
  domainContext: string | null;
}

export interface JobsResult {
  jobs: JobSummary[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface JobsMeta {
  totalJobCount: number;
  totalCompanies: number;
  totalRemote: number;
  profileCounts: Record<string, number>;
  companyTypes: string[];
  countries: string[];
}

const CITY_TO_COUNTRY: Record<string, string> = {
  mumbai: 'India', delhi: 'India', bengaluru: 'India', gurugram: 'India',
  pune: 'India', chennai: 'India', hyderabad: 'India', surat: 'India',
  ncr: 'India', karur: 'India', thiruvananthapuram: 'India', noida: 'India',
  haryana: 'India', karnataka: 'India', maharashtra: 'India', telangana: 'India',
  'tamil nadu': 'India', 'new delhi': 'India',
  helsinki: 'Finland', espoo: 'Finland', oulu: 'Finland', lappeenranta: 'Finland',
  stockholm: 'Sweden', lund: 'Sweden', huddinge: 'Sweden', kista: 'Sweden',
  sandviken: 'Sweden', göteborg: 'Sweden',
  brussels: 'Belgium', antwerp: 'Belgium', leuven: 'Belgium', diegem: 'Belgium',
  zaventem: 'Belgium', mol: 'Belgium',
  auckland: 'New Zealand',
  praha: 'Czech Republic', brno: 'Czech Republic', ostrava: 'Czech Republic',
  sydney: 'Australia', melbourne: 'Australia', brisbane: 'Australia',
  darwin: 'Australia', geelong: 'Australia', inkerman: 'Australia',
  london: 'UK',
};

const COUNTRY_ALIASES: Record<string, string> = {
  'united kingdom': 'UK',
  'new zealand': 'New Zealand',
  india: 'India',
  australia: 'Australia',
  belgium: 'Belgium',
  sweden: 'Sweden',
  finland: 'Finland',
  germany: 'Germany',
  netherlands: 'Netherlands',
  switzerland: 'Switzerland',
  luxembourg: 'Luxembourg',
  portugal: 'Portugal',
  uk: 'UK',
  'czech republic': 'Czech Republic',
};

export function extractCountry(location: string | null): string | null {
  if (!location) return null;
  const loc = location.toLowerCase();
  if (loc === 'remote' || loc.startsWith('remote in')) return 'Remote';

  const parts = location.split(',').map(p => p.trim());
  const last = parts[parts.length - 1].toLowerCase().replace(/\d+/g, '').trim();
  if (COUNTRY_ALIASES[last]) return COUNTRY_ALIASES[last];

  if (/\b(nsw|vic|qld|sa|wa|nt|act|tas)\b/i.test(location)) return 'Australia';

  for (const part of parts) {
    const clean = part.toLowerCase().replace(/\d+/g, '').trim().replace(/\(.*\)/, '').trim();
    if (CITY_TO_COUNTRY[clean]) return CITY_TO_COUNTRY[clean];
    for (const city of Object.keys(CITY_TO_COUNTRY)) {
      if (clean.includes(city)) return CITY_TO_COUNTRY[city];
    }
  }

  if (loc.includes('distansjobb') || loc.includes('sverige')) return 'Sweden';
  if (loc.includes('bruxelles') || loc.includes('etterbeek')) return 'Belgium';

  return null;
}

/**
 * Full job rows including the detail fields (roleSummary, skillsRequired,
 * domainContext). Exposed for server-only callers like the embedding
 * prebuild script; the regular page payload uses `getJobsFiltered` which
 * strips these heavy fields.
 */
export function getAllJobsFull(): JobRow[] {
  return loadAllJobs();
}

function loadAllJobs(): JobRow[] {
  const filePath = path.join(process.cwd(), 'src', 'jobs', 'jobs.xlsx');

  if (!fs.existsSync(filePath)) {
    return [];
  }

  const buf = fs.readFileSync(filePath);
  const workbook = XLSX.read(buf, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  const jobs: JobRow[] = raw
    .filter((row) => {
      const title = String(row['Title'] ?? '').trim();
      return title.length > 0;
    })
    .map((row) => ({
      datePosted: row['Date Posted'] ? String(row['Date Posted']) : null,
      profile: String(row['Profile'] ?? ''),
      title: String(row['Title'] ?? ''),
      company: String(row['Company'] ?? ''),
      companyType: String(row['Company Type'] ?? ''),
      location: row['Location'] ? String(row['Location']) : null,
      jobType: row['Job Type'] ? String(row['Job Type']) : null,
      jobLevel: row['Job Level'] ? String(row['Job Level']) : null,
      remote:
        row['Remote'] === true ||
        String(row['Remote']).toUpperCase() === 'TRUE',
      experience: row['Experience'] ? String(row['Experience']) : null,
      roleSummary: row['Role Summary'] ? String(row['Role Summary']) : null,
      skillsRequired: row['Skills Required']
        ? String(row['Skills Required'])
        : null,
      domainContext: row['Domain Context']
        ? String(row['Domain Context'])
        : null,
      relevance: Number(row['Relevance'] ?? 0),
      jobUrl: String(row['Job URL'] ?? ''),
    }));

  jobs.sort((a, b) => {
    if (b.relevance !== a.relevance) return b.relevance - a.relevance;
    const da = a.datePosted ? new Date(a.datePosted).getTime() : 0;
    const db = b.datePosted ? new Date(b.datePosted).getTime() : 0;
    return db - da;
  });

  return jobs;
}

export function getJobsMeta(): JobsMeta {
  const allJobs = loadAllJobs();

  const profileCounts: Record<string, number> = { all: allJobs.length };
  const companyTypesSet = new Set<string>();
  const countriesSet = new Set<string>();

  for (const job of allJobs) {
    profileCounts[job.profile] = (profileCounts[job.profile] ?? 0) + 1;
    if (job.companyType) companyTypesSet.add(job.companyType);
    const country = extractCountry(job.location);
    if (country) countriesSet.add(country);
  }

  return {
    totalJobCount: allJobs.length,
    totalCompanies: new Set(allJobs.map(j => j.company)).size,
    totalRemote: allJobs.filter(j => j.remote).length,
    profileCounts,
    companyTypes: Array.from(companyTypesSet).sort(),
    countries: Array.from(countriesSet).sort(),
  };
}

export function getJobsFiltered(filters: JobFilters): JobsResult {
  let jobs = loadAllJobs();

  if (filters.profile && filters.profile !== 'all') {
    jobs = jobs.filter(j => j.profile === filters.profile);
  }
  if (filters.companyType && filters.companyType !== 'all') {
    jobs = jobs.filter(j => j.companyType === filters.companyType);
  }
  if (filters.country && filters.country !== 'all') {
    jobs = jobs.filter(j => extractCountry(j.location) === filters.country);
  }
  if (filters.remote === 'remote') {
    jobs = jobs.filter(j => j.remote);
  } else if (filters.remote === 'onsite') {
    jobs = jobs.filter(j => !j.remote);
  }
  if (filters.search?.trim()) {
    const q = filters.search.toLowerCase();
    jobs = jobs.filter(
      j =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        (j.location?.toLowerCase().includes(q)) ||
        (j.roleSummary?.toLowerCase().includes(q)) ||
        (j.skillsRequired?.toLowerCase().includes(q)) ||
        (j.domainContext?.toLowerCase().includes(q))
    );
  }

  if (filters.sort === 'latest') {
    jobs.sort((a, b) => {
      const da = a.datePosted ? new Date(a.datePosted).getTime() : 0;
      const db = b.datePosted ? new Date(b.datePosted).getTime() : 0;
      return db - da;
    });
  }

  const total = jobs.length;
  const perPage = Math.max(1, Math.min(filters.perPage ?? 15, 50));
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(1, filters.page ?? 1), totalPages);
  const start = (page - 1) * perPage;

  const pageJobs: JobSummary[] = jobs.slice(start, start + perPage).map(
    ({ roleSummary, skillsRequired, domainContext, ...summary }) => summary
  );

  return {
    jobs: pageJobs,
    total,
    page,
    perPage,
    totalPages,
  };
}

/** Get detail fields for a specific job by its URL (stable identifier) */
export function getJobDetail(jobUrl: string): JobDetail | null {
  const allJobs = loadAllJobs();
  const job = allJobs.find(j => j.jobUrl === jobUrl);
  if (!job) return null;
  return {
    roleSummary: job.roleSummary,
    skillsRequired: job.skillsRequired,
    domainContext: job.domainContext,
  };
}

/** Preview for unauthenticated users (no detail fields) */
export function getJobsPreview(count: number): JobSummary[] {
  return loadAllJobs().slice(0, count).map(
    ({ roleSummary, skillsRequired, domainContext, ...summary }) => summary
  );
}
