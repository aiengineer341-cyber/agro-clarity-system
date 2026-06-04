import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/logo";
import { ScanLine, Database, Wifi, ArrowRight } from "lucide-react";
import heroField from "@/assets/hero-field.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AgroVision AI — Precision Plant Disease Detection" },
      { name: "description", content: "AI-powered plant disease detection. Diagnose crop diseases in seconds with multi-spectral vision and an agronomy knowledge base." },
      { property: "og:title", content: "AgroVision AI" },
      { property: "og:description", content: "Diagnose crop diseases in seconds with AI vision." },
      { property: "og:url", content: "https://agro-clarity-system.lovable.app/" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "canonical", href: "https://agro-clarity-system.lovable.app/" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "AgroVision AI",
          url: "https://agro-clarity-system.lovable.app/",
          logo: "https://agro-clarity-system.lovable.app/favicon.ico",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "AgroVision AI",
          url: "https://agro-clarity-system.lovable.app/",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "AgroVision AI",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          description: "AI-powered plant disease detection and treatment guidance for farmers.",
          url: "https://agro-clarity-system.lovable.app/",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }),
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-6">
            <Link to="/auth" className="hidden sm:inline text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-primary">
              Sign in
            </Link>
            <Link
              to="/auth"
              className="px-5 py-2 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-accent-bright transition-colors"
            >
              Initialize System
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-16">
        <section className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-8 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-primary">Live Telemetry Active</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[0.95] text-foreground">
              The New Standard <br />in <span className="text-primary">Precision Agriculture.</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
              Redefining yield management through multi-spectral computer vision and neural-edge processing. Turn raw field photos into actionable harvest intelligence.
            </p>
            <div className="flex items-center gap-4">
              <Link
                to="/auth"
                className="px-8 py-4 bg-primary text-primary-foreground font-bold text-sm rounded-sm hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 transition-all inline-flex items-center gap-2"
              >
                Initialize System <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/auth"
                className="px-8 py-4 border border-border font-bold text-sm rounded-sm hover:bg-card hover:border-primary/30 transition-colors"
              >
                View Dataset
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 animate-fade-in" style={{ animationDelay: "120ms" }}>
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-tr from-primary/20 to-transparent blur-2xl opacity-30" />
              <div className="relative bg-card border border-border rounded-xl overflow-hidden shadow-2xl">
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={heroField}
                    alt="Aerial view of a healthy green maize crop field at golden hour"
                    width={1536}
                    height={1024}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-background/80 via-background/30 to-transparent" />
                  <div className="absolute inset-6 border border-primary/30">
                    <div className="absolute -top-1 -left-1 size-3 border-l-2 border-t-2 border-primary" />
                    <div className="absolute -top-1 -right-1 size-3 border-r-2 border-t-2 border-primary" />
                    <div className="absolute -bottom-1 -left-1 size-3 border-b-2 border-l-2 border-primary" />
                    <div className="absolute -bottom-1 -right-1 size-3 border-b-2 border-r-2 border-primary" />
                    <div className="absolute left-0 top-0 h-px w-full bg-primary/40 animate-scan-line" />
                  </div>
                  <span className="absolute bottom-3 left-4 text-[10px] font-mono uppercase tracking-[0.2em] text-primary/90 z-10">Live · Field Vision Feed</span>
                </div>
                <div className="p-6 grid grid-cols-3 gap-6 bg-background/50 border-t border-border">
                  <Metric label="Hydration Index" value="84.2%" />
                  <Metric label="Anomaly Count" value="02" accent />
                  <Metric label="Yield Est." value="+12.4%" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-6 mt-24">
          {[
            { Icon: ScanLine, title: "Computer Vision", body: "Proprietary neural network identifies pathogens and nutrient deficiencies with sub-second accuracy." },
            { Icon: Wifi, title: "Edge Deployment", body: "Runs on low-bandwidth devices. Ensures real-time analysis even in rural zones with weak connectivity." },
            { Icon: Database, title: "Agronomy Knowledge Base", body: "RAG over a curated library of disease references. Treatment plans grounded in the field, not hallucinations." },
          ].map((f, i) => (
            <div key={f.title} className="animate-slide-up" style={{ animationDelay: `${200 + i * 80}ms` }}>
              <Feature Icon={f.Icon} title={f.title} body={f.body} />
            </div>
          ))}
        </section>

        <section className="mt-24 p-1 rounded-sm bg-gradient-to-r from-primary/30 via-border to-primary/30">
          <div className="bg-background p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">Ready to Deploy?</h2>
                <p className="text-muted-foreground">Create an account and start diagnosing within the minute.</p>
              </div>
              <Link
                to="/auth"
                className="w-full md:w-auto px-10 py-5 bg-foreground text-background font-bold tracking-tight hover:bg-primary transition-colors text-center"
              >
                Request Access
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border mt-32 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="opacity-50"><Logo size="sm" /></div>
          <div className="flex gap-8 text-xs font-mono uppercase tracking-widest text-muted-foreground">
            <span>Protocol v1.0</span>
            <span>© 2026 AgroVision AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-mono text-muted-foreground uppercase">{label}</p>
      <p className={`text-2xl font-semibold ${accent ? "text-primary" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

function Feature({ Icon, title, body }: { Icon: typeof ScanLine; title: string; body: string }) {
  return (
    <div className="p-8 bg-card border border-border hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 group rounded-sm h-full">
      <div className="size-12 rounded-sm bg-background/50 flex items-center justify-center mb-6 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
        <Icon className="size-5 text-primary" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed text-sm">{body}</p>
    </div>
  );
}
