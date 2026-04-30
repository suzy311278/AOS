export type Registry =
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

export type CorsiaPhase = 'pilot' | 'first' | 'second';

export type StatusBucket =
  | 'Registered'
  | 'Validation'
  | 'Development'
  | 'Inactive'
  | 'Other';

export interface ProjectRecord {
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
  registrationDate: string | null;
  creditingPeriodStart: string | null;
  creditingPeriodEnd: string | null;
  additionalCertifications: string[];
  registryUrl: string;
  cumulativeCreditsRegistered?: number | null;
  corsiaEligible?: boolean;
  corsiaPhases?: CorsiaPhase[];
  corsiaConditional?: boolean;
}

export interface CarbonMarketIndex {
  generatedAt: string;
  totals: {
    projects: number;
    registries?: number;
    vcusIssued: number;
    vcusRetired: number;
    creditsIssued?: number;
    creditsRetired?: number;
    bufferPool: number;
    uniqueBeneficiaries?: number;
  };
  facets: {
    registry: Record<string, number>;
    methodology: Record<string, number>;
    country: Record<string, number>;
    statusBucket: Record<string, number>;
    corsia?: {
      eligible: number;
      pilot: number;
      first: number;
      second: number;
      conditional: number;
    };
  };
  projects: ProjectRecord[];
}

export const REGISTRY_LABEL: Record<Registry, string> = {
  verra_vcs: 'Verra VCS',
  verra_ccb: 'Verra CCB',
  verra_pwrp: 'Verra PWRP',
  verra_jnr: 'Verra JNR',
  verra_fcpf: 'Verra FCPF',
  goldstandard: 'Gold Standard',
  acr: 'American Carbon Registry',
  car: 'Climate Action Reserve',
  car_compliance: 'CAR Compliance (ARB / Ecology)',
  art: 'ART TREES',
  gcc: 'Global Carbon Council',
};

export const STATUS_ORDER: StatusBucket[] = [
  'Registered',
  'Validation',
  'Development',
  'Inactive',
  'Other',
];

export const CERTIFICATION_OPTIONS = [
  'CCB',
  'Climate Gold',
  'Community Gold',
  'Biodiversity Gold',
  'Gold',
] as const;

export const COURSE_METHODOLOGIES: Record<string, string> = {
  VM0042: 'vm0042',
  VM0044: 'vm0044',
};
