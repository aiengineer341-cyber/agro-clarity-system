import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Logo } from "./logo";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

const items = [
  { to: "/dashboard", label: "Monitoring" },
  { to: "/detect", label: "Detect" },
  { to: "/analysis", label: "Analytics" },
  { to: "/history", label: "Records" },
  { to: "/knowledge", label: "Knowledge" },
];

export function TopNav({ userEmail }: { userEmail?: string | null }) {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [path]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <nav className={`sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md transition-shadow ${scrolled ? "shadow-[0_4px_24px_-12px_rgba(0,0,0,0.6)]" : ""}`}>
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
                  className={`relative py-1 transition-colors hover:text-primary ${active ? "text-primary" : ""}`}
                >
                  {i.label}
                  <span
                    className={`pointer-events-none absolute left-0 -bottom-0.5 h-px bg-primary transition-all duration-300 ${active ? "w-full opacity-100" : "w-0 opacity-0"}`}
                  />
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
            className="hidden sm:flex rounded-sm border border-border bg-card px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors items-center gap-1.5"
          >
            <LogOut className="size-3" /> Sign out
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="md:hidden rounded-sm border border-border bg-card p-2 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md animate-slide-down">
          <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col">
            {items.map((i, idx) => {
              const active = path === i.to;
              return (
                <Link
                  key={i.to}
                  to={i.to}
                  style={{ animationDelay: `${idx * 40}ms` }}
                  className={`animate-slide-up py-3 text-sm font-medium uppercase tracking-[0.18em] border-b border-border/60 last:border-b-0 transition-colors ${
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {i.label}
                </Link>
              );
            })}
            <button
              onClick={signOut}
              className="mt-3 flex items-center gap-2 py-3 text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="size-3.5" /> Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}