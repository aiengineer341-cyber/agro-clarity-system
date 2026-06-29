import { Link, useRouterState } from "@tanstack/react-router";
import { Logo } from "./logo";
import { Menu, X, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

const items = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/team", label: "Team" },
  { to: "/research", label: "Research" },
  { to: "/contact", label: "Contact" },
];

export function MarketingNav() {
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

  return (
    <nav className={`sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md transition-shadow ${scrolled ? "shadow-[0_4px_24px_-12px_rgba(0,0,0,0.6)]" : ""}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-10">
          <Link to="/" aria-label="UG AgroScan home"><Logo /></Link>
          <div className="hidden md:flex items-center gap-6 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {items.map((i) => {
              const active = i.to === "/" ? path === "/" : path.startsWith(i.to);
              return (
                <Link
                  key={i.to}
                  to={i.to}
                  className={`relative py-1 transition-colors hover:text-primary ${active ? "text-primary" : ""}`}
                >
                  {i.label}
                  <span className={`pointer-events-none absolute left-0 -bottom-0.5 h-px bg-primary transition-all duration-300 ${active ? "w-full opacity-100" : "w-0 opacity-0"}`} />
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/auth"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-sm bg-primary px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-primary-foreground hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 transition-all"
          >
            Sign in <ArrowRight className="size-3" />
          </Link>
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
              const active = i.to === "/" ? path === "/" : path.startsWith(i.to);
              return (
                <Link
                  key={i.to}
                  to={i.to}
                  style={{ animationDelay: `${idx * 40}ms` }}
                  className={`animate-slide-up py-3 text-sm font-medium uppercase tracking-[0.18em] border-b border-border/60 last:border-b-0 transition-colors ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {i.label}
                </Link>
              );
            })}
            <Link
              to="/auth"
              className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-sm bg-primary px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-primary-foreground"
            >
              Sign in <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}