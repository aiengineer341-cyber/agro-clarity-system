import { Link, useRouterState } from "@tanstack/react-router";
import { Logo } from "./logo";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./theme-toggle";

const items = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/team", label: "Team" },
  { to: "/research", label: "Research" },
  { to: "/contact", label: "Contact" },
];

export function MarketingNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md transition-shadow pt-safe ${scrolled ? "shadow-[0_4px_24px_-12px_rgba(0,0,0,0.25)]" : ""}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
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
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 active:scale-95"
          >
            Sign in <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>
    </nav>
  );
}