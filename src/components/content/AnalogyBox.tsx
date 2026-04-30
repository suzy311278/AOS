import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export default function AnalogyBox({ children }: Props) {
  return (
    <div
      className="border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 rounded-xl my-6 shadow-sm relative overflow-hidden"
      role="note"
      aria-label="Analogy"
    >
      <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 rounded-l-xl"></div>
      <div className="pl-2">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-6 h-6 mt-0.5 text-blue-600" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
          </span>
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
