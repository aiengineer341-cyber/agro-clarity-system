import { createFileRoute } from "@tanstack/react-router";
import hayford from "@/assets/team-hayford.jpg";
import eric from "@/assets/team-eric.jpg";
import joseph from "@/assets/team-joseph.jpg";

export const Route = createFileRoute("/_public/team")({
  head: () => ({
    meta: [
      { title: "Team — AgroVision AI" },
      { name: "description", content: "Meet the team behind AgroVision: Hayford, Eric, and Joseph — building AI for African agriculture." },
      { property: "og:title", content: "AgroVision Team" },
      { property: "og:description", content: "The people behind AgroVision." },
    ],
  }),
  component: Team,
});

const team = [
  { name: "Hayford", role: "Founder & ML Engineer", img: hayford, bio: "Leads model strategy and product direction. Obsessed with making diagnosis feel instant." },
  { name: "Eric", role: "Full-Stack Engineer", img: eric, bio: "Owns the platform end-to-end — from edge functions to the field-ready UI farmers actually use." },
  { name: "Joseph", role: "Agronomy & Data Lead", img: joseph, bio: "Curates the knowledge base and pathology datasets that keep AgroVision grounded in real agronomy." },
];

function Team() {
  return (
    <div>
      <section className="max-w-4xl mx-auto px-6 py-24 text-center animate-slide-up">
        <p className="text-[10px] font-mono uppercase tracking-widest text-primary mb-3">The team</p>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight">Three builders. One field.</h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          AgroVision is built by a small team of engineers and agronomists based in Ghana, building tools we wish our families had on the farm.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-6">
        {team.map((m, i) => (
          <div
            key={m.name}
            className="group rounded-md overflow-hidden border border-border bg-card hover:border-primary/40 hover:-translate-y-1 transition-all animate-slide-up"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="relative aspect-[4/5] overflow-hidden">
              <img
                src={m.img}
                alt={`Portrait of ${m.name}`}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold">{m.name}</h3>
              <p className="text-[11px] font-mono uppercase tracking-widest text-primary mt-1">{m.role}</p>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{m.bio}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}