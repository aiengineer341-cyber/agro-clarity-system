import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let auditUserId: string | null = null;
        let auditTextLength: number | null = null;
        const logAudit = async (status: number, errorMessage?: string) => {
          try {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            await supabaseAdmin.from("tts_audit_log").insert({
              user_id: auditUserId,
              status_code: status,
              text_length: auditTextLength,
              error_message: errorMessage ?? null,
            });
          } catch {
            // swallow — audit must never break the response
          }
        };
        try {
          // Require a signed-in Supabase user — this endpoint proxies a paid
          // AI voice API and would otherwise let anonymous callers drain credits.
          const authHeader = request.headers.get("authorization") ?? "";
          const token = authHeader.toLowerCase().startsWith("bearer ")
            ? authHeader.slice(7).trim()
            : "";
          if (!token) {
            await logAudit(401, "missing bearer token");
            return new Response("Unauthorized", { status: 401 });
          }

          const supabaseUrl = process.env.SUPABASE_URL;
          const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
          if (!supabaseUrl || !supabasePublishableKey) {
            await logAudit(500, "auth not configured");
            return new Response("Auth not configured", { status: 500 });
          }
          const supabase = createClient(supabaseUrl, supabasePublishableKey, {
            auth: { persistSession: false, autoRefreshToken: false },
            global: { headers: { Authorization: `Bearer ${token}` } },
          });
          const { data: userData, error: userErr } = await supabase.auth.getUser(token);
          if (userErr || !userData?.user) {
            await logAudit(401, userErr?.message ?? "invalid session");
            return new Response("Unauthorized", { status: 401 });
          }
          auditUserId = userData.user.id;

          const { text } = (await request.json()) as { text?: string };
          const trimmed = (text ?? "").trim().slice(0, 800);
          auditTextLength = trimmed.length;
          if (!trimmed) {
            await logAudit(400, "missing text");
            return new Response("Missing text", { status: 400 });
          }

          const key = process.env.LOVABLE_API_KEY;
          if (!key) {
            await logAudit(500, "missing LOVABLE_API_KEY");
            return new Response("Missing LOVABLE_API_KEY", { status: 500 });
          }

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
            await logAudit(upstream.status, `upstream: ${msg.slice(0, 300)}`);
            return new Response(`TTS failed: ${upstream.status} ${msg}`, { status: upstream.status });
          }
          await logAudit(200);
          return new Response(upstream.body, {
            headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-store" },
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "TTS error";
          await logAudit(500, message);
          return new Response(message, { status: 500 });
        }
      },
    },
  },
});