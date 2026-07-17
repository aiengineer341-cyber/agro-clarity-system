import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { text } = (await request.json()) as { text?: string };
          const trimmed = (text ?? "").trim().slice(0, 800);
          if (!trimmed) return new Response("Missing text", { status: 400 });

          const key = process.env.LOVABLE_API_KEY;
          if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

          const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "openai/gpt-4o-mini-tts",
              input: trimmed,
              voice: "alloy",
              stream_format: "sse",
              response_format: "pcm",
            }),
          });
          if (!upstream.ok || !upstream.body) {
            const msg = await upstream.text().catch(() => "");
            return new Response(`TTS failed: ${upstream.status} ${msg}`, { status: upstream.status });
          }
          return new Response(upstream.body, {
            headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-store" },
          });
        } catch (err) {
          return new Response(err instanceof Error ? err.message : "TTS error", { status: 500 });
        }
      },
    },
  },
});