import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { deleteDetection } from "@/lib/history.functions";
import { SeverityBadge, UrgencyDot } from "@/components/severity-badge";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "Analysis — AgroVision AI" }] }),
  component: HistoryPage,
});

type D = {
  id: string; crop: string; disease: string; severity: string;
  confidence: number; urgency: string | null; treatment: string | null;
  image_url: string | null; created_at: string;
  rank: number | null; scan_id: string | null;
};

function HistoryPage() {
  const [items, setItems] = useState<D[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const removeFn = useServerFn(deleteDetection);

  const load = () => {
    setLoading(true);
    supabase
      .from("detections")
      .select("id,crop,disease,severity,confidence,urgency,treatment,image_url,created_at,rank,scan_id")
      .order("created_at", { ascending: false })
      .order("rank", { ascending: true })
      .then(({ data }) => {
        setItems((data as D[]) ?? []);
        setLoading(false);
      });
  };
  useEffect(load, []);

  const filtered = filter === "all" ? items : items.filter((i) => i.severity === filter);

  const del = async (d: D) => {
    if (!window.confirm("Delete this vision record and its stored image?")) return;
    try {
      await removeFn({ data: { id: d.id } });
      setItems((prev) => {
        if (d.scan_id) return prev.filter((i) => i.scan_id !== d.scan_id);
        return prev.filter((i) => i.id !== d.id);
      });
      toast.success("Deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Operations / Analysis</p>
          <h1 className="text-3xl font-bold tracking-tight mt-1">Detection History</h1>
        </div>
        <div className="flex gap-1.5">
          {["all", "healthy", "mild", "moderate", "severe"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest rounded-sm border transition-colors ${
                filter === f ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <div className="rounded-sm border border-border bg-card divide-y divide-border">
        {loading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No detections.</div>
        ) : (
          filtered.map((d) => (
            <div key={d.id} className="p-5 flex items-start gap-5">
              <div className="size-16 shrink-0 rounded-sm bg-background border border-border overflow-hidden">
                {d.image_url && <img src={d.image_url} alt={d.crop} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      {d.crop}{d.rank ? ` · rank #${d.rank}` : ""}
                    </p>
                    <h3 className="text-base font-semibold mt-0.5">{d.disease}</h3>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <SeverityBadge severity={d.severity} />
                    {d.urgency && <UrgencyDot urgency={d.urgency} />}
                    <button onClick={() => del(d.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
                {d.treatment && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{d.treatment}</p>}
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-2">
                  {new Date(d.created_at).toLocaleString()} · {Math.round(Number(d.confidence) * 100)}% confidence
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}