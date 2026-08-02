import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TopNav } from "@/components/top-nav";
import { BottomNav } from "@/components/bottom-nav";
import type { User } from "@supabase/supabase-js";
import { Toaster } from "sonner";
import { useTheme } from "@/lib/use-theme";
import { Activity, ScanLine, BarChart3, ClipboardList, BookOpen } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

const bottomItems = [
  { to: "/dashboard", label: "Monitor", Icon: Activity },
  { to: "/detect", label: "Detect", Icon: ScanLine },
  { to: "/analysis", label: "Trends", Icon: BarChart3 },
  { to: "/history", label: "Records", Icon: ClipboardList },
  { to: "/knowledge", label: "Guide", Icon: BookOpen },
];

function AuthLayout() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user ?? null);
      if (!s) navigate({ to: "/auth" });
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate({ to: "/auth" });
      } else {
        setUser(data.session.user);
        setReady(true);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-background grid place-items-center">
        <div className="flex flex-col items-center gap-3">
          <span className="size-6 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="text-xs text-muted-foreground">Checking your session…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav userEmail={user?.email} />
      <div className="has-bottom-nav">
        <Outlet />
      </div>
      <BottomNav items={bottomItems} />
      <Toaster theme={theme} position="bottom-right" />
    </div>
  );
}