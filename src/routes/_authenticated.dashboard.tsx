import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { SeverityBadge, UrgencyDot } from "@/components/severity-badge";
import { updateDetection, deleteDetectionRow } from "@/lib/detections.functions";
import { AlertTriangle, ScanLine, ArrowRight, Pencil, Trash2, X, Save, Loader2, ImagePlus, ChevronDown, History } from "lucide-react";
import { toast } from "sonner";
import farmerTablet from "@/assets/farmer-tablet.jpg";
import { DashboardCharts } from "@/components/dashboard-charts";
import { VersionHistory } from "@/components/version-history";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Monitoring Dashboard — AgroVision AI" },
      { name: "description", content: "Live monitoring of crop disease detections across your fields with severity, urgency, and confidence telemetry." },
      { property: "og:title", content: "Monitoring Dashboard — AgroVision AI" },
      { property: "og:description", content: "Live monitoring of crop disease detections with severity and urgency telemetry." },
      { property: "og:url", content: "https://agro-clarity-system.lovable.app/dashboard" },
    ],
    links: [{ rel: "canonical", href: "https://agro-clarity-system.lovable.app/dashboard" }],
  }),
  component: Dashboard,
});

type Detection = {
  id: string;
  crop: string;
  disease: string;
  severity: string;
  confidence: number;
  urgency: string | null;
  created_at: string;
  symptoms: string | null;
  treatment: string | null;
  prevention: string | null;
  description: string | null;
  image_url: string | null;
  rank: number | null;
  scan_id: string | null;
};

const CROPS = ["Maize", "Tomato", "Cassava", "Pepper", "Plantain", "Cocoyam", "Potato", "Other"];
const SEVERITIES = ["healthy", "mild", "moderate", "severe"];
const URGENCIES = ["low", "medium", "high"];

function Dashboard() {
  const [det, setDet] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = () => {
    supabase
      .from("detections")
      .select("id,crop,disease,severity,confidence,urgency,created_at,symptoms,treatment,prevention,description,image_url,rank,scan_id")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setDet((data as Detection[]) ?? []);
        setLoading(false);
      });
  };
  useEffect(load, []);

  const total = det.length;
  const severe = det.filter((d) => d.severity === "severe").length;
  const moderate = det.filter((d) => d.severity === "moderate").length;
  const healthy = det.filter((d) => d.severity === "healthy").length;
  const avgConf = total
    ? Math.round((det.reduce((s, d) => s + Number(d.confidence || 0), 0) / total) * 100)
    : 0;

  const diseaseCounts = det.reduce<Record<string, number>>((acc, d) => {
    acc[d.disease] = (acc[d.disease] || 0) + 1;
    return acc;
  }, {});
  const topDiseases = Object.entries(diseaseCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const recent = det.slice(0, 6);

  const onUpdated = (next: Detection) =>
    setDet((prev) => prev.map((d) => (d.id === next.id ? { ...d, ...next } : d)));
  const onDeleted = (id: string) => {
    setDet((prev) => prev.filter((d) => d.id !== id));
    setOpenId(null);
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 space-y-8 animate-fade-in">
      <header className="relative overflow-hidden rounded-sm border border-border bg-card animate-slide-up">
        <img
          src={farmerTablet}
          alt="Farmer inspecting crops in the field with a tablet"
          width={1536}
          height={1024}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/40" />
        <div className="relative flex items-end justify-between flex-wrap gap-4 p-6 md:p-8">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
              Operations / Monitoring
            </p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-1">Field Telemetry</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Live pulse of every scan across your plots — severity, urgency, and confidence at a glance.
            </p>
          </div>
          <Link
            to="/detect"
            className="px-5 py-3 bg-primary text-primary-foreground font-bold text-sm rounded-sm hover:bg-accent-bright hover:-translate-y-0.5 transition-all inline-flex items-center gap-2"
          >
            <ScanLine className="size-4" /> New Detection
          </Link>
        </div>
      </header>

      {/* Stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-border ring-1 ring-border rounded-sm overflow-hidden animate-slide-up" style={{ animationDelay: "80ms" }}>
        <Stat label="Total Detections" value={String(total).padStart(3, "0")} />
        <Stat label="Severe Cases" value={String(severe).padStart(3, "0")} tone="danger" />
        <Stat label="Moderate" value={String(moderate).padStart(3, "0")} tone="warn" />
        <Stat label="Healthy" value={String(healthy).padStart(3, "0")} tone="success" />
        <Stat label="Avg Confidence" value={`${avgConf}%`} />
      </div>

      {severe > 0 && (
        <div className="flex items-center justify-between p-4 rounded-sm border border-destructive/30 bg-destructive/5 animate-slide-up">
          <div className="flex items-center gap-4">
            <AlertTriangle className="size-5 text-destructive shrink-0" />
            <p className="text-sm font-medium text-foreground">
              <span className="text-destructive font-semibold">{severe} severe case{severe > 1 ? "s" : ""}</span>{" "}
              require immediate field response.
            </p>
          </div>
          <Link
            to="/history"
            className="text-[10px] font-mono uppercase tracking-widest text-destructive hover:underline"
          >
            Review →
          </Link>
        </div>
      )}

      {/* Trends & distribution */}
      <DashboardCharts det={det} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-slide-up" style={{ animationDelay: "160ms" }}>
        {/* Recent */}
        <section className="lg:col-span-8 space-y-4">
          <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            Recent Detections
          </h2>
          <div className="rounded-sm border border-border bg-card divide-y divide-border">
            {loading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
            ) : recent.length === 0 ? (
              <EmptyState />
            ) : (
              recent.map((d, i) => (
                <DetectionRow
                  key={d.id}
                  d={d}
                  index={i}
                  open={openId === d.id}
                  onToggle={() => setOpenId(openId === d.id ? null : d.id)}
                  onUpdated={onUpdated}
                  onDeleted={onDeleted}
                />
              ))
            )}
          </div>
        </section>

        {/* Top diseases */}
        <section className="lg:col-span-4 space-y-4">
          <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            Prevalent Pathogens
          </h2>
          <div className="rounded-sm border border-border bg-card p-6 space-y-5">
            {topDiseases.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              topDiseases.map(([name, count]) => {
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={name} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium truncate">{name}</span>
                      <span className="font-mono text-muted-foreground text-xs">{pct}%</span>
                    </div>
                    <div className="h-1 bg-background rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function DetectionRow({
  d, index, open, onToggle, onUpdated, onDeleted,
}: {
  d: Detection;
  index: number;
  open: boolean;
  onToggle: () => void;
  onUpdated: (d: Detection) => void;
  onDeleted: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const updateFn = useServerFn(updateDetection);
  const deleteFn = useServerFn(deleteDetectionRow);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    crop: d.crop,
    disease: d.disease,
    severity: d.severity,
    urgency: d.urgency ?? "low",
    confidence: Math.round(Number(d.confidence) * 100),
    symptoms: d.symptoms ?? "",
    treatment: d.treatment ?? "",
    prevention: d.prevention ?? "",
    description: d.description ?? "",
    image_url: d.image_url ?? "",
  });

  useEffect(() => {
    if (!editing) {
      setForm({
        crop: d.crop, disease: d.disease, severity: d.severity,
        urgency: d.urgency ?? "low",
        confidence: Math.round(Number(d.confidence) * 100),
        symptoms: d.symptoms ?? "", treatment: d.treatment ?? "",
        prevention: d.prevention ?? "", description: d.description ?? "",
        image_url: d.image_url ?? "",
      });
    }
  }, [d, editing]);

  const save = async () => {
    setBusy(true);
    try {
      const patch = {
        crop: form.crop,
        disease: form.disease.trim(),
        severity: form.severity as "healthy" | "mild" | "moderate" | "severe",
        urgency: form.urgency as "low" | "medium" | "high",
        confidence: Math.max(0, Math.min(1, form.confidence / 100)),
        symptoms: form.symptoms.trim() || null,
        treatment: form.treatment.trim() || null,
        prevention: form.prevention.trim() || null,
        description: form.description.trim() || null,
        image_url: form.image_url || null,
      };
      const row = await updateFn({ data: { id: d.id, patch } });
      onUpdated(row as unknown as Detection);
      setEditing(false);
      toast.success("Prediction updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const replaceImage = async (file: File) => {
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
      const path = `${u.user.id}/${Date.now()}_edit.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("vision-images").upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("vision-images").getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: pub.publicUrl }));
      toast.success("Image staged — save to apply");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const del = async () => {
    if (!window.confirm("Delete this prediction?")) return;
    setBusy(true);
    try {
      await deleteFn({ data: { id: d.id } });
      onDeleted(d.id);
      toast.success("Prediction deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ animationDelay: `${index * 60}ms` }} className="animate-slide-up">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between gap-4 hover:bg-background/40 transition-colors text-left"
      >
        <div className="min-w-0 flex items-center gap-3">
          {d.image_url && (
            <img src={d.image_url} alt="" className="size-10 rounded-sm object-cover border border-border shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{d.disease}</p>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              {d.crop} · {new Date(d.created_at).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <span className="text-xs font-mono text-muted-foreground">{Math.round(Number(d.confidence) * 100)}%</span>
          <SeverityBadge severity={d.severity} />
          <ChevronDown className={`size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      {open && (
        <div className="px-4 pb-5 pt-1 border-t border-border bg-background/30 animate-fade-in">
          {!editing ? (
            <div className="grid md:grid-cols-[200px_1fr] gap-5 pt-4">
              <div className="overflow-hidden rounded-sm border border-border bg-background">
                {d.image_url ? (
                  <img src={d.image_url} alt={d.disease}
                    className="w-full aspect-square object-cover transition-transform duration-300 hover:scale-105" />
                ) : (
                  <div className="aspect-square grid place-items-center text-xs text-muted-foreground">No image</div>
                )}
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 flex-wrap">
                  <SeverityBadge severity={d.severity} />
                  {d.urgency && <UrgencyDot urgency={d.urgency} />}
                  {d.rank && <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Rank #{d.rank}</span>}
                  <div className="ml-auto flex gap-2">
                    <button onClick={() => setEditing(true)} className="px-3 py-1.5 text-xs font-medium rounded-sm border border-border hover:bg-card flex items-center gap-1.5">
                      <Pencil className="size-3" /> Edit
                    </button>
                    <button onClick={del} disabled={busy} className="px-3 py-1.5 text-xs font-medium rounded-sm border border-destructive/40 text-destructive hover:bg-destructive/10 flex items-center gap-1.5">
                      <Trash2 className="size-3" /> Delete
                    </button>
                  </div>
                </div>
                <Field label="Symptoms" value={d.symptoms} />
                <Field label="Treatment" value={d.treatment} />
                <Field label="Prevention" value={d.prevention} />
                <Field label="Notes" value={d.description} />
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-[200px_1fr] gap-5 pt-4">
              <div className="space-y-2">
                <div className="overflow-hidden rounded-sm border border-border bg-background">
                  {form.image_url ? (
                    <img src={form.image_url} alt="" className="w-full aspect-square object-cover" />
                  ) : (
                    <div className="aspect-square grid place-items-center text-xs text-muted-foreground">No image</div>
                  )}
                </div>
                <label className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-sm border border-dashed border-border hover:border-primary/50 cursor-pointer">
                  <ImagePlus className="size-3.5" /> Replace image
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => e.target.files?.[0] && replaceImage(e.target.files[0])} />
                </label>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormSelect label="Crop" value={form.crop} options={CROPS} onChange={(v) => setForm({ ...form, crop: v })} />
                  <FormInput label="Disease" value={form.disease} maxLength={120} onChange={(v) => setForm({ ...form, disease: v })} />
                  <FormSelect label="Severity" value={form.severity} options={SEVERITIES} onChange={(v) => setForm({ ...form, severity: v })} />
                  <FormSelect label="Urgency" value={form.urgency} options={URGENCIES} onChange={(v) => setForm({ ...form, urgency: v })} />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Confidence · {form.confidence}%</label>
                  <input type="range" min={0} max={100} value={form.confidence}
                    onChange={(e) => setForm({ ...form, confidence: Number(e.target.value) })}
                    className="w-full mt-1.5 accent-primary" />
                </div>
                <FormArea label="Symptoms" value={form.symptoms} onChange={(v) => setForm({ ...form, symptoms: v })} />
                <FormArea label="Treatment" value={form.treatment} onChange={(v) => setForm({ ...form, treatment: v })} />
                <FormArea label="Prevention" value={form.prevention} onChange={(v) => setForm({ ...form, prevention: v })} />
                <FormArea label="Notes" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
                <div className="flex justify-end gap-2 pt-1">
                  <button onClick={() => setEditing(false)} disabled={busy}
                    className="px-3 py-2 text-xs font-medium rounded-sm border border-border hover:bg-card flex items-center gap-1.5">
                    <X className="size-3" /> Cancel
                  </button>
                  <button onClick={save} disabled={busy}
                    className="px-3 py-2 text-xs font-bold rounded-sm bg-primary text-primary-foreground hover:bg-accent-bright disabled:opacity-50 flex items-center gap-1.5">
                    {busy ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />} Save changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-sm leading-relaxed mt-1 whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function FormInput({ label, value, onChange, maxLength }: { label: string; value: string; onChange: (v: string) => void; maxLength?: number }) {
  return (
    <label className="block">
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} maxLength={maxLength}
        className="mt-1 w-full bg-background border border-border rounded-sm px-2.5 py-2 text-sm focus:outline-none focus:border-primary" />
    </label>
  );
}

function FormSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-background border border-border rounded-sm px-2.5 py-2 text-sm focus:outline-none focus:border-primary capitalize">
        {options.map((o) => <option key={o} value={o} className="capitalize">{o}</option>)}
      </select>
    </label>
  );
}

function FormArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} maxLength={2000}
        className="mt-1 w-full bg-background border border-border rounded-sm px-2.5 py-2 text-sm focus:outline-none focus:border-primary resize-none" />
    </label>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "danger" | "warn" | "success" }) {
  const color =
    tone === "danger" ? "text-destructive" : tone === "warn" ? "text-warn" : tone === "success" ? "text-success" : "text-foreground";
  return (
    <div className="bg-card p-5">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-medium">{label}</p>
      <p className={`text-2xl font-mono tracking-tight ${color}`}>{value}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="p-10 text-center space-y-4">
      <p className="text-sm text-muted-foreground">No detections logged yet.</p>
      <Link
        to="/detect"
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold text-sm rounded-sm hover:bg-accent-bright"
      >
        Start your first scan <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}