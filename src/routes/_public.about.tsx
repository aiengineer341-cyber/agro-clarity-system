import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Target, ShieldCheck, Layers } from "lucide-react";
import heroField from "@/assets/hero-field.jpg";

export const Route = createFileRoute("/_public/about")({
  head: () => ({
    meta: [
      { title: "About AgroVision — Mission & Tech Stack" },
      { name: "description", content: "AgroVision is an AI-powered crop disease platform for smallholder farmers. Learn our mission, our approach, and the technology stack behind it." },
      { property: "og:title", content: "About AgroVision" },
      { property: "og:description", content: "The mission and tech stack behind AgroVision." },
    ],
  }),
  component: About,
});

const stack = [
  { group: "Frontend", items: ["React 19", "TanStack Start", "TanStack Router & Query", "Tailwind CSS v4", "shadcn/ui", "Vite 7", "TypeScript"] },
  { group: "Backend & Data", items: ["Lovable Cloud (Postgres)", "Row-Level Security", "Authentication", "Object Storage", "Edge server functions"] },
  { group: "AI & Vision", items: ["Lovable AI Gateway", "Gemini 2.5 Flash (vision)", "RAG over agronomy corpus", "Python · TensorFlow · Keras (model training)"] },
  { group: "Tooling", items: ["Zod validation", "Recharts analytics", "Sonner toasts", "Embla carousel", "Lucide icons"] },
];

function About() {
  return (
    <div>
      <section className="relative border-b border-border overflow-hidden">
        <img src={heroField} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        <div className="relative max-w-4xl mx-auto px-6 py-24 animate-slide-up">
          <p className="text-[10px] font-mono uppercase tracking-widest text-primary mb-3">About AgroVision</p>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.02]">
            Putting an agronomist in every farmer's pocket.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            AgroVision is an AI-powered plant disease detection platform built for smallholder farmers, extension officers, and agricultural researchers. We turn a single phone photo into a credible, citable diagnosis — symptoms, severity, treatment, and prevention — in under a second.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-20 grid md:grid-cols-3 gap-6">
        {[
          { Icon: Target, title: "Mission", body: "Make expert-level crop disease diagnosis instantly accessible to every farmer, regardless of geography or connectivity." },
          { Icon: ShieldCheck, title: "Problem", body: "Plant disease causes 20–40% of global crop loss. Extension officers are spread thin and timely diagnosis is out of reach for most smallholders." },
          { Icon: Sparkles, title: "Solution", body: "Multimodal AI grounded in a curated agronomy knowledge base produces decisions farmers can actually act on — fast." },
        ].map((c, i) => (
          <div key={c.title} className="rounded-md border border-border bg-card p-6 animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
            <c.Icon className="size-6 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">{c.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{c.body}</p>
          </div>
        ))}
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="flex items-center gap-3 mb-8">
          <Layers className="size-5 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Tech Stack</h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mb-10">
          AgroVision runs on a modern, edge-friendly stack. Every layer is chosen so the experience stays fast for farmers on slow connections, and trustworthy for researchers reviewing outputs.
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          {stack.map((s, i) => (
            <div key={s.group} className="rounded-md border border-border bg-card p-6 animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
              <h3 className="text-[11px] font-mono uppercase tracking-widest text-primary mb-4">{s.group}</h3>
              <ul className="grid grid-cols-2 gap-2">
                {s.items.map((it) => (
                  <li key={it} className="text-sm text-foreground/90 flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-primary" /> {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}