import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [
      { title: "Signing you in — UG AgroScan AI" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Finishing sign-in…");

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      // Supabase JS auto-detects the OAuth response in the URL (code or
      // hash tokens) and persists the session. Wait for it to settle.
      const { data, error } = await supabase.auth.getSession();
      if (cancelled) return;

      if (error) {
        toast.error(error.message);
        navigate({ to: "/auth" });
        return;
      }

      if (data.session) {
        navigate({ to: "/dashboard" });
        return;
      }

      // Fall back to the auth state listener in case the session hasn't
      // been written yet (e.g. code exchange still in flight).
      const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
        if (session) {
          sub.subscription.unsubscribe();
          navigate({ to: "/dashboard" });
        }
      });

      // Safety timeout — if nothing lands in ~6s, send the user back.
      setTimeout(() => {
        if (cancelled) return;
        sub.subscription.unsubscribe();
        setMessage("Could not complete sign-in. Please try again.");
        navigate({ to: "/auth" });
      }, 6000);
    }

    finish();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen grid place-items-center bg-background">
      <div className="text-center space-y-3">
        <div className="mx-auto h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    </div>
  );
}