## Problem

The Analytics dashboard renders charts with mostly black/invisible fills (see screenshot: donut is black, bars are black, grid lines missing). The chart code uses `hsl(var(--primary))`, `hsl(var(--border))`, etc., but the design tokens in `src/styles.css` are defined as `oklch(...)` values — not space-separated HSL channels — so `hsl(var(--primary))` evaluates to an invalid color and Recharts falls back to black.

`dashboard-charts.tsx` already does this correctly (uses `var(--color-primary)`). The analytics page just needs the same treatment plus a slight palette pass to match the emerald/amber/red app palette.

## Fix (scope: `src/routes/_authenticated.analysis.tsx` only)

1. **Replace every `hsl(var(--x))` with `var(--color-x)`** in axes, grids, tooltips, lines, bars, and pies. This is a mechanical swap that immediately restores color.

2. **Rework the two palette maps** to use semantic tokens instead of raw HSL literals:
   - `SEVERITY_COLORS`: `healthy → var(--color-success)`, `mild → var(--color-primary)`, `moderate → var(--color-warn)`, `severe → var(--color-destructive)`, `unknown → var(--color-muted-foreground)`.
   - `MODE_COLORS`: `[var(--color-primary), var(--color-warn), var(--color-accent-bright), var(--color-chart-4)]` so input-mode slices match the app's emerald/amber/mint/teal palette instead of cyan/purple/pink.

3. **Polish the chart chrome** to align with the rest of the app (matches `dashboard-charts.tsx`):
   - Tooltip: `background var(--color-card)`, `1px solid var(--color-border)`, radius 2, font-size 12, mono-ish.
   - Grid: `strokeDasharray="2 4"`, `vertical={false}`, stroke `var(--color-border)`.
   - Axis ticks: `fill var(--color-muted-foreground)`, `fontSize 10`, mono family, `stroke var(--color-border)`.
   - Line chart: add a soft `activeDot` and a second-line style consistent with the dashboard.
   - Pie strokes: use `var(--color-card)` to get the crisp separator ring like the dashboard donut.
   - Legend: `fontSize 11`, capitalized.

4. **Small readability tweaks** (no logic changes):
   - Bar radius kept, but `Bar fill` uses `var(--color-primary)` (currently invisible).
   - Vertical "Top Diseases" bars: give each bar a slight gradient by using `var(--color-primary)` fill and `var(--color-accent-bright)` on hover via `activeBar`.

## Not changing

- Data fetching, realtime subscription, KPI logic, `computeStats`, layout/grid, header, or any other route.
- `src/styles.css` tokens.
- `dashboard-charts.tsx` (already correct).

## Technical note

Root cause is a CSS token format mismatch: shadcn's default `hsl(var(--token))` pattern only works when tokens are stored as `H S L` triplets. This project stores them as full `oklch(...)` colors and re-exports them via `@theme inline` as `--color-*`, so components must reference `var(--color-*)` directly.
