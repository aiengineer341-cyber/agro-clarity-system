import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/use-theme";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className={`relative grid size-9 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-all hover:border-primary/40 hover:text-primary active:scale-95 ${className}`}
    >
      <Sun
        className={`absolute size-4 transition-all duration-300 ${theme === "dark" ? "scale-0 -rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"}`}
      />
      <Moon
        className={`absolute size-4 transition-all duration-300 ${theme === "dark" ? "scale-100 rotate-0 opacity-100" : "scale-0 rotate-90 opacity-0"}`}
      />
    </button>
  );
}