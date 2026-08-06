import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/**
 * Public read of the agronomy reference library.
 * Used as a fallback when the browser client cannot reach the Data API
 * (e.g. missing browser config on a self-hosted deploy).
 */
export const listDiseaseDocs = createServerFn({ method: "GET" }).handler(async () => {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
  if (!url || !key) throw new Error("Reference library is unavailable right now.");

  const client = createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client
    .from("disease_docs")
    .select("id,title,crop,content")
    .order("title");

  if (error) throw new Error(error.message);
  return data ?? [];
});
