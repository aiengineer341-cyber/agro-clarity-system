import { useMemo, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
} from "recharts";

type Det = {
  created_at: string;
  severity: string;
  disease: string;
};

const RANGES = [
  { key: "7", label: "7D", days: 7 },
  { key: "30", label: "30D", days: 30 },
  { key: "90", label: "90D", days: 90 },
] as const;

const SEVERITY_COLORS: Record<string, string> = {
  healthy: "var(--color-success)",
  mild: "var(--color-primary)",
  moderate: "var(--color-warn)",
  severe: "var(--color-destructive)",
};

const DISEASE_PALETTE = [
  "var(--color-primary)",
  "var(--color-warn)",
  "var(--color-destructive)",
  "var(--color-accent-bright)",
  "var(--color-muted-foreground)",
  "var(--color-success)",
];

function fmtDay(d: Date) {
  return d.toISOString().slice(0, 10);
}
function shortDay(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function DashboardCharts({ det }: { det: Det[] }) {
  const [range, setRange] = useState<(typeof RANGES)[number]["key"]>("30");
  const [pieMode, setPieMode] = useState<"severity" | "disease">("severity");

  const days = RANGES.find((r) => r.key === range)!.days;

  const lineData = useMemo(() => {
    const buckets = new Map<string, { day: string; total: number; severe: number }>();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = fmtDay(d);
      buckets.set(key, { day: key, total: 0, severe: 0 });
    }
    for (const r of det) {
      const key = fmtDay(new Date(r.created_at));
      const b = buckets.get(key);
      if (!b) continue;
      b.total++;
      if (r.severity === "severe") b.severe++;
    }
    return Array.from(buckets.values());
  }, [det, days]);

  const pieData = useMemo(() => {
    if (pieMode === "severity") {
      const counts: Record<string, number> = { healthy: 0, mild: 0, moderate: 0, severe: 0 };
      for (const r of det) counts[r.severity] = (counts[r.severity] ?? 0) + 1;
      return Object.entries(counts)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value, color: SEVERITY_COLORS[name] }));
    }
    const counts: Record<string, number> = {};
    for (const r of det) counts[r.disease] = (counts[r.disease] ?? 0) + 1;
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, 5);
    const otherSum = sorted.slice(5).reduce((s, [, v]) => s + v, 0);
    const arr = top.map(([name, value], i) => ({
      name, value, color: DISEASE_PALETTE[i % DISEASE_PALETTE.length],
    }));
    if (otherSum > 0) arr.push({ name: "Other", value: otherSum, color: DISEASE_PALETTE[5] });
    return arr;
  }, [det, pieMode]);

  const totalPie = pieData.reduce((s, p) => s + p.value, 0);

  const tooltipStyle = {
    background: "var(--color-card)",
    border: "1px solid var(--color-border)",
    borderRadius: 2,
    fontSize: 12,
  } as const;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-slide-up" style={{ animationDelay: "120ms" }}>
      {/* Line trend */}
      <section className="lg:col-span-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            Detection Trend
          </h2>
          <div className="flex gap-1 p-1 rounded-sm border border-border bg-card">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest rounded-sm transition-colors ${
                  range === r.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-sm border border-border bg-card p-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData} margin={{ top: 10, right: 16, bottom: 0, left: -16 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
              <XAxis
                dataKey="day"
                tickFormatter={shortDay}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 10, fontFamily: "monospace" }}
                stroke="var(--color-border)"
                minTickGap={20}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 10, fontFamily: "monospace" }}
                stroke="var(--color-border)"
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={(v) => new Date(v as string).toLocaleDateString()}
                cursor={{ stroke: "var(--color-primary)", strokeOpacity: 0.3 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line
                type="monotone" dataKey="total" name="All scans"
                stroke="var(--color-primary)" strokeWidth={2}
                dot={{ r: 2 }} activeDot={{ r: 5 }}
              />
              <Line
                type="monotone" dataKey="severe" name="Severe"
                stroke="var(--color-destructive)" strokeWidth={2}
                dot={{ r: 2 }} activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Pie distribution */}
      <section className="lg:col-span-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            Distribution
          </h2>
          <div className="flex gap-1 p-1 rounded-sm border border-border bg-card">
            <button
              onClick={() => setPieMode("severity")}
              className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest rounded-sm transition-colors ${
                pieMode === "severity" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Severity
            </button>
            <button
              onClick={() => setPieMode("disease")}
              className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest rounded-sm transition-colors ${
                pieMode === "disease" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Disease
            </button>
          </div>
        </div>
        <div className="rounded-sm border border-border bg-card p-4 h-72">
          {pieData.length === 0 ? (
            <div className="h-full grid place-items-center text-sm text-muted-foreground">No data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number, name: string) => [
                    `${value} (${Math.round((value / totalPie) * 100)}%)`,
                    name,
                  ]}
                />
                <Pie
                  data={pieData} dataKey="value" nameKey="name"
                  innerRadius={45} outerRadius={80} paddingAngle={2}
                  stroke="var(--color-card)"
                >
                  {pieData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11, textTransform: "capitalize" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </div>
  );
}