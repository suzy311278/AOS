# Sustainability Academy - Design System for Stitch

## Brand
- Name: Sustainability Academy (or Greentryst)
- Industry: Sustainability education, ESG tools, career platform
- Tone: Professional, trustworthy, modern, approachable

## Colors
- Primary: #00433d (deep teal)
- Primary Light: #005c55
- Primary Container: #006a63
- Primary Fixed: #a7f0e6
- Surface: #f8faf9
- Surface Dim: #d8dada
- Surface Container: #eceeed
- Surface Container Low: #f2f4f3
- Surface Container High: #e6e9e8
- On Surface: #191c1c
- On Surface Variant: #3f4947
- On Primary: #ffffff
- Outline: #6f7977
- Outline Variant: #bec9c6
- Accent Green: #22c55e (for success states, streaks)
- Accent Amber: #f59e0b (for warnings, Pro badge)
- Accent Blue: #3b82f6 (for links, info states)

## Typography
- Headlines / Display: Manrope, weight 700-800
- Body / Labels: Inter, weight 400-600
- Monospace (code/formulas): JetBrains Mono

## Shape
- Cards: border-radius 16px (rounded-2xl)
- Buttons: border-radius 9999px (fully rounded / pill shape)
- Inputs: border-radius 12px
- No 1px borders anywhere. Use tonal surface layering and subtle shadows instead.
- Card hover: translateY(-4px) with soft shadow

## Spacing
- Section padding: 80px vertical on desktop, 48px on mobile
- Card padding: 24px
- Grid gap: 24px
- Max content width: 1200px, centered

## Component Patterns
- Glass effect: rgba(255,255,255,0.08) + backdrop-blur(16px) for overlays
- Gradients: linear-gradient(135deg, #00433d 0%, #006a63 100%) for hero/dark sections
- Tonal layering: Use surface variants (#f8faf9 -> #eceeed -> #e6e9e8) to create depth without borders
- Shadows: 0 4px 6px -1px rgba(0,0,0,0.1) for cards, 0 10px 15px -3px rgba(0,0,0,0.1) for elevated elements

## Navigation
- Desktop: Horizontal top bar with logo, 4 items (Learn, Tools, Jobs, Pricing), search icon, user avatar
- Mobile: Top bar with logo + hamburger. No bottom tab bar on marketing pages.
- Nav background: white with subtle shadow, not glass

## Icons
- Style: Outlined, consistent stroke weight
- Use simple recognizable icons, not filled/heavy ones
