import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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

          <div className="space-y-3">
            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={googleLoading || appleLoading || loading}
              aria-label="Continue with Google"
              className="group w-full py-3 px-4 bg-white text-[#1f1f1f] font-medium rounded-sm border border-[#dadce0] hover:shadow-md hover:border-[#d2e3fc] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              style={{ fontFamily: "'Roboto', 'Inter', system-ui, sans-serif" }}
            >
              <GoogleG className={`size-5 shrink-0 transition-transform duration-200 ${googleLoading ? "animate-spin" : "group-hover:scale-110"}`} />
              <span className="text-sm">{googleLoading ? "Connecting…" : "Continue with Google"}</span>
            </button>

            <button
              type="button"
              onClick={signInWithApple}
              disabled={googleLoading || appleLoading || loading}
              aria-label="Continue with Apple"
              className="group w-full py-3 px-4 bg-black text-white font-medium rounded-sm border border-black hover:shadow-md active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 dark:bg-white dark:text-black dark:border-white"
              style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
            >
              <AppleLogo className={`size-5 shrink-0 transition-transform duration-200 ${appleLoading ? "animate-spin" : "group-hover:scale-110"}`} />
              <span className="text-sm">{appleLoading ? "Connecting…" : "Continue with Apple"}</span>
            </button>
          </div>

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

function GoogleG({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
  );
}

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.42 2.2-1.13 3.02-.85.99-2.24 1.76-3.4 1.67a3.5 3.5 0 0 1-.03-.42c0-1.1.48-2.25 1.2-3.02.84-.92 2.28-1.6 3.35-1.65.01.13.01.27.01.4zM20.5 17.06c-.35.8-.77 1.55-1.26 2.24-.67.94-1.22 1.59-1.64 1.95-.65.6-1.35.9-2.1.92-.54 0-1.19-.15-1.94-.46-.76-.31-1.45-.46-2.09-.46-.66 0-1.37.15-2.14.46-.77.31-1.39.47-1.86.49-.72.03-1.43-.28-2.14-.94-.45-.39-1.03-1.07-1.72-2.03a13.9 13.9 0 0 1-1.82-3.57C1.3 14.24 1 13.09 1 11.98c0-1.27.28-2.37.83-3.29a4.87 4.87 0 0 1 1.74-1.75 4.7 4.7 0 0 1 2.35-.66c.57 0 1.32.18 2.25.53.93.35 1.53.53 1.79.53.2 0 .86-.21 1.98-.62 1.06-.38 1.95-.54 2.68-.48 1.98.16 3.47.94 4.46 2.35-1.77 1.07-2.64 2.57-2.62 4.5.02 1.5.56 2.75 1.63 3.74.48.46 1.02.81 1.62 1.06-.13.38-.27.74-.41 1.09z"/>
    </svg>
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