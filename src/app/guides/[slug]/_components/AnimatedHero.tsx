/**
 * AnimatedHero - Guide detail page header with floating icons and animated gradient
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, BookOpen, Share2, Bookmark, ChevronRight, FileText, Leaf, Globe, TrendingUp, BarChart3, Target } from 'lucide-react';
import { cn } from '@/components/redesign/lib/cn';

interface AnimatedHeroProps {
  title: string;
  description: string;
  readingMinutes: number;
  lastUpdated?: string;
  coursesCount: number;
}

export function AnimatedHero({
  title,
  description,
  readingMinutes,
  lastUpdated,
  coursesCount,
}: AnimatedHeroProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Floating icon data
  const floatingIcons = [
    { Icon: Leaf, x: '10%', y: '20%', delay: 0, size: 24 },
    { Icon: Globe, x: '85%', y: '15%', delay: 0.5, size: 20 },
    { Icon: TrendingUp, x: '75%', y: '70%', delay: 1, size: 22 },
    { Icon: BarChart3, x: '15%', y: '75%', delay: 1.5, size: 18 },
    { Icon: Target, x: '90%', y: '45%', delay: 2, size: 20 },
    { Icon: FileText, x: '5%', y: '50%', delay: 0.8, size: 16 },
  ];

  return (
    <section className="relative overflow-hidden bg-gt-text-dark pt-24 pb-12">
      {/* Animated gradient blobs */}
      <div
        className={cn(
          'absolute -top-20 left-1/4 w-[600px] h-[600px] rounded-full transition-all duration-1000 ease-out',
          'bg-gradient-to-br from-gt-medium/30 via-gt-leaf/20 to-transparent blur-3xl',
          mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        )}
        style={{
          animation: mounted ? 'pulse-slow 8s ease-in-out infinite' : 'none',
        }}
        aria-hidden
      />
      <div
        className={cn(
          'absolute -bottom-40 right-1/4 w-[500px] h-[500px] rounded-full transition-all duration-1000 delay-300 ease-out',
          'bg-gradient-to-tl from-gt-leaf/25 via-gt-medium/15 to-transparent blur-3xl',
          mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        )}
        style={{
          animation: mounted ? 'pulse-slow 10s ease-in-out infinite reverse' : 'none',
        }}
        aria-hidden
      />

      {/* Dot grid */}
      <div
        className="gt-dot-grid absolute inset-0 opacity-40 pointer-events-none"
        aria-hidden
      />

      {/* Floating icons */}
      {floatingIcons.map(({ Icon, x, y, delay, size }, index) => (
        <div
          key={index}
          className={cn(
            'absolute transition-all duration-700 ease-out',
            mounted ? 'opacity-30' : 'opacity-0'
          )}
          style={{
            left: x,
            top: y,
            transitionDelay: `${delay * 300}ms`,
            animation: mounted
              ? `float-icon ${4 + index * 0.5}s ease-in-out infinite`
              : 'none',
            animationDelay: `${delay}s`,
          }}
          aria-hidden
        >
          <Icon
            className="text-white/40"
            style={{ width: size, height: size }}
            strokeWidth={1.5}
          />
        </div>
      ))}

      {/* Content aligned with body - uses same 1200px container, text constrained to left */}
      <div className="relative z-10 max-w-[1200px] mx-auto px-8">
        <div className="max-w-[900px]">
        {/* Breadcrumb */}
        <nav
          className={cn(
            'flex items-center gap-2 text-[12px] text-white/50 mb-6 transition-all duration-500',
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <Link href="/guides" className="hover:text-white transition-colors">
            Guides
          </Link>
          <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
          <span className="text-white/70 truncate">{title}</span>
        </nav>

        {/* Badge */}
        <div
          className={cn(
            'flex items-center gap-2 mb-4 transition-all duration-500 delay-100',
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <span
            className="px-3 py-1 bg-gt-leaf/20 border border-gt-leaf/30 text-gt-leaf text-[10px] font-bold uppercase rounded-full"
            style={{ letterSpacing: '0.05em' }}
          >
            Practitioner Guide
          </span>
        </div>

        {/* Title */}
        <h1
          className={cn(
            'text-[28px] md:text-[36px] font-extrabold text-white leading-tight mb-4 transition-all duration-500 delay-150',
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          {title}
        </h1>

        {/* Description */}
        <p
          className={cn(
            'text-[16px] text-white/60 mb-6 max-w-2xl transition-all duration-500 delay-200',
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          {description}
        </p>

        {/* Meta info */}
        <div
          className={cn(
            'flex flex-wrap items-center gap-6 text-[12px] text-white/50 transition-all duration-500 delay-250',
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" strokeWidth={2} />
            {readingMinutes} min read
          </span>
          {lastUpdated && <span>Updated {lastUpdated}</span>}
          {coursesCount > 0 && (
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" strokeWidth={2} />
              {coursesCount} related course{coursesCount !== 1 && 's'}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div
          className={cn(
            'flex items-center gap-3 mt-6 transition-all duration-500 delay-300',
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <button className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-[12px] font-semibold text-white hover:bg-white/20 hover:scale-105 transition-all">
            <Bookmark className="w-4 h-4" strokeWidth={2} />
            Save
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-[12px] font-semibold text-white hover:bg-white/20 hover:scale-105 transition-all">
            <Share2 className="w-4 h-4" strokeWidth={2} />
            Share
          </button>
        </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% {
            transform: scale(1) translateY(0);
          }
          50% {
            transform: scale(1.1) translateY(-20px);
          }
        }
        @keyframes float-icon {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          25% {
            transform: translateY(-8px) rotate(5deg);
          }
          50% {
            transform: translateY(-4px) rotate(0deg);
          }
          75% {
            transform: translateY(-12px) rotate(-5deg);
          }
        }
      `}</style>
    </section>
  );
}
