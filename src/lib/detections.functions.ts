import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const SEVERITY = z.enum(["healthy", "mild", "moderate", "severe"]);
const URGENCY = z.enum(["low", "medium", "high"]);

const PatchSchema = z.object({
  crop: z.string().trim().min(1).max(80).optional(),
  disease: z.string().trim().min(1).max(120).optional(),
  severity: SEVERITY.optional(),
  urgency: URGENCY.optional(),
  confidence: z.number().min(0).max(1).optional(),
  symptoms: z.string().trim().max(2000).optional().nullable(),
  treatment: z.string().trim().max(2000).optional().nullable(),
  prevention: z.string().trim().max(2000).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  image_url: z.string().url().max(1024).optional().nullable(),
});

const InputSchema = z.object({
  id: z.string().uuid(),
  patch: PatchSchema,
});

const VERSIONED_FIELDS = [
  "crop", "disease", "severity", "urgency", "confidence",
  "symptoms", "treatment", "prevention", "description", "image_url",
] as const;

export const updateDetection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Load current row to diff
    const { data: current, error: curErr } = await supabase
      .from("detections")
      .select("id,user_id,crop,disease,severity,urgency,confidence,symptoms,treatment,prevention,description,image_url")
      .eq("id", data.id)
      .single();
    if (curErr) throw new Error(curErr.message);

    const changedFields: string[] = [];
    const previous: Record<string, unknown> = {};
    const next: Record<string, unknown> = {};
    for (const key of VERSIONED_FIELDS) {
      if (!(key in data.patch)) continue;
      const before = (current as Record<string, unknown>)[key] ?? null;
      const after = (data.patch as Record<string, unknown>)[key] ?? null;
      if (before !== after) {
        changedFields.push(key);
        previous[key] = before;
        next[key] = after;
      }
    }

    const { data: row, error } = await supabase
      .from("detections")
      .update(data.patch)
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);

    if (changedFields.length > 0) {
      // Record version snapshot; ignore failure so the update still succeeds
      await supabase.from("detection_versions" as never).insert({
        detection_id: data.id,
        user_id: userId,
        changed_fields: changedFields,
        previous,
        next,
      } as never);
    }
    return row;
  });

export const deleteDetectionRow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("detections").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

export const listDetectionVersions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ detection_id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("detection_versions" as never)
      .select("id,detection_id,user_id,changed_at,changed_fields,previous,next")
      .eq("detection_id", data.detection_id)
      .order("changed_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []) as Array<{
      id: string;
      detection_id: string;
      user_id: string;
      changed_at: string;
      changed_fields: string[];
      previous: Record<string, JsonValue>;
      next: Record<string, JsonValue>;
    }>;
  });

export const restoreDetectionVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ version_id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: version, error: vErr } = await supabase
      .from("detection_versions" as never)
      .select("id,detection_id,previous")
      .eq("id", data.version_id)
      .single();
    if (vErr) throw new Error(vErr.message);
    const v = version as unknown as {
      id: string; detection_id: string; previous: Record<string, unknown>;
    };
    // Validate restored payload through schema (only known fields, allow null)
    const safePatch = PatchSchema.parse(v.previous);

    // Snapshot current → next so restore is itself versioned
    const { data: current, error: curErr } = await supabase
      .from("detections")
      .select("id,crop,disease,severity,urgency,confidence,symptoms,treatment,prevention,description,image_url")
      .eq("id", v.detection_id)
      .single();
    if (curErr) throw new Error(curErr.message);

    const changedFields: string[] = [];
    const previous: Record<string, unknown> = {};
    const next: Record<string, unknown> = {};
    for (const key of VERSIONED_FIELDS) {
      if (!(key in safePatch)) continue;
      const before = (current as Record<string, unknown>)[key] ?? null;
      const after = (safePatch as Record<string, unknown>)[key] ?? null;
      if (before !== after) {
        changedFields.push(key);
        previous[key] = before;
        next[key] = after;
      }
    }

    const { data: row, error } = await supabase
      .from("detections")
      .update(safePatch)
      .eq("id", v.detection_id)
      .select()
      .single();
    if (error) throw new Error(error.message);

    if (changedFields.length > 0) {
      await supabase.from("detection_versions" as never).insert({
        detection_id: v.detection_id,
        user_id: userId,
        changed_fields: changedFields,
        previous,
        next,
      } as never);
    }
    return row;
  });