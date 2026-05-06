/**
 * Logo - ArmorInnovate brand logo with context-aware colors
 *
 * Brand identity:
 * - "Armor" + "Innovate" wordmark
 * - Dark background: "Armor" (white) + "Innovate" (cyan)
 * - Light background: "Armor" (charcoal) + "Innovate" (primary blue)
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
      <span className={variant === 'dark' ? 'text-white' : 'text-gray-900'}>
        Armor
      </span>
      <span className={variant === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}>
        Innovate
      </span>
    </span>
  );

  if (href) {
    return <Link href={href}>{logoContent}</Link>;
  }

  return logoContent;
}
