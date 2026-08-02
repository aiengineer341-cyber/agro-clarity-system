import { createFileRoute } from "@tanstack/react-router";
import hayford from "@/assets/team-hayford.jpg";
import eric from "@/assets/team-eric.jpg";
import joseph from "@/assets/team-joseph.jpg";

export const Route = createFileRoute("/_public/team")({
  head: () => ({
    meta: [
      { title: "Team — UG AgroScan" },
      { name: "description", content: "The three-person team behind UG AgroScan: Hayford, Eric and Joseph." },
      { property: "og:title", content: "UG AgroScan Team" },
      { property: "og:description", content: "The people behind UG AgroScan." },
    ],
  }),
  component: Team,
});

const team = [
  { name: "Hayford", role: "Project lead", img: hayford, bio: "Sets the product direction and works on the diagnosis pipeline." },
  { name: "Eric", role: "Software engineer", img: eric, bio: "Builds the web application, the database layer and the reporting screens." },
  { name: "Joseph", role: "Agronomy and data", img: joseph, bio: "Maintains the disease reference material and reviews diagnosis quality." },
];

function Team() {
  return (
    <div>
      <section className="mx-auto max-w-4xl animate-slide-up px-6 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">The team</h1>
        <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
          UG AgroScan is built in Ghana by three people: one on product, one on engineering, one on
          agronomy.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-6">
        {team.map((m, i) => (
          <div
            key={m.name}
            className="group animate-slide-up overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/40"
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
              <p className="mt-1 text-xs font-medium uppercase tracking-widest text-primary">{m.role}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{m.bio}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}