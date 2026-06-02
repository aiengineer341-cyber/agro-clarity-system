import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const deleteDetection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    // Get the detection record to find scan_id and image_url
    const { data: record, error: fetchErr } = await supabase
      .from("detections")
      .select("scan_id, image_url")
      .eq("id", data.id)
      .single();

    if (fetchErr) throw new Error(fetchErr.message);
    if (!record) throw new Error("Record not found");

    const scanId = record.scan_id;
    const imageUrl = record.image_url;

    if (scanId) {
      // Delete the entire scan group
      const { error } = await supabase
        .from("detections")
        .delete()
        .eq("scan_id", scanId);
      if (error) throw new Error(error.message);
    } else {
      // Legacy single-record deletion
      const { error } = await supabase
        .from("detections")
        .delete()
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    }

    // Clean up storage image only if no other detections still reference it
    if (imageUrl) {
      const { data: stillUsed } = await supabase
        .from("detections")
        .select("id")
        .eq("image_url", imageUrl)
        .limit(1);

      if (!stillUsed || stillUsed.length === 0) {
        try {
          const url = new URL(imageUrl);
          const parts = url.pathname.split("/");
          const idx = parts.indexOf("vision-images");
          if (idx !== -1) {
            const filePath = parts.slice(idx + 1).join("/");
            await supabase.storage.from("vision-images").remove([filePath]);
          }
        } catch {
          // Ignore storage cleanup errors — the DB record is already gone
        }
      }
    }

    return { success: true };
  });
