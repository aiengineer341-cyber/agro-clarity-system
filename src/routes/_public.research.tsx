import { createFileRoute } from "@tanstack/react-router";
import diseaseLeaf from "@/assets/disease-leaf.jpg";
import cropMacro from "@/assets/crop-leaf-macro.jpg";
import drone from "@/assets/carousel-drone.jpg";
import { Microscope, TrendingUp, Sprout, Droplets, Bug } from "lucide-react";

export const Route = createFileRoute("/_public/research")({
  head: () => ({
    meta: [
      { title: "Research — UG AgroScan" },
      { name: "description", content: "Background reading behind UG AgroScan: crop disease detection, yield forecasting, soil testing, irrigation control and pest monitoring." },
      { property: "og:title", content: "Research — UG AgroScan" },
      { property: "og:description", content: "Background reading behind UG AgroScan." },
    ],
  }),
  component: Research,
});

const sections = [
  {
    id: "disease",
    Icon: Microscope,
    title: "Crop Disease Detection",
    body: "Image classifiers trained on annotated leaf photographs can separate cassava mosaic, tomato late blight and maize streak with accuracy comparable to a trained extension officer in published benchmarks. UG AgroScan adds a retrieval step over stored agronomy references, so each result is returned with symptoms, treatment and prevention taken from that reference rather than generated freely.",
  },
  {
    id: "yield",
    Icon: TrendingUp,
    title: "Yield Prediction",
    body: "Combining satellite NDVI, weather records, soil samples and past harvest figures allows yield to be forecast several weeks before harvest. Cooperatives use those forecasts when negotiating prices, applying for credit and booking storage.",
  },
  {
    id: "soil",
    Icon: Sprout,
    title: "Soil & Nutrient Analysis",
    body: "Spectral imaging with portable sensors gives nitrogen, phosphorus, potassium and pH readings close to laboratory quality. Those readings can be converted into fertiliser rates for each plot, which lowers input cost and protects soil condition over time.",
  },
  {
    id: "irrigation",
    Icon: Droplets,
    title: "Precision Irrigation",
    body: "Controllers driven by soil-moisture sensors irrigate only when readings fall below a threshold. Pilot schemes in dry regions report water savings of 20 to 40 percent without a drop in yield.",
  },
  {
    id: "pest",
    Icon: Bug,
    title: "Pest Monitoring with Computer Vision",
    body: "Traps fitted with onboard classifiers count and identify pest species as they are caught, which gives a warning before an infestation spreads. The same models are used for drone scouting, which finds affected patches that are hard to see from the ground.",
  },
];

function Research() {
  return (
    <div>
      <section className="relative border-b border-border overflow-hidden">
        <img src={diseaseLeaf} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        <div className="relative max-w-4xl mx-auto px-6 py-24 animate-slide-up">
          <h1 className="text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl">Research background</h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            A short survey of the work UG AgroScan draws on, and the neighbouring problems that use
            the same kinds of data: disease detection, yield forecasting, soil testing, irrigation
            control and pest monitoring.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-16 grid lg:grid-cols-[200px_1fr] gap-12">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Contents</p>
            <ul className="space-y-3 text-sm">
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-muted-foreground hover:text-primary transition-colors">{s.title}</a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <article className="space-y-16">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="grid size-10 place-items-center rounded-full bg-primary/10">
                  <s.Icon className="size-5 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{s.title}</h2>
              </div>
              <p className="text-base text-muted-foreground leading-[1.8]">{s.body}</p>
            </section>
          ))}

          <section className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="relative aspect-[21/9]">
              <img src={drone} alt="Aerial view of farmland" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-70" />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
            </div>
            <div className="p-8">
              <h3 className="mb-2 text-xl font-semibold">Where UG AgroScan focuses</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                We started with disease detection because it is the decision a smallholder has to
                make fastest and can least afford to get wrong. Weather already feeds into spray
                timing. Soil readings and pest counts are the next signals we intend to add.
              </p>
              <div className="mt-4">
                <img src={cropMacro} alt="" loading="lazy" className="h-32 w-full rounded-xl object-cover opacity-80" />
              </div>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}