/**
 * IEC 62443 Certification track — schema and registry.
 *
 * The ArmorInnovate certification path mirrors the ISA/IEC 62443
 * Cybersecurity Specialist program (4 specialist tracks) and adds a
 * 5th capstone — the IEC 62443 Cybersecurity Expert.
 *
 *   AI-CSP-FND  →  Cybersecurity Fundamentals Specialist
 *   AI-CSP-RA   →  Risk Assessment Specialist
 *   AI-CSP-DSN  →  Design Specialist
 *   AI-CSP-MNT  →  Maintenance Specialist
 *      ↓
 *   AI-CSE-EXP  →  Cybersecurity Expert (capstone)
 *
 * This module is the single source of truth for:
 *   - the registry consumed by `/certification` page
 *   - prereq resolution for course access gating
 *   - JSON-LD `EducationalOccupationalCredential` builders
 *
 * No runtime side effects — pure data + helpers.
 */

// ──────────────────────────────────────────────────────────────────────
// Track identifiers
// ──────────────────────────────────────────────────────────────────────

export type SpecialistTrackId =
  | 'foundations'
  | 'risk-assessment'
  | 'design'
  | 'maintenance';

export type IsaSecurityLevel = 'SL1' | 'SL2' | 'SL3' | 'SL4';

// ──────────────────────────────────────────────────────────────────────
// Schemas
// ──────────────────────────────────────────────────────────────────────

export interface SpecialistCertificate {
  /** Internal identifier (URL slug). */
  id: SpecialistTrackId;
  /** Public credential code (printed on the certificate). */
  code: 'AI-CSP-FND' | 'AI-CSP-RA' | 'AI-CSP-DSN' | 'AI-CSP-MNT';
  /** Human-readable name. */
  name: string;
  /** Shorter display label (used on cards, nav). */
  shortName: string;
  /** Equivalent in the ISA/IEC certification map (for credibility). */
  isaEquivalent: string;
  /** IEC 62443 parts this track covers. */
  iecParts: string[];
  /** Other specialist tracks that must be completed first. */
  prereqs: SpecialistTrackId[];
  /** Estimated study hours (lessons + reading, excluding lab time). */
  hours: number;
  /** Hands-on lab hours required. */
  labHours: number;
  /** Pass score on the final written exam (% out of 100). */
  passingScore: number;
  /** Slugs of the courses that compose this track. */
  courses: string[];
  /** SL coverage — which Security Levels the holder is qualified to assess. */
  isaLevels: IsaSecurityLevel[];
  /** Validity in years (re-cert required afterwards). */
  validityYears: number;
  /** Public summary used in the page header & schema.org payload. */
  summary: string;
}

export interface ExpertCapstone {
  id: 'cybersecurity-expert';
  code: 'AI-CSE-EXP';
  name: 'IEC 62443 Cybersecurity Expert';
  /** All four specialist tracks must be held to attempt the capstone. */
  requiresAll: SpecialistTrackId[];
  /** Capstone course slug. */
  capstoneCourse: string;
  /** Hands-on practical lab hours required for the practical exam. */
  practicalLabHours: number;
  /** Slug of the multi-stage practical exam (a chained lab scenario). */
  practicalExamSlug: string;
  /** Validity in years. */
  validityYears: number;
  /** Public summary. */
  summary: string;
}

// ──────────────────────────────────────────────────────────────────────
// Registry — the single source of truth.
//
// IMPORTANT: hours / labHours / passingScore values come from the
// public ISA/IEC 62443 Cybersecurity Specialist program; if you adjust
// them, update docs/armor-refactor-plan.md §2 in the same commit.
// ──────────────────────────────────────────────────────────────────────

export const SPECIALISTS: readonly SpecialistCertificate[] = [
  {
    id: 'foundations',
    code: 'AI-CSP-FND',
    name: 'IEC 62443 Cybersecurity Fundamentals Specialist',
    shortName: 'Fundamentals',
    isaEquivalent: 'ISA/IEC 62443 Cybersecurity Fundamentals Specialist',
    iecParts: ['IEC 62443-1-1', 'IEC 62443-2-1'],
    prereqs: [],
    hours: 30,
    labHours: 6,
    passingScore: 75,
    courses: ['iec-62443-foundations'],
    isaLevels: ['SL1', 'SL2'],
    validityYears: 3,
    summary:
      'Foundational concepts: ICS vs IT mindset, the Purdue model, threat actors (Stuxnet, Industroyer, TRITON), and the IEC 62443 series structure. Prerequisite for every other track.',
  },
  {
    id: 'risk-assessment',
    code: 'AI-CSP-RA',
    name: 'IEC 62443 Risk Assessment Specialist',
    shortName: 'Risk Assessment',
    isaEquivalent: 'ISA/IEC 62443 Cybersecurity Risk Assessment Specialist',
    iecParts: ['IEC 62443-3-2'],
    prereqs: ['foundations'],
    hours: 35,
    labHours: 8,
    passingScore: 75,
    courses: ['iec-62443-risk-assessment'],
    isaLevels: ['SL1', 'SL2', 'SL3'],
    validityYears: 3,
    summary:
      'Asset inventories, zone & conduit modelling, threat modelling for OT, and risk treatment per IEC 62443-3-2. Includes a hands-on assessment of a simulated water-treatment plant.',
  },
  {
    id: 'design',
    code: 'AI-CSP-DSN',
    name: 'IEC 62443 Design Specialist',
    shortName: 'Design',
    isaEquivalent: 'ISA/IEC 62443 Cybersecurity Design Specialist',
    iecParts: ['IEC 62443-3-3', 'IEC 62443-4-2'],
    prereqs: ['foundations'],
    hours: 40,
    labHours: 10,
    passingScore: 75,
    courses: ['iec-62443-design'],
    isaLevels: ['SL2', 'SL3', 'SL4'],
    validityYears: 3,
    summary:
      'Translate risk into hardened architecture: foundational requirements (FR 1-7), system requirements (SR), component requirements (CR). Capstone: design a Security Level 3 control system zone.',
  },
  {
    id: 'maintenance',
    code: 'AI-CSP-MNT',
    name: 'IEC 62443 Maintenance Specialist',
    shortName: 'Maintenance',
    isaEquivalent: 'ISA/IEC 62443 Cybersecurity Maintenance Specialist',
    iecParts: ['IEC 62443-2-3', 'IEC 62443-2-4'],
    prereqs: ['foundations'],
    hours: 30,
    labHours: 6,
    passingScore: 75,
    courses: ['iec-62443-maintenance'],
    isaLevels: ['SL1', 'SL2', 'SL3'],
    validityYears: 3,
    summary:
      'Operate the secure system over its lifecycle: patch management, security service provider requirements, incident response on ICS networks. Includes a tabletop exercise on a TRITON-style intrusion.',
  },
] as const;

export const EXPERT_CAPSTONE: ExpertCapstone = {
  id: 'cybersecurity-expert',
  code: 'AI-CSE-EXP',
  name: 'IEC 62443 Cybersecurity Expert',
  requiresAll: ['foundations', 'risk-assessment', 'design', 'maintenance'],
  capstoneCourse: 'iec-62443-expert-capstone',
  practicalLabHours: 40,
  practicalExamSlug: 'capstone-pentest-multistage',
  validityYears: 3,
  summary:
    'Multi-stage practical assessment: red-team a simulated chemical plant, write the report, defend it in oral. Holders demonstrate end-to-end mastery — risk, design, and maintenance — at SL3 / SL4.',
};

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

/**
 * Resolve a specialist by id. Throws if unknown — id should be validated
 * before reaching here (the type system guarantees this for callers in
 * TS, but defend against runtime data such as URL params).
 */
export function getSpecialist(id: string): SpecialistCertificate | undefined {
  return SPECIALISTS.find((s) => s.id === id);
}

/**
 * Determine whether a learner who has earned `held` can attempt `target`.
 * Pure, no I/O. The caller fetches `held` from the user's progress store.
 */
export function canEnter(
  target: SpecialistTrackId,
  held: ReadonlySet<SpecialistTrackId>,
): { ok: true } | { ok: false; missing: SpecialistTrackId[] } {
  const spec = getSpecialist(target);
  if (!spec) return { ok: false, missing: [] };
  const missing = spec.prereqs.filter((p) => !held.has(p));
  return missing.length === 0 ? { ok: true } : { ok: false, missing };
}

/**
 * Eligibility for the Expert capstone: all four specialists must be held.
 */
export function isEligibleForExpert(
  held: ReadonlySet<SpecialistTrackId>,
): boolean {
  return EXPERT_CAPSTONE.requiresAll.every((id) => held.has(id));
}

/**
 * Aggregate progress across the program. Useful for dashboard widgets.
 */
export interface CertificationProgress {
  specialistsEarned: SpecialistTrackId[];
  specialistsTotal: number;
  expertEligible: boolean;
  hoursCompleted: number;
  hoursTotal: number;
  percent: number;
}

export function summarizeProgress(
  held: ReadonlySet<SpecialistTrackId>,
): CertificationProgress {
  const earned = SPECIALISTS.filter((s) => held.has(s.id)).map((s) => s.id);
  const totalHours = SPECIALISTS.reduce((n, s) => n + s.hours + s.labHours, 0);
  const doneHours = SPECIALISTS
    .filter((s) => held.has(s.id))
    .reduce((n, s) => n + s.hours + s.labHours, 0);
  return {
    specialistsEarned: earned,
    specialistsTotal: SPECIALISTS.length,
    expertEligible: isEligibleForExpert(held),
    hoursCompleted: doneHours,
    hoursTotal: totalHours,
    percent: totalHours === 0 ? 0 : Math.round((doneHours / totalHours) * 100),
  };
}

/**
 * The whole-program registry, for the `/certification` page builder
 * and JSON-LD schema. Frozen so it cannot be mutated at runtime.
 */
export const CERTIFICATION_REGISTRY = Object.freeze({
  specialists: SPECIALISTS,
  expert: EXPERT_CAPSTONE,
});
