/**
 * AnimatedGuidesHero - Guides listing page header with floating icons and animated gradient
 */

'use client';

import { useState, useEffect } from 'react';
import { FileText, Leaf, Globe, TrendingUp, BarChart3, BookOpen, Sparkles } from 'lucide-react';
import { cn } from '@/components/redesign/lib/cn';

export function AnimatedGuidesHero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Floating icon data - positioned around the header
  const floatingIcons = [
    { Icon: Leaf, x: '8%', y: '25%', delay: 0, size: 28 },
    { Icon: Globe, x: '88%', y: '20%', delay: 0.4, size: 24 },
    { Icon: TrendingUp, x: '82%', y: '65%', delay: 0.8, size: 26 },
    { Icon: BarChart3, x: '12%', y: '70%', delay: 1.2, size: 22 },
    { Icon: BookOpen, x: '92%', y: '45%', delay: 0.6, size: 20 },
    { Icon: FileText, x: '5%', y: '50%', delay: 1, size: 18 },
    { Icon: Sparkles, x: '75%', y: '30%', delay: 1.4, size: 16 },
  ];

  return (
    <section className="relative overflow-hidden bg-gt-text-dark pt-24 pb-16">
      {/* Animated gradient blobs */}
      <div
        className={cn(
          'absolute -top-20 left-1/4 w-[600px] h-[600px] rounded-full transition-all duration-1000 ease-out',
          'bg-gradient-to-br from-gt-medium/30 via-gt-leaf/20 to-transparent blur-3xl',
          mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        )}
        style={{
          animation: mounted ? 'pulse-glow 8s ease-in-out infinite' : 'none',
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
          animation: mounted ? 'pulse-glow 10s ease-in-out infinite reverse' : 'none',
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
            'absolute transition-all duration-700 ease-out pointer-events-none',
            mounted ? 'opacity-30' : 'opacity-0'
          )}
          style={{
            left: x,
            top: y,
            transitionDelay: `${delay * 300}ms`,
            animation: mounted
              ? `float-icon-guides ${4 + index * 0.5}s ease-in-out infinite`
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

      {/* Content */}
      <div className="relative z-10 max-w-[1100px] mx-auto px-8 text-center">
        <p
          className={cn(
            'text-[11px] font-bold uppercase text-gt-leaf mb-4 transition-all duration-500',
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
          style={{ letterSpacing: '0.25em' }}
        >
          Resources
        </p>
        <h1
          className={cn(
            'text-[36px] md:text-[44px] font-extrabold text-white leading-tight mb-4 transition-all duration-500 delay-100',
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          Practitioner Guides
        </h1>
        <p
          className={cn(
            'text-[16px] text-white/60 max-w-xl mx-auto transition-all duration-500 delay-200',
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          Answers to the questions sustainability professionals ask most. Each guide connects you to relevant courses for deeper learning.
        </p>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% {
            transform: scale(1) translateY(0);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.15) translateY(-15px);
            opacity: 1;
          }
        }
        @keyframes float-icon-guides {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          25% {
            transform: translateY(-10px) rotate(5deg);
          }
          50% {
            transform: translateY(-5px) rotate(0deg);
          }
          75% {
            transform: translateY(-15px) rotate(-5deg);
          }
        }
      `}</style>
    </section>
  );
}
