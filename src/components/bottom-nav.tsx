import { Link, useRouterState } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

export type BottomNavItem = { to: string; label: string; Icon: LucideIcon };

/** Floating, rounded bottom navigation — mobile only, native app feel. */
export function BottomNav({ items }: { items: BottomNavItem[] }) {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed inset-x-3 bottom-3 z-50 pb-safe"
    >
      <ul className="flex items-stretch justify-between gap-1 rounded-[1.75rem] border border-border bg-card/90 p-1.5 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        {items.map((i) => {
          const active = i.to === "/" ? path === "/" : path.startsWith(i.to);
          return (
            <li key={i.to} className="flex-1">
              <Link
                to={i.to}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center justify-center gap-1 rounded-full px-1 py-2 transition-all active:scale-95 ${
                  active
                    ? "bg-primary/12 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <i.Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} />
                <span className="text-[10px] font-medium leading-none tracking-tight">
                  {i.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}