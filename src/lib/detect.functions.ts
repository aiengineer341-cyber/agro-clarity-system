import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  imageBase64: z.string().min(1),
  crop: z.string().min(1).max(80),
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
      .limit(6);

    const ragText =
      (docs ?? [])
        .map((d, i) => `[${i + 1}] ${d.title}: ${d.content}`)
        .join("\n") || "No reference docs available.";

    const system = `You are an expert plant pathologist for AgroVision AI. Diagnose the crop image.

REFERENCE KNOWLEDGE BASE:
${ragText}

CROP TYPE: ${data.crop}

Respond ONLY with a valid JSON object matching this schema:
{
  "crop": string,
  "disease": string (specific disease name OR "Healthy"),
  "severity": "healthy" | "mild" | "moderate" | "severe",
  "confidence": number (0..1),
  "symptoms": string,
  "treatment": string,
  "urgency": "low" | "medium" | "high",
  "prevention": string
}`;

    const body = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: [
            { type: "text", text: `Diagnose this ${data.crop} plant. Return JSON only.` },
            { type: "image_url", image_url: { url: data.imageBase64 } },
          ],
        },
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
    let parsed: {
      crop: string;
      disease: string;
      severity: string;
      confidence: number;
      symptoms: string;
      treatment: string;
      urgency: string;
      prevention: string;
    };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // try to extract JSON object
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("Failed to parse AI response");
      parsed = JSON.parse(m[0]);
    }

    return { ...parsed, rag_docs_used: docs?.length ?? 0 };
  });