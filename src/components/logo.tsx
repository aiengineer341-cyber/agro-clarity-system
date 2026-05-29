export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const px = size === "sm" ? 24 : size === "lg" ? 40 : 32;
  const text = size === "sm" ? "text-sm" : size === "lg" ? "text-2xl" : "text-lg";
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="bg-primary rounded-sm grid place-items-center shrink-0"
        style={{ width: px, height: px }}
      >
        <div
          className="border-2 border-background rotate-45"
          style={{ width: px / 2, height: px / 2 }}
        />
      </div>
      <span className={`font-mono font-medium tracking-tighter text-foreground ${text}`}>
        AGROVISION <span className="text-primary">AI</span>
      </span>
    </div>
  );
}