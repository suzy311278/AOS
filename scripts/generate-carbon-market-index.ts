/**
 * generate-carbon-market-index.ts
 *
 * Build-time script that merges four project CSVs (Verra VCS, CCB, PWRP, Gold
 * Standard) into a single normalized catalogue at public/carbon-market-index.json.
 * Consumed by the static /carbon/market page which filters in memory.
 *
 * Run: npx tsx scripts/generate-carbon-market-index.ts
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

const ROOT = join(__dirname, '..');
const PUBLIC_DIR = join(ROOT, 'public');
const DATA_ROOT = resolve(
  ROOT,
  '..',
  'LearningPlatform',
  'CarbonMarket Aggregator',
  'data',
);

// Handle the case where the aggregator folder sits as a sibling of the repo
// root (the canonical layout on disk).
const DATA_DIR = existsSync(DATA_ROOT)
  ? DATA_ROOT
  : resolve(ROOT, '..', 'CarbonMarket Aggregator', 'data');

if (!existsSync(DATA_DIR)) {
  // Aggregator CSVs live outside the repo and are only present on the
  // machine that authors the index. In any other build environment
  // (Vercel, clean clones) we ship the pre-generated JSON files already
  // committed to public/ and skip regeneration.
  console.warn(
    `[carbon-market] Aggregator data not found at ${DATA_DIR}. Skipping regeneration; using committed public/carbon-market-index.json.`,
  );
  process.exit(0);
}

type Registry =
  | 'verra_vcs'
  | 'verra_ccb'
  | 'verra_pwrp'
  | 'verra_jnr'
  | 'verra_fcpf'
  | 'goldstandard'
  | 'acr'
  | 'car'
  | 'car_compliance'
  | 'art'
  | 'gcc';
type StatusBucket = 'Registered' | 'Validation' | 'Development' | 'Inactive' | 'Other';
type CorsiaPhase = 'pilot' | 'first' | 'second';

interface ProjectRecord {
  id: string;
  registry: Registry;
  name: string;
  developer: string | null;
  methodology: string | null;
  projectType: string | null;
  country: string | null;
  region: string | null;
  status: string;
  statusBucket: StatusBucket;
  estAnnualReductions: number | null;
  estUnit: 'tCO2e' | 'tonnes_plastic';
  // APX registries (ACR, CAR, ART) expose a lifetime-cumulative total of
  // credits issued to date rather than an annual forward estimate. Surfaced
  // here so the UI can show it in the row detail dropdown without
  // conflating semantics with estAnnualReductions.
  cumulativeCreditsRegistered: number | null;
  registrationDate: string | null;
  creditingPeriodStart: string | null;
  creditingPeriodEnd: string | null;
  additionalCertifications: string[];
  registryUrl: string;
  // Derived fields (not in source CSVs; computed in enrichCorsia() at
  // build time). Optional here so individual ingestors don't have to
  // repeat the boilerplate; they get populated by the single pass below.
  corsiaEligible?: boolean;
  corsiaPhases?: CorsiaPhase[];
  corsiaConditional?: boolean;
}

// Tiny CSV parser that handles quoted fields with embedded commas and doubled
// quotes. Avoids pulling in a dependency for a one-off build script.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (c === '\r') {
      // swallow
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function readCsvDict(path: string): Record<string, string>[] {
  const raw = readFileSync(path, 'utf-8');
  const rows = parseCsv(raw).filter(r => r.some(cell => cell.length > 0));
  if (rows.length === 0) return [];
  const header = rows[0];
  return rows.slice(1).map(r => {
    const o: Record<string, string> = {};
    header.forEach((h, i) => {
      o[h] = (r[i] ?? '').trim();
    });
    return o;
  });
}

function parseNumber(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/,/g, '').trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseDate(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;
  // Verra CSVs emit YYYY-MM-DD; Gold Standard uses ISO timestamps.
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

function normalizeVerraStatus(s: string): StatusBucket {
  const v = s.toLowerCase();
  if (v === 'registered' || v === 'registration and verification approval requested') {
    return 'Registered';
  }
  if (v === 'under development') return 'Development';
  if (
    v.startsWith('under validation') ||
    v === 'registration requested' ||
    v === 'verification approval requested' ||
    v.startsWith('crediting period renewal') ||
    v === 'requantification requested'
  ) {
    return 'Validation';
  }
  if (
    v === 'inactive' ||
    v === 'withdrawn' ||
    v === 'rejected by administrator' ||
    v.includes('denied') ||
    v.startsWith('on hold') ||
    v === 'late to verify'
  ) {
    return 'Inactive';
  }
  return 'Other';
}

function normalizeGsStatus(s: string): StatusBucket {
  if (s === 'GOLD_STANDARD_CERTIFIED_PROJECT' || s === 'GOLD_STANDARD_CERTIFIED_DESIGN') {
    return 'Registered';
  }
  if (s === 'LISTED') return 'Validation';
  return 'Other';
}

// Fallback region inference for Gold Standard projects (the CSV has no region).
const COUNTRY_TO_REGION: Record<string, string> = {
  // Africa
  Kenya: 'Africa', Uganda: 'Africa', Ethiopia: 'Africa', Tanzania: 'Africa',
  Rwanda: 'Africa', Ghana: 'Africa', Nigeria: 'Africa', Malawi: 'Africa',
  Zambia: 'Africa', Zimbabwe: 'Africa', Mozambique: 'Africa', 'South Africa': 'Africa',
  Senegal: 'Africa', Madagascar: 'Africa', "Cote d'Ivoire": 'Africa', Cameroon: 'Africa',
  Morocco: 'Africa', Egypt: 'Africa', Tunisia: 'Africa', Algeria: 'Africa',
  'Burkina Faso': 'Africa', Mali: 'Africa', Benin: 'Africa', Togo: 'Africa',
  Namibia: 'Africa', Botswana: 'Africa', Lesotho: 'Africa', Sudan: 'Africa',
  'South Sudan': 'Africa', Liberia: 'Africa', 'Sierra Leone': 'Africa',
  'Democratic Republic of the Congo': 'Africa', Congo: 'Africa', Angola: 'Africa',
  Somalia: 'Africa', Eritrea: 'Africa', Djibouti: 'Africa',
  // Asia
  India: 'Asia', China: 'Asia', Indonesia: 'Asia', Vietnam: 'Asia', Thailand: 'Asia',
  Cambodia: 'Asia', Laos: 'Asia', Myanmar: 'Asia', Philippines: 'Asia',
  Bangladesh: 'Asia', Pakistan: 'Asia', 'Sri Lanka': 'Asia', Nepal: 'Asia',
  Bhutan: 'Asia', Mongolia: 'Asia', Japan: 'Asia', 'South Korea': 'Asia',
  'North Korea': 'Asia', Taiwan: 'Asia', Malaysia: 'Asia', Singapore: 'Asia',
  Kazakhstan: 'Asia', Uzbekistan: 'Asia', Turkmenistan: 'Asia', Kyrgyzstan: 'Asia',
  Tajikistan: 'Asia', Afghanistan: 'Asia', 'Timor-Leste': 'Asia',
  // Europe
  Germany: 'Europe', France: 'Europe', Italy: 'Europe', Spain: 'Europe',
  Portugal: 'Europe', 'United Kingdom': 'Europe', Ireland: 'Europe', Netherlands: 'Europe',
  Belgium: 'Europe', Luxembourg: 'Europe', Switzerland: 'Europe', Austria: 'Europe',
  Poland: 'Europe', Czechia: 'Europe', 'Czech Republic': 'Europe', Slovakia: 'Europe',
  Hungary: 'Europe', Romania: 'Europe', Bulgaria: 'Europe', Greece: 'Europe',
  Croatia: 'Europe', Slovenia: 'Europe', Serbia: 'Europe', Albania: 'Europe',
  'Bosnia and Herzegovina': 'Europe', Montenegro: 'Europe', 'North Macedonia': 'Europe',
  Denmark: 'Europe', Sweden: 'Europe', Norway: 'Europe', Finland: 'Europe',
  Iceland: 'Europe', Estonia: 'Europe', Latvia: 'Europe', Lithuania: 'Europe',
  Ukraine: 'Europe', Belarus: 'Europe', Moldova: 'Europe', Russia: 'Europe',
  Turkey: 'Europe',
  // Middle East
  'Saudi Arabia': 'Middle East', 'United Arab Emirates': 'Middle East', Qatar: 'Middle East',
  Bahrain: 'Middle East', Kuwait: 'Middle East', Oman: 'Middle East', Yemen: 'Middle East',
  Iraq: 'Middle East', Iran: 'Middle East', Jordan: 'Middle East', Lebanon: 'Middle East',
  Syria: 'Middle East', Israel: 'Middle East', Palestine: 'Middle East',
  // Latin America
  Mexico: 'Latin America', Guatemala: 'Latin America', Belize: 'Latin America',
  'El Salvador': 'Latin America', Honduras: 'Latin America', Nicaragua: 'Latin America',
  'Costa Rica': 'Latin America', Panama: 'Latin America', Cuba: 'Latin America',
  Haiti: 'Latin America', 'Dominican Republic': 'Latin America', Jamaica: 'Latin America',
  'Trinidad and Tobago': 'Latin America', Colombia: 'Latin America', Venezuela: 'Latin America',
  Ecuador: 'Latin America', Peru: 'Latin America', Bolivia: 'Latin America',
  Brazil: 'Latin America', Paraguay: 'Latin America', Uruguay: 'Latin America',
  Argentina: 'Latin America', Chile: 'Latin America', Guyana: 'Latin America',
  Suriname: 'Latin America',
  // North America
  'United States': 'North America', 'United States of America': 'North America',
  Canada: 'North America', Bermuda: 'North America',
  // Oceania
  Australia: 'Oceania', 'New Zealand': 'Oceania', Fiji: 'Oceania',
  'Papua New Guinea': 'Oceania', 'Solomon Islands': 'Oceania', Vanuatu: 'Oceania',
  Samoa: 'Oceania', Tonga: 'Oceania', Kiribati: 'Oceania',
};

function regionFor(country: string | null, fallback?: string): string | null {
  if (fallback) return fallback;
  if (!country) return null;
  return COUNTRY_TO_REGION[country] ?? null;
}

function vcsUrl(id: string): string {
  return `https://registry.verra.org/app/projectDetail/VCS/${id}`;
}

function ingestVcs(): ProjectRecord[] {
  const rows = readCsvDict(join(DATA_DIR, 'verra/vcs/projects.csv'));
  return rows.map<ProjectRecord>(r => ({
    id: `vcs-${r['ID']}`,
    registry: 'verra_vcs',
    name: r['Name'] || '(untitled project)',
    developer: r['Proponent'] || null,
    methodology: r['Methodology'] || null,
    projectType: r['Project Type'] || null,
    country: r['Country/Area'] || null,
    region: r['Region'] || null,
    status: r['Status'] || '',
    statusBucket: normalizeVerraStatus(r['Status'] || ''),
    estAnnualReductions: parseNumber(r['Estimated Annual Emission Reductions']),
    estUnit: 'tCO2e',
    registrationDate: parseDate(r['Project Registration Date']),
    creditingPeriodStart: parseDate(r['Crediting Period Start Date']),
    creditingPeriodEnd: parseDate(r['Crediting Period End Date']),
    additionalCertifications: [],
    cumulativeCreditsRegistered: null,
    registryUrl: r['Project URL'] || vcsUrl(r['ID']),
  }));
}

function ingestCcb(): ProjectRecord[] {
  const rows = readCsvDict(join(DATA_DIR, 'verra/ccb/projects.csv'));
  return rows.map<ProjectRecord>(r => {
    const distinctions = (r['Distinctions'] || '')
      .split(';')
      .map(s => s.trim())
      .filter(Boolean);
    const certs = ['CCB', ...distinctions];
    return {
      id: `ccb-${r['ID']}`,
      registry: 'verra_ccb',
      name: r['Name'] || '(untitled project)',
      developer: r['Proponent'] || null,
      methodology: null,
      projectType: r['CCB Project Type'] || null,
      country: r['Country/Area'] || null,
      region: r['Region'] || null,
      status: r['Status'] || '',
      statusBucket: normalizeVerraStatus(r['Status'] || ''),
      estAnnualReductions: null,
      estUnit: 'tCO2e',
      registrationDate: null,
      creditingPeriodStart: null,
      creditingPeriodEnd: null,
      additionalCertifications: Array.from(new Set(certs)),
      cumulativeCreditsRegistered: null,
      registryUrl: r['Project URL'] || vcsUrl(r['ID']),
    };
  });
}

function ingestJnr(): ProjectRecord[] {
  const path = join(DATA_DIR, 'verra/jnr/projects.csv');
  if (!existsSync(path)) return [];
  const rows = readCsvDict(path);
  return rows.map<ProjectRecord>(r => ({
    id: `jnr-${r['ID']}`,
    registry: 'verra_jnr',
    name: r['Name'] || '(untitled program)',
    developer: r['Proponent'] || null,
    methodology: null,
    projectType: r['Scenario'] || null,
    country: r['Country/Area'] || null,
    region: r['Region'] || null,
    status: r['Status'] || '',
    statusBucket: normalizeVerraStatus(r['Status'] || ''),
    estAnnualReductions: parseNumber(r['Estimated Annual Emission Reductions']),
    estUnit: 'tCO2e',
    cumulativeCreditsRegistered: null,
    registrationDate: parseDate(r['Project Registration Date']),
    creditingPeriodStart: null,
    creditingPeriodEnd: null,
    additionalCertifications: [],
    registryUrl: r['Project URL'] || vcsUrl(r['ID']),
  }));
}

function ingestFcpf(): ProjectRecord[] {
  const path = join(DATA_DIR, 'verra/fcpf/projects.csv');
  if (!existsSync(path)) return [];
  const rows = readCsvDict(path);
  return rows.map<ProjectRecord>(r => ({
    id: `fcpf-${r['ID']}`,
    registry: 'verra_fcpf',
    name: r['Name'] || '(untitled project)',
    developer: r['Proponent'] || null,
    methodology: r['Methodology'] || null,
    projectType: r['Project Type'] || null,
    country: r['Country/Area'] || null,
    region: r['Region'] || null,
    status: r['Status'] || '',
    statusBucket: normalizeVerraStatus(r['Status'] || ''),
    estAnnualReductions: parseNumber(r['Estimated Annual Emission Reductions']),
    estUnit: 'tCO2e',
    cumulativeCreditsRegistered: null,
    registrationDate: parseDate(r['Project Registration Date']),
    creditingPeriodStart: parseDate(r['Crediting Period Start Date']),
    creditingPeriodEnd: parseDate(r['Crediting Period End Date']),
    additionalCertifications: [],
    registryUrl: r['Project URL'] || vcsUrl(r['ID']),
  }));
}

function ingestPwrp(): ProjectRecord[] {
  const rows = readCsvDict(join(DATA_DIR, 'verra/pwrp/projects.csv'));
  return rows.map<ProjectRecord>(r => ({
    id: `pwrp-${r['ID']}`,
    registry: 'verra_pwrp',
    name: r['Name'] || '(untitled project)',
    developer: r['Proponent'] || null,
    methodology: null,
    projectType: r['Project Type'] || null,
    country: r['Country/Area'] || null,
    region: r['Region'] || null,
    status: r['Status'] || '',
    statusBucket: normalizeVerraStatus(r['Status'] || ''),
    estAnnualReductions: parseNumber(
      r['Average Amount of Plastic Waste Collected/Recycled'],
    ),
    estUnit: 'tonnes_plastic',
    registrationDate: parseDate(r['Project Registration Date']),
    creditingPeriodStart: null,
    creditingPeriodEnd: null,
    additionalCertifications: [],
    cumulativeCreditsRegistered: null,
    registryUrl: r['Project URL'] || vcsUrl(r['ID']),
  }));
}

function ingestGoldStandard(): ProjectRecord[] {
  const rows = readCsvDict(join(DATA_DIR, 'goldstandard/projects.csv'));
  return rows.map<ProjectRecord>(r => {
    const country = r['country'] || null;
    return {
      id: `gs-${r['id']}`,
      registry: 'goldstandard',
      name: r['name'] || '(untitled project)',
      developer: r['project_developer'] || null,
      methodology: r['methodology'] || null,
      projectType: r['type'] || null,
      country,
      region: regionFor(country),
      status: r['status'] || '',
      statusBucket: normalizeGsStatus(r['status'] || ''),
      estAnnualReductions: parseNumber(r['estimated_annual_credits']),
      estUnit: 'tCO2e',
      registrationDate: parseDate(r['created_at']),
      creditingPeriodStart: parseDate(r['crediting_period_start_date']),
      creditingPeriodEnd: parseDate(r['crediting_period_end_date']),
      additionalCertifications: [],
      cumulativeCreditsRegistered: null,
      registryUrl: r['project_url'] || `https://registry.goldstandard.org/projects/details/${r['id']}`,
    };
  });
}

// ----------------------------------------------------------------------------
// APX-platform registries (ACR, CAR, ART TREES)
//
// These three share the same APX Classic backend and the same HTML export
// shape but ship different column names. Per-row semantics:
//   - methodology: ACR + ART yes, CAR no (not on projects CSV)
//   - estAnnualReductions: always null for APX (their "Total Credits
//     Registered" is a lifetime sum, not a forward annual estimate)
//   - cumulativeCreditsRegistered: populated from that lifetime total so
//     the UI can surface it as an explicit, correctly labeled number
//   - registryUrl: constructed from the project ID prefix pattern
// ----------------------------------------------------------------------------

function apxProjectUrl(host: string, rawId: string, prefix: string): string {
  const numeric = rawId.toUpperCase().startsWith(prefix)
    ? rawId.slice(prefix.length)
    : rawId;
  return `${host}/mymodule/reg/prjView.asp?id1=${numeric}`;
}

function normalizeApxStatus(s: string): StatusBucket {
  const v = (s || '').toLowerCase();
  if (v === 'registered') return 'Registered';
  if (v === 'listed' || v.includes('proposed') || v === 'submitted') {
    return 'Validation';
  }
  if (v === 'under development' || v === 'in development') return 'Development';
  if (
    v === 'completed' ||
    v === 'terminated' ||
    v === 'cancelled' ||
    v === 'canceled' ||
    v.includes('inactive') ||
    v.includes('withdrawn')
  ) {
    return 'Inactive';
  }
  return 'Other';
}

function ingestAcr(): ProjectRecord[] {
  const path = join(DATA_DIR, 'acr/projects.csv');
  if (!existsSync(path)) return [];
  const rows = readCsvDict(path);
  return rows.map<ProjectRecord>(r => {
    const country = r['Project Site Country'] || null;
    const voluntary = r['Voluntary Status'] || '';
    const compliance = r['Compliance Program Status (ARB or Ecology)'] || '';
    const status = voluntary || compliance;
    return {
      id: `acr-${r['Project ID']}`,
      registry: 'acr',
      name: r['Project Name'] || '(untitled project)',
      developer: r['Project Developer'] || null,
      methodology: r['Project Methodology/Protocol'] || null,
      projectType: r['Project Type'] || null,
      country,
      region: regionFor(country),
      status,
      statusBucket: normalizeApxStatus(status),
      estAnnualReductions: null,
      estUnit: 'tCO2e',
      cumulativeCreditsRegistered: parseNumber(r['Total Number of Credits Registered']),
      registrationDate: parseDate(r['Project Status Date']),
      creditingPeriodStart: parseDate(r['Initial Crediting Period Start Date']),
      creditingPeriodEnd: parseDate(r['Current Crediting Period End Date']),
      additionalCertifications: [],
      registryUrl: apxProjectUrl('https://acr2.apx.com', r['Project ID'], 'ACR'),
    };
  });
}

function splitCerts(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[;,]/)
    .map(s => s.trim())
    .filter(Boolean);
}

function ingestCar(isCompliance: boolean): ProjectRecord[] {
  const file = isCompliance ? 'compliance_projects.csv' : 'projects.csv';
  const path = join(DATA_DIR, 'car', file);
  if (!existsSync(path)) return [];
  const rows = readCsvDict(path);
  const registry: Registry = isCompliance ? 'car_compliance' : 'car';
  const idPrefix = isCompliance ? 'carc' : 'car';
  return rows.map<ProjectRecord>(r => {
    const country = r['Project Site Country'] || null;
    const status = r['Status'] || '';
    return {
      id: `${idPrefix}-${r['Project ID']}`,
      registry,
      name: r['Project Name'] || '(untitled project)',
      developer: r['Project Developer'] || null,
      // CAR does not expose methodology at the project level. Project Type
      // doubles as methodology in practice (e.g. "US Forest Protocol",
      // "Livestock Protocol"). Keep methodology null; the UI can fall
      // back to projectType for display where needed.
      methodology: null,
      projectType: r['Project Type'] || null,
      country,
      region: regionFor(country),
      status,
      statusBucket: normalizeApxStatus(status),
      estAnnualReductions: null,
      estUnit: 'tCO2e',
      cumulativeCreditsRegistered: parseNumber(
        r['Total Number of Offset Credits Registered'],
      ),
      registrationDate: parseDate(r['Project Registered Date']),
      creditingPeriodStart: null,
      creditingPeriodEnd: null,
      additionalCertifications: splitCerts(r['Additional Certification(s)']),
      registryUrl: apxProjectUrl(
        'https://thereserve2.apx.com',
        r['Project ID'],
        'CAR',
      ),
    };
  });
}

function ingestGcc(): ProjectRecord[] {
  const path = join(DATA_DIR, 'gcc/projects.csv');
  if (!existsSync(path)) return [];
  const rows = readCsvDict(path);
  return rows.map<ProjectRecord>(r => {
    const country = r['projectCountryId'] || null;
    return {
      id: `gcc-${r['id']}`,
      registry: 'gcc',
      name: r['pcfProjectName'] || '(untitled project)',
      developer: null, // GCC's public PCF endpoint does not expose developer
      methodology: null, // Separate PRC endpoint has methodology; add later
      projectType: r['projectKindsString'] || null,
      country,
      region: regionFor(country),
      status: r['projectTrackTypeId'] || '',
      // GCC PCFs are consideration forms (pre-registration); treat as Development
      // until we ingest the PRC (Project Registration Certification) endpoint.
      statusBucket: 'Development',
      estAnnualReductions: null,
      estUnit: 'tCO2e',
      cumulativeCreditsRegistered: null,
      registrationDate: parseDate(r['createdOn']),
      creditingPeriodStart: null,
      creditingPeriodEnd: null,
      additionalCertifications: [],
      // GCC per-project URL pattern: /PublicPCF/PublicPCF/<mongoObjectId>
      registryUrl: r['id']
        ? `https://gcc2.globalcarboncouncil.com/PublicPCF/PublicPCF/${r['id']}`
        : 'https://gcc2.globalcarboncouncil.com/search/registration',
    };
  });
}

function ingestArt(): ProjectRecord[] {
  const path = join(DATA_DIR, 'art/projects.csv');
  if (!existsSync(path)) return [];
  const rows = readCsvDict(path);
  return rows.map<ProjectRecord>(r => {
    const country = r['Program  Country'] || r['Program Country'] || null;
    const status = r['Status'] || '';
    return {
      id: `art-${r['Program ID']}`,
      registry: 'art',
      name: r['Program Name'] || '(untitled program)',
      developer: r['Sovereign Program Developer'] || null,
      // ART TREES programs cite their standard (TREES) rather than a
      // methodology code; the "Crediting Program and Standard" column
      // is usable as an informal methodology hint.
      methodology: r['Crediting Program and Standard'] || null,
      projectType: r['Program Type'] || null,
      country,
      region: regionFor(country),
      status,
      statusBucket: normalizeApxStatus(status),
      estAnnualReductions: null,
      estUnit: 'tCO2e',
      cumulativeCreditsRegistered: null, // not on the bulk CSV; in credits_verified.csv
      registrationDate: parseDate(r['Initial Crediting Period Start Date']),
      creditingPeriodStart: parseDate(r['Initial Crediting Period Start Date']),
      creditingPeriodEnd: null,
      additionalCertifications: [],
      registryUrl: apxProjectUrl('https://art.apx.com', r['Program ID'], 'ART'),
    };
  });
}

// --- CORSIA enrichment ---------------------------------------------------
// Reads data/corsia/eligibility.json (emitted by scraper/corsia.py) and
// annotates every ProjectRecord with CORSIA flags based on its registry
// and crediting-period window. A project is considered eligible for a
// given phase if (a) its registry is approved for that phase and (b) its
// crediting period overlaps the phase's vintage window. Projects from
// conditionally-approved programmes (e.g. Cercarbono) carry the flag on
// `corsiaConditional` rather than strict phase membership.

interface CorsiaPhaseEntry {
  vintageStart: number;
  vintageEnd: number;
  phaseYears: string;
  phaseLabel: string;
}
interface CorsiaRegistryEntry {
  programme: string;
  conditional: boolean;
  vintages: Partial<Record<CorsiaPhase, CorsiaPhaseEntry | null>>;
}

function loadCorsia(): Record<string, CorsiaRegistryEntry[]> {
  const p = join(DATA_DIR, 'corsia/eligibility.json');
  if (!existsSync(p)) return {};
  try {
    const parsed = JSON.parse(readFileSync(p, 'utf-8'));
    return (parsed.byRegistry as Record<string, CorsiaRegistryEntry[]>) ?? {};
  } catch {
    return {};
  }
}

function yearOf(iso: string | null): number | null {
  if (!iso) return null;
  const n = Number(iso.slice(0, 4));
  return Number.isFinite(n) ? n : null;
}

function enrichCorsia(
  records: ProjectRecord[],
  byRegistry: Record<string, CorsiaRegistryEntry[]>,
): void {
  const PHASE_CODES: CorsiaPhase[] = ['pilot', 'first', 'second'];
  for (const r of records) {
    const entries = byRegistry[r.registry];
    if (!entries || entries.length === 0) {
      r.corsiaEligible = false;
      r.corsiaPhases = [];
      r.corsiaConditional = false;
      continue;
    }
    // Collapse multiple programme entries for the same registry (e.g.
    // Verra VCS + JNR share a programme line) by union of phases.
    const phases = new Set<CorsiaPhase>();
    let conditional = false;
    const start = yearOf(r.creditingPeriodStart);
    const end = yearOf(r.creditingPeriodEnd);
    for (const entry of entries) {
      if (entry.conditional) conditional = true;
      for (const code of PHASE_CODES) {
        const v = entry.vintages[code];
        if (!v) continue;
        // If we don't know the project's period, be permissive: any
        // phase the programme supports counts. This keeps the chip
        // useful for projects (e.g. CCB, PWRP) without explicit dates.
        if (start == null && end == null) {
          phases.add(code);
          continue;
        }
        // Overlap test: project-period [start, end] ∩ phase-window
        const ps = start ?? end!;
        const pe = end ?? start!;
        if (pe >= v.vintageStart && ps <= v.vintageEnd) {
          phases.add(code);
        }
      }
    }
    r.corsiaPhases = PHASE_CODES.filter(p => phases.has(p));
    r.corsiaEligible = r.corsiaPhases.length > 0 || conditional;
    r.corsiaConditional = conditional;
  }
}

function main() {
  const vcs = ingestVcs();
  const ccb = ingestCcb();
  const jnr = ingestJnr();
  const fcpf = ingestFcpf();
  const pwrp = ingestPwrp();
  const gs = ingestGoldStandard();
  const acr = ingestAcr();
  const carVol = ingestCar(false);
  const carComp = ingestCar(true);
  const art = ingestArt();
  const gcc = ingestGcc();

  const all: ProjectRecord[] = [
    ...vcs,
    ...ccb,
    ...jnr,
    ...fcpf,
    ...pwrp,
    ...gs,
    ...acr,
    ...carVol,
    ...carComp,
    ...art,
    ...gcc,
  ];

  enrichCorsia(all, loadCorsia());

  // Aggregates pulled from program_summary.json for the live stat tiles.
  const summary = JSON.parse(
    readFileSync(join(DATA_DIR, 'verra/program_summary.json'), 'utf-8'),
  );
  const issued =
    (summary.VCS?.issued ?? 0) +
    (summary.CCB?.issued ?? 0) +
    (summary.PWRP?.issued ?? 0);
  const retired =
    (summary.VCS?.retired ?? 0) +
    (summary.CCB?.retired ?? 0) +
    (summary.PWRP?.retired ?? 0);
  const buffer = summary.VCS?.resourcesBufferCreditsDeposited ?? 0;

  // Cross-registry credit tallies pulled from per-project credit summary
  // files (VCS, ACR, CAR). Verra's program_summary.json gives us the
  // authoritative totals for Verra programs; for everything else we sum
  // what we've scraped. The header tiles use these combined numbers.
  const extraRegistrySources: Array<{ file: string; registryKey: string }> = [
    { file: 'acr/credits_summary.json', registryKey: 'acr' },
    { file: 'car/credits_summary.json', registryKey: 'car' },
  ];
  let extraIssued = 0;
  let extraRetired = 0;
  const uniqueBeneficiaries = new Set<string>();
  for (const src of extraRegistrySources) {
    const p = join(DATA_DIR, src.file);
    if (!existsSync(p)) continue;
    try {
      const per = JSON.parse(readFileSync(p, 'utf-8')) as Record<string, {
        totalIssued: number;
        totalRetired: number;
        topBeneficiaries: { name: string }[];
      }>;
      for (const entry of Object.values(per)) {
        extraIssued += entry.totalIssued || 0;
        extraRetired += entry.totalRetired || 0;
        for (const b of entry.topBeneficiaries || []) {
          if (b.name) uniqueBeneficiaries.add(b.name);
        }
      }
    } catch {
      /* skip */
    }
  }
  // Also count VCS beneficiaries (they go into the same summary file but
  // we already have it loaded via creditsMerged below; duplicate a small
  // pass here for the totals-tile correctness).
  const vcsSumPath = join(DATA_DIR, 'verra/vcs/credits_summary.json');
  if (existsSync(vcsSumPath)) {
    try {
      const per = JSON.parse(readFileSync(vcsSumPath, 'utf-8')) as Record<string, {
        topBeneficiaries: { name: string }[];
      }>;
      for (const entry of Object.values(per)) {
        for (const b of entry.topBeneficiaries || []) {
          if (b.name) uniqueBeneficiaries.add(b.name);
        }
      }
    } catch {
      /* skip */
    }
  }
  const totalIssuedAll = issued + extraIssued;
  const totalRetiredAll = retired + extraRetired;

  // Pre-compute facet counts so the client can render the left rail without a
  // second pass over the full dataset.
  const countBy = (key: keyof ProjectRecord): Record<string, number> => {
    const out: Record<string, number> = {};
    for (const p of all) {
      const v = p[key];
      if (typeof v === 'string' && v) out[v] = (out[v] ?? 0) + 1;
    }
    return out;
  };

  const payload = {
    generatedAt: new Date().toISOString(),
    totals: {
      projects: all.length,
      registries: new Set(all.map(p => p.registry)).size,
      // Historically "vcusIssued" was Verra-only; we now expose cross-
      // registry totals under more honest names and keep the legacy
      // fields populated for backwards compatibility with older UI reads.
      vcusIssued: issued,
      vcusRetired: retired,
      creditsIssued: totalIssuedAll,
      creditsRetired: totalRetiredAll,
      bufferPool: buffer,
      uniqueBeneficiaries: uniqueBeneficiaries.size,
    },
    facets: {
      registry: countBy('registry'),
      methodology: countBy('methodology'),
      country: countBy('country'),
      statusBucket: countBy('statusBucket'),
      corsia: {
        eligible: all.reduce((n, p) => n + (p.corsiaEligible ? 1 : 0), 0),
        pilot: all.reduce(
          (n, p) => n + ((p.corsiaPhases ?? []).includes('pilot') ? 1 : 0),
          0,
        ),
        first: all.reduce(
          (n, p) => n + ((p.corsiaPhases ?? []).includes('first') ? 1 : 0),
          0,
        ),
        second: all.reduce(
          (n, p) => n + ((p.corsiaPhases ?? []).includes('second') ? 1 : 0),
          0,
        ),
        conditional: all.reduce((n, p) => n + (p.corsiaConditional ? 1 : 0), 0),
      },
    },
    projects: all,
  };

  if (!existsSync(PUBLIC_DIR)) mkdirSync(PUBLIC_DIR, { recursive: true });
  writeFileSync(
    join(PUBLIC_DIR, 'carbon-market-index.json'),
    JSON.stringify(payload),
  );

  // Separate description side-file, lazy-loaded by the client only when a user
  // expands a row. Keeping it out of the main index avoids a ~7 MB hit on the
  // initial payload. Merges descriptions across all registries that ship
  // project_details directories.
  const descriptions: Record<string, string> = {};

  // Verra programs (VCS, CCB, PWRP, JNR, FCPF) all share the same
  // resourceSummary endpoint; their descriptions live in per-program
  // directories written by `verra_api.py details --program X`.
  const verraDetailSources: Array<{ dir: string; prefix: string }> = [
    { dir: join(DATA_DIR, 'verra/vcs/project_details'), prefix: 'vcs' },
    { dir: join(DATA_DIR, 'verra/ccb/project_details'), prefix: 'ccb' },
    { dir: join(DATA_DIR, 'verra/pwrp/project_details'), prefix: 'pwrp' },
    { dir: join(DATA_DIR, 'verra/jnr/project_details'), prefix: 'jnr' },
    { dir: join(DATA_DIR, 'verra/fcpf/project_details'), prefix: 'fcpf' },
  ];
  for (const { dir, prefix } of verraDetailSources) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter(f => f.endsWith('.json'))) {
      try {
        const raw = JSON.parse(readFileSync(join(dir, f), 'utf-8'));
        const id = raw.resourceIdentifier || f.replace(/\.json$/, '');
        const desc = (raw.description || '').trim();
        if (desc) descriptions[`${prefix}-${id}`] = desc;
      } catch {
        /* skip malformed */
      }
    }
  }

  // APX registries (ACR, CAR, CAR-compliance, ART) scraped via apx_details.py
  // write one record per project at data/{registry}/project_details/{ProjectID}.json
  // The JSON shape is { registry, projectId, description, ... }
  const apxSources: Array<{ dir: string; prefix: string }> = [
    { dir: join(DATA_DIR, 'acr/project_details'), prefix: 'acr' },
    { dir: join(DATA_DIR, 'car/project_details'), prefix: 'car' }, // voluntary + compliance share dir
    { dir: join(DATA_DIR, 'art/project_details'), prefix: 'art' },
  ];
  for (const { dir, prefix } of apxSources) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter(f => f.endsWith('.json'))) {
      try {
        const raw = JSON.parse(readFileSync(join(dir, f), 'utf-8'));
        const pid = (raw.projectId || f.replace(/\.json$/, '')).toString();
        const desc = (raw.description || '').trim();
        if (!desc) continue;
        // Key must match the main-index record IDs. Our ingestors use
        // "{prefix}-{ProjectID}" (e.g. "acr-ACR586", "car-CAR1957").
        descriptions[`${prefix}-${pid}`] = desc;
        // CAR-compliance rows are keyed "carc-{ProjectID}" in the index but
        // share the same project_details directory. Mirror the description
        // under that key too so compliance rows expand correctly.
        if (prefix === 'car') descriptions[`carc-${pid}`] = desc;
      } catch {
        /* skip malformed */
      }
    }
  }

  writeFileSync(
    join(PUBLIC_DIR, 'carbon-market-descriptions.json'),
    JSON.stringify(descriptions),
  );

  // Credits summary side-file: merged output from per-registry summary
  // scripts (summarize_vcs_credits.py, summarize_apx_credits.py). Contains
  // totalIssued, totalRetired, outstanding, topBeneficiaries, bridges,
  // lastRetirementDate per project. Lazy-loaded when a row is expanded,
  // same pattern as descriptions.
  const creditsMerged: Record<string, unknown> = {};
  for (const relPath of [
    'verra/vcs/credits_summary.json',
    'acr/credits_summary.json',
    'car/credits_summary.json',
  ]) {
    const p = join(DATA_DIR, relPath);
    if (!existsSync(p)) continue;
    try {
      Object.assign(creditsMerged, JSON.parse(readFileSync(p, 'utf-8')));
    } catch {
      /* skip malformed */
    }
  }
  // CAR-compliance rows share IDs with CAR voluntary — mirror their
  // summaries under the carc- prefix so compliance rows expand cleanly.
  for (const key of Object.keys(creditsMerged)) {
    if (key.startsWith('car-')) {
      creditsMerged[key.replace(/^car-/, 'carc-')] = creditsMerged[key];
    }
  }
  writeFileSync(
    join(PUBLIC_DIR, 'carbon-market-credits-summary.json'),
    JSON.stringify(creditsMerged),
  );
  console.log(
    `[carbon-market] ${Object.keys(creditsMerged).length} credits summaries merged`,
  );

  // Global retirement leaderboard: invert the per-project top-beneficiaries
  // into a per-beneficiary global roll-up. We only have the top 5 retirees
  // per project, but since corporate retirers (Shell, Eni, Microsoft...)
  // dominate across many projects, aggregating the top-5 snapshots is a
  // strong proxy for the true leaderboard. Exposed as a separate side-file
  // consumed by /carbon/retirements.
  type GlobalBenef = {
    name: string;
    totalRetired: number;
    projectCount: number;
    registries: Set<Registry>;
    methodologies: Set<string>;
    bridge?: string;
  };
  const benefMap = new Map<string, GlobalBenef>();
  // Build a quick project-id → project-record lookup for annotation
  const projectById = new Map(all.map(p => [p.id, p]));
  for (const [projectId, entry] of Object.entries(
    creditsMerged as Record<string, {
      topBeneficiaries?: { name: string; quantity: number; bridge?: string }[];
    }>,
  )) {
    const proj = projectById.get(projectId);
    for (const b of entry.topBeneficiaries ?? []) {
      if (!b.name) continue;
      // Normalize name to a single canonical form for dedupe (trim, collapse
      // whitespace). Keep original-case for display on first encounter.
      const key = b.name.trim().replace(/\s+/g, ' ');
      let rec = benefMap.get(key.toLowerCase());
      if (!rec) {
        rec = {
          name: key,
          totalRetired: 0,
          projectCount: 0,
          registries: new Set(),
          methodologies: new Set(),
          bridge: b.bridge,
        };
        benefMap.set(key.toLowerCase(), rec);
      }
      rec.totalRetired += b.quantity || 0;
      rec.projectCount += 1;
      if (proj) {
        rec.registries.add(proj.registry);
        if (proj.methodology) rec.methodologies.add(proj.methodology);
      }
      if (!rec.bridge && b.bridge) rec.bridge = b.bridge;
    }
  }
  // Sort by totalRetired desc, cap to top 500 for file size.
  const leaderboard = [...benefMap.values()]
    .sort((a, b) => b.totalRetired - a.totalRetired)
    .slice(0, 500)
    .map(r => ({
      name: r.name,
      totalRetired: r.totalRetired,
      projectCount: r.projectCount,
      registries: [...r.registries],
      methodologies: [...r.methodologies].slice(0, 8),
      ...(r.bridge ? { bridge: r.bridge } : {}),
    }));
  const retirementsPayload = {
    generatedAt: new Date().toISOString(),
    totalBeneficiaries: benefMap.size,
    totalRetiredInLeaderboard: leaderboard.reduce((s, r) => s + r.totalRetired, 0),
    beneficiaries: leaderboard,
  };
  writeFileSync(
    join(PUBLIC_DIR, 'carbon-market-retirements.json'),
    JSON.stringify(retirementsPayload),
  );
  console.log(
    `[carbon-market] leaderboard: ${leaderboard.length} of ${benefMap.size} beneficiaries`,
  );

  // Tiny methodology-count file consumed by LiveProjectsCard (inline
  // banner in carbon-markets lessons). Keeping this separate from the
  // main index so lesson pages don't pull the full ~7 MB catalogue.
  const methodologyStats: Record<string, { projects: number; countries: number }> = {};
  for (const p of all) {
    if (!p.methodology) continue;
    const m = (methodologyStats[p.methodology] ??= { projects: 0, countries: 0 });
    m.projects += 1;
  }
  // Compute country coverage per methodology in a second pass so we can
  // dedupe by country string cleanly.
  const byMethodologyCountries: Record<string, Set<string>> = {};
  for (const p of all) {
    if (!p.methodology || !p.country) continue;
    (byMethodologyCountries[p.methodology] ??= new Set()).add(p.country);
  }
  for (const [m, set] of Object.entries(byMethodologyCountries)) {
    if (methodologyStats[m]) methodologyStats[m].countries = set.size;
  }
  writeFileSync(
    join(PUBLIC_DIR, 'carbon-market-methodology-counts.json'),
    JSON.stringify({
      totalProjects: all.length,
      byMethodology: methodologyStats,
    }),
  );
  console.log(
    `[carbon-market] methodology counts written for ${Object.keys(methodologyStats).length} methodologies`,
  );
  const descMb = (JSON.stringify(descriptions).length / 1024 / 1024).toFixed(2);
  console.log(
    `[carbon-market] ${Object.keys(descriptions).length} descriptions written (${descMb} MB)`,
  );
  const sizeMb = (
    JSON.stringify(payload).length /
    1024 /
    1024
  ).toFixed(2);
  const corsiaCount = all.reduce((n, p) => n + (p.corsiaEligible ? 1 : 0), 0);
  console.log(
    `[carbon-market] ${all.length} projects written (${sizeMb} MB). ` +
      `VCS=${vcs.length} CCB=${ccb.length} JNR=${jnr.length} FCPF=${fcpf.length} ` +
      `PWRP=${pwrp.length} GS=${gs.length} ACR=${acr.length} CAR=${carVol.length} ` +
      `CAR-compliance=${carComp.length} ART=${art.length} GCC=${gcc.length}  |  ` +
      `CORSIA-eligible=${corsiaCount}`,
  );
}

main();
