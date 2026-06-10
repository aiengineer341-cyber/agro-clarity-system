## Goal

1. **Version history**: every time a user edits a prediction on the dashboard, store a timestamped snapshot of the prior values so they can browse, diff, and (optionally) restore.
2. **Visualization**: add an interactive analytics panel to `/dashboard` with a line chart (detections-over-time trend) and a pie chart (severity / disease distribution).

## 1. Version history

### Schema
New table `public.detection_versions`:
- `id uuid pk`
- `detection_id uuid` → `detections.id` (ON DELETE CASCADE)
- `user_id uuid` (the editor)
- `changed_at timestamptz default now()`
- `changed_fields text[]` (which keys changed)
- `previous jsonb` (full previous values for those fields)
- `next jsonb` (new values)

RLS: owner can SELECT/INSERT for their own detections; admins can SELECT. GRANT to authenticated + service_role.

### Server functions (`src/lib/detections.functions.ts`)
- Update `updateDetection`: before writing the patch, fetch the current row, diff against the patch, and insert a `detection_versions` row capturing only changed fields. Then apply the update.
- New `listDetectionVersions({ detection_id })`: returns versions ordered by `changed_at desc`.
- New `restoreDetectionVersion({ version_id })`: applies `version.previous` back to the detection (also creates a new version row — restore is itself an edit).

### Dashboard UI
In the expanded preview drawer, add a "History" toggle next to Edit/Delete. Opens an inline panel listing each version:
- timestamp (relative + absolute on hover)
- changed fields as chips
- expandable diff (previous → next per field)
- **Restore** button per entry

## 2. Visualization

New section on `/dashboard` titled "Trends & Distribution", placed above "Recent Detections":

- **Line chart** (recharts `LineChart`): detections per day for the last 30 days, with selectable range buttons (7d / 30d / 90d). One line for total, optional second line for severe cases. Interactive tooltip with date + counts. Animated draw on mount (recharts default).
- **Pie chart** (recharts `PieChart`): toggle between **Severity distribution** (healthy/mild/moderate/severe) and **Top diseases** (top 5 + "Other"). Interactive: hover slice highlights + tooltip with count and %.

Both pull from the same `det` array already loaded by the dashboard — no extra fetch. Use design tokens for stroke/fill (`--primary`, `--destructive`, `--warn`, `--success`, `--muted`).

## Technical notes

- Charts in a new `src/components/dashboard-charts.tsx` to keep the route file lean.
- Recharts and date-fns are already installed.
- All animations stay within allowed set (fade-in panels, default recharts transitions).
- No changes to detection/save flow on `/detect` — versions are recorded only on edits via `updateDetection`.

## Files

- New migration: `detection_versions` table + RLS + grants.
- Edited: `src/lib/detections.functions.ts` (version diff on update, list, restore).
- New: `src/components/dashboard-charts.tsx`.
- New: `src/components/version-history.tsx`.
- Edited: `src/routes/_authenticated.dashboard.tsx` (charts section, History toggle in drawer).
