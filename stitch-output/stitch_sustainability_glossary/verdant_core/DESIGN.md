```markdown
# Design System Document

## 1. Overview & Creative North Star: "The Living Archive"
This design system is built to transform sustainability education from a static experience into an immersive, high-end editorial journey. Our Creative North Star is **"The Living Archive."** 

Unlike traditional e-learning platforms that feel cluttered and clinical, this system mimics the tactile prestige of a premium architectural journal. We break the "standard web template" through **intentional asymmetry**, where content isn't just placed on a grid but curated within a landscape. By leveraging expansive whitespace (the "breath" of the system) and sophisticated layering, we create an environment that feels authoritative yet deeply organic. We move away from rigid lines and toward tonal depth, ensuring the user feels they are interacting with a living, breathing body of knowledge.

---

## 2. Colors & Surface Philosophy
The palette is rooted in the deep, regenerative greens of old-growth forests and the crisp clarity of morning light. 

### The "No-Line" Rule
To maintain a high-end, bespoke feel, **1px solid borders are strictly prohibited for sectioning.** 
*   **The Technique:** Boundaries must be defined solely through background shifts. For example, a `surface-container-low` section should sit directly against a `surface` background. 
*   **The Goal:** This creates a "seamless horizon" effect that feels more natural and less "engineered."

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of fine, heavy-stock paper.
*   **Tiered Depth:** Use `surface-container-lowest` (#ffffff) for the most elevated interactive elements (like course cards) sitting on a `surface-container-low` (#f3f4f5) background.
*   **Nesting:** When nesting information, move one step up or down the container scale (Lowest to Highest) to define importance rather than adding a stroke.

### The "Glass & Gradient" Rule
To elevate the experience beyond "flat design," use Glassmorphism for floating navigation or overlay modals.
*   **Execution:** Apply semi-transparent `surface` colors with a `backdrop-blur` (20px–40px). 
*   **Signature Textures:** For Hero sections or Primary CTAs, use a subtle linear gradient transitioning from `primary` (#005c55) to `primary_container` (#0f766e). This adds "visual soul" and a sense of light hitting a dense canopy.

---

## 3. Typography: Editorial Authority
Our typography uses a high-contrast scale to guide the eye through complex educational content.

*   **Display & Headlines (Manrope):** These are our "Voice." `display-lg` (3.5rem) should be used with generous letter-spacing to command attention. Manrope’s geometric yet warm terminals provide a modern, professional edge.
*   **Body & Labels (Inter):** These are our "Utility." Inter is chosen for its exceptional readability at small sizes. `body-lg` (1rem) is the workhorse for course content, ensuring maximum legibility without eye strain.
*   **The Identity Shift:** By pairing the structured, architectural feel of Manrope with the neutral clarity of Inter, we convey a brand that is both scientifically rigorous and human-centric.

---

## 4. Elevation & Depth
In "The Living Archive," depth is felt, not seen. We avoid the heavy, muddy shadows of generic UI kits.

*   **Tonal Layering:** Use the surface-container tiers to create a soft, natural lift. A card using `surface-container-lowest` on top of a `surface-dim` background creates a clear hierarchy through luminosity alone.
*   **Ambient Shadows:** If a floating element (like a FAB or dropdown) requires a shadow, use a large blur (30px+) and very low opacity (4%-6%). The shadow color should be a tinted version of `on_surface` (#191c1d) to mimic natural light refraction.
*   **The "Ghost Border" Fallback:** If a container absolutely requires a boundary (e.g., a search input), use the `outline_variant` token at **20% opacity**. Never use 100% opaque borders.
*   **Interactivity:** On hover, elements shouldn't just "glow"—they should physically "lift" by shifting from `surface-container-low` to `surface-container-lowest`.

---

## 5. Components

### Buttons
*   **Primary:** Solid `primary` background. No border. Large horizontal padding (using Spacing `6` or `2rem`). Roundedness: `md` (0.75rem).
*   **Secondary:** `surface-container-highest` background with `on_surface` text. This feels integrated into the page rather than competing with the Primary CTA.
*   **Tertiary:** Ghost style. No background; text only in `primary`. Use for low-emphasis actions like "Cancel" or "Back."

### Cards & Course Modules
*   **The Rule:** Absolutely no divider lines. 
*   **Structure:** Separate the "Image," "Category Label," and "Title" using vertical white space from the Spacing Scale (specifically `3` or `4`). Use a `surface-container-low` background for the card body to subtly distinguish it from the page.

### Input Fields
*   **Style:** Minimalist. Use `surface-container-low` as the field background. Labels use `label-md` in `on_surface_variant`. 
*   **Focus State:** Transition the background to `surface-container-lowest` and add a "Ghost Border" of `primary` at 30% opacity.

### Progress Indicators (Sustainability Context)
*   **The "Vines" Indicator:** For course progress, use a thin, horizontal bar. The unfilled portion is `secondary_container`, and the filled portion is a gradient of `secondary` to `primary`. This reinforces the eco-friendly narrative through color.

---

## 6. Do’s and Don’ts

### Do
*   **DO** use extreme whitespace. If a section feels "comfortable," add 20% more space (Scale `16` or `20`).
*   **DO** use asymmetrical layouts for Hero sections—place text on the left and allow imagery to bleed off the right edge of the screen.
*   **DO** use `tertiary_fixed` for "Inspiration" callout boxes to give them a distinct, scholarly feel.

### Don’t
*   **DON’T** use pure black (#000000). Always use `on_surface` or `on_tertiary_fixed` for text to keep the palette organic.
*   **DON’T** use standard 1px dividers to separate list items. Use Spacing `4` (1.4rem) and let the alignment create the structure.
*   **DON’T** use sharp corners. Every element should have a minimum roundedness of `sm` (0.25rem) to maintain a soft, approachable aesthetic.

---

## 7. Spacing & Rhythm
This system relies on a **"Breathable Grid."** Avoid "compact" layouts.
*   **Standard Padding:** Use `8` (2.75rem) for container padding.
*   **Section Gaps:** Use `20` (7rem) or `24` (8.5rem) to separate major content blocks. This creates the "Editorial" feel where every piece of information has its own "gallery space." 
*   **Micro-spacing:** Use `1.5` (0.5rem) for labeling and metadata to keep them tightly bound to their parent objects.```