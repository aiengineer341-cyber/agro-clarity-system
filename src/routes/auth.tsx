import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Logo } from "@/components/logo";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — UG AgroScan AI" },
      { name: "description", content: "Sign in or create a UG AgroScan AI account to start diagnosing crop diseases." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (error) throw error;
        toast.success("Account created — signing in…");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/dashboard" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      navigate({ to: "/dashboard" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed";
      toast.error(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 border-r border-border bg-card/40">
        <Link to="/"><Logo /></Link>
        <div className="space-y-6 max-w-md">
          <h2 className="text-4xl font-bold tracking-tight leading-tight">
            Diagnose any crop. <span className="text-primary">Anywhere.</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            UG AgroScan AI combines multi-spectral computer vision with a curated agronomy
            knowledge base. Snap a leaf, get a treatment plan in seconds.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
            <Stat label="Diseases" value="120+" />
            <Stat label="Accuracy" value="94%" />
            <Stat label="Median" value="2.1s" />
          </div>
        </div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          © 2026 UG AgroScan AI — Precision Agriculture Protocol
        </p>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden"><Logo /></div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {mode === "signin" ? "Sign in to UG AgroScan" : "Create your account"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "signin" ? "Welcome back." : "Start diagnosing in seconds."}
            </p>
          </div>

          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={googleLoading || loading}
            aria-label="Continue with Google"
            className="group w-full py-3 px-4 bg-white text-[#1f1f1f] font-medium rounded-sm border border-[#dadce0] hover:shadow-md hover:border-[#d2e3fc] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            style={{ fontFamily: "'Roboto', 'Inter', system-ui, sans-serif" }}
          >
            <GoogleG className={`size-5 shrink-0 transition-transform duration-200 ${googleLoading ? "animate-spin" : "group-hover:scale-110"}`} />
            <span className="text-sm">{googleLoading ? "Connecting…" : "Continue with Google"}</span>
          </button>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">or</span>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <Field
                label="Full name"
                value={name}
                onChange={setName}
                placeholder="Kwame Asante"
                required
              />
            )}
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@farm.com"
              required
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              minLength={6}
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-sm hover:bg-accent-bright transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
              {!loading && <ArrowRight className="size-4" />}
            </button>
          </form>

          <p className="text-sm text-muted-foreground text-center">
            {mode === "signin" ? "No account?" : "Already have one?"}{" "}
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-primary font-medium hover:underline"
            >
              {mode === "signin" ? "Create one" : "Sign in"}
            </button>
          </p>

          <Link to="/" className="block text-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground">
            ← Back home
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl font-semibold font-mono">{value}</div>
      <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", placeholder, required, minLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className="mt-1.5 w-full bg-card border border-border rounded-sm px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
      />
    </label>
  );
}