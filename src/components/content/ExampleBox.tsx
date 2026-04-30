import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  title?: string;
}

export default function ExampleBox({ children, title }: Props) {
  return (
    <div
      className="border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 rounded-xl my-6 shadow-sm relative overflow-hidden"
      role="note"
      aria-label={title ?? 'Worked example'}
    >
      <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500 rounded-l-xl"></div>
      <div className="pl-2">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-6 h-6 mt-0.5 text-amber-600" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </span>
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
