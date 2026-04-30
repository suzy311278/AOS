import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.ts',
    './src/content/**/*.{md,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Segoe UI', 'system-ui', 'sans-serif'],
        // Redesign fonts, set via CSS variables in src/app/redesign/layout.tsx
        'redesign-sans': ['var(--font-inter)', 'Inter', 'sans-serif'],
        'redesign-mono': ['var(--font-jetbrains-mono)', 'JetBrains Mono', 'monospace'],
        // ArmorInnovate (mono-first, cyber-industrial aesthetic).
        'ai-sans': ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        'ai-mono': ['var(--font-jetbrains-mono)', 'JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Greentryst brand palette, unified with LinkedIn carousel brand.
        // All tokens prefixed with `gt-` to avoid collisions with existing
        // Tailwind color utilities used elsewhere in the project.
        //
        // Use the semantic names (pale, deep, forest, etc.) so references
        // stay readable and map 1:1 to the Design Bible.
        gt: {
          // Core brand greens (used for dark sections, cards, accents, CTAs)
          'text-dark': '#18181B', // charcoal, primary dark surface (hero, footer)
          deep: '#23232A',         // dark card bg (signature element)
          dark: '#1B4332',         // dark alt, hover states
          medium: '#2D6A4F',       // primary CTAs, active states
          forest: '#40916C',       // secondary accents, mid-tone
          leaf: '#52B788',         // success / live badges
          mint: '#95D5B2',         // light accents on dark backgrounds

          // Neutral surfaces (light sections use these, NOT saturated greens)
          pale: '#F8FAF9',          // off-white neutral, primary light bg
          'pale-warm': '#F4F7F5',   // very subtle warm tint for alternation
          white: '#FFFFFF',

          // Text (near-black, not green, for readability)
          'text-light': '#F0FFF4',  // off-white, used for text on dark bg

          // Semantic aliases
          bg: '#F8FAF9',           // neutral light section bg
          'bg-alt': '#FFFFFF',     // pure white for alternating sections
          'bg-dark': '#18181B',    // dark hero / footer bg
          card: '#FFFFFF',         // white cards on light sections
          'card-dark': '#23232A',  // dark cards (the signature accent)
          'card-dark-alt': '#2D2D35',

          // Text colors
          text: '#0B1F15',           // near-black with warm undertone, primary on light
          'text-muted': '#3D4E45',   // secondary text on light, neutral gray-green
          'text-dim': '#6B7870',     // muted metadata on light
          'text-on-dark': '#F0FFF4',
          'text-on-dark-muted': '#95D5B2',

          // Accents
          success: '#52B788',  // leaf, for LIVE badges
          amber: '#f59e0b',    // coming soon badges

          // Borders
          'border-light': '#E5EAE7', // neutral gray-green border on light bg
          'border-dark': '#40916C',  // green border on dark bg
        },

        // ============================================================
        // ArmorInnovate OS — Cyber-Industrial palette (`ai-*`)
        //
        // Design discipline: high-performance HMI. Backgrounds are
        // muted, near-monochrome. Saturation is reserved for ALARMS
        // (`crit`, `warn`) — never use those tokens for CTAs or decor.
        // Primary action uses `ai-primary` (deep industrial blue);
        // active/focus uses `ai-accent`; live signals use `ai-cyber`.
        // See docs/armor-refactor-plan.md §4.1 for the full table.
        // ============================================================
        ai: {
          // Surfaces (light, muted)
          bg:          '#FFFFFF',
          'bg-soft':   '#F4F6F8',
          'bg-mute':   '#E8ECF1',

          // Surfaces (dark — terminal, hero)
          deep:        '#0B1F3A',
          'deep-2':    '#0F172A',
          grid:        '#1F2937',

          // Text
          ink:         '#0B1220',
          'ink-soft':  '#3D4A5F',
          'ink-dim':   '#6B7A90',
          'ink-on-deep':       '#E2E8F0',
          'ink-on-deep-soft':  '#94A3B8',
          'ink-on-deep-dim':   '#64748B',

          // Lines / borders
          line:        '#D7DEE8',
          'line-soft': '#E5E9F0',
          'line-deep': '#1E293B',

          // Brand / action
          primary:        '#1E3A8A',
          'primary-hover':'#1E40AF',
          accent:         '#2563EB',
          'accent-soft':  '#DBEAFE',

          // Live signal accent (cyan)
          cyber:        '#06B6D4',
          'cyber-glow': '#67E8F9',

          // HMI status (high-contrast, used sparingly)
          ok:        '#16A34A',
          'ok-soft': '#DCFCE7',
          warn:      '#D97706',
          'warn-soft':'#FEF3C7',
          crit:      '#DC2626',
          'crit-soft':'#FEE2E2',
          offline:   '#6B7280',
        },
      },
      borderRadius: {
        'gt-card': '1rem', // 16px, the signature rounded-2xl
        'ai-card': '0.75rem', // 12px — squarer, industrial
        'ai-tile': '0.375rem', // 6px — HMI tiles
      },
      boxShadow: {
        'gt-card': '0 1px 3px rgba(8, 28, 21, 0.08)',
        'gt-card-hover': '0 4px 16px rgba(8, 28, 21, 0.12)',
        'gt-card-lg': '0 10px 40px rgba(11, 61, 46, 0.15)',
        'gt-glow': '0 0 40px rgba(45, 106, 79, 0.18)',
        'gt-glow-strong': '0 0 60px rgba(45, 106, 79, 0.28)',
        // ArmorInnovate
        'ai-tile':         '0 1px 2px rgba(11, 31, 58, 0.06), 0 1px 1px rgba(11, 31, 58, 0.04)',
        'ai-tile-hover':   '0 4px 12px rgba(11, 31, 58, 0.10), 0 2px 4px rgba(11, 31, 58, 0.06)',
        'ai-card':         '0 6px 20px rgba(11, 31, 58, 0.08)',
        'ai-card-deep':    '0 12px 40px rgba(11, 31, 58, 0.45)',
        'ai-glow-cyber':   '0 0 24px rgba(6, 182, 212, 0.35)',
        'ai-glow-primary': '0 0 28px rgba(30, 58, 138, 0.30)',
        'ai-alarm':        '0 0 20px rgba(220, 38, 38, 0.55)',
      },
      letterSpacing: {
        'gt-tight': '-0.03em',
        'gt-tighter': '-0.02em',
        'gt-wide': '0.2em',
        'gt-wider': '0.25em',
        'ai-mono': '0.02em',
        'ai-eyebrow': '0.22em',
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
        // ArmorInnovate
        'ai-blink':        'ai-blink 1s steps(2, end) infinite',
        'ai-scan':         'ai-scan 4s linear infinite',
        'ai-alarm-pulse':  'ai-alarm-pulse 1.4s ease-in-out infinite',
        'ai-data-flicker': 'ai-data-flicker 3s ease-in-out infinite',
        'ai-fade-up':      'ai-fade-up 600ms cubic-bezier(0.22, 1, 0.36, 1) both',
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.05)' },
        },
        // ArmorInnovate
        'ai-blink': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
        'ai-scan': {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'ai-alarm-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(220, 38, 38, 0.55)' },
          '50%':      { boxShadow: '0 0 0 6px rgba(220, 38, 38, 0)' },
        },
        'ai-data-flicker': {
          '0%, 92%, 100%': { opacity: '1' },
          '94%':           { opacity: '0.6' },
          '96%':           { opacity: '1' },
          '98%':           { opacity: '0.85' },
        },
        'ai-fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'ai-grid':
          "linear-gradient(rgba(148,163,184,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.07) 1px, transparent 1px)",
        'ai-grid-deep':
          "linear-gradient(rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.06) 1px, transparent 1px)",
        'ai-scanline':
          'repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0 1px, transparent 1px 3px)',
      },
      backgroundSize: {
        'ai-grid': '32px 32px',
      },
    },
  },
  plugins: [],
};

export default config;
