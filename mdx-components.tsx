// Required by Next.js MDX integration — must be in project root.
import { getMDXComponents } from '@/components/content/mdx-components';
export function useMDXComponents(components: import('mdx/types').MDXComponents) {
  return getMDXComponents(components);
}
