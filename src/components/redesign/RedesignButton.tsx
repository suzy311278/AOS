/**
 * RedesignButton
 *
 * Primary and secondary button variants for the redesign. Can be rendered
 * as a <button> or an <a> via the `href` prop.
 *
 * Variants:
 * - primary: solid medium-green bg, white text
 * - secondary-light: transparent with forest border (for light bg)
 * - secondary-dark: transparent with mint border (for dark bg)
 * - ghost: text-only with arrow, for inline CTAs
 */

import Link from 'next/link';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/components/redesign/lib/cn';

type Variant = 'primary' | 'secondary-light' | 'secondary-dark' | 'ghost';
type Size = 'md' | 'lg';

interface BaseProps {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
}

type ButtonProps = BaseProps &
  Omit<ComponentPropsWithoutRef<'button'>, 'className' | 'children'> & {
    href?: undefined;
  };

type LinkProps = BaseProps & {
  href: string;
  target?: string;
  rel?: string;
};

export type RedesignButtonProps = ButtonProps | LinkProps;

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-gt-medium text-gt-text-light hover:bg-gt-dark shadow-sm hover:shadow-gt-glow',
  'secondary-light':
    'bg-transparent text-gt-medium border border-gt-medium/30 hover:bg-gt-pale hover:border-gt-medium',
  'secondary-dark':
    'bg-transparent text-gt-text-light border border-gt-mint/30 hover:bg-gt-mint/10 hover:border-gt-mint',
  ghost: 'bg-transparent text-gt-medium hover:text-gt-dark',
};

const SIZE_CLASSES: Record<Size, string> = {
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-8 py-4 text-base',
};

export function RedesignButton(props: RedesignButtonProps) {
  const { children, variant = 'primary', size = 'md', className } = props;

  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold',
    'transition-all duration-200 active:scale-[0.98]',
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className
  );

  if ('href' in props && props.href) {
    const { href, target, rel } = props;
    return (
      <Link href={href} target={target} rel={rel} className={classes}>
        {children}
      </Link>
    );
  }

  const { href: _href, ...buttonProps } = props as ButtonProps & { href?: undefined };
  return (
    <button {...buttonProps} className={classes}>
      {children}
    </button>
  );
}
