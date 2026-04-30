/**
 * Logo - Greentryst brand logo with context-aware colors
 *
 * Brand identity:
 * - Capital G always: "Greentryst"
 * - Dark background: "Green" (white) + "tryst" (teal/leaf green)
 * - Light background: "Green" (charcoal) + "tryst" (teal/medium green)
 */

import Link from 'next/link';

export interface LogoProps {
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'text-[20px]',
  md: 'text-[24px]',
  lg: 'text-[28px]',
};

export function Logo({
  variant = 'light',
  size = 'md',
  href = '/',
  className = '',
}: LogoProps) {
  const logoContent = (
    <span className={`font-extrabold tracking-tight ${sizeClasses[size]} ${className}`}>
      <span className={variant === 'dark' ? 'text-white' : 'text-gt-text'}>
        Green
      </span>
      <span className={variant === 'dark' ? 'text-gt-leaf' : 'text-gt-medium'}>
        tryst
      </span>
    </span>
  );

  if (href) {
    return <Link href={href}>{logoContent}</Link>;
  }

  return logoContent;
}
