## Detection History & Field Analytics — Explicit Save

### Current behavior
- `/detect` runs `analyse()` which both calls the AI **and** auto-inserts every ranked prediction into `detections`. There is no user confirmation step.
- `/dashboard` already computes Total / Severe / Moderate / Healthy / Avg Confidence dynamically from `detections`, and avg confidence is already shown as `%`.

### Changes

**1. `src/routes/_authenticated.detect.tsx` — split analyse vs save**
- Remove the auto-insert (image upload + `detections.insert`) from `analyse()`. `analyse()` only runs the AI and shows ranked predictions.
- Add `saved` state and a new `save()` function containing the existing storage upload + `detections.insert` logic (scan_id, rank, image_url, crop, disease, severity, confidence, symptoms, treatment, urgency, prevention, input_mode, description, rag_docs_used, model, lat, lng).
- Render a **Save Diagnosis** button in the result panel, shown only when `result.predictions.length > 0`. Disabled while saving or after a successful save (becomes "Saved ✓"). Works for every crop (Maize, Tomato, Cassava, Pepper, Plantain, Cocoyam, Potato, Other) — no per-crop branching.
- Gate by input: must have an image OR a text/voice description (same rule as today). Toast on success/error.
- Reset `saved` to `false` whenever inputs change or a new analysis runs.

**2. Dashboard / Records / Analytics**
- No schema or query changes needed. Dashboard stats already derive from `detections` rows; once save is explicit, only confirmed records are counted.
- Verify `Avg Confidence` continues to render as `XX%` (already does).

### Out of scope
- No DB migration (all required columns already exist on `detections`).
- No changes to History, Analytics, or top-nav.
- No new business logic in the AI server function.