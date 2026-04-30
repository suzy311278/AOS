/**
 * ActiveShowcase
 *
 * The Work Modes section's main element. A split layout with:
 *   - Left (35%): Vertical nav listing all 5 product areas. The active
 *     item has a teal border, filled icon, and a thin progress bar that
 *     fills over the 4-second auto-advance interval.
 *   - Right (65%): A large dark canvas that morphs between products as
 *     the active index changes. Each slide has 5 stacked elements:
 *       1. Small uppercase label
 *       2. Big headline
 *       3. Stats strip (2-3 mono numbers)
 *       4. Visual mockup card
 *       5. CTA button
 *     Elements fade + slide up in sequence with a 80ms stagger.
 *
 * Behavior:
 *   - Auto-advances every 4 seconds
 *   - Mouse entering the section pauses auto-advance
 *   - Mouse leaving resumes
 *   - Clicking a nav item makes it "sticky" (no auto-advance) for 15s
 *   - Clicking the same nav item again resumes auto-advance immediately
 *
 * This component is a client component because it manages state for
 * the active slide, auto-advance, and hover pause.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Sparkles,
  Calculator,
  Bell,
  Briefcase,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Play,
  FileText,
  GitCompare,
  Building2,
  Link2,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/components/redesign/lib/cn';
import { StatBadge } from '@/components/redesign/StatBadge';

const AUTO_ADVANCE_INTERVAL = 4500;
const STICKY_DURATION = 15000;

interface ProductStat {
  value: string;
  label: string;
}

interface ShowcaseProduct {
  id: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  navTagline: string;
  headline: string;
  italicTagline: string;
  stats: ProductStat[];
  cta: { label: string; href: string };
  comingSoon?: boolean;
  mockup: React.ReactNode;
}

// ==========================================================================
// MOCKUP COMPONENTS - small product UI previews shown on the right canvas
// Each is a self-contained JSX block that looks like a slice of real product UI.
// ==========================================================================

/**
 * LearnMockup
 *
 * Shows a lesson preview that demonstrates the practical-first
 * approach: audio at the top, a visually broken-down color-coded
 * equation, a worked "in practice" example with real numbers, and
 * a checkpoint quiz indicator at the bottom.
 *
 * The goal is to SHOW the differentiator in a single glance:
 * "theory + practice + audio + quiz, all in one lesson."
 */
function LearnMockup() {
  return (
    <div className="bg-black/30 border border-white/10 rounded-xl p-5 space-y-4">
      {/* Lesson header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-[9px] font-bold text-gt-leaf uppercase"
            style={{ letterSpacing: '0.2em' }}
          >
            Lesson 2.3 · PCAF v3
          </span>
          <span
            className="text-[9px] text-white/45"
            style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
          >
            10 min
          </span>
        </div>
        <p className="text-[15px] font-bold text-white leading-tight">
          Asset Class Attribution
        </p>
      </div>

      {/* Audio strip - at the top, showing audio is built into every lesson */}
      <div className="flex items-center gap-3 bg-orange-500/5 border border-orange-400/20 rounded-lg px-3 py-2.5">
        <div className="w-7 h-7 rounded-full bg-orange-400/20 border border-orange-400/40 flex items-center justify-center flex-shrink-0">
          <Play className="w-3 h-3 text-orange-300 ml-0.5" fill="currentColor" />
        </div>
        {/* Waveform bars */}
        <div className="flex items-center gap-[2px] h-5 flex-1 overflow-hidden">
          {[40, 65, 85, 50, 72, 45, 60, 88, 52, 68, 38, 75, 55, 82, 48, 70, 42, 60].map((h, i) => (
            <div
              key={i}
              className={`w-[2px] rounded-full ${i < 6 ? 'bg-orange-400' : 'bg-orange-400/30'}`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <span
          className="text-[9px] text-orange-300/80 flex-shrink-0"
          style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
        >
          3:42 / 10:12
        </span>
      </div>

      {/* THEORY - visual color-coded equation breakdown */}
      <div>
        <div
          className="text-[9px] font-bold text-white/45 uppercase mb-2.5"
          style={{ letterSpacing: '0.22em' }}
        >
          Theory
        </div>

        {/* The equation, rendered with colored pills for each variable */}
        <div className="flex items-center justify-center gap-2.5 py-2">
          {/* Left: Attribution Factor (teal) */}
          <div className="px-2.5 py-1.5 bg-[#5eead4]/12 border border-[#5eead4]/40 rounded-md">
            <span
              className="text-sm font-bold text-[#5eead4]"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            >
              AF
            </span>
          </div>

          <span className="text-white/50 text-base">=</span>

          {/* Right: fraction Outstanding / (Equity + Debt) */}
          <div className="flex flex-col items-center gap-1">
            <div className="px-2.5 py-1 bg-[#93c5fd]/12 border border-[#93c5fd]/40 rounded-md">
              <span className="text-[11px] font-semibold text-[#93c5fd]">
                Outstanding
              </span>
            </div>
            <div className="w-full h-px bg-white/30" />
            <div className="px-2.5 py-1 bg-[#fbbf24]/12 border border-[#fbbf24]/40 rounded-md">
              <span className="text-[11px] font-semibold text-[#fbbf24]">
                Equity + Debt
              </span>
            </div>
          </div>
        </div>

        {/* Legend - each color maps to its meaning */}
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5eead4]" />
            <span className="text-[10px] text-white/60">
              Attribution factor (share of emissions)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#93c5fd]" />
            <span className="text-[10px] text-white/60">
              Loan amount outstanding
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24]" />
            <span className="text-[10px] text-white/60">
              Total company capital
            </span>
          </div>
        </div>
      </div>

      {/* IN PRACTICE - worked example with real numbers */}
      <div className="bg-gt-leaf/8 border-l-2 border-gt-leaf rounded-r p-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <CheckCircle2 className="w-3 h-3 text-gt-leaf flex-shrink-0" />
          <span
            className="text-[9px] font-bold text-gt-leaf uppercase"
            style={{ letterSpacing: '0.2em' }}
          >
            In Practice
          </span>
        </div>
        <div
          className="text-[11px] text-white/85 leading-relaxed"
          style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
        >
          <span className="text-[#93c5fd]">$24.5M</span>
          <span className="text-white/50"> / </span>
          <span className="text-[#fbbf24]">$78M</span>
          <span className="text-white/50"> = </span>
          <span className="text-gt-leaf font-bold">0.314</span>
        </div>
      </div>

      {/* Quiz footer - at the end of every lesson */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-gt-leaf/15 border border-gt-leaf/40 flex items-center justify-center">
            <span className="text-[9px] font-bold text-gt-leaf">?</span>
          </div>
          <span className="text-[10px] text-white/65 font-semibold">
            Checkpoint quiz · 4 questions
          </span>
        </div>
        <span className="text-[9px] text-white/35">Next →</span>
      </div>
    </div>
  );
}

/**
 * AskMockup
 *
 * Shows a SustainIQ answer with the exact source location prominently
 * displayed: the primary source has document + section + page number,
 * followed by a verbatim quote from the source. Cross-references are
 * listed below as a secondary confirmation with breathing room so
 * they don't feel crumpled.
 *
 * The question pops in a bright neon-mint green so it visually
 * balances the white answer below it. Both question and answer now
 * carry visual weight - you don't subconsciously skim past the
 * question to get to the answer.
 */
function AskMockup() {
  return (
    <div className="bg-black/30 border border-white/10 rounded-xl p-5 space-y-4">
      {/* Question at top - bright neon green so it POPS */}
      <div className="flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-[#86efac] flex-shrink-0 mt-0.5" />
        <p
          className="text-[13px] font-medium text-[#86efac] leading-snug"
          style={{
            textShadow: '0 0 20px rgba(134, 239, 172, 0.25)',
          }}
        >
          What is the baseline period for VM0042?
        </p>
      </div>

      {/* Big answer - prominent white */}
      <p className="text-[18px] font-bold text-white leading-tight">
        10 years prior to project start
      </p>

      {/* PRIMARY SOURCE with exact location + verbatim quote */}
      <div className="bg-gt-leaf/8 border border-gt-leaf/30 rounded-lg overflow-hidden">
        <div className="px-3 py-2 bg-gt-leaf/10 border-b border-gt-leaf/20">
          <div
            className="text-[9px] font-bold text-gt-leaf uppercase"
            style={{ letterSpacing: '0.22em' }}
          >
            Primary Source
          </div>
        </div>
        <div className="p-3 space-y-2.5">
          {/* Exact location - the star of the card */}
          <div className="flex items-start gap-2">
            <div className="w-4 h-5 bg-gt-leaf/20 border border-gt-leaf/40 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[8px] text-gt-leaf font-bold">PDF</span>
            </div>
            <div className="min-w-0">
              <p
                className="text-[11px] font-bold text-white leading-tight"
                style={{
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                }}
              >
                VM0042 v2.2
              </p>
              <p
                className="text-[10px] text-gt-leaf mt-0.5"
                style={{
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                }}
              >
                Section 3.1.2 · Page 14
              </p>
            </div>
          </div>
          {/* Verbatim quote - proves it's reading from the real doc */}
          <div className="border-l-2 border-gt-leaf/50 pl-2.5 py-0.5">
            <p className="text-[10px] italic text-white/75 leading-relaxed">
              &ldquo;The baseline period shall be the 10 years immediately
              prior to the project start date.&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/*
        Cross-references - each on its own row with justify-between
        layout: document name on the left, exact location on the right.
        More breathing room (py-2) and larger text (11px) so the list
        doesn't feel crumpled.
      */}
      <div>
        <div
          className="text-[9px] font-bold text-white/45 uppercase mb-2.5"
          style={{ letterSpacing: '0.22em' }}
        >
          Also cross-referenced in
        </div>
        <div className="divide-y divide-white/5 border-t border-b border-white/5">
          <div className="flex items-center justify-between py-2">
            <span
              className="text-[11px] text-white/75"
              style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
              }}
            >
              Verra Handbook
            </span>
            <span
              className="text-[10px] text-gt-leaf/70"
              style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
              }}
            >
              p. 47
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span
              className="text-[11px] text-white/75"
              style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
              }}
            >
              VCS Standard v4.7
            </span>
            <span
              className="text-[10px] text-gt-leaf/70"
              style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
              }}
            >
              § 5.2
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ToolsMockup
 *
 * Stateful mockup with 4 clickable tool tabs. Each tab shows its own
 * distinct content to prove the breadth and depth of the Tools suite.
 *
 *   1. GHG Calculator   - Scope 3 Cat 6 Business Travel calculation
 *                         with "feeds into" downstream disclosures
 *   2. Report Drafter   - BRSR Principle 6 auto-populated draft with
 *                         data pulled from the GHG Calculator
 *   3. IFRS Gap Assessor - IFRS S2 requirements coverage with gaps list
 *   4. BRSR Screener    - Company BRSR profile with ESG score + metrics
 *
 * Tab state is local to this component. When the user clicks a tab,
 * the mockup swaps content. The auto-advance pauses when the user's
 * mouse is over the showcase, so they can explore tabs freely before
 * the carousel resumes.
 */
type ToolTab = 'ghg' | 'report' | 'ifrs' | 'brsr';

/**
 * Per-tool export button label. Each tool has its own realistic
 * export format so the footer button reinforces what the tool
 * actually outputs:
 *   - GHG       -> PDF report with calculation audit trail
 *   - Report    -> Word document with embedded source citations
 *   - IFRS Gap  -> Gap assessment report with remediation recommendations
 *   - BRSR      -> XBRL tagged filing for SEBI submission
 */
const TOOL_EXPORT_LABELS: Record<ToolTab, string> = {
  ghg: 'Export PDF with audit trail for report',
  report: 'Export Word doc file with sources',
  ifrs: 'Export gap assessment with recommendation',
  brsr: 'Export XBRL',
};

function ToolsMockup() {
  const [activeTab, setActiveTab] = useState<ToolTab>('ghg');

  const tabs: { id: ToolTab; label: string; Icon: typeof Calculator }[] = [
    { id: 'ghg', label: 'GHG', Icon: Calculator },
    { id: 'report', label: 'Report', Icon: FileText },
    { id: 'ifrs', label: 'IFRS Gap', Icon: GitCompare },
    { id: 'brsr', label: 'BRSR', Icon: Building2 },
  ];

  return (
    <div className="bg-black/30 border border-white/10 rounded-xl p-5 space-y-4">
      {/* Tool selector tabs - clickable, each switches the mockup content */}
      <div className="flex gap-1 border-b border-white/10">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.Icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveTab(tab.id);
              }}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 pb-2.5 border-b-2 -mb-px transition-colors',
                isActive
                  ? 'border-gt-leaf'
                  : 'border-transparent hover:border-white/20'
              )}
            >
              <Icon
                className={cn(
                  'w-3.5 h-3.5 transition-colors',
                  isActive ? 'text-gt-leaf' : 'text-white/40'
                )}
              />
              <span
                className={cn(
                  'text-[8px] font-bold uppercase transition-colors',
                  isActive ? 'text-gt-leaf' : 'text-white/40'
                )}
                style={{ letterSpacing: '0.12em' }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active tool content - swaps based on state */}
      {activeTab === 'ghg' && <ToolGHGContent />}
      {activeTab === 'report' && <ToolReportContent />}
      {activeTab === 'ifrs' && <ToolIFRSContent />}
      {activeTab === 'brsr' && <ToolBRSRContent />}

      {/* Export button - label is tool-specific and reinforces the
          real output format of each tool. Icon uses items-center on
          the flex container plus self-center to stay vertically
          aligned, with horizontal padding so the content does not
          touch the edges when the label is long. */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 rounded-lg px-4 py-3 hover:bg-white/10 transition-colors"
      >
        <Download className="w-3 h-3 text-white/65 flex-shrink-0 self-center" />
        <span className="text-[10px] text-white/75 font-semibold leading-tight text-center">
          {TOOL_EXPORT_LABELS[activeTab]}
        </span>
      </button>
    </div>
  );
}

// ==========================================================================
// Tool variant contents - each returns the body of a specific tool.
// Keep visual rhythm consistent: small label → metrics → "feeds into" or
// equivalent hook-in section.
// ==========================================================================

/** Variant 1: GHG Calculator */
function ToolGHGContent() {
  return (
    <>
      <div>
        <p
          className="text-[9px] font-bold text-gt-leaf uppercase mb-3"
          style={{ letterSpacing: '0.2em' }}
        >
          Scope 3 · Cat 6 · Business Travel
        </p>
        <div className="space-y-2 mb-3">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-white/55">Activity data</span>
            <span
              className="text-white font-medium"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            >
              142,500 km
            </span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-white/55">Emission factor</span>
            <div className="flex items-center gap-1.5">
              <span
                className="text-white font-medium"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                0.255 kgCO2e/km
              </span>
              <CheckCircle2 className="w-3 h-3 text-gt-leaf flex-shrink-0" />
            </div>
          </div>
        </div>
        <div className="pt-3 border-t border-white/10 flex justify-between items-baseline">
          <span className="text-[11px] text-gt-leaf font-semibold">Result</span>
          <span
            className="text-[22px] font-bold text-gt-leaf leading-none"
            style={{
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              letterSpacing: '-0.02em',
            }}
          >
            36.3 tCO2e
          </span>
        </div>
      </div>

      <div className="bg-gt-leaf/5 border border-gt-leaf/25 rounded-lg p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Link2 className="w-3 h-3 text-gt-leaf" />
          <span
            className="text-[9px] font-bold text-gt-leaf uppercase"
            style={{ letterSpacing: '0.2em' }}
          >
            Feeds Into
          </span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-gt-leaf flex-shrink-0" />
              <span
                className="text-white/80"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                BRSR Principle 6
              </span>
            </div>
            <span
              className="text-white/45"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            >
              EI 1
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-gt-leaf flex-shrink-0" />
              <span
                className="text-white/80"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                CSRD ESRS E1
              </span>
            </div>
            <span
              className="text-white/45"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            >
              §1.4
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

/** Variant 2: Report Drafter */
function ToolReportContent() {
  return (
    <>
      <div>
        <p
          className="text-[9px] font-bold text-gt-leaf uppercase mb-3"
          style={{ letterSpacing: '0.2em' }}
        >
          BRSR Comprehensive · Principle 6 · EI 1
        </p>

        {/* Framework selector pills */}
        <div className="flex gap-1.5 mb-3">
          <span className="text-[9px] bg-gt-leaf/15 text-gt-leaf px-2 py-0.5 rounded">
            BRSR
          </span>
          <span className="text-[9px] bg-white/5 text-white/45 px-2 py-0.5 rounded">
            CSRD
          </span>
          <span className="text-[9px] bg-white/5 text-white/45 px-2 py-0.5 rounded">
            GRI
          </span>
          <span className="text-[9px] bg-white/5 text-white/45 px-2 py-0.5 rounded">
            TCFD
          </span>
        </div>

        {/* Draft preview */}
        <div className="bg-black/30 border-l-2 border-gt-leaf rounded-r p-3 mb-2">
          <div
            className="text-[9px] font-bold text-gt-leaf uppercase mb-1.5"
            style={{ letterSpacing: '0.2em' }}
          >
            Auto-draft preview
          </div>
          <p className="text-[10px] text-white/80 leading-relaxed italic">
            &ldquo;Total energy consumption in FY 2024-25 was{' '}
            <span className="text-gt-leaf font-semibold not-italic">
              8,450 GJ
            </span>
            , comprising Scope 1 direct emissions of{' '}
            <span className="text-gt-leaf font-semibold not-italic">
              420 tCO2e
            </span>{' '}
            and Scope 2 indirect of{' '}
            <span className="text-gt-leaf font-semibold not-italic">
              890 tCO2e
            </span>
            ...&rdquo;
          </p>
        </div>
        <p
          className="text-[9px] text-white/40"
          style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
        >
          Values auto-populated from GHG Calculator · FY 24-25
        </p>
      </div>

      {/* Status footer */}
      <div className="bg-gt-leaf/5 border border-gt-leaf/25 rounded-lg p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gt-leaf animate-pulse" />
          <span
            className="text-[10px] font-semibold text-white/80"
            style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
          >
            Draft ready for review
          </span>
        </div>
        <span
          className="text-[10px] text-gt-leaf"
          style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
        >
          94% complete
        </span>
      </div>
    </>
  );
}

/** Variant 3: IFRS Gap Assessor */
function ToolIFRSContent() {
  return (
    <>
      <div>
        <p
          className="text-[9px] font-bold text-gt-leaf uppercase mb-3"
          style={{ letterSpacing: '0.2em' }}
        >
          IFRS S2 · Climate Disclosures
        </p>

        {/* Coverage progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-white/60">
              Requirements covered
            </span>
            <span
              className="text-[14px] font-bold text-gt-leaf"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            >
              68%
            </span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gt-forest to-gt-leaf rounded-full"
              style={{ width: '68%' }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[9px] text-white/45">
            <span>34 of 50 met</span>
            <span
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            >
              16 gaps
            </span>
          </div>
        </div>

        {/* Top gaps list */}
        <div>
          <div
            className="text-[9px] font-bold text-white/45 uppercase mb-2"
            style={{ letterSpacing: '0.2em' }}
          >
            Top gaps
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[10px] text-white/75">
              <span className="w-1 h-1 rounded-full bg-orange-400 flex-shrink-0" />
              <span>Scope 3 Category 15 disclosure</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-white/75">
              <span className="w-1 h-1 rounded-full bg-orange-400 flex-shrink-0" />
              <span>Climate scenario analysis</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-white/75">
              <span className="w-1 h-1 rounded-full bg-orange-400 flex-shrink-0" />
              <span>Transition plan quantification</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cross-link to Learn */}
      <div className="bg-gt-leaf/5 border border-gt-leaf/25 rounded-lg p-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Link2 className="w-3 h-3 text-gt-leaf" />
          <span
            className="text-[9px] font-bold text-gt-leaf uppercase"
            style={{ letterSpacing: '0.2em' }}
          >
            Recommended
          </span>
        </div>
        <p
          className="text-[10px] text-white/80"
          style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
        >
          Course: IFRS S2 Gap Remediation · 6 lessons
        </p>
      </div>
    </>
  );
}

/** Variant 4: BRSR Screener */
function ToolBRSRContent() {
  return (
    <>
      <div>
        <p
          className="text-[9px] font-bold text-gt-leaf uppercase mb-3"
          style={{ letterSpacing: '0.2em' }}
        >
          Tata Steel Ltd · BSE
        </p>

        {/* ESG Score row with E/S/G breakdown */}
        <div className="flex items-start gap-4 mb-4">
          <div>
            <div
              className="text-[10px] text-white/45 uppercase mb-0.5"
              style={{ letterSpacing: '0.15em' }}
            >
              ESG Score
            </div>
            <div
              className="text-[26px] font-bold text-gt-leaf leading-none"
              style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                letterSpacing: '-0.02em',
              }}
            >
              72
              <span className="text-[14px] text-white/45">/100</span>
            </div>
          </div>
          <div className="flex gap-3 ml-auto pt-2">
            <div className="text-center">
              <div
                className="text-[13px] font-bold text-white leading-none"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                68
              </div>
              <div className="text-[8px] text-white/50 mt-0.5">E</div>
            </div>
            <div className="text-center">
              <div
                className="text-[13px] font-bold text-white leading-none"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                74
              </div>
              <div className="text-[8px] text-white/50 mt-0.5">S</div>
            </div>
            <div className="text-center">
              <div
                className="text-[13px] font-bold text-white leading-none"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                76
              </div>
              <div className="text-[8px] text-white/50 mt-0.5">G</div>
            </div>
          </div>
        </div>

        {/* Key metrics mini-table */}
        <div className="space-y-1.5 mb-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-white/55">GHG intensity</span>
            <span
              className="text-white font-medium"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            >
              2.14 tCO2e/t
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-white/55">Women in workforce</span>
            <span
              className="text-white font-medium"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            >
              8.2%
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-white/55">Board independence</span>
            <span
              className="text-white font-medium"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            >
              64%
            </span>
          </div>
        </div>
      </div>

      {/* Source footer */}
      <div className="bg-gt-leaf/5 border border-gt-leaf/25 rounded-lg p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <Link2 className="w-3 h-3 text-gt-leaf" />
          <span
            className="text-[9px] font-bold text-gt-leaf uppercase"
            style={{ letterSpacing: '0.2em' }}
          >
            Source Filing
          </span>
        </div>
        <p
          className="text-[10px] text-white/80"
          style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
        >
          BRSR FY2024-25 · Tata Steel Annual Report
        </p>
      </div>
    </>
  );
}

/**
 * RegulationsMockup
 *
 * Shows a rich regulation intelligence briefing with three killer
 * elements:
 *   1. Live freshness signal (pulsing dot + "2 hours ago") proves
 *      the tracker is alive and monitoring constantly
 *   2. Status timeline visualizing the regulation lifecycle
 *      (Draft -> Adopted -> In force -> Wave 2) - no competitor
 *      tracks regulations this way
 *   3. "APPLIES TO YOUR BUSINESS" section with specific reasons -
 *      proves the tool understands your business profile and does
 *      applicability analysis, not just generic notifications
 *
 * Recent changes list at the bottom shows the dynamic nature:
 * omnibus proposals, timeline extensions, amendments.
 */
function RegulationsMockup() {
  return (
    <div className="bg-black/30 border border-white/10 rounded-xl p-5 space-y-4">
      {/* Freshness signal */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gt-leaf opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-gt-leaf" />
          </span>
          <span
            className="text-[9px] text-gt-leaf font-bold uppercase"
            style={{ letterSpacing: '0.22em' }}
          >
            New update
          </span>
        </div>
        <span
          className="text-[9px] text-white/45"
          style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
        >
          2 hours ago
        </span>
      </div>

      {/* Regulation title + subtitle */}
      <div>
        <p className="text-[16px] font-bold text-white leading-tight">
          CSRD &mdash; Wave 2
        </p>
        <p className="text-[11px] text-white/55 mt-0.5 leading-snug">
          EU Corporate Sustainability Reporting Directive
        </p>
      </div>

      {/* Lifecycle status timeline - horizontal progression with
          filled dots for completed stages and outline for upcoming.
          Uses a 4-column grid so dots are evenly spaced regardless of
          label width. The connecting line is absolutely positioned
          and its endpoints match the dot centers (12.5% to 87.5%). */}
      <div>
        <div
          className="text-[9px] font-bold text-white/45 uppercase mb-3"
          style={{ letterSpacing: '0.22em' }}
        >
          Status
        </div>
        <div className="relative">
          {/* Base line spans from center of dot 1 (12.5%) to center
              of dot 4 (87.5%) = 75% of container width.
              Positioned at top 5px with height 2px so it sits
              exactly through the center of the 12px dots. */}
          <div
            className="absolute h-0.5 bg-white/12 rounded-full"
            style={{ top: '5px', left: '12.5%', width: '75%' }}
          />
          {/* Completed portion - from dot 1 center (12.5%) to dot 3
              center (62.5%) = 50% of container width.
              Sits on top of the base line. */}
          <div
            className="absolute h-0.5 bg-gt-leaf rounded-full"
            style={{ top: '5px', left: '12.5%', width: '50%' }}
          />

          <div className="grid grid-cols-4">
            {/* Stage 1: Draft - completed */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-gt-leaf ring-2 ring-gt-deep" />
              <span className="text-[8px] text-gt-leaf font-semibold mt-1.5 whitespace-nowrap">
                Draft
              </span>
            </div>

            {/* Stage 2: Adopted - completed */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-gt-leaf ring-2 ring-gt-deep" />
              <span className="text-[8px] text-gt-leaf font-semibold mt-1.5 whitespace-nowrap">
                Adopted
              </span>
            </div>

            {/* Stage 3: In force - completed */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-gt-leaf ring-2 ring-gt-deep" />
              <span className="text-[8px] text-gt-leaf font-semibold mt-1.5 whitespace-nowrap">
                In force
              </span>
            </div>

            {/* Stage 4: Wave 2 - upcoming (outline only) */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-gt-deep border-2 border-white/35 ring-2 ring-gt-deep" />
              <span className="text-[8px] text-white/50 font-semibold mt-1.5 whitespace-nowrap">
                Wave 2
              </span>
              <span
                className="text-[8px] text-white/35 whitespace-nowrap mt-0.5"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                Jan 2028
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* APPLIES TO YOUR BUSINESS - the killer element */}
      <div className="bg-gt-leaf/8 border border-gt-leaf/30 rounded-lg p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <AlertTriangle className="w-3 h-3 text-gt-leaf" />
          <span
            className="text-[9px] font-bold text-gt-leaf uppercase"
            style={{ letterSpacing: '0.2em' }}
          >
            Applies to your business
          </span>
        </div>
        <div className="space-y-1">
          <div className="flex items-start gap-2 text-[10px] text-white/85">
            <CheckCircle2 className="w-3 h-3 text-gt-leaf flex-shrink-0 mt-0.5" />
            <span>EU subsidiary (Germany)</span>
          </div>
          <div className="flex items-start gap-2 text-[10px] text-white/85">
            <CheckCircle2 className="w-3 h-3 text-gt-leaf flex-shrink-0 mt-0.5" />
            <span>Group turnover &gt; EUR 150M</span>
          </div>
          <div className="flex items-start gap-2 text-[10px] text-white/85">
            <CheckCircle2 className="w-3 h-3 text-gt-leaf flex-shrink-0 mt-0.5" />
            <span>Listed on regulated market</span>
          </div>
        </div>
      </div>

      {/* Recent changes - proves the dynamic nature */}
      <div>
        <div
          className="text-[9px] font-bold text-white/45 uppercase mb-2"
          style={{ letterSpacing: '0.22em' }}
        >
          Recent changes
        </div>
        <div className="space-y-1.5">
          <div className="flex items-start gap-2 text-[10px]">
            <span
              className="text-white/40 w-16 flex-shrink-0"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            >
              Feb 2025
            </span>
            <span className="text-white/75 leading-snug">
              Omnibus proposal reduces scope for non-EU parents
            </span>
          </div>
          <div className="flex items-start gap-2 text-[10px]">
            <span
              className="text-white/40 w-16 flex-shrink-0"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            >
              Nov 2024
            </span>
            <span className="text-white/75 leading-snug">
              Wave 2 timeline extended by 1 year
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * CareersMockup
 *
 * Rich match card showing:
 *   1. STRONG MATCH badge (quality signal - only strong matches get
 *      notified so visitors understand "no spam, just fit")
 *   2. Job title + company + location
 *   3. Match score with progress bar (the star of the card)
 *   4. "Skills you have" list with checkmarks (proves the tool knows
 *      what the user has learned)
 *   5. Learning attribution line ("+13% since PCAF v3 course") which
 *      is THE connection to Learn - courses directly improved matches
 *   6. Gap analysis section showing a specific course that would
 *      close the remaining gap to a perfect match
 */
function CareersMockup() {
  return (
    <div className="bg-black/30 border border-white/10 rounded-xl p-5 space-y-4">
      {/* Quality signal at top */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gt-leaf opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-gt-leaf" />
        </span>
        <span
          className="text-[9px] font-bold text-gt-leaf uppercase"
          style={{ letterSpacing: '0.22em' }}
        >
          Strong match
        </span>
        <span className="text-white/25">·</span>
        <span
          className="text-[9px] text-white/55 font-semibold uppercase"
          style={{ letterSpacing: '0.15em' }}
        >
          Live
        </span>
      </div>

      {/* Job title + company */}
      <div>
        <p className="text-[15px] font-bold text-white leading-tight">
          Senior ESG Analyst
        </p>
        <p className="text-[11px] text-white/55 mt-1 leading-snug">
          Deloitte · London · Remote friendly
        </p>
      </div>

      {/* Match score + progress bar */}
      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-[10px] text-white/55 uppercase font-semibold" style={{ letterSpacing: '0.15em' }}>
            Your match
          </span>
          <span
            className="text-[26px] font-bold text-gt-leaf leading-none"
            style={{
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              letterSpacing: '-0.02em',
            }}
          >
            87%
          </span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-gt-forest to-gt-leaf rounded-full"
            style={{ width: '87%' }}
          />
        </div>
      </div>

      {/* Skills you have - proves the tool knows your learning */}
      <div>
        <div
          className="text-[9px] font-bold text-white/45 uppercase mb-2"
          style={{ letterSpacing: '0.22em' }}
        >
          Skills you have
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[11px] text-white/85">
            <CheckCircle2 className="w-3 h-3 text-gt-leaf flex-shrink-0" />
            <span>PCAF methodology</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-white/85">
            <CheckCircle2 className="w-3 h-3 text-gt-leaf flex-shrink-0" />
            <span>GHG Protocol Scope 3</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-white/85">
            <CheckCircle2 className="w-3 h-3 text-gt-leaf flex-shrink-0" />
            <span>Financial modeling</span>
          </div>
        </div>
      </div>

      {/* Learning attribution - the killer Learn -> Career link */}
      <div className="flex items-center gap-2 text-[11px] text-white/80 bg-gt-leaf/8 border border-gt-leaf/25 rounded-lg px-3 py-2">
        <TrendingUp className="w-3 h-3 text-gt-leaf flex-shrink-0" />
        <span>
          +13% since you completed{' '}
          <span className="text-gt-leaf font-semibold">PCAF v3</span>
        </span>
      </div>

      {/* Gap analysis with course suggestion */}
      <div className="pt-3 border-t border-white/10">
        <div
          className="text-[9px] font-bold text-white/45 uppercase mb-2"
          style={{ letterSpacing: '0.22em' }}
        >
          Gap to perfect match
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-white/85">
            <div className="w-3 h-3 rounded-full border-2 border-white/40 flex-shrink-0" />
            <span>SBTi Target Setting</span>
          </div>
          <span
            className="text-[10px] text-gt-leaf font-semibold"
            style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
          >
            1 course
          </span>
        </div>
      </div>
    </div>
  );
}

// ==========================================================================
// PRODUCT DATA
// ==========================================================================

const SHOWCASE_PRODUCTS: ShowcaseProduct[] = [
  {
    id: 'learn',
    label: 'Learn',
    Icon: BookOpen,
    navTagline: 'Master any topic from scratch',
    headline: 'Learn how to do the work, not just read about it.',
    italicTagline:
      'For when the theory is clear but the actual steps are fuzzy.',
    stats: [
      { value: '23', label: 'Courses' },
      { value: '552', label: 'Lessons & audios' },
      { value: '10 min', label: 'Per lesson' },
    ],
    cta: { label: 'Start learning', href: '/courses' },
    mockup: <LearnMockup />,
  },
  {
    id: 'ask',
    label: 'Ask',
    Icon: Sparkles,
    navTagline: 'Check any fact. See exactly where it comes from.',
    headline: "What\u2019s written. Where exactly.",
    italicTagline:
      "For when you're in a meeting and need to check one thing, right now. The exact line. The exact source.",
    stats: [
      { value: '530+', label: 'Source documents' },
      { value: 'Page', label: 'Every citation' },
      { value: '< 2s', label: 'Answer speed' },
    ],
    cta: { label: 'Try SustainIQ', href: '/ask' },
    mockup: <AskMockup />,
  },
  {
    id: 'tools',
    label: 'Tools',
    Icon: Calculator,
    navTagline: 'Less Excel. More done.',
    headline: 'Built by people who actually understand the work.',
    italicTagline:
      "For everything you shouldn't be doing in Excel anymore.",
    stats: [
      { value: '166', label: 'Emission factors live' },
      { value: '100%', label: 'Sourced & auditable' },
      { value: 'Free', label: 'No sign-up to search' },
    ],
    cta: { label: 'Open tools', href: '/tools' },
    mockup: <ToolsMockup />,
  },
  {
    id: 'regulations',
    label: 'Regulations',
    Icon: Bell,
    navTagline: 'Know what applies to you, when, where.',
    headline: 'What applies. When. To whom.',
    italicTagline:
      'For when a new regulation just dropped and you need to know what it means for your business.',
    comingSoon: true,
    stats: [
      { value: '120+', label: 'Regulations' },
      { value: '40+', label: 'Geographies' },
      { value: 'Live', label: 'Draft \u2192 Final tracking' },
    ],
    cta: { label: 'Get notified', href: '/guides' },
    mockup: <RegulationsMockup />,
  },
];

/**
 * Build the full product list with live counts injected into the
 * Careers card. Called once per render by the parent component so the
 * stats stay accurate as the jobs.xlsx file updates.
 */
function buildShowcaseProducts(
  jobsCount: string,
  geographiesCount: string,
  companiesCount: string
): ShowcaseProduct[] {
  return [
    ...SHOWCASE_PRODUCTS,
    {
      id: 'careers',
      label: 'Careers',
      Icon: Briefcase,
      navTagline: 'Find matches. Close gaps. Land the role.',
      headline: 'Find the match. Close the gap. Land the role.',
      italicTagline:
        "For when a role is almost a fit, and you want to know exactly what's missing.",
      stats: [
        { value: jobsCount, label: 'Live jobs' },
        { value: geographiesCount, label: 'Geographies' },
        { value: companiesCount, label: 'Companies hiring' },
      ],
      cta: { label: 'Get matched', href: '/jobs' },
      mockup: <CareersMockup />,
    },
  ];
}

// ==========================================================================
// MAIN COMPONENT
// ==========================================================================

export interface ActiveShowcaseProps {
  className?: string;
  /** Live jobs count pulled from /lib/jobs (e.g. "416") */
  jobsCount?: string;
  /** Live geographies count pulled from /lib/jobs (e.g. "14") */
  geographiesCount?: string;
  /** Live companies-hiring count pulled from /lib/jobs */
  companiesCount?: string;
}

export function ActiveShowcase({
  className,
  jobsCount = '—',
  geographiesCount = '—',
  companiesCount = '—',
}: ActiveShowcaseProps) {
  const products = buildShowcaseProducts(
    jobsCount,
    geographiesCount,
    companiesCount
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const stickyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-advance interval. Runs unless paused (mouse over) or sticky
  // (user clicked an item within the last STICKY_DURATION ms).
  useEffect(() => {
    if (isPaused || isSticky) return;
    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % products.length);
    }, AUTO_ADVANCE_INTERVAL);
    return () => clearInterval(id);
  }, [isPaused, isSticky, products.length]);

  // Clean up sticky timeout on unmount
  useEffect(() => {
    return () => {
      if (stickyTimeoutRef.current) clearTimeout(stickyTimeoutRef.current);
    };
  }, []);

  const handleNavClick = (index: number) => {
    // Clicking the already-active item resumes auto-advance immediately
    if (index === activeIndex && isSticky) {
      setIsSticky(false);
      if (stickyTimeoutRef.current) clearTimeout(stickyTimeoutRef.current);
      return;
    }

    setActiveIndex(index);
    setIsSticky(true);

    if (stickyTimeoutRef.current) clearTimeout(stickyTimeoutRef.current);
    stickyTimeoutRef.current = setTimeout(() => {
      setIsSticky(false);
    }, STICKY_DURATION);
  };

  const active = products[activeIndex];
  const progressActive = !isPaused && !isSticky;

  return (
    <div
      className={cn(
        'grid grid-cols-1 lg:grid-cols-[minmax(280px,38%)_1fr] gap-6 lg:gap-10 items-stretch',
        className
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ==========================================================
          LEFT NAV
          Uses flex-1 on each item so the 5 items stretch to match
          the canvas height on the right. Larger text (base instead
          of sm) and taller padding for better visual weight.
          ========================================================== */}
      <nav className="flex flex-col">
        {products.map((product, index) => {
          const isActive = index === activeIndex;
          const Icon = product.Icon;
          return (
            <button
              key={product.id}
              onClick={() => handleNavClick(index)}
              className={cn(
                'relative text-left px-7 py-7 border-l-2 transition-all duration-300 group flex-1 flex flex-col justify-center',
                isActive
                  ? 'border-gt-leaf bg-gt-leaf/5'
                  : 'border-gt-border-light hover:border-gt-forest/50 hover:bg-gt-leaf/[0.02]'
              )}
            >
              <div className="flex items-center gap-3 mb-1.5">
                <Icon
                  className={cn(
                    'w-5 h-5 transition-colors duration-300',
                    isActive ? 'text-gt-medium' : 'text-gt-text-dim group-hover:text-gt-forest'
                  )}
                />
                <span
                  className={cn(
                    'text-[13px] font-bold uppercase transition-colors duration-300',
                    isActive ? 'text-gt-medium' : 'text-gt-text-dim group-hover:text-gt-forest'
                  )}
                  style={{ letterSpacing: '0.18em' }}
                >
                  {product.label}
                </span>
                {product.comingSoon && (
                  <StatBadge variant="coming-soon" className="ml-1 !text-[9px] !px-1.5 !py-0.5">
                    Soon
                  </StatBadge>
                )}
              </div>
              <p
                className={cn(
                  'text-base leading-snug transition-colors duration-300',
                  isActive ? 'text-gt-text font-medium' : 'text-gt-text-muted'
                )}
              >
                {product.navTagline}
              </p>

              {/* Progress bar at the bottom of active item.
                  Keyed on activeIndex so it restarts on each change. */}
              {isActive && progressActive && (
                <div
                  key={`progress-${activeIndex}`}
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-gt-leaf gt-showcase-progress"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* ==========================================================
          RIGHT CANVAS (the dark showcase window)
          Internal layout is a 2-column grid:
            - Top-left area: label + headline + tagline + stats
            - Right area: the product mockup (no nested card bg so
              it reads as an integrated visual, not a box-in-box)
            - Bottom-left: CTA button (kept inside the canvas bounds)
          Keyed on activeIndex so children re-mount and replay
          the enter animation each transition.
          ========================================================== */}
      <div className="relative">
        <div
          key={activeIndex}
          className="relative bg-gt-deep border border-white/10 rounded-2xl shadow-gt-card-lg overflow-hidden h-full min-h-[560px]"
        >
          {/* Ambient glow in top-right corner */}
          <div
            className="absolute top-0 right-0 w-96 h-96 pointer-events-none opacity-50"
            style={{
              background:
                'radial-gradient(circle at top right, rgba(82, 183, 136, 0.12), transparent 65%)',
            }}
            aria-hidden
          />

          {/* Two-column internal layout */}
          <div className="relative h-full grid grid-cols-1 lg:grid-cols-[1fr_minmax(280px,42%)] gap-8 p-8 md:p-10">

            {/*
              LEFT COLUMN: label + headline + tagline + stats + CTA.
              Uses justify-center so the whole block is vertically
              centered in the canvas. Consistent margin rhythm between
              elements (no mb-auto pushing the CTA to the edge).
            */}
            <div className="flex flex-col justify-center min-w-0">
              {/* Element 1: Label + coming soon */}
              <div className="gt-showcase-enter gt-showcase-el-1 flex items-center gap-3 mb-4">
                <span
                  className="text-[11px] font-bold uppercase text-gt-leaf"
                  style={{ letterSpacing: '0.25em' }}
                >
                  {active.label}
                </span>
                {active.comingSoon && (
                  <StatBadge variant="coming-soon">Coming Soon</StatBadge>
                )}
              </div>

              {/* Element 2: Big headline */}
              <h3
                className="gt-showcase-enter gt-showcase-el-2 text-3xl md:text-[36px] font-extrabold text-white leading-[1.08] mb-3"
                style={{ letterSpacing: '-0.02em' }}
              >
                {active.headline}
              </h3>

              {/* Italic tagline sits under the headline */}
              <p className="gt-showcase-enter gt-showcase-el-2 italic text-white/60 text-[15px] leading-snug mb-8">
                {active.italicTagline}
              </p>

              {/* Element 3: Stats strip */}
              <div className="gt-showcase-enter gt-showcase-el-3 grid grid-cols-3 gap-6 mb-8">
                {active.stats.map((stat) => (
                  <div key={stat.label}>
                    <div
                      className="text-2xl md:text-[30px] font-bold text-gt-leaf leading-none mb-1.5"
                      style={{
                        fontFamily:
                          'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {stat.value}
                    </div>
                    <div
                      className="text-[10px] font-bold uppercase text-white/50 leading-tight"
                      style={{ letterSpacing: '0.18em' }}
                    >
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Element 5: CTA - flows directly after stats with a
                  consistent 32px gap (mb-8 above). No dead space. */}
              <div className="gt-showcase-enter gt-showcase-el-5">
                <Link
                  href={active.cta.href}
                  className="inline-flex items-center gap-2 bg-gt-leaf text-gt-text-dark px-5 py-3 rounded-lg text-sm font-bold hover:bg-white transition-colors"
                >
                  {active.cta.label}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* RIGHT COLUMN: product mockup.
                No wrapping card bg - the mockup sits directly on the
                canvas dark surface for an integrated feel. */}
            <div className="gt-showcase-enter gt-showcase-el-4 flex items-center justify-center min-w-0">
              <div className="w-full">{active.mockup}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
