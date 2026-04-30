import Link from 'next/link';

interface Crumb {
  label: string;
  href?: string;
}

interface Props {
  crumbs: Crumb[];
}

export default function Breadcrumb({ crumbs }: Props) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-gray-500">
      {crumbs.map((crumb, idx) => (
        <span key={idx} className="flex items-center gap-1">
          {idx > 0 && <span aria-hidden className="text-gray-300">›</span>}
          {crumb.href ? (
            <Link
              href={crumb.href}
              className="hover:text-gray-700 transition-colors truncate max-w-[140px]"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="text-gray-700 font-medium truncate max-w-[160px]" aria-current="page">
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
