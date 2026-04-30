import Link from 'next/link';

interface Props {
  href: string;
  title: string;
  description?: string;
}

export default function GoDeeper({ href, title, description }: Props) {
  return (
    <Link
      href={href}
      className="block border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-5 rounded-xl my-6 shadow-sm relative overflow-hidden hover:shadow-md hover:border-indigo-300 transition-all duration-200 no-underline group"
    >
      <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 rounded-l-xl" />
      <div className="pl-2">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-6 h-6 mt-0.5 text-indigo-600" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-1">Go deeper</p>
            <p className="font-semibold text-gray-900 text-sm leading-snug group-hover:text-indigo-700 transition-colors">{title}</p>
            {description && (
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">{description}</p>
            )}
          </div>
          <svg className="flex-shrink-0 w-5 h-5 text-indigo-400 mt-1 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
