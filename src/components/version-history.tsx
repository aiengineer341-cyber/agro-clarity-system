import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listDetectionVersions, restoreDetectionVersion } from "@/lib/detections.functions";
import { Loader2, RotateCcw, Clock } from "lucide-react";
import { toast } from "sonner";

type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

type Version = {
  id: string;
  detection_id: string;
  user_id: string;
  changed_at: string;
  changed_fields: string[];
  previous: Record<string, JsonValue>;
  next: Record<string, JsonValue>;
};

function relTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

function formatVal(v: JsonValue): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "number") {
    // Confidence is 0..1; show as % if it looks like one
    if (v > 0 && v <= 1) return `${Math.round(v * 100)}%`;
    return String(v);
  }
  const s = String(v);
  if (s.length > 120) return s.slice(0, 120) + "…";
  return s;
}

export function VersionHistory({
  detectionId,
  onRestored,
}: {
  detectionId: string;
  onRestored: () => void;
}) {
  const listFn = useServerFn(listDetectionVersions);
  const restoreFn = useServerFn(restoreDetectionVersion);
  const [versions, setVersions] = useState<Version[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const rows = await listFn({ data: { detection_id: detectionId } });
      setVersions(rows as Version[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load history");
      setVersions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectionId]);

  const restore = async (v: Version) => {
    if (!window.confirm("Restore these previous values? This itself is recorded as a new version.")) return;
    setBusyId(v.id);
    try {
      await restoreFn({ data: { version_id: v.id } });
      toast.success("Restored previous version");
      onRestored();
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Restore failed");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-6 flex items-center justify-center text-xs text-muted-foreground">
        <Loader2 className="size-4 animate-spin mr-2" /> Loading history…
      </div>
    );
  }

  if (!versions || versions.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-muted-foreground">
        No edits recorded yet. Changes will appear here once you update this prediction.
      </div>
    );
  }

  return (
    <ol className="relative border-l border-border ml-2 space-y-4 py-2">
      {versions.map((v) => (
        <li key={v.id} className="ml-4 animate-fade-in">
          <span className="absolute -left-1.5 flex size-3 items-center justify-center rounded-full bg-primary ring-4 ring-background">
            <Clock className="size-2 text-primary-foreground" />
          </span>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[11px] font-mono text-muted-foreground"
                title={new Date(v.changed_at).toLocaleString()}
              >
                {relTime(v.changed_at)}
              </span>
              {v.changed_fields.map((f) => (
                <span
                  key={f}
                  className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded-sm bg-background border border-border text-foreground/80"
                >
                  {f.replace("_", " ")}
                </span>
              ))}
            </div>
            <button
              onClick={() => restore(v)}
              disabled={busyId === v.id}
              className="px-2 py-1 text-[10px] font-mono uppercase tracking-widest rounded-sm border border-border hover:bg-card flex items-center gap-1.5 disabled:opacity-50"
            >
              {busyId === v.id ? <Loader2 className="size-3 animate-spin" /> : <RotateCcw className="size-3" />}
              Restore
            </button>
          </div>
          <div className="mt-2 rounded-sm border border-border bg-background overflow-hidden">
            <table className="w-full text-xs">
              <tbody className="divide-y divide-border">
                {v.changed_fields.map((f) => (
                  <tr key={f}>
                    <td className="px-2 py-1.5 align-top text-[10px] font-mono uppercase tracking-widest text-muted-foreground w-24">
                      {f.replace("_", " ")}
                    </td>
                    <td className="px-2 py-1.5 align-top text-destructive/80 line-through whitespace-pre-wrap break-words">
                      {formatVal(v.previous?.[f] ?? null)}
                    </td>
                    <td className="px-2 py-1.5 align-top text-success whitespace-pre-wrap break-words">
                      {formatVal(v.next?.[f] ?? null)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </li>
      ))}
    </ol>
  );
}