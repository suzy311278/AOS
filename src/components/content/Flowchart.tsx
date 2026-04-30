'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  chart: string;
}

export default function Flowchart({ chart }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const renderIdRef = useRef(`fc-${Math.random().toString(36).slice(2, 9)}`);

  useEffect(() => {
    if (!chart) return;
    let cancelled = false;
    async function render() {
      const mermaid = (await import('mermaid')).default;
      mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        themeVariables: {
          primaryColor: '#eff6ff',
          primaryBorderColor: '#93c5fd',
          primaryTextColor: '#1e3a5f',
          lineColor: '#94a3b8',
          secondaryColor: '#f0fdf4',
          tertiaryColor: '#fefce8',
          fontFamily: '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
          fontSize: '13px',
          edgeLabelBackground: '#ffffff',
          clusterBkg: '#f8fafc',
          clusterBorder: '#e2e8f0',
        },
        flowchart: {
          htmlLabels: true,
          curve: 'basis',
          padding: 20,
          nodeSpacing: 40,
          rankSpacing: 50,
          useMaxWidth: true,
        },
      });
      try {
        const { svg: rendered } = await mermaid.render(renderIdRef.current, chart.trim());
        if (!cancelled) setSvg(injectStyles(rendered));
      } catch (e) {
        console.error('Mermaid render error:', e);
      }
    }
    render();
    return () => { cancelled = true; };
  }, [chart]);

  return (
    <div className="my-8 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6 md:p-8 shadow-sm">
      <div
        ref={containerRef}
        className="flex justify-center overflow-x-auto [&_svg]:max-w-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}

/** Inject a <style> block into the SVG for edge labels, nodes, and arrows */
function injectStyles(svg: string): string {
  const styles = `<style>
    .edgeLabel rect {
      fill: #f8fafc !important;
      stroke: #cbd5e1 !important;
      stroke-width: 1.5px !important;
      rx: 8 !important;
      ry: 8 !important;
    }
    .edgeLabel span,
    .edgeLabel p,
    .edgeLabel div,
    .edgeLabel text {
      color: #0f172a !important;
      fill: #0f172a !important;
      font-weight: 700 !important;
      font-size: 12px !important;
    }
    .node rect,
    .node .label-container {
      rx: 14px;
      ry: 14px;
      filter: drop-shadow(0 1px 3px rgba(0,0,0,0.07));
    }
    .node polygon {
      filter: drop-shadow(0 1px 3px rgba(0,0,0,0.07));
    }
    .node .label div {
      line-height: 1.45;
    }
    .edgePath .path {
      stroke-width: 2px !important;
    }
    marker path {
      fill: #94a3b8 !important;
    }
  </style>`;

  // Insert styles right after the opening <svg> tag
  return svg.replace(/<svg([^>]*)>/, `<svg$1>${styles}`);
}
