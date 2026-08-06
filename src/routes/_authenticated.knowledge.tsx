import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen } from "lucide-react";
import diseaseLeaf from "@/assets/disease-leaf.jpg";

export const Route = createFileRoute("/_authenticated/knowledge")({
  head: () => ({
    meta: [
      { title: "Agronomy Knowledge Base — UG AgroScan AI" },
      { name: "description", content: "Searchable reference library of crop diseases, symptoms, and treatments powering UG AgroScan's RAG diagnoses." },
      { property: "og:title", content: "Agronomy Knowledge Base — UG AgroScan AI" },
      { property: "og:description", content: "Searchable crop disease reference library powering RAG diagnoses." },
      { property: "og:url", content: "https://ugagroscan.app/knowledge" },
    ],
    links: [{ rel: "canonical", href: "https://ugagroscan.app/knowledge" }],
  }),
  component: KnowledgePage,
});

type Doc = { id: string; title: string; crop: string | null; content: string };

const CROP_ORDER = ["Cassava", "Maize", "Tomato", "Potato", "Pepper", "Plantain", "Cocoyam"];

function KnowledgePage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [q, setQ] = useState("");
  const [crop, setCrop] = useState<string>("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("disease_docs").select("id,title,crop,content").order("title").then(({ data }) => {
      setDocs((data as Doc[]) ?? []);
      setLoading(false);
    });
  }, []);

  const term = q.trim().toLowerCase();
  const filtered = docs.filter((d) => {
    const label = d.crop ?? "General";
    if (crop !== "All" && label !== crop) return false;
    if (!term) return true;
    return (
      d.title.toLowerCase().includes(term) ||
      d.content.toLowerCase().includes(term) ||
      label.toLowerCase().includes(term)
    );
  });

  const crops = Array.from(new Set(docs.map((d) => d.crop ?? "General"))).sort(
    (a, b) => {
      const ia = CROP_ORDER.indexOf(a);
      const ib = CROP_ORDER.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
    }
  );

  const groups = crops
    .map((c) => ({ crop: c, items: filtered.filter((d) => (d.crop ?? "General") === c) }))
    .filter((g) => g.items.length > 0);

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 space-y-6 animate-fade-in">
      <header className="relative overflow-hidden rounded-sm border border-border bg-card animate-slide-up">
        <img
          src={diseaseLeaf}
          alt="Close-up of a diseased crop leaf showing brown lesions and yellow spots"
          width={1536}
          height={1024}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/40" />
        <div className="relative p-6 md:p-8">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Reference / Knowledge</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-1">Agronomy Knowledge Base</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            {docs.length} curated disease references across {crops.length} crop groups — the same
            sources every diagnosis is grounded in.
          </p>
        </div>
      </header>

      <div className="space-y-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search diseases, symptoms, treatments…"
          aria-label="Search the knowledge base"
          className="w-full max-w-md bg-card border border-border rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
        />
        <div className="flex flex-wrap gap-2">
          {["All", ...crops].map((c) => (
            <button
              key={c}
              onClick={() => setCrop(c)}
              aria-pressed={crop === c}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                crop === c
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading references…</p>
      ) : groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No references match “{q}”. Try a crop name, a symptom, or a treatment.
        </p>
      ) : (
        groups.map((g) => (
          <section key={g.crop} className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold tracking-tight">{g.crop}</h2>
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                {g.items.length} {g.items.length === 1 ? "entry" : "entries"}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {g.items.map((d, i) => (
                <article
                  key={d.id}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className="rounded-xl border border-border bg-card p-6 hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-300 animate-slide-up group"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="size-9 rounded-full bg-primary/10 grid place-items-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <BookOpen className="size-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold leading-tight">{d.title}</h3>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-1">
                        {d.crop ?? "All crops"}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{d.content}</p>
                </article>
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  );
}