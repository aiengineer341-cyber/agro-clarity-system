const map: Record<string, string> = {
  healthy: "bg-success/15 text-success ring-success/30",
  mild: "bg-warn/15 text-warn ring-warn/30",
  moderate: "bg-warn/15 text-warn ring-warn/40",
  severe: "bg-destructive/15 text-destructive ring-destructive/40",
};

export function SeverityBadge({ severity }: { severity: string }) {
  const cls = map[severity?.toLowerCase()] ?? "bg-muted text-muted-foreground ring-border";
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest ring-1 ${cls}`}
    >
      {severity || "unknown"}
    </span>
  );
}

const urgencyMap: Record<string, string> = {
  low: "text-success",
  medium: "text-warn",
  high: "text-destructive",
};

export function UrgencyDot({ urgency }: { urgency: string }) {
  const c = urgencyMap[urgency?.toLowerCase()] ?? "text-muted-foreground";
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest ${c}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {urgency}
    </span>
  );
}