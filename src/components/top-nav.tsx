import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Logo } from "./logo";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";

const items = [
  { to: "/dashboard", label: "Monitoring" },
  { to: "/detect", label: "Detect" },
  { to: "/analysis", label: "Analysis" },
  { to: "/history", label: "History" },
  { to: "/knowledge", label: "Knowledge" },
];

export function TopNav({ userEmail }: { userEmail?: string | null }) {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-10">
          <Link to="/dashboard">
            <Logo />
          </Link>
          <div className="hidden md:flex items-center gap-6 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {items.map((i) => {
              const active = path === i.to;
              return (
                <Link
                  key={i.to}
                  to={i.to}
                  className={`transition-colors hover:text-primary ${active ? "text-primary" : ""}`}
                >
                  {i.label}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
            </span>
            <span className="text-[9px] font-mono uppercase tracking-widest text-primary">Live</span>
          </div>
          <span className="hidden lg:inline font-mono text-[10px] uppercase tracking-widest text-muted-foreground truncate max-w-[180px]">
            {userEmail}
          </span>
          <button
            onClick={signOut}
            className="rounded-sm border border-border bg-card px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors flex items-center gap-1.5"
          >
            <LogOut className="size-3" /> Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}