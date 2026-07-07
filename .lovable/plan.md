## Context

The app is dark-mode only (`:root` in `src/styles.css` already defines the dark palette; there is no light theme to switch to). After the last change, chart fills and axes use theme tokens correctly, but a few Recharts elements still don't inherit the dark palette:

- **Legend text** — Recharts renders legend labels with an inline `color: #000` by default, which is unreadable on the dark card background.
- **Tooltip label + item text** — `contentStyle` only styles the wrapper; the item name/value use `itemStyle` / `labelStyle` and default to near-black.
- **Tooltip cursor on line charts** — currently a faint primary stroke, hard to see on dark.
- **Pie slice separators** — thin `var(--color-card)` stroke is fine, but very small slices disappear on dark; add a subtle outer stroke.
- **KPI strip divider** — `bg-border` gap is nearly invisible on dark; bump to `bg-background` for crisper separators like the dashboard.

## Fix (scope: `src/routes/_authenticated.analysis.tsx` only)

1. **Global chart text defaults** — introduce shared style objects and apply them everywhere:
   - `tooltipLabelStyle = { color: "var(--color-muted-foreground)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }`
   - `tooltipItemStyle = { color: "var(--color-foreground)", fontSize: 12 }`
   - `legendStyle = { fontSize: 11, color: "var(--color-foreground)", textTransform: "capitalize" }`
   - Pass `labelStyle={tooltipLabelStyle}` and `itemStyle={tooltipItemStyle}` on every `<Tooltip>`.
   - Pass `wrapperStyle={legendStyle}` on every `<Legend>` and add `formatter={(v) => <span style={{ color: "var(--color-foreground)" }}>{v}</span>}` so per-item legend text overrides Recharts' hard-coded black.

2. **Line chart cursor + dot contrast** — change tooltip `cursor` to `{ stroke: "var(--color-accent-bright)", strokeOpacity: 0.5, strokeDasharray: "3 3" }`, and give the `Line` `dot` a `stroke: "var(--color-background)"` so points read on the dark grid.

3. **Bar cursor contrast** — replace the low-opacity `var(--color-accent)` cursor with `{ fill: "var(--color-primary)", fillOpacity: 0.08 }` so the hover band is visible but non-dominant.

4. **Pie slice contrast on dark** — keep `stroke="var(--color-card)"` but add `strokeWidth={2}` and wrap the container so tiny slices (e.g. a single "healthy" category) still show a visible ring. When only one category exists, render a centered summary label ("100% Healthy") instead of a solid ring that looks black.

5. **Empty-slice guard** — for both pie charts, if all values are 0, render the same "No data yet." placeholder used elsewhere instead of an empty SVG.

6. **KPI strip separators** — change the `gap-px bg-border` container to `gap-px bg-background` so the 1px seams read on dark, matching the dashboard's KPI row.

7. **Panel hover + focus** — bump `hover:border-primary/30` to `hover:border-primary/50` and add `focus-within:border-primary/60` so keyboard focus on a chart control is visible in dark mode.

## Not changing

- Data fetching, realtime subscription, `computeStats`, or KPI logic.
- The header, layout grid, or any other route.
- `src/styles.css` tokens (dark palette is already correct).
- `dashboard-charts.tsx` (already renders correctly on dark).

## Technical note

Recharts injects inline `color: #000` / `fill: #000` into legend items and tooltip rows regardless of parent CSS, so overriding requires explicit `labelStyle`, `itemStyle`, `wrapperStyle`, and a legend `formatter` returning styled markup. Simply setting `color` on the parent has no effect.
