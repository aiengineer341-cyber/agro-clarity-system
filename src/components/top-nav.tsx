import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { friendlyError } from "@/lib/errors";

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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate({ to: "/" });
    } catch (e) {
      toast.error(friendlyError(e, "Couldn't sign you out. Try again."));
    }
  };

  return (
    <nav
      className={`sticky top-0 z-50 border-b border-border bg-background/85 pt-safe backdrop-blur-md transition-shadow ${
        scrolled ? "shadow-[0_4px_24px_-12px_rgba(0,0,0,0.25)]" : ""
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-10">
          <Link to="/dashboard" aria-label="UG AgroScan dashboard">
            <Logo />
          </Link>
          <div className="hidden items-center gap-6 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground md:flex">
            {items.map((i) => {
              const active = path === i.to;
              return (
                <Link
                  key={i.to}
                  to={i.to}
                  aria-current={active ? "page" : undefined}
                  className={`relative py-1 transition-colors hover:text-primary ${active ? "text-primary" : ""}`}
                >
                  {i.label}
                  <span
                    className={`pointer-events-none absolute -bottom-0.5 left-0 h-px bg-primary transition-all duration-300 ${
                      active ? "w-full opacity-100" : "w-0 opacity-0"
                    }`}
                  />
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden max-w-[180px] truncate text-[11px] text-muted-foreground lg:inline">
            {userEmail}
          </span>
          <ThemeToggle />
          <button
            onClick={signOut}
            aria-label="Sign out"
            className="grid size-9 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-all hover:border-primary/40 hover:text-primary active:scale-95"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
