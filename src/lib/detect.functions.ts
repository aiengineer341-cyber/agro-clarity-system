import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { fetchWeatherContext } from "@/lib/weather.server";

const Input = z.object({
  imageBase64: z.string().optional(),
  description: z.string().max(2000).optional(),
  crop: z.string().min(1).max(80),
  lat: z.number().optional(),
  lng: z.number().optional(),
}).refine((v) => !!v.imageBase64 || (v.description && v.description.trim().length > 5), {
  message: "Provide an image or a symptom description (min 6 chars).",
});

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
        `FORECAST SIGNAL: ${weather.forecast_summary ?? "n/a"}\n` +
        `INFECTION PRESSURE (next 24h): ${(weather.disease_pressure ?? "unknown").toUpperCase()} — ${weather.pressure_reason ?? ""}\n` +
        (weather.spray_window
          ? `RECOMMENDED TREATMENT WINDOW: ${weather.spray_window.label} (${weather.spray_window.risk_level}; ${weather.spray_window.reason}). Tell the farmer to apply within this window and say why.\n`
          : `NO SAFE SPRAY WINDOW in the next 48h — advise cultural controls (sanitation, pruning, drainage) and waiting for drier conditions.\n`) +
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
      "weather_precaution": string (1 short sentence tailored to the current weather AND the recommended treatment window, naming the window when one exists, or "" if not applicable)
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