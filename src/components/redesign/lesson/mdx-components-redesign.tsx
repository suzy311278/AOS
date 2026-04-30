/**
 * mdx-components-redesign
 *
 * The MDX component map for redesigned lesson pages. Replaces every
 * production content component with its redesigned counterpart.
 *
 * Components covered:
 *   - HighlightBox, AnalogyBox, ExampleBox, KeyTakeaways (Phase A)
 *   - AudioPlayer (Phase A)
 *   - DeepDive, ResponsiveTable, FormulaBox, EquationBreakdown (Phase B)
 *   - CalculationExercise, Chart, RoughChart, Flowchart (Phase C)
 *
 * Components deliberately not in the map (skipped per spec):
 *   - GlossaryTerm  - never used in any lesson, defer
 *   - CaseStudy     - never used in any lesson, defer
 *   - GoDeeper      - only used in guides, not lessons
 *
 * The HTML element overrides (h2, h3, p, table, etc.) follow the
 * Greentryst typography scale: Inter for body, JetBrains Mono for
 * inline code, generous line-height, brand-green strong text.
 */

import type { MDXComponents } from 'mdx/types';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import {
  HighlightBoxRedesign,
  AnalogyBoxRedesign,
  ExampleBoxRedesign,
  KeyTakeawaysRedesign,
} from './CalloutBoxes';
import { AudioPlayerRedesign } from './AudioPlayerRedesign';
import {
  DeepDiveRedesign,
  ResponsiveTableRedesign,
  FormulaBoxRedesign,
  EquationBreakdownRedesign,
} from './StructuralBlocks';
import {
  CalculationExerciseRedesign,
  ChartRedesign,
  RoughChartRedesign,
  FlowchartRedesign,
} from './InteractiveBlocks';
import { LiveProjectsCard } from './LiveProjectsCard';

function extractText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (typeof node === 'object' && 'props' in node)
    return extractText(node.props.children);
  return '';
}

export function getRedesignMDXComponents(
  components?: MDXComponents
): MDXComponents {
  return {
    // Custom content components - all redesigned
    HighlightBox: HighlightBoxRedesign,
    AnalogyBox: AnalogyBoxRedesign,
    ExampleBox: ExampleBoxRedesign,
    KeyTakeaways: KeyTakeawaysRedesign,
    AudioPlayer: AudioPlayerRedesign,
    DeepDive: DeepDiveRedesign,
    ResponsiveTable: ResponsiveTableRedesign,
    FormulaBox: FormulaBoxRedesign,
    EquationBreakdown: EquationBreakdownRedesign,
    CalculationExercise: CalculationExerciseRedesign,
    Chart: ChartRedesign,
    RoughChart: RoughChartRedesign,
    LiveProjectsCard,

    // Intercept fenced ```mermaid blocks and render the redesigned
    // Flowchart instead of a code block.
    pre: ({
      children,
      ...props
    }: ComponentPropsWithoutRef<'pre'> & { children?: ReactNode }) => {
      if (
        children &&
        typeof children === 'object' &&
        'props' in children &&
        typeof children.props.className === 'string' &&
        children.props.className.includes('language-mermaid')
      ) {
        const chart = extractText(children.props.children);
        return <FlowchartRedesign chart={chart} />;
      }
      return <pre {...props}>{children}</pre>;
    },

    // Tables - bare table override. Most lessons wrap their tables
    // in <ResponsiveTable> (which has its own descendant-selector
    // styling for raw HTML tables), but this override catches the
    // bare case (e.g. markdown tables converted by remarkGfm). The
    // wrapper applies the same descendant-selector recipe so the
    // styling is identical regardless of which path the table
    // takes through MDX.
    table: (props: ComponentPropsWithoutRef<'table'>) => (
      <div
        className={
          'my-7 overflow-x-auto rounded-2xl bg-white shadow-gt-card border border-gt-border-light ' +
          // Header row
          '[&_thead]:bg-gt-medium/[0.06] ' +
          '[&_th]:px-5 [&_th]:py-3.5 [&_th]:text-[11px] [&_th]:font-bold [&_th]:uppercase [&_th]:text-gt-deepest [&_th]:border-b [&_th]:border-gt-medium/15 [&_th]:align-middle [&_th]:whitespace-nowrap [&_th]:tracking-[0.1em] ' +
          '[&_th]:first:pl-7 [&_th]:last:pr-7 ' +
          // Body rows + hover
          '[&_tbody_tr]:transition-colors [&_tbody_tr]:hover:bg-gt-medium/[0.03] ' +
          '[&_tr:has(td)]:transition-colors [&_tr:has(td)]:hover:bg-gt-medium/[0.03] ' +
          '[&_tr:has(th)]:bg-gt-medium/[0.06] ' +
          // Body cells
          '[&_td]:px-5 [&_td]:py-3.5 [&_td]:text-[14px] [&_td]:text-gt-text [&_td]:leading-relaxed [&_td]:border-b [&_td]:border-gt-border-light/70 [&_td]:align-top ' +
          '[&_td]:first:pl-7 [&_td]:last:pr-7 ' +
          '[&_tr:last-child_td]:border-b-0 ' +
          '[&_td_strong]:text-gt-deepest [&_td_strong]:font-bold'
        }
      >
        <table
          className="w-full border-collapse text-left"
          {...props}
        />
      </div>
    ),

    // Heading scale - Inter, generous spacing, brand-green underline
    h2: (props: ComponentPropsWithoutRef<'h2'>) => (
      <h2
        className="text-2xl sm:text-[28px] font-extrabold text-gt-text mt-14 mb-5 tracking-tight pb-3 border-b border-gt-border-light"
        style={{ letterSpacing: '-0.015em' }}
        {...props}
      />
    ),
    h3: (props: ComponentPropsWithoutRef<'h3'>) => (
      <h3
        className="text-xl sm:text-[22px] font-bold text-gt-text mt-10 mb-4 tracking-tight"
        style={{ letterSpacing: '-0.01em' }}
        {...props}
      />
    ),
    h4: (props: ComponentPropsWithoutRef<'h4'>) => (
      <h4
        className="text-[17px] font-bold text-gt-text mt-7 mb-3 tracking-tight"
        {...props}
      />
    ),

    // Body prose
    p: (props: ComponentPropsWithoutRef<'p'>) => (
      <p
        className="mb-5 text-gt-text leading-[1.75] text-[16px]"
        {...props}
      />
    ),
    ul: (props: ComponentPropsWithoutRef<'ul'>) => (
      <ul
        className="mb-6 pl-6 space-y-2 list-disc text-gt-text text-[16px] marker:text-gt-medium leading-relaxed"
        {...props}
      />
    ),
    ol: (props: ComponentPropsWithoutRef<'ol'>) => (
      <ol
        className="mb-6 pl-6 space-y-2 list-decimal text-gt-text text-[16px] marker:text-gt-medium leading-relaxed"
        {...props}
      />
    ),
    li: (props: ComponentPropsWithoutRef<'li'>) => (
      <li className="pl-1" {...props} />
    ),
    code: (props: ComponentPropsWithoutRef<'code'>) => (
      <code
        className="bg-gt-medium/[0.07] px-1.5 py-0.5 rounded text-[14px] text-gt-deepest border border-gt-medium/15"
        style={{
          fontFamily:
            'var(--font-jetbrains-mono), JetBrains Mono, monospace',
        }}
        {...props}
      />
    ),
    strong: (props: ComponentPropsWithoutRef<'strong'>) => (
      <strong className="font-bold text-gt-deepest" {...props} />
    ),
    blockquote: (props: ComponentPropsWithoutRef<'blockquote'>) => (
      <blockquote
        className="border-l-[3px] border-gt-medium pl-5 py-1 italic text-gt-text-muted my-7"
        {...props}
      />
    ),
    a: (props: ComponentPropsWithoutRef<'a'>) => (
      <a
        className="text-gt-medium font-semibold underline underline-offset-2 hover:text-gt-deepest transition-colors"
        {...props}
      />
    ),

    ...components,
  };
}
