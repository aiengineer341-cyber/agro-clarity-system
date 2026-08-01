## 1. Weather prediction signal — best time to treat

Today the scan only fetches *current* conditions plus the last 3 days of rain. I'll extend it with a short-range forecast so the app can tell the farmer **when** to apply the treatment, not just what to apply.

**Data**: extend the existing keyless Open-Meteo call in `src/lib/detect.functions.ts` to also request hourly `precipitation_probability`, `precipitation`, `wind_speed_10m`, `temperature_2m`, `relative_humidity_2m` for the next 48 hours (plus 3-day daily rain totals already used).

**Scoring (server-side, deterministic)**: score each upcoming hour for spray suitability:
- dry now and for the following ~4–6 hours (rain probability low, no precipitation)
- wind below ~15 km/h (drift risk)
- temperature roughly 12–30 °C, avoiding the hottest midday hours (leaf burn)
- prefer early morning / late afternoon
Pick the best contiguous window and return a structured `spray_window`:
`{ start, end, label ("Today 6–9 AM"), score, reason, risk_level, alternatives[] }`, plus a `disease_pressure` signal (high/moderate/low) derived from forecast humidity + rain, since wet warm spells raise fungal risk.

**AI prompt**: pass the forecast summary, chosen window, and disease-pressure signal into the diagnosis prompt so each prediction's `weather_precaution` and treatment text align with the recommended window.

**UI** (`src/routes/_authenticated.detect.tsx`): add a "Best time to treat" panel under the weather chip showing the recommended window, why it was chosen, the alternative window, and a disease-pressure badge. Narration (existing TTS) will read the window out when narration is on.

**Storage**: the existing `detections.weather` JSONB column will carry the forecast + window, so saved scans and History/Analytics keep the advice — no schema change needed.

## 2. Remove Google / Apple sign-in

Google and Apple buttons exist only on the sign-in page (`src/routes/auth.tsx`); no other form has social login.
- Remove both buttons, their handlers, loading state, the brand SVG icons, and the "or" divider.
- Leave email + password sign-in / sign-up as the only method, restyled so the form reads cleanly without the divider.
- Remove the now-unused `lovable` OAuth import; `src/routes/auth.callback.tsx` becomes unused, so it will be deleted and any link to it dropped.
- Disable the Google and Apple providers in the backend auth settings so no stale provider remains enabled.

### Technical notes
- No database migration required.
- Generated files under `src/integrations/` are left untouched.
- Weather remains keyless (Open-Meteo), cached ~10 minutes per location as it is now.
