'use client';

import { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';

interface RoughChartProps {
  type: 'pie' | 'bar' | 'horizontal-bar' | 'line';
  title?: string;
  data: string;
  xKey: string;
  yKey: string;
  /** For line charts with multiple series, comma-separated keys e.g. "ssp1,ssp2,ssp3" */
  seriesKeys?: string;
  /** Comma-separated labels for each series */
  seriesLabels?: string;
  unit?: string;
  height?: string;
  /** JSON string of annotations: [{"target":"barName","text":"annotation text"}] */
  annotations?: string;
}

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444',
  '#06b6d4', '#ec4899', '#f97316', '#14b8a6', '#6366f1',
];

export default function RoughChart({ type, title, data, xKey, yKey, seriesKeys, seriesLabels, unit, height, annotations }: RoughChartProps) {
  const canvasRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; value: number } | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const hitAreasRef = useRef<Array<{ path: Path2D | null; x: number; y: number; w: number; h: number; label: string; value: number; startAngle?: number; endAngle?: number; cx?: number; cy?: number; radius?: number }>>([]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    setContainerWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!canvasRef.current || containerWidth < 100) return;

    let parsedData: Record<string, unknown>[];
    try {
      parsedData = JSON.parse(data);
    } catch {
      return;
    }

    const svg = canvasRef.current;
    const chartHeight = parseInt(height || '380', 10);
    const w = containerWidth;
    const h = chartHeight;

    // Clear
    svg.innerHTML = '';
    svg.setAttribute('width', String(w));
    svg.setAttribute('height', String(h));
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

    const rc = rough.svg(svg);
    const labels = parsedData.map(d => String(d[xKey]));
    const values = parsedData.map(d => Number(d[yKey]));
    const hitAreas: typeof hitAreasRef.current = [];

    if (type === 'pie') {
      renderPie(svg, rc, labels, values, w, h, hitAreas);
    } else if (type === 'horizontal-bar') {
      renderHorizontalBar(svg, rc, labels, values, w, h, hitAreas);
    } else if (type === 'line') {
      renderLine(svg, rc, parsedData, w, h, hitAreas);
    } else {
      renderBar(svg, rc, labels, values, w, h, hitAreas);
    }

    // Draw annotations
    if (annotations) {
      try {
        const annots: Array<{ target?: string; targets?: string; from?: string; to?: string; text: string }> = JSON.parse(annotations);
        for (const annot of annots) {

          if (annot.from && annot.to) {
            // Connector annotation: diagonal arrow between two bars with a label above
            const fromArea = hitAreas.find(a => a.label === annot.from);
            const toArea = hitAreas.find(a => a.label === annot.to);
            if (!fromArea || !toArea) continue;

            // Arrow goes from above the "from" bar value text to above the "to" bar value text
            const fromX = fromArea.x + fromArea.w / 2;
            const fromY = fromArea.y - 28;
            const toX = toArea.x + toArea.w / 2;
            const toY = toArea.y - 28;

            // Diagonal line
            const diagLine = rc.line(fromX, fromY, toX, toY, {
              stroke: '#ef4444', strokeWidth: 2, roughness: 1.5,
            });
            svg.appendChild(diagLine);

            // Arrowhead at the "to" end
            const headSize = 8;
            const dx = toX - fromX;
            const dy = toY - fromY;
            const len = Math.sqrt(dx * dx + dy * dy);
            const ux = dx / len;
            const uy = dy / len;
            const px = -uy;
            const py = ux;
            const head1 = rc.line(toX, toY, toX - ux * headSize * 1.5 + px * headSize, toY - uy * headSize * 1.5 + py * headSize, {
              stroke: '#ef4444', strokeWidth: 2, roughness: 1,
            });
            const head2 = rc.line(toX, toY, toX - ux * headSize * 1.5 - px * headSize, toY - uy * headSize * 1.5 - py * headSize, {
              stroke: '#ef4444', strokeWidth: 2, roughness: 1,
            });
            svg.appendChild(head1);
            svg.appendChild(head2);

            // Label above the midpoint of the arrow, offset upward to avoid overlap
            const midX = (fromX + toX) / 2;
            const midY = (fromY + toY) / 2;
            const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textEl.setAttribute('x', String(midX));
            textEl.setAttribute('y', String(midY - 25));
            textEl.setAttribute('text-anchor', 'middle');
            textEl.setAttribute('font-size', '12');
            textEl.setAttribute('font-weight', 'bold');
            textEl.setAttribute('font-family', "'Comic Neue', 'Comic Sans MS', cursive, sans-serif");
            textEl.setAttribute('fill', '#ef4444');
            textEl.textContent = annot.text;
            svg.appendChild(textEl);

          } else if (type === 'pie' && annot.targets) {
            // Pie annotation: curly brace along outer arc of grouped slices
            const targetNames = annot.targets.split(',').map(t => t.trim());
            const matchedAreas = hitAreas.filter(a => targetNames.includes(a.label) && a.startAngle !== undefined);
            if (matchedAreas.length === 0) continue;

            // Get the full arc span of the grouped slices
            const arcStart = Math.min(...matchedAreas.map(a => a.startAngle!));
            const arcEnd = Math.max(...matchedAreas.map(a => a.endAngle!));
            const pieCx = matchedAreas[0].cx!;
            const pieCy = matchedAreas[0].cy!;
            const pieR = matchedAreas[0].radius!;

            // Draw the brace outside the pie
            const braceR = pieR + 14;
            const braceOuterR = pieR + 28;
            const midAngle = (arcStart + arcEnd) / 2;

            // Draw arc segments: start to mid, mid to end (two arcs forming the brace)
            const numPoints = 20;
            const halfPoints = numPoints / 2;

            // First half: arc from start to mid, curving outward at the midpoint
            for (let i = 0; i < numPoints; i++) {
              const t1 = i / numPoints;
              const t2 = (i + 1) / numPoints;
              const a1 = arcStart + (arcEnd - arcStart) * t1;
              const a2 = arcStart + (arcEnd - arcStart) * t2;

              // Radius varies: starts at braceR, bulges to braceOuterR at midpoint, back to braceR
              const midness1 = 1 - Math.abs(t1 - 0.5) * 2; // 0 at ends, 1 at middle
              const midness2 = 1 - Math.abs(t2 - 0.5) * 2;
              const r1 = braceR + (braceOuterR - braceR) * midness1 * 0.3;
              const r2 = braceR + (braceOuterR - braceR) * midness2 * 0.3;

              const x1 = pieCx + r1 * Math.cos(a1);
              const y1 = pieCy + r1 * Math.sin(a1);
              const x2 = pieCx + r2 * Math.cos(a2);
              const y2 = pieCy + r2 * Math.sin(a2);

              const seg = rc.line(x1, y1, x2, y2, {
                stroke: '#ef4444', strokeWidth: 2, roughness: 1,
              });
              svg.appendChild(seg);
            }

            // Draw the tip of the brace (small point at the midpoint)
            const tipR = braceOuterR + 5;
            const tipX = pieCx + tipR * Math.cos(midAngle);
            const tipY = pieCy + tipR * Math.sin(midAngle);
            const braceMiddleX = pieCx + (braceR + (braceOuterR - braceR) * 0.3) * Math.cos(midAngle);
            const braceMiddleY = pieCy + (braceR + (braceOuterR - braceR) * 0.3) * Math.sin(midAngle);

            const tipLine = rc.line(braceMiddleX, braceMiddleY, tipX, tipY, {
              stroke: '#ef4444', strokeWidth: 2, roughness: 1.2,
            });
            svg.appendChild(tipLine);

            // Connector line from tip to upper-right white space
            const labelX = w * 0.72;
            const labelY = h * 0.18;

            const connLine = rc.line(tipX, tipY, labelX, labelY, {
              stroke: '#ef4444', strokeWidth: 1.5, roughness: 1.5,
            });
            svg.appendChild(connLine);

            // Text label in upper-right
            const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textEl.setAttribute('x', String(labelX + 6));
            textEl.setAttribute('y', String(labelY + 4));
            textEl.setAttribute('text-anchor', 'start');
            textEl.setAttribute('font-size', '12');
            textEl.setAttribute('font-weight', 'bold');
            textEl.setAttribute('font-family', "'Comic Neue', 'Comic Sans MS', cursive, sans-serif");
            textEl.setAttribute('fill', '#ef4444');
            textEl.textContent = annot.text;
            svg.appendChild(textEl);

          } else if (annot.target) {
            // Bar annotation: arrow pointing at a specific bar
            const area = hitAreas.find(a => a.label === annot.target);
            if (!area) continue;

            const arrowStartX = area.x - 65;
            const arrowStartY = area.y - 15;
            const arrowEndX = area.x - 4;
            const arrowEndY = area.y + area.h * 0.3;

            const arrowLine = rc.line(arrowStartX, arrowStartY, arrowEndX, arrowEndY, {
              stroke: '#ef4444', strokeWidth: 2, roughness: 1.5,
            });
            svg.appendChild(arrowLine);

            const headSize = 6;
            const dx = arrowEndX - arrowStartX;
            const dy = arrowEndY - arrowStartY;
            const len = Math.sqrt(dx * dx + dy * dy);
            const uxh = dx / len;
            const uyh = dy / len;
            const px = -uyh;
            const py = uxh;
            const head1 = rc.line(arrowEndX, arrowEndY, arrowEndX - uxh * headSize * 1.5 + px * headSize, arrowEndY - uyh * headSize * 1.5 + py * headSize, {
              stroke: '#ef4444', strokeWidth: 2, roughness: 1,
            });
            const head2 = rc.line(arrowEndX, arrowEndY, arrowEndX - uxh * headSize * 1.5 - px * headSize, arrowEndY - uyh * headSize * 1.5 - py * headSize, {
              stroke: '#ef4444', strokeWidth: 2, roughness: 1,
            });
            svg.appendChild(head1);
            svg.appendChild(head2);

            const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textEl.setAttribute('x', String(arrowStartX - 5));
            textEl.setAttribute('y', String(arrowStartY - 4));
            textEl.setAttribute('text-anchor', 'end');
            textEl.setAttribute('font-size', '11');
            textEl.setAttribute('font-weight', 'bold');
            textEl.setAttribute('font-family', "'Comic Neue', 'Comic Sans MS', cursive, sans-serif");
            textEl.setAttribute('fill', '#ef4444');

            const words = annot.text.split(' ');
            const mid = Math.ceil(words.length / 2);
            const line1 = words.slice(0, mid).join(' ');
            const line2 = words.slice(mid).join(' ');

            const ts1 = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
            ts1.setAttribute('x', String(arrowStartX - 5));
            ts1.setAttribute('dy', '0');
            ts1.textContent = line1;
            const ts2 = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
            ts2.setAttribute('x', String(arrowStartX - 5));
            ts2.setAttribute('dy', '13');
            ts2.textContent = line2;
            textEl.appendChild(ts1);
            textEl.appendChild(ts2);

            svg.appendChild(textEl);
          }
        }
      } catch {
        // ignore malformed annotations
      }
    }

    hitAreasRef.current = hitAreas;
  }, [containerWidth, type, data, xKey, yKey, seriesKeys, seriesLabels, height, annotations]);

  function renderPie(
    svg: SVGSVGElement,
    rc: ReturnType<typeof rough.svg>,
    labels: string[],
    values: number[],
    w: number,
    h: number,
    hitAreas: typeof hitAreasRef.current
  ) {
    const total = values.reduce((a, b) => a + b, 0);
    const cx = w * 0.38;
    const cy = h * 0.5;
    const radius = Math.min(cx - 30, cy - 40);
    const innerRadius = radius * 0.35;

    let startAngle = -Math.PI / 2;

    values.forEach((val, i) => {
      const sliceAngle = (val / total) * 2 * Math.PI;
      const endAngle = startAngle + sliceAngle;

      // Build arc path for donut slice
      const x1o = cx + radius * Math.cos(startAngle);
      const y1o = cy + radius * Math.sin(startAngle);
      const x2o = cx + radius * Math.cos(endAngle);
      const y2o = cy + radius * Math.sin(endAngle);
      const x1i = cx + innerRadius * Math.cos(endAngle);
      const y1i = cy + innerRadius * Math.sin(endAngle);
      const x2i = cx + innerRadius * Math.cos(startAngle);
      const y2i = cy + innerRadius * Math.sin(startAngle);

      const largeArc = sliceAngle > Math.PI ? 1 : 0;

      const pathD = [
        `M ${x1o} ${y1o}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${x2o} ${y2o}`,
        `L ${x1i} ${y1i}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x2i} ${y2i}`,
        'Z',
      ].join(' ');

      const node = rc.path(pathD, {
        fill: COLORS[i % COLORS.length],
        fillStyle: 'hachure',
        fillWeight: 1.5,
        hachureGap: 4,
        stroke: '#374151',
        strokeWidth: 1.5,
        roughness: 1.2,
      });
      svg.appendChild(node);

      // Hit area for tooltip (with angle data for annotations)
      const midAngle = startAngle + sliceAngle / 2;
      hitAreas.push({
        path: null,
        x: cx + (radius * 0.7) * Math.cos(midAngle) - 20,
        y: cy + (radius * 0.7) * Math.sin(midAngle) - 20,
        w: 40,
        h: 40,
        label: labels[i],
        value: val,
        startAngle,
        endAngle,
        cx,
        cy,
        radius,
      });

      startAngle = endAngle;
    });

    // Legend on the right
    const legendX = w * 0.68;
    const legendStartY = h * 0.15;

    labels.forEach((label, i) => {
      const ly = legendStartY + i * 28;
      const swatch = rc.rectangle(legendX, ly, 16, 16, {
        fill: COLORS[i % COLORS.length],
        fillStyle: 'solid',
        stroke: '#374151',
        strokeWidth: 1,
        roughness: 1,
      });
      svg.appendChild(swatch);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', String(legendX + 24));
      text.setAttribute('y', String(ly + 13));
      text.setAttribute('font-size', '12');
      text.setAttribute('font-family', "'Comic Neue', 'Comic Sans MS', cursive, sans-serif");
      text.setAttribute('fill', '#374151');
      text.textContent = label;
      svg.appendChild(text);
    });

    // Title
    if (title) {
      const titleEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      titleEl.setAttribute('x', String(w / 2));
      titleEl.setAttribute('y', '24');
      titleEl.setAttribute('text-anchor', 'middle');
      titleEl.setAttribute('font-size', '14');
      titleEl.setAttribute('font-weight', 'bold');
      titleEl.setAttribute('font-family', "'Comic Neue', 'Comic Sans MS', cursive, sans-serif");
      titleEl.setAttribute('fill', '#1f2937');
      titleEl.textContent = title;
      svg.appendChild(titleEl);
    }
  }

  function renderBar(
    svg: SVGSVGElement,
    rc: ReturnType<typeof rough.svg>,
    labels: string[],
    values: number[],
    w: number,
    h: number,
    hitAreas: typeof hitAreasRef.current
  ) {
    const margin = { top: 45, right: 20, bottom: 60, left: 50 };
    const plotW = w - margin.left - margin.right;
    const plotH = h - margin.top - margin.bottom;
    const maxVal = Math.max(...values) * 1.15;
    const barWidth = Math.min(plotW / labels.length * 0.7, 50);
    const gap = plotW / labels.length;

    // Y axis
    const axisLine = rc.line(margin.left, margin.top, margin.left, margin.top + plotH, {
      stroke: '#9ca3af', roughness: 1.5, strokeWidth: 1.5,
    });
    svg.appendChild(axisLine);

    // X axis
    const xAxisLine = rc.line(margin.left, margin.top + plotH, margin.left + plotW, margin.top + plotH, {
      stroke: '#9ca3af', roughness: 1.5, strokeWidth: 1.5,
    });
    svg.appendChild(xAxisLine);

    // Y tick labels
    const tickCount = 5;
    for (let i = 0; i <= tickCount; i++) {
      const val = (maxVal / tickCount) * i;
      const y = margin.top + plotH - (val / maxVal) * plotH;
      const tickLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      tickLabel.setAttribute('x', String(margin.left - 8));
      tickLabel.setAttribute('y', String(y + 4));
      tickLabel.setAttribute('text-anchor', 'end');
      tickLabel.setAttribute('font-size', '11');
      tickLabel.setAttribute('font-family', "'Comic Neue', 'Comic Sans MS', cursive, sans-serif");
      tickLabel.setAttribute('fill', '#6b7280');
      tickLabel.textContent = val.toFixed(0);
      svg.appendChild(tickLabel);

      // Grid line
      const gridLine = rc.line(margin.left, y, margin.left + plotW, y, {
        stroke: '#e5e7eb', roughness: 0.5, strokeWidth: 0.5,
      });
      svg.appendChild(gridLine);
    }

    // Bars
    values.forEach((val, i) => {
      const barH = (val / maxVal) * plotH;
      const x = margin.left + gap * i + (gap - barWidth) / 2;
      const y = margin.top + plotH - barH;

      const bar = rc.rectangle(x, y, barWidth, barH, {
        fill: COLORS[i % COLORS.length],
        fillStyle: 'hachure',
        fillWeight: 1.5,
        hachureGap: 4,
        stroke: '#374151',
        strokeWidth: 1.5,
        roughness: 1.2,
      });
      svg.appendChild(bar);

      hitAreas.push({
        path: null,
        x, y, w: barWidth, h: barH,
        label: labels[i], value: val,
      });

      // Value on top
      const valLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      valLabel.setAttribute('x', String(x + barWidth / 2));
      valLabel.setAttribute('y', String(y - 6));
      valLabel.setAttribute('text-anchor', 'middle');
      valLabel.setAttribute('font-size', '11');
      valLabel.setAttribute('font-weight', 'bold');
      valLabel.setAttribute('font-family', "'Comic Neue', 'Comic Sans MS', cursive, sans-serif");
      valLabel.setAttribute('fill', '#374151');
      valLabel.textContent = `${val}${unit ? ` ${unit}` : ''}`;
      svg.appendChild(valLabel);

      // X label
      const xLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      xLabel.setAttribute('x', String(x + barWidth / 2));
      xLabel.setAttribute('y', String(margin.top + plotH + 16));
      xLabel.setAttribute('text-anchor', 'middle');
      xLabel.setAttribute('font-size', '10');
      xLabel.setAttribute('font-family', "'Comic Neue', 'Comic Sans MS', cursive, sans-serif");
      xLabel.setAttribute('fill', '#6b7280');

      // Wrap long labels
      const words = labels[i].split(' ');
      if (words.length > 2) {
        const line1 = words.slice(0, Math.ceil(words.length / 2)).join(' ');
        const line2 = words.slice(Math.ceil(words.length / 2)).join(' ');
        const ts1 = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        ts1.setAttribute('x', String(x + barWidth / 2));
        ts1.setAttribute('dy', '0');
        ts1.textContent = line1;
        const ts2 = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        ts2.setAttribute('x', String(x + barWidth / 2));
        ts2.setAttribute('dy', '13');
        ts2.textContent = line2;
        xLabel.appendChild(ts1);
        xLabel.appendChild(ts2);
      } else {
        xLabel.textContent = labels[i];
      }
      svg.appendChild(xLabel);
    });

    // Title
    if (title) {
      const titleEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      titleEl.setAttribute('x', String(w / 2));
      titleEl.setAttribute('y', '24');
      titleEl.setAttribute('text-anchor', 'middle');
      titleEl.setAttribute('font-size', '14');
      titleEl.setAttribute('font-weight', 'bold');
      titleEl.setAttribute('font-family', "'Comic Neue', 'Comic Sans MS', cursive, sans-serif");
      titleEl.setAttribute('fill', '#1f2937');
      titleEl.textContent = title;
      svg.appendChild(titleEl);
    }
  }

  function renderLine(
    svg: SVGSVGElement,
    rc: ReturnType<typeof rough.svg>,
    parsedData: Record<string, unknown>[],
    w: number,
    h: number,
    hitAreas: typeof hitAreasRef.current
  ) {
    const keys = seriesKeys ? seriesKeys.split(',').map(k => k.trim()) : [yKey];
    const labels = seriesLabels ? seriesLabels.split(',').map(l => l.trim()) : keys;
    const xLabels = parsedData.map(d => String(d[xKey]));

    const margin = { top: 45, right: 130, bottom: 50, left: 55 };
    const plotW = w - margin.left - margin.right;
    const plotH = h - margin.top - margin.bottom;

    // Find global min/max across all series
    let allVals: number[] = [];
    for (const key of keys) {
      for (const d of parsedData) {
        const v = Number(d[key]);
        if (!isNaN(v)) allVals.push(v);
      }
    }
    const minVal = Math.min(0, Math.min(...allVals));
    const maxVal = Math.max(...allVals) * 1.1;
    const range = maxVal - minVal;

    // Axes
    const yAxis = rc.line(margin.left, margin.top, margin.left, margin.top + plotH, {
      stroke: '#9ca3af', roughness: 1.5, strokeWidth: 1.5,
    });
    svg.appendChild(yAxis);

    const xAxis = rc.line(margin.left, margin.top + plotH, margin.left + plotW, margin.top + plotH, {
      stroke: '#9ca3af', roughness: 1.5, strokeWidth: 1.5,
    });
    svg.appendChild(xAxis);

    // Y ticks
    const tickCount = 5;
    for (let i = 0; i <= tickCount; i++) {
      const val = minVal + (range / tickCount) * i;
      const y = margin.top + plotH - ((val - minVal) / range) * plotH;

      const tickLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      tickLabel.setAttribute('x', String(margin.left - 8));
      tickLabel.setAttribute('y', String(y + 4));
      tickLabel.setAttribute('text-anchor', 'end');
      tickLabel.setAttribute('font-size', '11');
      tickLabel.setAttribute('font-family', "'Comic Neue', 'Comic Sans MS', cursive, sans-serif");
      tickLabel.setAttribute('fill', '#6b7280');
      tickLabel.textContent = val.toFixed(1);
      svg.appendChild(tickLabel);

      if (i > 0) {
        const gridLine = rc.line(margin.left, y, margin.left + plotW, y, {
          stroke: '#e5e7eb', roughness: 0.5, strokeWidth: 0.5,
        });
        svg.appendChild(gridLine);
      }
    }

    // X ticks
    const xStep = plotW / (xLabels.length - 1 || 1);
    xLabels.forEach((label, i) => {
      const x = margin.left + xStep * i;
      const tickLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      tickLabel.setAttribute('x', String(x));
      tickLabel.setAttribute('y', String(margin.top + plotH + 18));
      tickLabel.setAttribute('text-anchor', 'middle');
      tickLabel.setAttribute('font-size', '11');
      tickLabel.setAttribute('font-family', "'Comic Neue', 'Comic Sans MS', cursive, sans-serif");
      tickLabel.setAttribute('fill', '#6b7280');
      tickLabel.textContent = label;
      svg.appendChild(tickLabel);
    });

    // Draw each series
    keys.forEach((key, si) => {
      const color = COLORS[si % COLORS.length];
      const points: Array<{ x: number; y: number; val: number }> = [];

      parsedData.forEach((d, i) => {
        const v = Number(d[key]);
        if (isNaN(v)) return;
        const px = margin.left + xStep * i;
        const py = margin.top + plotH - ((v - minVal) / range) * plotH;
        points.push({ x: px, y: py, val: v });
      });

      // Draw line segments
      for (let i = 0; i < points.length - 1; i++) {
        const line = rc.line(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, {
          stroke: color,
          strokeWidth: 2.5,
          roughness: 1.2,
        });
        svg.appendChild(line);
      }

      // Draw dots at each point
      points.forEach((p) => {
        const dot = rc.circle(p.x, p.y, 8, {
          fill: color,
          fillStyle: 'solid',
          stroke: '#374151',
          strokeWidth: 1,
          roughness: 0.8,
        });
        svg.appendChild(dot);

        hitAreas.push({
          path: null,
          x: p.x - 10,
          y: p.y - 10,
          w: 20,
          h: 20,
          label: labels[si],
          value: p.val,
        });
      });

      // End-of-line label
      if (points.length > 0) {
        const last = points[points.length - 1];
        const endLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        endLabel.setAttribute('x', String(last.x + 10));
        endLabel.setAttribute('y', String(last.y + 4));
        endLabel.setAttribute('text-anchor', 'start');
        endLabel.setAttribute('font-size', '11');
        endLabel.setAttribute('font-weight', 'bold');
        endLabel.setAttribute('font-family', "'Comic Neue', 'Comic Sans MS', cursive, sans-serif");
        endLabel.setAttribute('fill', color);
        endLabel.textContent = `${labels[si]} (${last.val}${unit ? unit : ''})`;
        svg.appendChild(endLabel);
      }
    });

    // Title
    if (title) {
      const titleEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      titleEl.setAttribute('x', String(w / 2));
      titleEl.setAttribute('y', '24');
      titleEl.setAttribute('text-anchor', 'middle');
      titleEl.setAttribute('font-size', '14');
      titleEl.setAttribute('font-weight', 'bold');
      titleEl.setAttribute('font-family', "'Comic Neue', 'Comic Sans MS', cursive, sans-serif");
      titleEl.setAttribute('fill', '#1f2937');
      titleEl.textContent = title;
      svg.appendChild(titleEl);
    }
  }

  function renderHorizontalBar(
    svg: SVGSVGElement,
    rc: ReturnType<typeof rough.svg>,
    labels: string[],
    values: number[],
    w: number,
    h: number,
    hitAreas: typeof hitAreasRef.current
  ) {
    const margin = { top: 45, right: 60, bottom: 20, left: 140 };
    const plotW = w - margin.left - margin.right;
    const plotH = h - margin.top - margin.bottom;
    const maxVal = Math.max(...values) * 1.15;
    const barHeight = Math.min(plotH / labels.length * 0.65, 32);
    const gap = plotH / labels.length;

    // X axis (bottom)
    const xAxisLine = rc.line(margin.left, margin.top + plotH, margin.left + plotW, margin.top + plotH, {
      stroke: '#9ca3af', roughness: 1.5, strokeWidth: 1.5,
    });
    svg.appendChild(xAxisLine);

    // Y axis (left)
    const yAxisLine = rc.line(margin.left, margin.top, margin.left, margin.top + plotH, {
      stroke: '#9ca3af', roughness: 1.5, strokeWidth: 1.5,
    });
    svg.appendChild(yAxisLine);

    // X tick labels
    const tickCount = 5;
    for (let i = 0; i <= tickCount; i++) {
      const val = (maxVal / tickCount) * i;
      const x = margin.left + (val / maxVal) * plotW;
      const tickLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      tickLabel.setAttribute('x', String(x));
      tickLabel.setAttribute('y', String(margin.top + plotH + 16));
      tickLabel.setAttribute('text-anchor', 'middle');
      tickLabel.setAttribute('font-size', '11');
      tickLabel.setAttribute('font-family', "'Comic Neue', 'Comic Sans MS', cursive, sans-serif");
      tickLabel.setAttribute('fill', '#6b7280');
      tickLabel.textContent = val.toFixed(0);
      svg.appendChild(tickLabel);

      // Grid line
      if (i > 0) {
        const gridLine = rc.line(x, margin.top, x, margin.top + plotH, {
          stroke: '#e5e7eb', roughness: 0.5, strokeWidth: 0.5,
        });
        svg.appendChild(gridLine);
      }
    }

    // Bars
    values.forEach((val, i) => {
      const barW = (val / maxVal) * plotW;
      const x = margin.left;
      const y = margin.top + gap * i + (gap - barHeight) / 2;

      const bar = rc.rectangle(x, y, barW, barHeight, {
        fill: COLORS[i % COLORS.length],
        fillStyle: 'hachure',
        fillWeight: 1.5,
        hachureGap: 4,
        stroke: '#374151',
        strokeWidth: 1.5,
        roughness: 1.2,
      });
      svg.appendChild(bar);

      hitAreas.push({
        path: null,
        x, y, w: barW, h: barHeight,
        label: labels[i], value: val,
      });

      // Value at end of bar
      const valLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      valLabel.setAttribute('x', String(x + barW + 8));
      valLabel.setAttribute('y', String(y + barHeight / 2 + 4));
      valLabel.setAttribute('text-anchor', 'start');
      valLabel.setAttribute('font-size', '12');
      valLabel.setAttribute('font-weight', 'bold');
      valLabel.setAttribute('font-family', "'Comic Neue', 'Comic Sans MS', cursive, sans-serif");
      valLabel.setAttribute('fill', '#374151');
      valLabel.textContent = `${val}${unit ? ` ${unit}` : ''}`;
      svg.appendChild(valLabel);

      // Y label (left of bar)
      const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      yLabel.setAttribute('x', String(margin.left - 8));
      yLabel.setAttribute('y', String(y + barHeight / 2 + 4));
      yLabel.setAttribute('text-anchor', 'end');
      yLabel.setAttribute('font-size', '12');
      yLabel.setAttribute('font-family', "'Comic Neue', 'Comic Sans MS', cursive, sans-serif");
      yLabel.setAttribute('fill', '#374151');
      yLabel.textContent = labels[i];
      svg.appendChild(yLabel);
    });

    // Title
    if (title) {
      const titleEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      titleEl.setAttribute('x', String(w / 2));
      titleEl.setAttribute('y', '24');
      titleEl.setAttribute('text-anchor', 'middle');
      titleEl.setAttribute('font-size', '14');
      titleEl.setAttribute('font-weight', 'bold');
      titleEl.setAttribute('font-family', "'Comic Neue', 'Comic Sans MS', cursive, sans-serif");
      titleEl.setAttribute('fill', '#1f2937');
      titleEl.textContent = title;
      svg.appendChild(titleEl);
    }
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = canvasRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = containerWidth / rect.width;
    const scaleY = parseInt(height || '380', 10) / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    for (const area of hitAreasRef.current) {
      if (mx >= area.x && mx <= area.x + area.w && my >= area.y && my <= area.y + area.h) {
        setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, label: area.label, value: area.value });
        return;
      }
    }
    setTooltip(null);
  }

  return (
    <div ref={containerRef} className="my-6 bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm relative">
      <link href="https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&display=swap" rel="stylesheet" />
      <svg
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
        style={{ width: '100%', height: 'auto', display: 'block', cursor: 'crosshair' }}
      />
      {tooltip && (
        <div
          className="absolute bg-gray-900 text-white text-xs rounded-lg px-3 py-1.5 pointer-events-none shadow-lg"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10, fontFamily: "'Comic Neue', cursive" }}
        >
          {tooltip.label}: {tooltip.value}{unit ? ` ${unit}` : ''}
        </div>
      )}
    </div>
  );
}
