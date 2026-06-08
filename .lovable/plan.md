## Goal

Turn the Dashboard from a read-only telemetry view into an interactive workspace where users can preview their saved predictions (image + analysis data), edit any field, replace the image, and delete individual ranked predictions — all without leaving the dashboard.

## UX

On `/dashboard`, the existing "Recent Detections" list becomes interactive:

- Clicking a row expands an inline **Preview drawer** showing:
  - Uploaded image thumbnail (large, with hover zoom)
  - Crop, disease, severity badge, urgency dot, confidence %
  - Symptoms / Treatment / Prevention / Description blocks
  - Timestamp + rank (#1, #2, #3) within its scan
- Two actions in the drawer header: **Edit** and **Delete**.
- **Edit mode** swaps the drawer into a form with:
  - Diagnosis: disease (text), severity (select: healthy/mild/moderate/severe), urgency (select: low/medium/high), confidence (0–100 slider)
  - Clinical notes: symptoms, treatment, prevention (textareas)
  - Context: crop (select), description (textarea)
  - Image: "Replace image" file input → uploads to `vision-images`, swaps `image_url`
  - **Save** / **Cancel** buttons
- **Delete** removes that single prediction row (per-rank), with confirm dialog and toast.
- After save/delete, the dashboard refetches and the stat strip (Total/Severe/Moderate/Healthy/Avg Confidence) and Prevalent Pathogens panel update reactively.

Animations stay within the allowed set: fade-in drawer, slide-down expand, hover transitions on rows and image.

## Technical

### Server functions (`src/lib/detections.functions.ts`, new)

Use `createServerFn` + `requireSupabaseAuth` so RLS scopes everything to `auth.uid()`:

- `updateDetection({ id, patch })` — Zod-validated partial update. Allowed fields: `crop`, `disease`, `severity` (enum), `urgency` (enum), `confidence` (0–1), `symptoms`, `treatment`, `prevention`, `description`, `image_url`. String length caps (disease ≤120, notes ≤2000, description ≤2000). Returns updated row.
- `deleteDetectionRow({ id })` — deletes a single prediction (already covered partially by existing `deleteDetection` which cascades by scan_id; add a row-only variant).

Image replacement: client uploads the new file to `vision-images` bucket (same pattern as `detect.tsx` save flow), then calls `updateDetection` with the new `image_url`. Old image is left in storage (acceptable; can add cleanup later).

### Dashboard changes (`src/routes/_authenticated.dashboard.tsx`)

- Select all editable columns (`symptoms`, `treatment`, `prevention`, `description`, `image_url`, `rank`, `scan_id`) in addition to existing fields.
- Extract the recent-row into a `DetectionCard` component with local `expanded` + `editing` state.
- Add `PreviewDrawer` and `EditForm` subcomponents (kept in-file, small).
- After mutation success: optimistically update local `det` state and re-derive stats; on error, refetch.

### Validation

Server-side Zod schema in the server fn; mirror client-side with simple input attributes (maxLength, min/max). No business-logic changes beyond CRUD on existing `detections` rows.

### No DB schema changes

Existing `detections` table already has all the fields. RLS policies for owner update/delete are already in place (verify via `supabase--read_query` before wiring — if missing, add a migration with `USING (auth.uid() = user_id)` for UPDATE/DELETE).

### Files

- New: `src/lib/detections.functions.ts`
- Edited: `src/routes/_authenticated.dashboard.tsx`
- Possibly: small migration if UPDATE/DELETE policies are missing on `detections`

History page is left as-is for now (read + delete already works there); all edit UX lives on the dashboard per your choice.
