import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, Archive } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/retention")({
  head: () => ({
    meta: [
      { title: "TTS Audit Retention — UG AgroScan AI" },
      { name: "description", content: "Admin control for TTS audit log retention window and archive." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: RetentionAdmin,
});

function RetentionAdmin() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [days, setDays] = useState<number>(30);
  const [liveCount, setLiveCount] = useState<number | null>(null);
  const [archiveCount, setArchiveCount] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.user.id)
        .eq("role", "admin")
        .maybeSingle();
      const isAdmin = !!role;
      setAllowed(isAdmin);
      if (!isAdmin) return;

      const [{ data: setting }, live, arch] = await Promise.all([
        supabase.from("app_settings").select("value,updated_at").eq("key", "tts_audit_retention_days").maybeSingle(),
        supabase.from("tts_audit_log").select("*", { count: "exact", head: true }),
        supabase.from("tts_audit_log_archive").select("*", { count: "exact", head: true }),
      ]);
      const v = setting?.value;
      setDays(typeof v === "number" ? v : Number(v) || 30);
      setUpdatedAt(setting?.updated_at ?? null);
      setLiveCount(live.count ?? 0);
      setArchiveCount(arch.count ?? 0);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const save = async () => {
    if (days < 1 || days > 3650) { toast.error("Retention must be 1–3650 days"); return; }
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("app_settings")
        .upsert({
          key: "tts_audit_retention_days",
          value: days,
          updated_at: new Date().toISOString(),
          updated_by: u.user?.id ?? null,
        });
      if (error) throw error;
      toast.success("Retention updated");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-16 grid place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }
  if (!allowed) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-2xl font-bold">Admins only</h1>
        <p className="text-sm text-muted-foreground mt-2">You need the admin role to view retention settings.</p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-10 space-y-8 animate-fade-in">
      <header>
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Admin / Retention</p>
        <h1 className="text-3xl font-bold tracking-tight mt-1">TTS Audit Log Retention</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Records older than this window are archived nightly (03:00 UTC). Archived rows are hard-purged after 6× the window.
        </p>
      </header>

      <section className="rounded-sm border border-border bg-card p-6 space-y-4">
        <label className="block">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Retention (days)</span>
          <input
            type="number" min={1} max={3650} value={days}
            onChange={(e) => setDays(parseInt(e.target.value, 10) || 0)}
            className="mt-1.5 w-full bg-background border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
          />
        </label>
        <button
          onClick={save} disabled={saving}
          className="w-full py-2.5 bg-primary text-primary-foreground font-bold rounded-sm hover:bg-accent-bright disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save retention
        </button>
        {updatedAt && (
          <p className="text-[10px] font-mono text-muted-foreground">Last updated {new Date(updatedAt).toLocaleString()}</p>
        )}
      </section>

      <section className="grid grid-cols-2 gap-4">
        <Stat label="Live records" value={liveCount} />
        <Stat label="Archived records" value={archiveCount} icon />
      </section>
    </main>
  );
}

function Stat({ label, value, icon }: { label: string; value: number | null; icon?: boolean }) {
  return (
    <div className="rounded-sm border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</p>
        {icon && <Archive className="size-3.5 text-muted-foreground" />}
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value ?? "—"}</p>
    </div>
  );
}