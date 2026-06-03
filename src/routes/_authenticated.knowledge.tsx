import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/_authenticated/knowledge")({
  head: () => ({
    meta: [
      { title: "Agronomy Knowledge Base — AgroVision AI" },
      { name: "description", content: "Searchable reference library of crop diseases, symptoms, and treatments powering AgroVision's RAG diagnoses." },
      { property: "og:title", content: "Agronomy Knowledge Base — AgroVision AI" },
      { property: "og:description", content: "Searchable crop disease reference library powering RAG diagnoses." },
      { property: "og:url", content: "https://agro-clarity-system.lovable.app/knowledge" },
    ],
    links: [{ rel: "canonical", href: "https://agro-clarity-system.lovable.app/knowledge" }],
  }),
  component: KnowledgePage,
});

type Doc = { id: string; title: string; crop: string | null; content: string };

function KnowledgePage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase.from("disease_docs").select("id,title,crop,content").order("title").then(({ data }) => {
      setDocs((data as Doc[]) ?? []);
    });
  }, []);

  const filtered = docs.filter(
    (d) => d.title.toLowerCase().includes(q.toLowerCase()) ||
      d.content.toLowerCase().includes(q.toLowerCase()) ||
      (d.crop?.toLowerCase().includes(q.toLowerCase()) ?? false)
  );

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 space-y-6">
      <header>
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Reference / Knowledge</p>
        <h1 className="text-3xl font-bold tracking-tight mt-1">Agronomy Knowledge Base</h1>
      </header>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search diseases, crops, treatments…"
        className="w-full max-w-md bg-card border border-border rounded-sm px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((d) => (
          <article key={d.id} className="rounded-sm border border-border bg-card p-6 hover:border-primary/30 transition-colors">
            <div className="flex items-start gap-3 mb-3">
              <div className="size-9 rounded-sm bg-primary/10 grid place-items-center shrink-0">
                <BookOpen className="size-4 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold leading-tight">{d.title}</h2>
                {d.crop && (
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-1">{d.crop}</p>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{d.content}</p>
          </article>
        ))}
      </div>
    </main>
  );
}