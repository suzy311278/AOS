'use client';

import Link from 'next/link';
import { TrendingDown, ArrowRight } from 'lucide-react';

interface Props {
  totalRetirers?: number;
  totalRetired?: number;
}

function formatBig(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString('en-US');
}

/**
 * Cross-link banner shown between the /carbon/market hero and the
 * catalogue table. Pulls users into the retirement leaderboard — the
 * single most differentiated surface in the carbon product.
 */
export default function RetirementsBanner({ totalRetirers, totalRetired }: Props) {
  return (
    <div className="max-w-[1280px] mx-auto px-6 md:px-8 mt-8 md:mt-10">
      <Link
        href="/carbon/retirements"
        className="group relative flex flex-col md:flex-row md:items-center gap-4 md:gap-6 bg-[#0e1e1e] text-white rounded-2xl shadow-sm border-l-4 border-l-[#8cd4ca] px-5 md:px-7 py-5 md:py-6 hover:bg-[#122525] transition-colors"
      >
        <span
          aria-hidden="true"
          className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-[#005c55]/30 text-[#8cd4ca]"
        >
          <TrendingDown className="w-5 h-5" strokeWidth={1.75} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8cd4ca]">
              Retirement leaderboard
            </span>
          </div>
          <h3 className="text-base md:text-lg font-semibold text-white leading-snug">
            {totalRetirers
              ? `Who actually retired their credits — ${totalRetirers.toLocaleString('en-US')} corporate buyers ranked`
              : 'Who actually retired their credits — corporate buyers ranked'}
          </h3>
          <p className="mt-1.5 text-sm text-white/65 leading-relaxed">
            {totalRetired
              ? `${formatBig(totalRetired)} tCO2e of retirements across Verra, ACR, CAR, and more. Search by beneficiary, filter by methodology, verify corporate net-zero claims.`
              : 'Retirements across Verra, ACR, CAR, and more. Search by beneficiary, filter by methodology, verify corporate net-zero claims.'}
          </p>
        </div>
        <span className="flex items-center gap-2 text-sm font-medium text-[#8cd4ca] group-hover:text-white transition-colors">
          Open leaderboard
          <ArrowRight
            className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
            strokeWidth={2}
          />
        </span>
      </Link>
    </div>
  );
}
