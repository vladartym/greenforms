# Greenspace Health — Brand & Style (Visual Identity)

Observed from a live tour of `greenspacehealth.com/en-ca/`. All values come from the site's computed styles (DOM-inspected via Chrome MCP), so fonts and hex values are exact rather than eyeballed. Pages visited: Home, About, Measurement-Based Care (product), For Organizations, Contact.

---

## Overview

Greenspace pairs a **serious, editorial serif** for body copy with a **modern geometric sans-serif** for headings, buttons, and UI — a combination that reads as clinical yet warm. The layout rhythm is the most distinctive move: every scroll reveals a **new full-bleed colored section**, alternating between saturated "bold" backgrounds (brand green, indigo, wine red, chartreuse, periwinkle) and soft pastel "relief" tones (cream, sage, blush, pale blue). Buttons are **pill-shaped** and mostly in the primary green. Overall impression: **healthcare-grade trust, but visually playful** — not the sterile blue/white typical of clinical SaaS.

---

## Typography

| Role | Typeface | Notes |
|---|---|---|
| Headings, buttons, UI, form inputs | **Matter** (by Displaay) | Loaded as `"Matter TRIAL"` on the live site. Neo-grotesque sans with humanist warmth. All weights on site render at **400 (Regular)** — no bold headings. |
| Body copy, labels, footer | **Tiempos Text** (by Klim Type Foundry) | Editorial serif. Calm, trustworthy, reads well at small sizes. |

**Size hierarchy (observed, desktop):**

| Element | Size | Weight | Line height | Color |
|---|---|---|---|---|
| H1 | `40.5px` (~2.5rem) | 400 | `48.6px` (~1.2) | white on dark hero, `#090909` on light |
| H2 | `34.2px` (~2.1rem) | 400 | — | `#090909` |
| Body | `18px` | 400 | — | `#090909` |
| Form label | `17.1px` | 400 (Tiempos) | — | `#090909` |
| Form input text | `14.4px` | 400 (Matter) | — | `rgba(0,0,0,0.5)` placeholder |
| Primary button (nav) | `14px` | 400 | — | white |
| Primary button (body) | `18px` | 400 | — | white |

**Notable choices:**
- Headings never go bolder than Regular (400). The display typeface does the heavy lifting, not the weight.
- Letter-spacing is left at `normal` — no tracking tightening on large headings.
- Labels use the serif; inputs use the sans. Small, deliberate contrast.

---

## Color Palette

### Primary

| Token | Hex | RGB | Usage |
|---|---|---|---|
| **Brand Green** | `#10633F` | `16, 99, 63` | Primary CTAs, logo, `.bg-primary`, hero backgrounds, cookie-banner accept. The single most important color. |
| Green (variants) | `#2D6142`, `#147945` | — | Slight variations seen on product page (`#2F6043`) — likely hover/section tints. |
| Ink | `#090909` | `9, 9, 9` | Default body text. Near-black, not pure black. |
| White | `#FFFFFF` | — | Text on dark, card backgrounds, inverted buttons. |

### Bold Section / Hero Backgrounds

Greenspace uses a surprisingly wide set of **saturated full-bleed block colors** — each page tends to use 1–2 as "hero" or "CTA" blocks.

| Token (observed class) | Hex | Where seen |
|---|---|---|
| Brand Green (`.bg-primary`) | `#10633F` | Home hero, About hero, "community" CTA |
| Indigo (`.new-testimonial`) | `#333295` | Testimonial sections (sitewide), Organizations page body |
| Wine Red | `#9C0002` | Organizations page hero |
| Deep Red | `#8F1B11` | Product-page section |
| Chartreuse (`.cta.bg-green`) | `#D9DB57` | Home "Learn how MBC can help" CTA block |
| Periwinkle | `#7082E2` / `#717FD8` | Final CTA block on Home + Product page |

### Pastel / "Relief" Section Backgrounds

Paired with the bold blocks to pace the scroll.

| Token | Hex | Where seen |
|---|---|---|
| Cream | `#F6E6D1` | Home "Clients and Patients" section |
| Sage (`.bg-light`) | `#E8EED4` | About "What We Do", product "see in action" |
| Pale Blue-Lavender (`.bg-blue-light`) | `#DEE3F0` | About "How Greenspace Began", product "A Platform That Matters", Contact hero |
| Blush (`.bg-red-light`) | `#FAE1D8` | About bottom CTA |
| Off-white | `#F9F9F9` | Secondary button fills (e.g. cookie deny) |

> **The pattern:** every page is a vertical stack of ~8–12 sections, alternating between a saturated color, a pastel, and white. No section is "just" white for long — each page feels like a small magazine rather than a traditional SaaS landing page.

---

## Logo

**Greenforms logo (ours):**
- `static/logos/greenforms-logo-black.svg` — dark wordmark for light backgrounds (default header, body sections)
- `static/logos/greenforms-logo-white.svg` — white wordmark for dark/saturated backgrounds (green hero, indigo testimonial blocks, footer if dark)

**Usage:**
- Default header placement: left-aligned, same slim horizontal wordmark treatment Greenspace uses (~160px wide × ~24px tall as a starting point — adjust to the wordmark's natural proportions).
- Always use the SVG (don't rasterize). Both files already exist as inline SVG so they scale cleanly.
- Alt text: `"Greenforms"` (full brand name, even if the wordmark shows a shortened form).
- No icon/monogram yet — wordmark alone, matching Greenspace's approach.

**Greenspace reference (for comparison):**
- Three variants on their site (SVG): `logo-dark.svg`, `logo-inverted.svg`, `logo-primary.svg` (green/brand-colored).
- Rendered header size: `163×23px`.
- *Consider adding a green-colored variant* (`greenforms-logo-green.svg`) later if we ever need the wordmark on pastel backgrounds where neither pure black nor pure white feels right.

---

## Imagery

- Aspect ratio ~**0.9** (portrait-ish): most content images are approximately `432×495` or `434×459` px rendered.
- Mix of:
  - **Real photography** — clinicians, patients, office scenes (e.g. `pexels-tima-miroshnichenko-8376232-scaled.jpg` sourced from Pexels; `image_clinician.jpg`).
  - **Branded / conceptual illustration-photos** — filenames hint at Adobe Firefly usage (`Firefly-Homepage2.png`), and there are designed image-on-color compositions (e.g. `GreenMRI-1.jpg`, `mbc_for1.png`).
- **Team page:** only 2 `team`-prefixed images — the "Meet Our Team" section (3157px tall) suggests a long grid of individual portraits.
- No heavy filter/duotone treatment observed — photos appear in their natural color.

---

## Iconography

- **Total SVGs on homepage: 9** — icons are used sparingly, not ornamentally.
- SVG inline strokes observed are `1.5px width`, `round` linecap, `round` linejoin, black (via `currentColor`) — standard **line-icon** style (not filled).
- Third-party form library (Formidable) ships its own icon pack with 24×24 viewboxes, matching that same outlined style.

---

## Layout & Spacing

- **Container:** standard max-width container inside every section (no full-bleed text).
- **Header height:** `63px` — compact fixed top nav.
- **Section vertical padding:** `49.5px` top/bottom on most, `70px 0 50px` on larger feature blocks.
- **Section height range (home page):** from `304px` (small CTA block) to `962px` (feature-rich explainer) — sections are deliberately varied in height to avoid a monotone scroll.
- **Section class vocabulary** (useful reference if you want to mirror the system):
  - `section double` → 2-column layout
  - `section triple` → 3-column grid
  - `section has-swiper` → carousel/slider
  - `section reversed` → flipped 2-col order
  - `section inverted` → light text on dark bg
  - `section cta` → dedicated CTA block
  - Paired with background tokens: `bg-primary`, `bg-light`, `bg-blue-light`, `bg-red-light`, `bg-green` (chartreuse, not the brand green — slightly confusing naming).

---

## Components

### Buttons

Pill-shaped, Matter font, no uppercase, no letter-spacing change. Three consistent variants:

| Variant | Background | Text | Radius | Padding | Weight |
|---|---|---|---|---|---|
| **Primary (filled)** | `#10633F` | white | `36px` (pill) | `0–18px` horiz, `~2px` vert | 400 |
| **Inverted primary** (on dark) | white | `#090909` | `36px` | same | 400 |
| **Outline / text** (secondary) | transparent | `#10633F` | `0` / `36px` | minimal | **600** |
| **Nav "Book a Demo"** (smaller) | `#10633F` | white | `36px` | `5px 12px 6px` | 400 |

Notably: buttons have **no border-width**, no visible outline, no shadow, and no text transform. Visual weight comes only from the pill shape + filled color.

### Form fields

- **Inputs / textareas:** white background, **no visible border**, **`0px` border-radius** (square), `13.5px 18px` padding, Matter 14.4px, placeholder at `rgba(0,0,0,0.5)`.
- **Labels:** serif (Tiempos Text) at 17.1px in near-black — noticeably warmer than the input itself.
- **Submit:** same primary pill button as the rest of the site.

### Cards

- Radius: **`12px`**
- Shadow: **`0 4px 12px rgba(0,0,0,0.1)`** — subtle, single elevation level.
- Background: white.
- Example: `.video-card` for video testimonials carousel.

### Navigation

- Thin top bar, `63px` tall, transparent/white background over body.
- Wordmark on left, category dropdowns center (Measurement-Based Care, Solutions, Learn), "Sign In" + primary green "Book a Demo" pill on right.
- Mega-menu dropdowns with deep child lists ("For Organizations", "For Clients", "For Providers", "For Researchers", "For Schools", "For Health Plans", etc.).

### Footer

- Uses Tiempos serif for copy.
- Transparent background on outer `footer`; contained within `.footer-container.container`.
- Standard grouping: Company links (About, Contact, Careers, Privacy & Security), plus legal (Accessibility, Privacy Policy, Terms of Use).

---

## Page-by-page notes

### Home (`/en-ca/`)
- H1 hero on brand-green: *"The future of mental health care, now."* — white text, 40.5px.
- Alternates: green hero → white explainer → cream → white → chartreuse CTA → white → indigo testimonial → sage → pale blue 3-up → periwinkle CTA.
- Long page (~11 sections).

### About (`/en-ca/company/about/`)
- H1 on brand-green: *"Mission Driven, Since Day One"*.
- Long team page — the "Meet Our Team" section alone is 3157px tall (grid of portraits).
- "How Greenspace Began" uses pale-blue background; "We Make MBC Easier..." uses blush pink — this page leans more pastel than Home.

### Measurement-Based Care (`/en-ca/measurement-based-care/`)
- H1 (white section): *"The Measurement-Based Care Platform That Helps Everyone Thrive."*
- **Product UI mockups** appear here (`<img alt="MBC Dashboard">` with 1440×1031 viewBox placeholders).
- Much more varied colors than other pages: pale blue, sage, periwinkle, indigo, deep-red (`#8F1B11`), and a secondary green section.

### For Organizations (`/en-ca/organizations/`)
- H1 on **wine-red** (`#9C0002`): *"The highest possible quality of care."* — the only page hero that is red; suggests red is reserved for the "enterprise/decision-maker" audience.
- Heavy use of indigo `#333295` for the supporting feature blocks.

### Contact (`/en-ca/company/contact/`)
- Pale-blue hero (`#DEE3F0`), no large H1 — this page leads with the form.
- Form is the clearest place to see the input styling described above.

---

## Things I did NOT see / worth flagging

- **No visible pricing page** in nav — "Book a Demo" gates it.
- **No explicit hover-state** captures (would need interaction to confirm; assume the green darkens slightly).
- **No motion/animation** observed in static DOM reads (carousels exist via Swiper; presence of motion design beyond that wasn't verified).
- **"Matter TRIAL"** in the font stack implies the site is currently running a **trial/demo version** of the Matter typeface — worth noting if you're benchmarking licensing.

---

## Quick "how to look like Greenspace" cheat sheet

1. Pair a **neo-grotesque sans display** (Matter, or similar: Söhne, Neue Haas Grotesk, Inter) with an **editorial serif body** (Tiempos, or similar: Source Serif, Lora).
2. Pick **one saturated brand color** (theirs: `#10633F`) and use it for all CTAs, **pill-shaped**, `36px` radius.
3. Build pages as a **vertical stack of full-bleed sections**, alternating one saturated block with one pastel.
4. Keep **all headings at weight 400** — let the typeface and size do the work.
5. Forms: **square inputs, no border**, serif labels, sans input text.
6. Cards: `12px` radius, `0 4px 12px rgba(0,0,0,0.1)` shadow, nothing more.
