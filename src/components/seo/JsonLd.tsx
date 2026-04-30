/**
 * Server-rendered JSON-LD script tag. Pass any serialisable object (or array
 * of objects) and it will be emitted inside <script type="application/ld+json">
 * with safe escaping.
 */

import { safeJsonLd } from '@/lib/json-ld';

interface Props {
  data: unknown;
  id?: string;
}

export function JsonLd({ data, id }: Props) {
  return (
    <script
      type="application/ld+json"
      {...(id ? { id } : {})}
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}
