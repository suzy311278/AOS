import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export default function FormulaBox({ children }: Props) {
  return (
    <div
      className="bg-slate-800 text-slate-100 rounded-lg p-4 my-4 font-mono text-sm overflow-x-auto [&_p]:text-slate-100 [&_strong]:text-white [&_code]:text-slate-200 [&_code]:bg-slate-700 [&_li]:text-slate-100 [&_ul]:text-slate-100 [&_ol]:text-slate-100"
      role="math"
      aria-label="Formula"
    >
      {children}
    </div>
  );
}
