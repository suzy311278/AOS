// Color map: module color name → Tailwind classes
// Mirrors the colorMap from the original single-file app.

export interface ColorSet {
  bg: string;
  text: string;
  border: string;
  btn: string;
  active: string;
  light: string;      // lighter bg for progress bars, badges
  hoverLight: string;  // hover variant of light bg
}

export const colorMap: Record<string, ColorSet> = {
  green: {
    bg: 'bg-green-600',
    text: 'text-green-600',
    border: 'border-green-600',
    btn: 'bg-green-600 hover:bg-green-700 text-white',
    active: 'bg-green-50 border-l-4 border-green-600 text-green-800',
    light: 'bg-green-50',
    hoverLight: 'hover:bg-green-50',
  },
  emerald: {
    bg: 'bg-emerald-600',
    text: 'text-emerald-600',
    border: 'border-emerald-600',
    btn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    active: 'bg-emerald-50 border-l-4 border-emerald-600 text-emerald-800',
    light: 'bg-emerald-50',
    hoverLight: 'hover:bg-emerald-50',
  },
  teal: {
    bg: 'bg-teal-600',
    text: 'text-teal-600',
    border: 'border-teal-600',
    btn: 'bg-teal-600 hover:bg-teal-700 text-white',
    active: 'bg-teal-50 border-l-4 border-teal-600 text-teal-800',
    light: 'bg-teal-50',
    hoverLight: 'hover:bg-teal-50',
  },
  blue: {
    bg: 'bg-blue-600',
    text: 'text-blue-600',
    border: 'border-blue-600',
    btn: 'bg-blue-600 hover:bg-blue-700 text-white',
    active: 'bg-blue-50 border-l-4 border-blue-600 text-blue-800',
    light: 'bg-blue-50',
    hoverLight: 'hover:bg-blue-50',
  },
  violet: {
    bg: 'bg-violet-600',
    text: 'text-violet-600',
    border: 'border-violet-600',
    btn: 'bg-violet-600 hover:bg-violet-700 text-white',
    active: 'bg-violet-50 border-l-4 border-violet-600 text-violet-800',
    light: 'bg-violet-50',
    hoverLight: 'hover:bg-violet-50',
  },
  orange: {
    bg: 'bg-orange-600',
    text: 'text-orange-600',
    border: 'border-orange-600',
    btn: 'bg-orange-600 hover:bg-orange-700 text-white',
    active: 'bg-orange-50 border-l-4 border-orange-600 text-orange-800',
    light: 'bg-orange-50',
    hoverLight: 'hover:bg-orange-50',
  },
  red: {
    bg: 'bg-red-600',
    text: 'text-red-600',
    border: 'border-red-600',
    btn: 'bg-red-600 hover:bg-red-700 text-white',
    active: 'bg-red-50 border-l-4 border-red-600 text-red-800',
    light: 'bg-red-50',
    hoverLight: 'hover:bg-red-50',
  },
  purple: {
    bg: 'bg-purple-600',
    text: 'text-purple-600',
    border: 'border-purple-600',
    btn: 'bg-purple-600 hover:bg-purple-700 text-white',
    active: 'bg-purple-50 border-l-4 border-purple-600 text-purple-800',
    light: 'bg-purple-50',
    hoverLight: 'hover:bg-purple-50',
  },
  cyan: {
    bg: 'bg-cyan-600',
    text: 'text-cyan-600',
    border: 'border-cyan-600',
    btn: 'bg-cyan-600 hover:bg-cyan-700 text-white',
    active: 'bg-cyan-50 border-l-4 border-cyan-600 text-cyan-800',
    light: 'bg-cyan-50',
    hoverLight: 'hover:bg-cyan-50',
  },
  rose: {
    bg: 'bg-rose-600',
    text: 'text-rose-600',
    border: 'border-rose-600',
    btn: 'bg-rose-600 hover:bg-rose-700 text-white',
    active: 'bg-rose-50 border-l-4 border-rose-600 text-rose-800',
    light: 'bg-rose-50',
    hoverLight: 'hover:bg-rose-50',
  },
  indigo: {
    bg: 'bg-indigo-600',
    text: 'text-indigo-600',
    border: 'border-indigo-600',
    btn: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    active: 'bg-indigo-50 border-l-4 border-indigo-600 text-indigo-800',
    light: 'bg-indigo-50',
    hoverLight: 'hover:bg-indigo-50',
  },
};

export function getColor(color: string): ColorSet {
  return colorMap[color] ?? colorMap.green;
}
