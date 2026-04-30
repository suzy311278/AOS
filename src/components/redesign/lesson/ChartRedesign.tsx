'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3 } from 'lucide-react';

/** Brand-aligned palette. Forest green at the top of the order
 *  with progressively warmer accents for differentiation. */
const CHART_COLORS = [
  '#2D6A4F', // gt-medium
  '#52B788', // gt-leaf
  '#0B3D2E', // gt-deepest
  '#95D5B2', // gt-mint
  '#1B4332',
  '#40916C',
  '#74C69D',
  '#B7E4C7',
];

interface ChartRedesignProps {
  type: 'bar' | 'pie' | 'horizontal-bar';
  data: string;
  xKey: string;
  yKey: string;
  title?: string;
  unit?: string;
  height?: string;
}

function ChartTooltip({
  active,
  payload,
  unit,
}: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: Record<string, unknown>;
  }>;
  unit?: string;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div
      className="bg-white border border-gt-border-light rounded-lg shadow-gt-card px-3 py-2"
      style={{
        fontFamily:
          'var(--font-jetbrains-mono), JetBrains Mono, monospace',
      }}
    >
      <p className="text-[12px] font-bold text-gt-text">
        {String(item.payload.name || item.name)}
      </p>
      <p className="text-[12px] text-gt-medium font-semibold">
        {item.value}
        {unit ? ` ${unit}` : ''}
      </p>
    </div>
  );
}

export default function ChartRedesign({
  type,
  data,
  xKey,
  yKey,
  title,
  unit,
  height,
}: ChartRedesignProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  let parsedData: Record<string, unknown>[];
  try {
    parsedData = JSON.parse(data);
  } catch {
    return (
      <div className="my-7 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
        Chart error: invalid data format
      </div>
    );
  }

  const chartHeight = parseInt(height || '320', 10);

  return (
    <div className="my-7 rounded-2xl border border-gt-border-light bg-white p-6 shadow-gt-card">
      {/* BlockHeader inlined to keep this file self-contained */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gt-medium/10 text-gt-medium">
          <BarChart3 className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gt-medium">Data</p>
          {title && <h4 className="text-sm font-semibold text-gt-text">{title}</h4>}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        {type === 'pie' ? (
          <PieChart>
            <Pie
              data={parsedData}
              dataKey={yKey}
              nameKey={xKey}
              cx="50%"
              cy="50%"
              outerRadius="75%"
              innerRadius="40%"
              paddingAngle={2}
              onMouseEnter={(_, idx) => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
              label={({ name, value }) =>
                `${name}: ${value}${unit ?? ''}`
              }
              labelLine={false}
            >
              {parsedData.map((_, idx) => (
                <Cell
                  key={idx}
                  fill={CHART_COLORS[idx % CHART_COLORS.length]}
                  opacity={
                    activeIndex === null || activeIndex === idx ? 1 : 0.4
                  }
                  stroke={activeIndex === idx ? '#0B3D2E' : 'white'}
                  strokeWidth={activeIndex === idx ? 2 : 1}
                  style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip unit={unit} />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span className="text-[11px] text-gt-text-muted">{value}</span>
              )}
            />
          </PieChart>
        ) : type === 'horizontal-bar' ? (
          <BarChart
            data={parsedData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E8E8EA" />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: '#6f7977' }}
              unit={unit ? ` ${unit}` : ''}
            />
            <YAxis
              type="category"
              dataKey={xKey}
              tick={{ fontSize: 11, fill: '#191c1c' }}
              width={95}
            />
            <Tooltip content={<ChartTooltip unit={unit} />} />
            <Bar
              dataKey={yKey}
              radius={[0, 4, 4, 0]}
              onMouseEnter={(_, idx) => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {parsedData.map((_, idx) => (
                <Cell
                  key={idx}
                  fill={CHART_COLORS[idx % CHART_COLORS.length]}
                  opacity={
                    activeIndex === null || activeIndex === idx ? 1 : 0.5
                  }
                  style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                />
              ))}
            </Bar>
          </BarChart>
        ) : (
          <BarChart
            data={parsedData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E8E8EA" />
            <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#6f7977' }} />
            <YAxis
              tick={{ fontSize: 11, fill: '#6f7977' }}
              unit={unit ? ` ${unit}` : ''}
            />
            <Tooltip content={<ChartTooltip unit={unit} />} />
            <Bar
              dataKey={yKey}
              radius={[6, 6, 0, 0]}
              onMouseEnter={(_, idx) => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {parsedData.map((_, idx) => (
                <Cell
                  key={idx}
                  fill={CHART_COLORS[idx % CHART_COLORS.length]}
                  opacity={
                    activeIndex === null || activeIndex === idx ? 1 : 0.5
                  }
                  style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
