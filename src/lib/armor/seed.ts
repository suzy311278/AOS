/**
 * Shared seed data for the ArmorInnovate IA (Phase 1).
 *
 * These constants drive the four section pages (`/knowledge`, `/labs`,
 * `/certification`, `/intel`) until Phase 2 (course engine + DB) and
 * Phase 4 (CISA ingestion) replace them with live queries.
 *
 * Conventions
 * ───────────
 *   - Pure data only — no React, no I/O. Safe to import anywhere.
 *   - Types are local (this file is the contract). When the live DB
 *     schema lands in Phase 4, those types will be promoted into the
 *     drizzle schema and this file will re-export thin facades.
 *   - All ids are URL-safe slugs.
 *
 * The richer dataset here intentionally extends what `src/app/page.tsx`
 * uses (the homepage shows a curated 5-row strip, the `/intel` page
 * shows the full 30-row dashboard).
 */

import type { SpecialistTrackId } from './certification';

// ──────────────────────────────────────────────────────────────────────
// Vulnerability advisories (CISA ICS-CERT shape, simplified)
// ──────────────────────────────────────────────────────────────────────

export type Severity = 'crit' | 'warn' | 'ok';

export interface Advisory {
  id: string;                  // ICSA-XX-NNN-NN
  cve?: string;                // primary CVE (if assigned)
  vendor: string;
  product: string;
  title: string;
  cvss: number;
  severity: Severity;
  publishedISO: string;        // YYYY-MM-DD
  age: string;                 // human-friendly relative age
  isaImpact: ('SL1' | 'SL2' | 'SL3' | 'SL4')[];
  protocols: string[];         // 'modbus', 's7comm', 'cip', 'iec104', etc.
  mitigations: string[];
  summary: string;
  references: { label: string; url: string }[];
}

export const ADVISORIES: readonly Advisory[] = [
  {
    id: 'ICSA-24-009-01',
    cve: 'CVE-2024-21912',
    vendor: 'Rockwell Automation',
    product: 'CompactLogix 5380',
    title: 'CompactLogix unauthenticated firmware overwrite',
    cvss: 9.8,
    severity: 'crit',
    publishedISO: '2024-01-09',
    age: '2h',
    isaImpact: ['SL2', 'SL3', 'SL4'],
    protocols: ['cip', 'ethernet/ip'],
    mitigations: [
      'Upgrade to firmware ≥ 33.012',
      'Restrict CIP traffic to engineering workstations only',
      'Place controllers in a Level 1 zone with a single conduit to Level 2',
    ],
    summary:
      'A flaw in the firmware update routine allows unauthenticated attackers on the local subnet to overwrite controller firmware over CIP, leading to denial of process and remote code execution.',
    references: [
      { label: 'CISA advisory', url: 'https://www.cisa.gov/news-events/ics-advisories/icsa-24-009-01' },
      { label: 'Vendor PSIRT',  url: 'https://www.rockwellautomation.com/en-us/trust-center/security-advisories' },
    ],
  },
  {
    id: 'ICSA-24-191-04',
    cve: 'CVE-2024-37369',
    vendor: 'Rockwell Automation',
    product: 'FactoryTalk View ME',
    title: 'FactoryTalk View ME remote code execution',
    cvss: 8.6,
    severity: 'warn',
    publishedISO: '2024-07-09',
    age: '6h',
    isaImpact: ['SL2', 'SL3'],
    protocols: ['http', 'rdp'],
    mitigations: [
      'Apply ME patch v14 SR2',
      'Block RDP from Level 2.5 to Level 3 networks',
      'Disable XML trace logging in production',
    ],
    summary:
      'A path-traversal in the ME runtime XML loader allows authenticated operators to escape the project sandbox and execute code as SYSTEM.',
    references: [
      { label: 'CISA advisory', url: 'https://www.cisa.gov/news-events/ics-advisories/icsa-24-191-04' },
    ],
  },
  {
    id: 'ICSA-23-353-08',
    cve: 'CVE-2023-44321',
    vendor: 'Siemens',
    product: 'SIMATIC S7-1500',
    title: 'S7-1500 authentication bypass via S7CommPlus',
    cvss: 8.6,
    severity: 'warn',
    publishedISO: '2023-12-19',
    age: '1d',
    isaImpact: ['SL2', 'SL3'],
    protocols: ['s7comm', 's7commplus'],
    mitigations: [
      'Upgrade to firmware ≥ V3.1.0',
      'Enable program / configuration access protection',
      'Disable web server on production CPUs',
    ],
    summary:
      'A reused session token in S7CommPlus authentication allows an attacker who observed one valid handshake to forge subsequent commands, including STOP and program download.',
    references: [
      { label: 'CISA advisory',           url: 'https://www.cisa.gov/news-events/ics-advisories/icsa-23-353-08' },
      { label: 'Siemens ProductCERT SSA', url: 'https://cert-portal.siemens.com/productcert/' },
    ],
  },
  {
    id: 'ICSA-24-046-09',
    cve: 'CVE-2024-22013',
    vendor: 'Schneider Electric',
    product: 'Modicon M340',
    title: 'Modicon M340 buffer overflow in HTTP server',
    cvss: 7.5,
    severity: 'warn',
    publishedISO: '2024-02-15',
    age: '2d',
    isaImpact: ['SL2', 'SL3'],
    protocols: ['http', 'modbus'],
    mitigations: [
      'Disable embedded HTTP server',
      'Apply firmware ≥ 3.40',
      'Restrict Modbus/TCP to known engineering workstations',
    ],
    summary:
      'A long URL in the embedded web server overflows a stack buffer, leading to denial of service and (with crafted payload) code execution on the controller CPU.',
    references: [
      { label: 'CISA advisory', url: 'https://www.cisa.gov/news-events/ics-advisories/icsa-24-046-09' },
    ],
  },
  {
    id: 'ICSA-23-336-03',
    cve: 'CVE-2023-50229',
    vendor: 'Mitsubishi Electric',
    product: 'MELSEC iQ-R',
    title: 'MELSEC iQ-R denial of service via MELSOFT',
    cvss: 5.3,
    severity: 'ok',
    publishedISO: '2023-12-02',
    age: '3d',
    isaImpact: ['SL1', 'SL2'],
    protocols: ['melsoft', 'tcp'],
    mitigations: [
      'Update CPU firmware ≥ 60',
      'Limit MELSOFT TCP/5007 to engineering subnet',
    ],
    summary:
      'A malformed MELSOFT packet causes the CPU to halt; recovery requires manual restart. Pre-auth, network-adjacent.',
    references: [
      { label: 'CISA advisory', url: 'https://www.cisa.gov/news-events/ics-advisories/icsa-23-336-03' },
    ],
  },
  {
    id: 'ICSA-24-128-02',
    cve: 'CVE-2024-30471',
    vendor: 'Honeywell',
    product: 'Experion PKS',
    title: 'Experion PKS heap overflow in CDA broker',
    cvss: 9.1,
    severity: 'crit',
    publishedISO: '2024-05-07',
    age: '5d',
    isaImpact: ['SL3', 'SL4'],
    protocols: ['cda'],
    mitigations: [
      'Apply Experion R520.2 hotfix',
      'Segment CDA brokers from Level 3 networks',
    ],
    summary:
      'Heap overflow in the Control Data Access (CDA) broker on connection negotiation; allows remote unauthenticated code execution.',
    references: [
      { label: 'CISA advisory', url: 'https://www.cisa.gov/news-events/ics-advisories/icsa-24-128-02' },
    ],
  },
  {
    id: 'ICSA-24-072-05',
    cve: 'CVE-2024-23906',
    vendor: 'ABB',
    product: 'AC500 V3',
    title: 'AC500 V3 hardcoded engineering credentials',
    cvss: 8.1,
    severity: 'warn',
    publishedISO: '2024-03-12',
    age: '6d',
    isaImpact: ['SL2', 'SL3'],
    protocols: ['codesys'],
    mitigations: [
      'Replace default device credentials',
      'Apply firmware ≥ 3.7.0',
      'Disable CODESYS Web Visualisation in production',
    ],
    summary:
      'A factory-set service account in the AC500 V3 web visualisation service allows remote login. Vendor advises rotating credentials and disabling unused services.',
    references: [
      { label: 'CISA advisory', url: 'https://www.cisa.gov/news-events/ics-advisories/icsa-24-072-05' },
    ],
  },
  {
    id: 'ICSA-23-285-11',
    cve: 'CVE-2023-46123',
    vendor: 'Yokogawa',
    product: 'CENTUM VP',
    title: 'CENTUM VP improper certificate validation',
    cvss: 7.4,
    severity: 'warn',
    publishedISO: '2023-10-12',
    age: '8d',
    isaImpact: ['SL2', 'SL3'],
    protocols: ['vnet/ip'],
    mitigations: [
      'Apply Vnet/IP Open patch R6.09.50',
      'Pin field controller CA to engineering workstation only',
    ],
    summary:
      'CENTUM VP DCS does not validate the certificate chain on Vnet/IP Open sessions, enabling MITM attackers to intercept setpoint changes.',
    references: [
      { label: 'CISA advisory', url: 'https://www.cisa.gov/news-events/ics-advisories/icsa-23-285-11' },
    ],
  },
];

// ──────────────────────────────────────────────────────────────────────
// Lab catalogue
// ──────────────────────────────────────────────────────────────────────

export type LabRuntime =
  | 'pymodbus-simulator'
  | 'snap7-simulator'
  | 'cpppo-simulator'
  | 'view-me-mock'
  | 'iec104-simulator'
  | 'opc-ua-mock';

export type LabDifficulty = 'intro' | 'intermediate' | 'advanced';

export interface Lab {
  slug: string;
  tag: string;                 // LAB-NN
  title: string;
  shortLabel: string;
  runtime: LabRuntime;
  protocol: string;
  port: string;
  unit: string;                // tcp | udp | mixed
  difficulty: LabDifficulty;
  status: 'ready' | 'queue' | 'maintenance';
  durationMin: number;
  track: 'ics-pentest' | 'ot-defense' | 'capstone';
  isaLevels: ('SL1' | 'SL2' | 'SL3' | 'SL4')[];
  /** Linked specialist track for prereq gating, if any. */
  specialist?: SpecialistTrackId;
  objectives: string[];
  toolkit: string[];
  scenario: string;
  successCriteria: string[];
  relatedAdvisories: string[]; // advisory IDs from ADVISORIES
}

export const LABS: readonly Lab[] = [
  {
    slug: 'modbus-pentest-101',
    tag: 'LAB-01',
    title: 'Modbus pentesting: enumeration and forced coil writes',
    shortLabel: 'Modbus pentesting',
    runtime: 'pymodbus-simulator',
    protocol: 'Modbus/TCP',
    port: '502',
    unit: 'tcp',
    difficulty: 'intro',
    status: 'ready',
    durationMin: 90,
    track: 'ics-pentest',
    isaLevels: ['SL1', 'SL2'],
    specialist: 'foundations',
    objectives: [
      'Enumerate registers and coils on a live Modbus/TCP slave',
      'Force-write a discrete output and observe HMI response',
      'Detect the attack from Wireshark captures',
    ],
    toolkit: ['nmap NSE (modbus-discover)', 'mbtget', 'pymodbus-cli', 'wireshark'],
    scenario:
      'You are auditing a small water-treatment skid. The integrator left Modbus/TCP exposed on the engineering VLAN. Map the device, identify the holding registers used for setpoints, and demonstrate impact without crashing the simulator.',
    successCriteria: [
      'Submit a pcap showing register-read enumeration',
      'Submit the mbtget command that flipped coil 42',
      'Write a 200-word report mapping findings to IEC 62443-3-3 SR 1.1, SR 2.1',
    ],
    relatedAdvisories: ['ICSA-24-046-09'],
  },
  {
    slug: 's7comm-stop-run-abuse',
    tag: 'LAB-02',
    title: 'S7comm exploitation: STOP/RUN abuse and block download',
    shortLabel: 'S7comm exploitation',
    runtime: 'snap7-simulator',
    protocol: 'S7comm',
    port: '102',
    unit: 'tcp',
    difficulty: 'intermediate',
    status: 'ready',
    durationMin: 120,
    track: 'ics-pentest',
    isaLevels: ['SL2', 'SL3'],
    specialist: 'risk-assessment',
    objectives: [
      'Fingerprint a Siemens S7-1200 over TCP/102',
      'Send a STOP command using snap7-cli',
      'Pull program blocks (DB, OB) for offline analysis',
    ],
    toolkit: ['plcscan', 'snap7-cli', 'isf (industrial security framework)'],
    scenario:
      'A simulated S7-1200 is reachable on the lab network. Demonstrate the STOP/RUN abuse pattern Stuxnet used as a primitive, then show how the same channel exfiltrates DBs.',
    successCriteria: [
      'Capture the S7comm STOP frame with Wireshark',
      'List downloaded blocks in the report',
      'Map findings to IEC 62443-3-3 SR 2.4',
    ],
    relatedAdvisories: ['ICSA-23-353-08'],
  },
  {
    slug: 'enip-cip-class-abuse',
    tag: 'LAB-03',
    title: 'EtherNet/IP & CIP: class enumeration and attribute writes',
    shortLabel: 'EtherNet/IP & CIP',
    runtime: 'cpppo-simulator',
    protocol: 'EtherNet/IP (CIP)',
    port: '44818',
    unit: 'mixed',
    difficulty: 'advanced',
    status: 'queue',
    durationMin: 150,
    track: 'ics-pentest',
    isaLevels: ['SL2', 'SL3', 'SL4'],
    specialist: 'design',
    objectives: [
      'Enumerate CIP classes on a CompactLogix-style target',
      'Trigger CVE-2024-21912 in a controlled lab harness',
      'Detect the exploit path via Snort/Suricata rules',
    ],
    toolkit: ['cpppo', 'enip-stack', 'snort', 'kibana'],
    scenario:
      'The lab harness emulates a CompactLogix L83 with the firmware-overwrite primitive (ICSA-24-009-01) intentionally exposed. Demonstrate the exploit path on a sacrificial controller, then write a Suricata rule that catches it.',
    successCriteria: [
      'Successful pcap of the malicious CIP class write',
      'A working Suricata rule that fires on the pattern',
      'Mapping to IEC 62443-3-3 SR 1.6, SR 7.6',
    ],
    relatedAdvisories: ['ICSA-24-009-01'],
  },
  {
    slug: 'hmi-hardening-view-me',
    tag: 'LAB-04',
    title: 'HMI hardening: zone and conduit design with View ME',
    shortLabel: 'HMI hardening',
    runtime: 'view-me-mock',
    protocol: 'HMI / RDP',
    port: '443',
    unit: 'tcp',
    difficulty: 'intermediate',
    status: 'ready',
    durationMin: 90,
    track: 'ot-defense',
    isaLevels: ['SL2', 'SL3'],
    specialist: 'design',
    objectives: [
      'Design a Level 3.5 DMZ for HMI traffic',
      'Patch the View ME RCE in a sandboxed copy',
      'Write firewall rules that survive the audit',
    ],
    toolkit: ['mock View ME', 'pf rules', 'iptables', 'visio (zone diagram)'],
    scenario:
      'The plant is recovering from CVE-2024-37369 (FactoryTalk View ME RCE). Stand up the patched HMI, then defend it with a zone-and-conduit diagram and corresponding pf ruleset.',
    successCriteria: [
      'A zone diagram annotated with 62443-3-2 risk levels',
      'A working pf ruleset that allows only HMI ↔ historian flows',
      'Patched View ME confirmed by a re-test of the original PoC',
    ],
    relatedAdvisories: ['ICSA-24-191-04'],
  },
  {
    slug: 'iec104-substation',
    tag: 'LAB-05',
    title: 'IEC 60870-5-104: substation traffic analysis',
    shortLabel: 'IEC 104 substation',
    runtime: 'iec104-simulator',
    protocol: 'IEC 60870-5-104',
    port: '2404',
    unit: 'tcp',
    difficulty: 'advanced',
    status: 'maintenance',
    durationMin: 120,
    track: 'ot-defense',
    isaLevels: ['SL3', 'SL4'],
    specialist: 'maintenance',
    objectives: [
      'Decode IEC 104 ASDUs from a captured substation trace',
      'Spot Industroyer-style malicious switch operations',
      'Write a SOC playbook for the pattern',
    ],
    toolkit: ['iec104-cli', 'wireshark + iec104 dissector', 'splunk'],
    scenario:
      'A simulated 110 kV substation generates IEC 104 traffic. Two of the captures contain Industroyer-style operate commands disguised as routine setpoint changes. Find them.',
    successCriteria: [
      'Annotated pcap with the malicious frames highlighted',
      'A SOC playbook (markdown) that catches the pattern',
    ],
    relatedAdvisories: [],
  },
  {
    slug: 'opc-ua-trust',
    tag: 'LAB-06',
    title: 'OPC UA: certificate trust list hardening',
    shortLabel: 'OPC UA trust',
    runtime: 'opc-ua-mock',
    protocol: 'OPC UA',
    port: '4840',
    unit: 'tcp',
    difficulty: 'intermediate',
    status: 'ready',
    durationMin: 75,
    track: 'ot-defense',
    isaLevels: ['SL2', 'SL3'],
    specialist: 'maintenance',
    objectives: [
      'Inspect an OPC UA server\u2019s trust list and reject list',
      'Configure mutual TLS with a self-signed CA',
      'Detect a rogue subscription via server audit events',
    ],
    toolkit: ['UaExpert', 'opcua-cli', 'openssl'],
    scenario:
      'A loosely-configured OPC UA server in the lab accepts any client certificate. Lock it down, prove the lockdown blocks a known rogue cert, and show the audit trail of a subscription denial.',
    successCriteria: [
      'Hardened server-config XML',
      'Audit log entry for the rejected client',
    ],
    relatedAdvisories: [],
  },
];

// ──────────────────────────────────────────────────────────────────────
// Knowledge base index
//
// 5 specialist courses + 1 capstone, surfaced as cards on /knowledge.
// Real MDX bodies come in Phase 2 (course engine). For now each entry
// carries enough metadata for the index + detail stub pages.
// ──────────────────────────────────────────────────────────────────────

export interface KnowledgeCourse {
  slug: string;
  code: string;
  title: string;
  shortTitle: string;
  track: SpecialistTrackId | 'capstone';
  tagline: string;
  summary: string;
  hours: number;
  labHours: number;
  parts: string[];
  modules: { id: string; title: string; lessons: number }[];
  outcomes: string[];
  status: 'available' | 'beta' | 'coming-soon';
}

export const KNOWLEDGE_COURSES: readonly KnowledgeCourse[] = [
  {
    slug: 'iec-62443-foundations',
    code: 'AI-CSP-FND',
    title: 'IEC 62443 Cybersecurity Fundamentals',
    shortTitle: 'Fundamentals',
    track: 'foundations',
    tagline: 'Start here. The Purdue model, threat actors, and how 62443 is organised.',
    summary:
      'Learn how OT differs from IT, why availability outranks confidentiality, and the canonical industrial threat actors (Stuxnet, Industroyer, TRITON). End the course with a mental map of the IEC 62443 series so the rest of the program drops into place.',
    hours: 30,
    labHours: 6,
    parts: ['62443-1-1', '62443-2-1'],
    modules: [
      { id: '0', title: 'ICS vs IT mindset',          lessons: 4 },
      { id: '1', title: 'The Purdue Reference Model', lessons: 5 },
      { id: '2', title: 'Threat actors & case studies', lessons: 4 },
      { id: '3', title: 'IEC 62443 series structure', lessons: 4 },
      { id: '4', title: 'Hands-on: capture a Modbus session', lessons: 1 },
    ],
    outcomes: [
      'Explain why an HMI freeze is more dangerous than a database leak',
      'Name the seven Foundational Requirements of IEC 62443-3-3',
      'Identify Purdue level for any device on a brownfield network diagram',
    ],
    status: 'available',
  },
  {
    slug: 'iec-62443-risk-assessment',
    code: 'AI-CSP-RA',
    title: 'IEC 62443 Risk Assessment',
    shortTitle: 'Risk Assessment',
    track: 'risk-assessment',
    tagline: 'Asset inventories, zone & conduit modelling, threat modelling for OT.',
    summary:
      'Run a full ICS cybersecurity risk assessment per IEC 62443-3-2. Inventory assets, model zones and conduits, score risk against tolerable risk, and select countermeasures by Security Level.',
    hours: 35,
    labHours: 8,
    parts: ['62443-3-2'],
    modules: [
      { id: '0', title: 'Scope, asset inventory, criticality', lessons: 4 },
      { id: '1', title: 'Zones and conduits',                   lessons: 5 },
      { id: '2', title: 'Threat modelling for OT',              lessons: 5 },
      { id: '3', title: 'Risk scoring & treatment',             lessons: 4 },
      { id: '4', title: 'Hands-on: water plant assessment',     lessons: 1 },
    ],
    outcomes: [
      'Produce a 62443-3-2 compliant risk register for a small plant',
      'Justify Security Level targets per zone',
      'Translate a TRITON-style scenario into a risk treatment plan',
    ],
    status: 'available',
  },
  {
    slug: 'iec-62443-design',
    code: 'AI-CSP-DSN',
    title: 'IEC 62443 Design',
    shortTitle: 'Design',
    track: 'design',
    tagline: 'FRs, SRs, CRs — turn risk into hardened architecture.',
    summary:
      'Translate risk into engineering: foundational requirements (FR 1-7), system requirements (SR), component requirements (CR). End the course by designing a Security Level 3 control system zone end to end.',
    hours: 40,
    labHours: 10,
    parts: ['62443-3-3', '62443-4-2'],
    modules: [
      { id: '0', title: 'Foundational Requirements (FR 1-7)', lessons: 5 },
      { id: '1', title: 'System Requirements at SL1-SL4',       lessons: 5 },
      { id: '2', title: 'Component Requirements (4-2)',         lessons: 4 },
      { id: '3', title: 'Reference architectures',              lessons: 4 },
      { id: '4', title: 'Hands-on: SL3 zone design',            lessons: 1 },
    ],
    outcomes: [
      'Design an SL3 zone with documented conduit controls',
      'Map every SR in 62443-3-3 to a concrete control',
      'Review a vendor datasheet for 62443-4-2 conformance',
    ],
    status: 'available',
  },
  {
    slug: 'iec-62443-maintenance',
    code: 'AI-CSP-MNT',
    title: 'IEC 62443 Maintenance',
    shortTitle: 'Maintenance',
    track: 'maintenance',
    tagline: 'Operate the secure system over its lifecycle.',
    summary:
      'Patch management on PLCs, security service provider requirements (SSPRs), and incident response on ICS networks. Includes a tabletop exercise on a TRITON-style intrusion.',
    hours: 30,
    labHours: 6,
    parts: ['62443-2-3', '62443-2-4'],
    modules: [
      { id: '0', title: 'OT patch management',                  lessons: 5 },
      { id: '1', title: 'Security service provider req. (2-4)', lessons: 4 },
      { id: '2', title: 'Incident response on ICS networks',    lessons: 4 },
      { id: '3', title: 'Tabletop: TRITON intrusion',           lessons: 3 },
      { id: '4', title: 'Hands-on: IEC 104 forensics',          lessons: 1 },
    ],
    outcomes: [
      'Approve a controller firmware patch with risk justification',
      'Run a tabletop exercise that surfaces gaps in your IR plan',
      'Reconstruct an Industroyer-style attack from packet captures',
    ],
    status: 'beta',
  },
  {
    slug: 'iec-62443-expert-capstone',
    code: 'AI-CSE-EXP',
    title: 'IEC 62443 Cybersecurity Expert — Capstone',
    shortTitle: 'Expert Capstone',
    track: 'capstone',
    tagline: '40-hour multi-stage practical. Red, write, defend.',
    summary:
      'Capstone for the Cybersecurity Expert designation. Red-team a simulated chemical plant, write the report, defend it in oral. Holders demonstrate end-to-end mastery — risk, design, and maintenance — at SL3 / SL4.',
    hours: 8,
    labHours: 40,
    parts: ['62443-1-1', '62443-2-1', '62443-2-3', '62443-2-4', '62443-3-2', '62443-3-3', '62443-4-2'],
    modules: [
      { id: '0', title: 'Capstone briefing',          lessons: 2 },
      { id: '1', title: 'Practical: chemical plant',  lessons: 3 },
      { id: '2', title: 'Report writing',             lessons: 2 },
      { id: '3', title: 'Oral defence preparation',   lessons: 1 },
    ],
    outcomes: [
      'Pass the multi-stage practical assessment at ≥ 75%',
      'Defend the written report in a 45-minute oral with two examiners',
    ],
    status: 'coming-soon',
  },
];

// ──────────────────────────────────────────────────────────────────────
// Quick lookups
// ──────────────────────────────────────────────────────────────────────

export function getAdvisory(id: string): Advisory | undefined {
  return ADVISORIES.find((a) => a.id === id);
}

export function getLab(slug: string): Lab | undefined {
  return LABS.find((l) => l.slug === slug);
}

export function getKnowledgeCourse(slug: string): KnowledgeCourse | undefined {
  return KNOWLEDGE_COURSES.find((c) => c.slug === slug);
}

export function relatedLabsForAdvisory(advisoryId: string): readonly Lab[] {
  return LABS.filter((l) => l.relatedAdvisories.includes(advisoryId));
}

/** Normalised, sorted list for the /intel dashboard. */
export function listAdvisories(): readonly Advisory[] {
  return [...ADVISORIES].sort(
    (a, b) => +new Date(b.publishedISO) - +new Date(a.publishedISO),
  );
}
