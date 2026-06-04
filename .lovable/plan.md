## Goal
Capture full scan input/metadata in the DB, and add a dedicated `/analysis` page with charts. Monitoring keeps its current row-per-prediction view.

## 1. Database — extend `detections`

New migration adds these columns (nullable, safe with existing rows):

- `input_mode` text — `'upload' | 'camera' | 'voice' | 'text'`
- `description` text — typed/dictated symptom transcript
- `rag_docs_used` int
- `lat` double precision, `lng` double precision (replaces unused `gps` text for structured queries; keep `gps` for back-compat)
- `model` already exists — start populating it from the server fn

RLS/grants unchanged (already correct for owner + admin/extension_officer).

## 2. Server function — `detect.functions.ts`
Return `input_mode`, `description`, `rag_docs_used`, `model`, and (optional) `lat`/`lng` in the result so the client can persist them.

## 3. Detect page — `_authenticated.detect.tsx`
- Track the active `mode` and pass it through.
- Request `navigator.geolocation` once (best-effort, silent on denial).
- Insert rows into `detections` with the new fields populated (still one row per ranked prediction, grouped by `scan_id`).

## 4. New Analysis page — `_authenticated.analysis.tsx`
Route `/analysis` (update top-nav `Analysis` link from `/history` → `/analysis`; keep `/history` for the raw list).

Charts (Recharts — already in deps via shadcn `chart.tsx`):
- **Scans over time** — line chart, scans/day for last 30 days (group by `scan_id`).
- **Severity distribution** — donut (healthy / mild / moderate / severe).
- **Top diseases** — horizontal bar, top 8 by count.
- **Crop breakdown** — bar, scans per crop.
- **Input mode mix** — small donut (upload/camera/voice/text).
- KPI strip: total scans, avg confidence, severe rate, most-affected crop.

Reads via `supabase.from('detections').select(...)` scoped by RLS to the signed-in user.

`head()` with unique title/description/canonical, h1 "Field Analytics".

## 5. Top-nav
`{ to: "/analysis", label: "Analysis" }` (was `/history`). History stays reachable from the dashboard "Review" link and the Detect page's "View in history".

## Technical notes
- Recharts is already available; no new deps.
- No edge functions — all writes happen client-side via the existing pattern; the server fn only enriches the result.
- Migration is additive and back-compat: old rows render fine (new fields just show "—" in any future UI).