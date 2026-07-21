import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  imageBase64: z.string().optional(),
  description: z.string().max(2000).optional(),
  crop: z.string().min(1).max(80),
  lat: z.number().optional(),
  lng: z.number().optional(),
}).refine((v) => !!v.imageBase64 || (v.description && v.description.trim().length > 5), {
  message: "Provide an image or a symptom description (min 6 chars).",
});

// --- Weather context (Open-Meteo, keyless) -------------------------------
type WeatherSnapshot = {
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

async function fetchWeatherContext(lat: number, lng: number): Promise<WeatherSnapshot | null> {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const cached = weatherCache.get(key);
  if (cached && Date.now() - cached.at < 10 * 60_000) return cached.data;

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code` +
    `&daily=precipitation_sum&past_days=3&forecast_days=1&timezone=auto`;
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(to);
    if (!res.ok) return null;
    const j = await res.json() as {
      current?: { temperature_2m?: number; relative_humidity_2m?: number; precipitation?: number; wind_speed_10m?: number; weather_code?: number };
      daily?: { precipitation_sum?: number[] };
    };
    const c = j.current ?? {};
    const rain3 = (j.daily?.precipitation_sum ?? []).slice(-3).reduce((a, b) => a + (b ?? 0), 0);
    const condition = WMO[c.weather_code ?? -1] ?? "unknown";
    const snap: WeatherSnapshot = {
      temp_c: c.temperature_2m ?? null,
      humidity_pct: c.relative_humidity_2m ?? null,
      precip_mm: c.precipitation ?? null,
      rain_3d_mm: Number.isFinite(rain3) ? Math.round(rain3 * 10) / 10 : null,
      wind_kmh: c.wind_speed_10m ?? null,
      condition,
      summary: `${c.temperature_2m ?? "?"}°C, ${c.relative_humidity_2m ?? "?"}% RH, ${condition}, ${c.precipitation ?? 0}mm now / ${Math.round((rain3 || 0) * 10) / 10}mm last 3 days, wind ${c.wind_speed_10m ?? "?"} km/h`,
      fetched_at: new Date().toISOString(),
      lat, lng,
    };
    weatherCache.set(key, { at: Date.now(), data: snap });
    return snap;
  } catch {
    return null;
  }
}

export const detectDisease = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI gateway not configured");

    // Pull RAG context from disease docs for this crop
    const { data: docs } = await context.supabase
      .from("disease_docs")
      .select("title,content,crop")
      .or(`crop.eq.${data.crop},crop.is.null`)
      .limit(12);

    const ragText =
      (docs ?? [])
        .map((d, i) => `[${i + 1}] ${d.title}: ${d.content}`)
        .join("\n") || "No reference docs available.";

    const weather =
      typeof data.lat === "number" && typeof data.lng === "number"
        ? await fetchWeatherContext(data.lat, data.lng)
        : null;

    const weatherBlock = weather
      ? `\nCURRENT FIELD WEATHER (use to weight likelihood and add precautions):\n${weather.summary}\n` +
        `- Humid + wet conditions favour fungal/bacterial diseases (late blight, downy mildew, bacterial blights) — boost their confidence when symptoms match.\n` +
        `- Hot + dry favours mites, powdery mildew, sunscald — boost when symptoms match.\n` +
        `- Recent or imminent rain: warn against foliar sprays that need dry conditions.\n`
      : "";

    const system = `You are an expert plant pathologist for UG AgroScan AI. Diagnose the crop based on the provided image and/or symptom description.

REFERENCE KNOWLEDGE BASE:
${ragText}
${weatherBlock}
CROP TYPE: ${data.crop}

Return the TOP 3-5 most likely diagnoses ranked by confidence (highest first). If the plant looks healthy, return a single "Healthy" prediction.

Respond ONLY with a valid JSON object matching this schema:
{
  "crop": string,
  "predictions": [
    {
      "disease": string,
      "confidence": number (0..1),
      "severity": "healthy" | "mild" | "moderate" | "severe",
      "symptoms": string,
      "treatment": string,
      "urgency": "low" | "medium" | "high",
      "prevention": string,
      "rationale": string (1 short sentence on why this rank),
      "weather_precaution": string (1 short sentence tailored to the current weather, or "" if not applicable)
    }
  ]
}`;

    const userParts: Array<Record<string, unknown>> = [];
    const textPrompt =
      `Diagnose this ${data.crop} plant. Return JSON only with ranked predictions.` +
      (data.description ? `\n\nFarmer description: ${data.description}` : "");
    userParts.push({ type: "text", text: textPrompt });
    if (data.imageBase64) {
      userParts.push({ type: "image_url", image_url: { url: data.imageBase64 } });
    }

    const body = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: userParts },
      ],
    };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.status === 429) throw new Error("Rate limit exceeded. Try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits to continue.");
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`AI error: ${t.slice(0, 200)}`);
    }

    const json = await res.json();
    const text: string = json.choices?.[0]?.message?.content ?? "";
    const cleaned = text.replace(/```json|```/g, "").trim();
    type Prediction = {
      disease: string;
      confidence: number;
      severity: string;
      symptoms: string;
      treatment: string;
      urgency: string;
      prevention: string;
      rationale?: string;
      weather_precaution?: string;
    };
    let parsed: { crop: string; predictions: Prediction[] };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("Failed to parse AI response");
      parsed = JSON.parse(m[0]);
    }

    // Normalise + sort by confidence desc
    const predictions = (parsed.predictions ?? [])
      .map((p) => ({ ...p, confidence: Math.max(0, Math.min(1, Number(p.confidence) || 0)) }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);

    return {
      crop: parsed.crop || data.crop,
      predictions,
      rag_docs_used: docs?.length ?? 0,
      model: body.model,
      weather,
    };
  });