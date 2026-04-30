import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-auto bg-gray-900 text-gray-400 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-5 h-5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-md" aria-hidden />
              <span className="text-sm font-semibold text-white">Green Tryst - Sustainability Academy</span>
            </div>
            <p className="text-xs text-gray-500 ml-[30px]">
              Open-source sustainability education
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
            <span>Climate</span>
            <span>Carbon Markets</span>
            <span>ESG</span>
            <span>Green Finance</span>
            <Link href="/jobs" className="text-gray-500 hover:text-gray-300 transition-colors">Jobs</Link>
            <Link href="/glossary" className="text-gray-500 hover:text-gray-300 transition-colors">Glossary</Link>
            <Link href="/guides" className="text-gray-500 hover:text-gray-300 transition-colors">Guides</Link>
            <Link href="/feedback" className="text-gray-500 hover:text-gray-300 transition-colors">Feedback</Link>
            <Link href="/disclaimer" className="text-gray-500 hover:text-gray-300 transition-colors">Disclaimer</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
