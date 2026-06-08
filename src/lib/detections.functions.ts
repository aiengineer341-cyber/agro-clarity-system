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

export const updateDetection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase
      .from("detections")
      .update(data.patch)
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
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