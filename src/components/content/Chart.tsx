'use client';

import { useState } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';

/**
 * Chart — Interactive data visualization for MDX lessons.
 *
 * Props are strings because MDX cannot reliably parse nested objects/arrays.
 * Data format: JSON string of array of objects, e.g.:
 *   '[{"name":"Energy","value":34},{"name":"Industry","value":24}]'
 */

interface ChartProps {
  /** Chart type */
  type: 'bar' | 'pie' | 'horizontal-bar';
  /** JSON stringified array of data objects */
  data: string;
  /** Key in data objects for x-axis / labels */
  xKey: string;
  /** Key in data objects for y-axis / values */
  yKey: string;
  /** Chart title */
  title?: string;
  /** Unit label for values (e.g., "%", "GtCO2e") */
  unit?: string;
  /** Chart height in pixels */
  height?: string;
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#f97316', // orange
  '#14b8a6', // teal
  '#6366f1', // indigo
];

function CustomTooltip({ active, payload, unit }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: Record<string, unknown> }>; unit?: string }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-medium text-gray-900">{String(item.payload.name || item.name)}</p>
      <p className="text-gray-600">{item.value}{unit ? ` ${unit}` : ''}</p>
    </div>
  );
}

export default function Chart({ type, data, xKey, yKey, title, unit, height }: ChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  let parsedData: Record<string, unknown>[];
  try {
    parsedData = JSON.parse(data);
  } catch {
    return (
      <div className="text-red-500 text-sm p-4 border border-red-200 rounded-lg">
        Chart error: invalid data format
      </div>
    );
  }

  const chartHeight = parseInt(height || '320', 10);

  return (
    <div className="my-6 bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
      {title && (
        <h4 className="text-sm font-semibold text-gray-700 mb-4 text-center">{title}</h4>
      )}

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
              label={({ name, value }) => `${name}: ${value}${unit || ''}`}
              labelLine={false}
            >
              {parsedData.map((_, idx) => (
                <Cell
                  key={idx}
                  fill={COLORS[idx % COLORS.length]}
                  opacity={activeIndex === null || activeIndex === idx ? 1 : 0.4}
                  stroke={activeIndex === idx ? '#1f2937' : 'white'}
                  strokeWidth={activeIndex === idx ? 2 : 1}
                  style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip unit={unit} />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
            />
          </PieChart>
        ) : type === 'horizontal-bar' ? (
          <BarChart data={parsedData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} unit={unit ? ` ${unit}` : ''} />
            <YAxis type="category" dataKey={xKey} tick={{ fontSize: 12, fill: '#374151' }} width={95} />
            <Tooltip content={<CustomTooltip unit={unit} />} />
            <Bar
              dataKey={yKey}
              radius={[0, 4, 4, 0]}
              onMouseEnter={(_, idx) => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {parsedData.map((_, idx) => (
                <Cell
                  key={idx}
                  fill={COLORS[idx % COLORS.length]}
                  opacity={activeIndex === null || activeIndex === idx ? 1 : 0.5}
                  style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                />
              ))}
            </Bar>
          </BarChart>
        ) : (
          <BarChart data={parsedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: '#6b7280' }} />
            <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} unit={unit ? ` ${unit}` : ''} />
            <Tooltip content={<CustomTooltip unit={unit} />} />
            <Bar
              dataKey={yKey}
              radius={[4, 4, 0, 0]}
              onMouseEnter={(_, idx) => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {parsedData.map((_, idx) => (
                <Cell
                  key={idx}
                  fill={COLORS[idx % COLORS.length]}
                  opacity={activeIndex === null || activeIndex === idx ? 1 : 0.5}
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
