import { createFileRoute } from "@tanstack/react-router";
import { Target, ShieldCheck, Sprout } from "lucide-react";
import heroField from "@/assets/hero-field.jpg";
import { canonical } from "@/lib/site";

export const Route = createFileRoute("/_public/about")({
  head: () => ({
    meta: [
      { title: "About UG AgroScan" },
      { name: "description", content: "Why we built UG AgroScan: fast, low-cost crop disease diagnosis for smallholder farms that cannot reach an extension officer in time." },
      { property: "og:title", content: "About UG AgroScan" },
      { property: "og:description", content: "Why we built a crop disease diagnosis tool for smallholder farms." },
    ],
    links: [{ rel: "canonical", href: canonical("/about") }],
  }),
  component: About,
});

const points = [
  {
    Icon: ShieldCheck,
    title: "The problem",
    body: "Crop disease destroys a large share of every harvest. A farmer who spots an unfamiliar spot on a leaf usually waits days for advice, and by then the field has spread it.",
  },
  {
    Icon: Target,
    title: "What we do",
    body: "A photo of the leaf returns the likely disease, how bad it is, what to apply, and when to apply it. Answers are written for someone standing in a field, not reading a report.",
  },
  {
    Icon: Sprout,
    title: "How we keep it honest",
    body: "Every diagnosis is checked against a written agronomy reference for that crop, and local weather is used to say whether spraying today is worth it.",
  },
];

function About() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <img src={heroField} alt="" className="absolute inset-0 h-full w-full object-cover opacity-15" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
        <div className="relative mx-auto max-w-3xl animate-slide-up px-6 py-20 md:py-28">
          <h1 className="text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl">
            Faster answers about a sick crop
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            UG AgroScan is a diagnosis tool for smallholder farmers, extension officers and
            agriculture students. You send a photo of the affected plant and get back a named
            disease, a severity, a treatment, and the best window to apply it.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-6 py-16 md:grid-cols-3">
        {points.map((c, i) => (
          <div
            key={c.title}
            className="animate-slide-up rounded-2xl border border-border bg-card p-6"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <c.Icon className="mb-4 size-6 text-primary" />
            <h2 className="mb-2 text-lg font-semibold">{c.title}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{c.body}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-24">
        <h2 className="text-2xl font-bold tracking-tight">Who it is for</h2>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            Farms of one to twenty acres growing cassava, maize, tomato, pepper, plantain, cocoyam
            or potato. Extension officers covering more farms than they can visit. Students and
            researchers who need a record of what was diagnosed and when.
          </p>
          <p>
            Every scan is saved to your account, so you can look back at what happened on a plot
            last season, correct a diagnosis, and see whether disease pressure is rising or falling.
          </p>
        </div>
      </section>
    </div>
  );
}
