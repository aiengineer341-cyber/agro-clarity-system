import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SeverityBadge } from "@/components/severity-badge";
import { AlertTriangle, ScanLine, ArrowRight } from "lucide-react";

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
};

function Dashboard() {
  const [det, setDet] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("detections")
      .select("id,crop,disease,severity,confidence,urgency,created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setDet((data as Detection[]) ?? []);
        setLoading(false);
      });
  }, []);

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

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            Operations / Monitoring
          </p>
          <h1 className="text-3xl font-bold tracking-tight mt-1">Field Telemetry</h1>
        </div>
        <Link
          to="/detect"
          className="px-5 py-3 bg-primary text-primary-foreground font-bold text-sm rounded-sm hover:bg-accent-bright transition-colors inline-flex items-center gap-2"
        >
          <ScanLine className="size-4" /> New Detection
        </Link>
      </header>

      {/* Stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-border ring-1 ring-border rounded-sm overflow-hidden">
        <Stat label="Total Detections" value={String(total).padStart(3, "0")} />
        <Stat label="Severe Cases" value={String(severe).padStart(3, "0")} tone="danger" />
        <Stat label="Moderate" value={String(moderate).padStart(3, "0")} tone="warn" />
        <Stat label="Healthy" value={String(healthy).padStart(3, "0")} tone="success" />
        <Stat label="Avg Confidence" value={`${avgConf}%`} />
      </div>

      {severe > 0 && (
        <div className="flex items-center justify-between p-4 rounded-sm border border-destructive/30 bg-destructive/5">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
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
              recent.map((d) => (
                <div key={d.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{d.disease}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {d.crop} · {new Date(d.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 shrink-0">
                    <span className="text-xs font-mono text-muted-foreground">
                      {Math.round(Number(d.confidence) * 100)}%
                    </span>
                    <SeverityBadge severity={d.severity} />
                  </div>
                </div>
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