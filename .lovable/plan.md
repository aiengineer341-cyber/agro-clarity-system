
## Goal
Refresh the app's visual layer with real agriculture imagery and tasteful motion, and tighten the navigation so tabs are consistent, mobile-friendly, and free of duplicates.

## 1. Navigation restructure (`src/components/top-nav.tsx`)

Current tabs: Monitoring · Detect · Analysis · History · Knowledge — "Analysis" and "History" overlap conceptually and there's no mobile menu.

New structure (single source of truth, no duplicates):
- **Monitoring** → `/dashboard`
- **Detect** → `/detect`
- **Analytics** → `/analysis` (charts)
- **Records** → `/history` (raw list)
- **Knowledge** → `/knowledge`

Improvements:
- Sticky header already present — keep `sticky top-0`, add subtle shadow on scroll.
- Active state: underline indicator that slides between tabs (animated via Tailwind transition on a `::after` bar), plus `text-primary`.
- Mobile: add a hamburger (`Menu` icon from lucide) that opens a slide-down sheet listing the 5 tabs with fade-in stagger. Use existing `Sheet` shadcn component.
- Keep "Live" pill + sign-out in the header row.

## 2. Real agriculture imagery

Replace placeholder/abstract visuals with generated photo-real crop & field imagery (stored in `src/assets/` as `.jpg`).

Images to generate (premium model, photo-realistic):
- `hero-field.jpg` — drone view of a green crop field at golden hour (landing hero, replaces the "scan line" placeholder card).
- `crop-leaf-macro.jpg` — close-up of a healthy maize leaf with dew (Knowledge page header / Detect empty-state).
- `farmer-tablet.jpg` — farmer inspecting plants with tablet (Dashboard empty-state / Analytics header).
- `disease-leaf.jpg` — leaf showing visible disease lesions (Detect page sample / History fallback thumbnail).

Used in:
- **Landing** (`src/routes/index.tsx`): swap the placeholder "Satellite Core Vision Feed" card for `hero-field.jpg` with overlay metrics + scan-line animation kept on top.
- **Dashboard** (`_authenticated.dashboard.tsx`): hero strip with `farmer-tablet.jpg`, dark gradient overlay, KPI text on top.
- **Detect** (`_authenticated.detect.tsx`): empty-state preview uses `crop-leaf-macro.jpg`.
- **Analytics** (`_authenticated.analysis.tsx`): subtle banner using `crop-leaf-macro.jpg` behind the KPI strip.
- **Knowledge** (`_authenticated.knowledge.tsx`): header banner with `disease-leaf.jpg`.
- **History** thumbnails: fallback to `disease-leaf.jpg` when storage image is missing.

## 3. Animation system

Use only the allowed set: fade-in, fade-out, slide-up, slide-down, hover, micro-interactions. No parallax, no heavy scroll effects.

Add to `src/styles.css` (extend existing keyframes):
- `@keyframes slide-up` (translateY 12px → 0, opacity 0 → 1)
- `@keyframes slide-down` (translateY -12px → 0, opacity 0 → 1)
- Utility classes: `.animate-slide-up`, `.animate-slide-down`, `.animate-fade-in` (already in tailwind config), stagger via `style={{ animationDelay }}`.

Applied:
- Page entry: each main page wraps content in `animate-fade-in`. Hero sections add `animate-slide-up`.
- Cards (feature grid, KPI cards, history rows): `animate-slide-up` with 60–80 ms stagger.
- Buttons: existing hover state + `hover:-translate-y-0.5 transition-transform` micro-interaction (already used on landing CTA — extend to dashboard/detect primary buttons).
- Nav tabs: `transition-colors` on hover + animated underline bar.
- Mobile menu: slide-down on open, fade-out on close.
- Toast/dialog: leave shadcn defaults.

## 4. Files touched

- `src/components/top-nav.tsx` — restructured tabs, mobile sheet, animated active indicator.
- `src/styles.css` — add `slide-up` / `slide-down` keyframes + utilities.
- `src/assets/hero-field.jpg`, `crop-leaf-macro.jpg`, `farmer-tablet.jpg`, `disease-leaf.jpg` — generated (premium imagegen).
- `src/routes/index.tsx` — hero imagery + entry animations.
- `src/routes/_authenticated.dashboard.tsx` — banner + staggered cards.
- `src/routes/_authenticated.detect.tsx` — empty-state image + fade-in results.
- `src/routes/_authenticated.analysis.tsx` — header banner + slide-up KPI/chart cards.
- `src/routes/_authenticated.history.tsx` — fallback image + slide-up rows.
- `src/routes/_authenticated.knowledge.tsx` — header banner + fade-in cards.

## Out of scope
- No new routes, no backend/database changes, no auth changes.
- No new animation libraries (Framer Motion, GSAP) — pure CSS keyframes only.
- No redesign of the dark theme tokens; colors stay as defined in `styles.css`.
