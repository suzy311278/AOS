import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export default function HighlightBox({ children }: Props) {
  return (
    <div
      className="border border-green-200 bg-gradient-to-br from-green-50 to-white p-5 rounded-xl my-6 shadow-sm relative overflow-hidden"
      role="note"
      aria-label="Key takeaway"
    >
      <div className="absolute top-0 left-0 w-1.5 h-full bg-green-500 rounded-l-xl"></div>
      <div className="pl-2">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-6 h-6 mt-0.5 text-green-600" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 4 12.7V17a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1v-2.3A7 7 0 0 1 12 2z" />
            </svg>
          </span>
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
