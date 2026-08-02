import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";
import { ScanLine } from "lucide-react";
import cropLeaf from "@/assets/crop-leaf-macro.jpg";

export const Route = createFileRoute("/_authenticated/analysis")({
  head: () => ({
    meta: [
      { title: "Field Analytics — UG AgroScan AI" },
      { name: "description", content: "Trends, severity distribution, top diseases, crops and input-mode breakdown for your UG AgroScan scans." },
      { property: "og:title", content: "Field Analytics — UG AgroScan AI" },
      { property: "og:description", content: "Visual analytics over your crop disease scan history." },
      { property: "og:url", content: "https://ugagroscan.app/analysis" },
    ],
    links: [{ rel: "canonical", href: "https://ugagroscan.app/analysis" }],
  }),
  component: AnalysisPage,
});

type Row = {
  id: string;
  scan_id: string | null;
  rank: number;
  crop: string;
  disease: string;
  severity: string;
  confidence: number;
  input_mode: string | null;
  created_at: string;
};

const SEVERITY_COLORS: Record<string, string> = {
  healthy: "var(--color-success)",
  mild: "var(--color-primary)",
  moderate: "var(--color-warn)",
  severe: "var(--color-destructive)",
  unknown: "var(--color-muted-foreground)",
};
const MODE_COLORS = [
  "var(--color-primary)",
  "var(--color-warn)",
  "var(--color-accent-bright)",
  "var(--color-chart-4)",
];

const tooltipStyle = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 2,
  fontSize: 12,
} as const;

const axisTick = {
  fill: "var(--color-muted-foreground)",
  fontSize: 10,
  fontFamily: "monospace",
} as const;

const tooltipLabelStyle = {
  color: "var(--color-muted-foreground)",
  fontSize: 10,
  textTransform: "uppercase" as const,
  letterSpacing: "0.1em",
  marginBottom: 4,
};

const tooltipItemStyle = {
  color: "var(--color-foreground)",
  fontSize: 12,
};

const legendWrapperStyle = {
  fontSize: 11,
  color: "var(--color-foreground)",
  textTransform: "capitalize" as const,
};

const legendFormatter = (v: string) => (
  <span style={{ color: "var(--color-foreground)" }}>{v}</span>
);

const lineCursor = {
  stroke: "var(--color-accent-bright)",
  strokeOpacity: 0.5,
  strokeDasharray: "3 3",
};

const barCursor = { fill: "var(--color-primary)", fillOpacity: 0.08 };

const EmptyChart = () => (
  <div className="h-full w-full flex items-center justify-center text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
    No data yet.
  </div>
);

function AnalysisPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = async () => {
    const { data, error } = await supabase
      .from("detections")
      .select("id,scan_id,rank,crop,disease,severity,confidence,input_mode,created_at")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) setError(error.message);
    else {
      setError(null);
      setRows((data as Row[]) ?? []);
      setUpdatedAt(new Date());
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const onFocus = () => load();
    const onVis = () => { if (document.visibilityState === "visible") load(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);

    let channel: ReturnType<typeof supabase.channel> | null = null;
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id;
      if (!uid) return;
      channel = supabase
        .channel("detections-analytics")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "detections", filter: `user_id=eq.${uid}` },
          () => load(),
        )
        .subscribe((status) => setLive(status === "SUBSCRIBED"));
    });

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const stats = useMemo(() => computeStats(rows), [rows]);

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 space-y-8 animate-fade-in">
      <header className="relative overflow-hidden rounded-sm border border-border bg-card animate-slide-up">
        <img
          src={cropLeaf}
          alt="Macro view of a healthy crop leaf with dew droplets"
          width={1536}
          height={1024}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/40" />
        <div className="relative flex items-end justify-between flex-wrap gap-4 p-6 md:p-8">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
              Operations / Analytics
            </p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-1">Field Analytics</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Trends and distribution across every scan in your field history.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-sm border text-[10px] font-mono uppercase tracking-widest ${live ? "border-primary/40 text-primary" : "border-border text-muted-foreground"}`}>
                <span className={`size-1.5 rounded-full ${live ? "bg-primary animate-pulse" : "bg-muted-foreground"}`} />
                {live ? "Live" : "Offline"}
              </span>
              {updatedAt && (
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Updated {updatedAt.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          <Link
            to="/detect"
            className="px-5 py-3 bg-primary text-primary-foreground font-bold text-sm rounded-sm hover:bg-accent-bright hover:-translate-y-0.5 transition-all inline-flex items-center gap-2"
          >
            <ScanLine className="size-4" /> New Detection
          </Link>
        </div>
      </header>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading analytics…</p>
      ) : error ? (
        <div className="rounded-sm border border-destructive/40 bg-destructive/5 p-6 text-center space-y-3">
          <p className="text-sm text-destructive">Failed to load analytics: {error}</p>
          <button
            onClick={() => { setLoading(true); load(); }}
            className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest border border-border rounded-sm hover:border-primary hover:text-primary"
          >
            Retry
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-sm border border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">No scan data yet. Run a detection to see analytics.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-background ring-1 ring-border rounded-sm overflow-hidden animate-slide-up" style={{ animationDelay: "80ms" }}>
            <Kpi label="Total Scans" value={String(stats.totalScans).padStart(3, "0")} />
            <Kpi label="Avg Confidence" value={`${stats.avgConfidence}%`} />
            <Kpi label="Severe Rate" value={`${stats.severeRate}%`} tone="danger" />
            <Kpi label="Top Crop" value={stats.topCrop ?? "—"} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Panel title="Scans Over Time" className="lg:col-span-8 h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.daily}>
                  <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="day" tick={axisTick} stroke="var(--color-border)" minTickGap={20} />
                  <YAxis allowDecimals={false} tick={axisTick} stroke="var(--color-border)" />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} cursor={lineCursor} />
                  <Line type="monotone" dataKey="scans" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 2, stroke: "var(--color-background)", strokeWidth: 1 }} activeDot={{ r: 5, stroke: "var(--color-background)", strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </Panel>

            <Panel title="Severity Mix" className="lg:col-span-4 h-[320px]">
              {stats.severity.reduce((s, x) => s + x.value, 0) === 0 ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.severity} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2} stroke="var(--color-card)" strokeWidth={2}>
                      {stats.severity.map((s) => (
                        <Cell key={s.name} fill={SEVERITY_COLORS[s.name] ?? SEVERITY_COLORS.unknown} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
                    <Legend wrapperStyle={legendWrapperStyle} formatter={legendFormatter} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Panel>

            <Panel title="Top Diseases" className="lg:col-span-7 h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.diseases} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={axisTick} stroke="var(--color-border)" />
                  <YAxis type="category" dataKey="name" width={140} tick={{ ...axisTick, fontSize: 11 }} stroke="var(--color-border)" />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} cursor={barCursor} />
                  <Bar dataKey="count" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Panel>

            <Panel title="Crops Scanned" className="lg:col-span-5 h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.crops}>
                  <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" tick={axisTick} stroke="var(--color-border)" />
                  <YAxis allowDecimals={false} tick={axisTick} stroke="var(--color-border)" />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} cursor={barCursor} />
                  <Bar dataKey="count" fill="var(--color-accent-bright)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Panel>

            <Panel title="Input Mode Mix" className="lg:col-span-5 h-[300px]">
              {stats.modes.reduce((s, x) => s + x.value, 0) === 0 ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.modes} dataKey="value" nameKey="name" innerRadius={40} outerRadius={80} paddingAngle={2} stroke="var(--color-card)" strokeWidth={2}>
                      {stats.modes.map((m, i) => (
                        <Cell key={m.name} fill={MODE_COLORS[i % MODE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
                    <Legend wrapperStyle={legendWrapperStyle} formatter={legendFormatter} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Panel>

            <Panel title="Confidence by Severity" className="lg:col-span-7 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.confBySeverity}>
                  <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" tick={axisTick} stroke="var(--color-border)" />
                  <YAxis domain={[0, 100]} tick={axisTick} stroke="var(--color-border)" />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} cursor={barCursor} formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                    {stats.confBySeverity.map((s) => (
                      <Cell key={s.name} fill={SEVERITY_COLORS[s.name] ?? SEVERITY_COLORS.unknown} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Panel>
          </div>
        </>
      )}
    </main>
  );
}

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-sm border border-border bg-card p-5 flex flex-col hover:border-primary/50 focus-within:border-primary/60 transition-colors animate-slide-up ${className}`}>
      <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-3">{title}</h2>
      <div className="flex-1 min-h-0">{children}</div>
    </section>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "danger" }) {
  const color = tone === "danger" ? "text-destructive" : "text-foreground";
  return (
    <div className="bg-card p-5">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-medium">{label}</p>
      <p className={`text-2xl font-mono tracking-tight truncate ${color}`}>{value}</p>
    </div>
  );
}

function computeStats(rows: Row[]) {
  // Group by scan_id to count "scans" (a scan can produce multiple ranked rows)
  const scanMap = new Map<string, Row>();
  for (const r of rows) {
    const key = r.scan_id ?? r.id;
    const existing = scanMap.get(key);
    if (!existing || r.rank < existing.rank) scanMap.set(key, r);
  }
  const scans = Array.from(scanMap.values());
  const totalScans = scans.length;

  const avgConfidence = scans.length
    ? Math.round((scans.reduce((s, r) => s + Number(r.confidence || 0), 0) / scans.length) * 100)
    : 0;

  const severeCount = scans.filter((r) => r.severity?.toLowerCase() === "severe").length;
  const severeRate = scans.length ? Math.round((severeCount / scans.length) * 100) : 0;

  // Daily series, last 30 days
  const dayBuckets = new Map<string, number>();
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    dayBuckets.set(d.toISOString().slice(5, 10), 0);
  }
  for (const s of scans) {
    const key = new Date(s.created_at).toISOString().slice(5, 10);
    if (dayBuckets.has(key)) dayBuckets.set(key, (dayBuckets.get(key) ?? 0) + 1);
  }
  const daily = Array.from(dayBuckets, ([day, scansCount]) => ({ day, scans: scansCount }));

  // Severity / crop / mode / disease distributions over top predictions
  const severity = countBy(scans, (r) => r.severity?.toLowerCase() || "unknown")
    .map(([name, value]) => ({ name, value }));
  const crops = countBy(scans, (r) => r.crop || "Unknown")
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  const modes = countBy(scans, (r) => r.input_mode || "unknown")
    .map(([name, value]) => ({ name, value }));
  const diseases = countBy(scans, (r) => r.disease || "Unknown")
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const topCrop = crops[0]?.name ?? null;

  // Avg confidence per severity tier
  const sevGroups = new Map<string, number[]>();
  for (const r of scans) {
    const k = r.severity?.toLowerCase() || "unknown";
    const arr = sevGroups.get(k) ?? [];
    arr.push(Number(r.confidence || 0));
    sevGroups.set(k, arr);
  }
  const confBySeverity = Array.from(sevGroups, ([name, vals]) => ({
    name,
    avg: Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 100),
  }));

  return { totalScans, avgConfidence, severeRate, topCrop, daily, severity, crops, modes, diseases, confBySeverity };
}

function countBy<T>(arr: T[], key: (x: T) => string): [string, number][] {
  const m = new Map<string, number>();
  for (const x of arr) {
    const k = key(x);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return Array.from(m);
}