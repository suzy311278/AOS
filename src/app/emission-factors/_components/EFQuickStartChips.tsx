/**
 * EFQuickStartChips
 *
 * Six chips linking to category landing pages. Each chip uses its Lucide
 * category icon from the shared CATEGORY_META map.
 */

import Link from 'next/link';
import { CATEGORY_META, QUICK_START_CATEGORIES } from '@/lib/emission-factors/categories';

export function EFQuickStartChips() {
  return (
    <ul className="flex flex-wrap items-center justify-center gap-3">
      {QUICK_START_CATEGORIES.map((cat) => {
        const meta = CATEGORY_META[cat];
        const Icon = meta.icon;
        return (
          <li key={cat}>
            <Link
              href={`/emission-factors/category/${cat}`}
              className="group inline-flex items-center gap-2 rounded-full bg-white border border-gt-border-light px-4 py-2 text-sm font-medium text-gt-text hover:border-[#95D5B2] hover:text-[#2D6A4F] transition-colors shadow-gt-card"
            >
              <Icon className="h-4 w-4 text-[#2D6A4F]" aria-hidden />
              <span>{meta.shortLabel}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
