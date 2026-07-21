## 1. TTS Audit Log Retention

**Configurable retention window** stored in a new tiny `app_settings` table (key/value), default `tts_audit_retention_days = 30`. Admins can update it; a helper function `get_tts_retention_days()` reads it with a fallback.

**Archive-then-purge** via `pg_cron` (daily at 03:00 UTC):
- Create `tts_audit_log_archive` (same columns + `archived_at`).
- Job moves rows older than the retention window from `tts_audit_log` into the archive, then deletes rows from the archive older than `retention_days * 6` (hard purge).
- Wrapped in a `SECURITY DEFINER` function `purge_tts_audit_log()` owned by `postgres`; only `service_role` can EXECUTE.
- Both tables: RLS on, admin-only SELECT (reuse `has_role(auth.uid(),'admin')`), `service_role` full access.

**Admin UI** (small addition to existing admin surface, or a new `/_authenticated/admin/tts-audit` route if none exists): shows current retention days, lets an admin update it, shows counts of live vs archived rows and last purge time. Non-destructive; purely reads/writes `app_settings`.

## 2. Weather-Aware Scan & Diagnosis

Goal: enrich each detection with the current local weather so the RAG diagnosis considers conditions like humidity, rainfall, and temperature — which materially affect fungal/bacterial disease likelihood and treatment timing.

**Data source**: Open-Meteo (free, no API key, no secret to add). Endpoint: `https://api.open-meteo.com/v1/forecast` with `current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code` plus `daily=precipitation_sum` (last 3 days for disease-pressure signal).

**Capture location**: reuse the existing `latitude` / `longitude` columns on `detections`. On the Detect page, if the browser has geolocation permission, fetch coords once per session; otherwise fall back to farm coordinates (if the user has a saved farm) or skip weather.

**Server flow** (`src/lib/detect.functions.ts`):
1. New helper `fetchWeatherContext(lat, lon)` (server-side fetch, 5s timeout, cached in-memory 10 min per rounded coord).
2. Pass a compact weather summary into the RAG prompt: temp °C, humidity %, precipitation today, 3-day rainfall, wind, plain-language condition.
3. Instruct the model to (a) adjust confidence for humidity/rain-driven diseases (e.g., late blight, cassava bacterial blight boost when humid+wet), and (b) add **weather-aware precautions** to each prediction's rationale (e.g., "delay foliar spray — rain expected", "high humidity favors sporulation, prioritize sanitation").

**Persistence**: add `weather` `jsonb` column on `detections` (nullable) storing the snapshot used, so History/Analytics can display it and audits are reproducible. Migration includes GRANTs already in place (column addition only).

**UI**:
- Detect page: small weather chip near the scan controls ("28°C · 82% RH · rain today") once fetched; graceful skeleton/empty if unavailable.
- Prediction cards: a "Weather precautions" line under each rationale when present.
- History detail: show the stored weather snapshot alongside the scan.
- Analytics: no chart changes in this pass (kept out of scope).

**Failure handling**: weather fetch failures never block diagnosis — the pipeline runs without weather context and the UI simply hides the chip.

## Technical Notes

- Migrations (single migration each):
  - `app_settings(key text pk, value jsonb, updated_at)`, seed `tts_audit_retention_days=30`; RLS admin RW + service_role.
  - `tts_audit_log_archive` + `purge_tts_audit_log()` + `pg_cron` schedule via `supabase--insert` (not migration, since it embeds runtime data).
  - `alter table public.detections add column weather jsonb`.
- No new secrets. Open-Meteo is keyless.
- Voice/scan-sound flow untouched.
- Existing `input_mode`, `latitude`, `longitude`, `rag_docs_used` columns are reused.

## Out of Scope

- Historical backfill of weather for past detections.
- Multi-provider weather fallback.
- Push notifications for weather-based spray advisories.
