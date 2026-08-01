// Keyless weather context + spray-window prediction (Open-Meteo).

export type SprayWindow = {
  start: string;
  end: string;
  label: string;
  score: number;
  reason: string;
  risk_level: "ideal" | "acceptable" | "poor";
};

export type WeatherSnapshot = {
  temp_c: number | null;
  humidity_pct: number | null;
  precip_mm: number | null;
  rain_3d_mm: number | null;
  wind_kmh: number | null;
  condition: string;
  summary: string;
  fetched_at: string;
  lat: number;
  lng: number;
  forecast_summary?: string;
  rain_next_24h_mm?: number | null;
  max_rain_prob_24h?: number | null;
  disease_pressure?: "low" | "moderate" | "high";
  pressure_reason?: string;
  spray_window?: SprayWindow | null;
  alternative_windows?: SprayWindow[];
};

const WMO: Record<number, string> = {
  0: "clear sky", 1: "mainly clear", 2: "partly cloudy", 3: "overcast",
  45: "fog", 48: "rime fog", 51: "light drizzle", 53: "drizzle", 55: "dense drizzle",
  61: "light rain", 63: "rain", 65: "heavy rain",
  71: "light snow", 73: "snow", 75: "heavy snow",
  80: "rain showers", 81: "heavy showers", 82: "violent showers",
  95: "thunderstorm", 96: "thunderstorm w/ hail", 99: "severe thunderstorm w/ hail",
};

const weatherCache = new Map<string, { at: number; data: WeatherSnapshot }>();

type Hour = {
  time: string;
  temp: number;
  rh: number;
  precip: number;
  prob: number;
  wind: number;
};

function hourLabel(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12} ${ampm}`;
}

function dayLabel(iso: string, nowIso: string) {
  const d = new Date(iso);
  const n = new Date(nowIso);
  const diff = Math.round((d.setHours(0, 0, 0, 0) - new Date(n).setHours(0, 0, 0, 0)) / 86_400_000);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short" });
}

/** Score a single hour 0..1 for suitability of a foliar spray / field treatment. */
function scoreHour(h: Hour): number {
  let s = 1;
  // Rain now or likely soon = washes off product
  s -= Math.min(1, h.precip * 0.6);
  s -= Math.min(0.7, (h.prob / 100) * 0.7);
  // Wind drift
  if (h.wind > 15) s -= Math.min(0.6, (h.wind - 15) / 20);
  // Temperature band 12-30C, penalise heat
  if (h.temp < 12) s -= (12 - h.temp) * 0.06;
  if (h.temp > 30) s -= (h.temp - 30) * 0.08;
  // Prefer early morning / late afternoon, avoid midday sun & night
  const hr = new Date(h.time).getHours();
  if (hr >= 6 && hr <= 9) s += 0.15;
  else if (hr >= 16 && hr <= 18) s += 0.1;
  else if (hr >= 11 && hr <= 14) s -= 0.15;
  else if (hr < 5 || hr > 19) s -= 0.25;
  return Math.max(0, Math.min(1, s));
}

function buildWindows(hours: Hour[]): SprayWindow[] {
  const scored = hours.map((h) => ({ h, s: scoreHour(h) }));
  const windows: SprayWindow[] = [];
  const SPAN = 3; // 3-hour application window
  for (let i = 0; i + SPAN <= scored.length; i++) {
    const slice = scored.slice(i, i + SPAN);
    const avg = slice.reduce((a, b) => a + b.s, 0) / SPAN;
    // Require a dry tail so the product can dry / set
    const tail = scored.slice(i + SPAN, i + SPAN + 3);
    const tailRain = tail.reduce((a, b) => a + b.h.precip, 0);
    const dryPenalty = Math.min(0.4, tailRain * 0.4);
    const score = Math.max(0, avg - dryPenalty);

    const first = slice[0].h;
    const last = slice[SPAN - 1].h;
    const maxWind = Math.max(...slice.map((x) => x.h.wind));
    const maxProb = Math.max(...slice.map((x) => x.h.prob));
    const avgTemp = slice.reduce((a, b) => a + b.h.temp, 0) / SPAN;

    const reasons: string[] = [];
    reasons.push(maxProb < 25 ? "low rain chance" : `${Math.round(maxProb)}% rain chance`);
    reasons.push(maxWind <= 15 ? `light wind ${Math.round(maxWind)} km/h` : `windy ${Math.round(maxWind)} km/h`);
    reasons.push(`${Math.round(avgTemp)}°C`);
    if (dryPenalty > 0.05) reasons.push("rain expected soon after");

    windows.push({
      start: first.time,
      end: last.time,
      label: `${dayLabel(first.time, hours[0].time)} ${hourLabel(first.time)}–${hourLabel(last.time)}`,
      score: Math.round(score * 100) / 100,
      reason: reasons.join(", "),
      risk_level: score >= 0.7 ? "ideal" : score >= 0.45 ? "acceptable" : "poor",
    });
  }
  return windows.sort((a, b) => b.score - a.score);
}

function pickAlternatives(all: SprayWindow[], best: SprayWindow | null): SprayWindow[] {
  if (!best) return [];
  const out: SprayWindow[] = [];
  for (const w of all) {
    if (w.start === best.start) continue;
    const tooClose = [best, ...out].some(
      (x) => Math.abs(new Date(w.start).getTime() - new Date(x.start).getTime()) < 6 * 3_600_000,
    );
    if (tooClose) continue;
    out.push(w);
    if (out.length === 2) break;
  }
  return out;
}

function diseasePressure(hours: Hour[]): { level: "low" | "moderate" | "high"; reason: string } {
  const next = hours.slice(0, 24);
  if (!next.length) return { level: "moderate", reason: "Insufficient forecast data." };
  const wetHours = next.filter((h) => h.rh >= 85 || h.precip > 0.1).length;
  const avgTemp = next.reduce((a, b) => a + b.temp, 0) / next.length;
  const rain = next.reduce((a, b) => a + b.precip, 0);
  const warm = avgTemp >= 18 && avgTemp <= 30;
  if (wetHours >= 10 && warm) {
    return {
      level: "high",
      reason: `${wetHours} humid/wet hours ahead at ~${Math.round(avgTemp)}°C — strong fungal and bacterial infection pressure.`,
    };
  }
  if (wetHours >= 5 || rain > 3) {
    return {
      level: "moderate",
      reason: `${wetHours} humid hours and ${Math.round(rain * 10) / 10}mm rain expected — moderate infection pressure.`,
    };
  }
  return {
    level: "low",
    reason: `Mostly dry next 24h (${Math.round(rain * 10) / 10}mm) — low fungal pressure, watch for mites and heat stress.`,
  };
}

export async function fetchWeatherContext(lat: number, lng: number): Promise<WeatherSnapshot | null> {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const cached = weatherCache.get(key);
  if (cached && Date.now() - cached.at < 10 * 60_000) return cached.data;

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code` +
    `&hourly=temperature_2m,relative_humidity_2m,precipitation,precipitation_probability,wind_speed_10m` +
    `&daily=precipitation_sum&past_days=3&forecast_days=3&timezone=auto`;
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(to);
    if (!res.ok) return null;
    const j = (await res.json()) as {
      current?: { temperature_2m?: number; relative_humidity_2m?: number; precipitation?: number; wind_speed_10m?: number; weather_code?: number };
      daily?: { precipitation_sum?: number[] };
      hourly?: {
        time?: string[]; temperature_2m?: number[]; relative_humidity_2m?: number[];
        precipitation?: number[]; precipitation_probability?: number[]; wind_speed_10m?: number[];
      };
    };
    const c = j.current ?? {};
    const rain3 = (j.daily?.precipitation_sum ?? []).slice(0, 3).reduce((a, b) => a + (b ?? 0), 0);
    const condition = WMO[c.weather_code ?? -1] ?? "unknown";

    // Build the forward-looking hourly series (next 48h from now).
    const t = j.hourly?.time ?? [];
    const nowMs = Date.now();
    const hours: Hour[] = [];
    for (let i = 0; i < t.length; i++) {
      const ms = new Date(t[i]).getTime();
      if (ms < nowMs - 30 * 60_000) continue;
      hours.push({
        time: t[i],
        temp: j.hourly?.temperature_2m?.[i] ?? 25,
        rh: j.hourly?.relative_humidity_2m?.[i] ?? 60,
        precip: j.hourly?.precipitation?.[i] ?? 0,
        prob: j.hourly?.precipitation_probability?.[i] ?? 0,
        wind: j.hourly?.wind_speed_10m?.[i] ?? 5,
      });
      if (hours.length >= 48) break;
    }

    const all = hours.length >= 4 ? buildWindows(hours) : [];
    const best = all[0] ?? null;
    const alternatives = pickAlternatives(all, best);
    const pressure = diseasePressure(hours);
    const next24 = hours.slice(0, 24);
    const rain24 = next24.reduce((a, b) => a + b.precip, 0);
    const maxProb24 = next24.length ? Math.max(...next24.map((h) => h.prob)) : null;

    const snap: WeatherSnapshot = {
      temp_c: c.temperature_2m ?? null,
      humidity_pct: c.relative_humidity_2m ?? null,
      precip_mm: c.precipitation ?? null,
      rain_3d_mm: Number.isFinite(rain3) ? Math.round(rain3 * 10) / 10 : null,
      wind_kmh: c.wind_speed_10m ?? null,
      condition,
      summary: `${c.temperature_2m ?? "?"}°C, ${c.relative_humidity_2m ?? "?"}% RH, ${condition}, ${c.precipitation ?? 0}mm now / ${Math.round((rain3 || 0) * 10) / 10}mm last 3 days, wind ${c.wind_speed_10m ?? "?"} km/h`,
      fetched_at: new Date().toISOString(),
      lat,
      lng,
      forecast_summary:
        `Next 24h: ${Math.round(rain24 * 10) / 10}mm rain expected, peak rain chance ${maxProb24 ?? "?"}%.` +
        (best ? ` Best treatment window: ${best.label} (${best.reason}).` : " No clearly safe spray window in the next 48h."),
      rain_next_24h_mm: Math.round(rain24 * 10) / 10,
      max_rain_prob_24h: maxProb24,
      disease_pressure: pressure.level,
      pressure_reason: pressure.reason,
      spray_window: best,
      alternative_windows: alternatives,
    };
    weatherCache.set(key, { at: Date.now(), data: snap });
    return snap;
  } catch {
    return null;
  }
}
