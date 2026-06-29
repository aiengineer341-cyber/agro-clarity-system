import { createFileRoute } from "@tanstack/react-router";
import diseaseLeaf from "@/assets/disease-leaf.jpg";
import cropMacro from "@/assets/crop-leaf-macro.jpg";
import drone from "@/assets/carousel-drone.jpg";
import { Microscope, TrendingUp, Sprout, Droplets, Bug } from "lucide-react";

export const Route = createFileRoute("/_public/research")({
  head: () => ({
    meta: [
      { title: "Research & Use Cases — AI in Agriculture" },
      { name: "description", content: "An in-depth look at how AI transforms agriculture: crop disease detection, yield prediction, soil analysis, irrigation, and pest monitoring." },
      { property: "og:title", content: "AI in Agriculture — UG AgroScan Research" },
      { property: "og:description", content: "Real-world use cases of AI in farming." },
    ],
  }),
  component: Research,
});

const sections = [
  {
    id: "disease",
    Icon: Microscope,
    title: "Crop Disease Detection",
    body: "Computer vision models trained on tens of thousands of annotated leaf images can classify pathogens like cassava mosaic, tomato late blight, and maize streak in under a second — accuracy now rivals trained extension officers in benchmark studies. UG AgroScan pairs this with retrieval-augmented generation over a curated agronomy corpus so every diagnosis comes with cited symptoms, treatment, and prevention.",
  },
  {
    id: "yield",
    Icon: TrendingUp,
    title: "Yield Prediction",
    body: "By fusing satellite NDVI, weather, soil samples, and historical harvest data, machine learning models forecast yield weeks before harvest. Smallholder cooperatives use these predictions to negotiate fair prices, secure credit, and plan storage logistics — turning rough guesses into a reliable plan.",
  },
  {
    id: "soil",
    Icon: Sprout,
    title: "Soil & Nutrient Analysis",
    body: "Spectral imaging combined with portable sensors gives near-lab quality readings of nitrogen, phosphorus, potassium, and pH. ML pipelines translate these signals into per-plot fertilizer recommendations, cutting input costs while improving long-term soil health.",
  },
  {
    id: "irrigation",
    Icon: Droplets,
    title: "Precision Irrigation",
    body: "Reinforcement-learning controllers paired with soil-moisture telemetry water only what plants need, when they need it. Pilot deployments in arid regions have shown 20–40% water savings with no yield loss — critical as climate variability intensifies.",
  },
  {
    id: "pest",
    Icon: Bug,
    title: "Pest Monitoring with Computer Vision",
    body: "Smart traps with onboard image classifiers count and identify pest species in real time, alerting farmers before infestations spread. The same vision pipelines power drone-based scouting that finds early hotspots invisible from ground level.",
  },
];

function Research() {
  return (
    <div>
      <section className="relative border-b border-border overflow-hidden">
        <img src={diseaseLeaf} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        <div className="relative max-w-4xl mx-auto px-6 py-24 animate-slide-up">
          <p className="text-[10px] font-mono uppercase tracking-widest text-primary mb-3">Research</p>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.02]">AI in Agriculture: from sensors to decisions.</h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            Agriculture is the original data problem: variable inputs, noisy signals, high stakes. Over the past decade, advances in vision, language models, and edge computing have made it possible to turn raw field data into decisions that materially change yields and livelihoods. This is a survey of the use cases that matter — and how UG AgroScan fits into them.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-16 grid lg:grid-cols-[200px_1fr] gap-12">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-4">Contents</p>
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
                <div className="size-10 rounded-sm bg-primary/10 grid place-items-center">
                  <s.Icon className="size-5 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{s.title}</h2>
              </div>
              <p className="text-base text-muted-foreground leading-[1.8]">{s.body}</p>
            </section>
          ))}

          <section className="rounded-md border border-border bg-card overflow-hidden">
            <div className="relative aspect-[21/9]">
              <img src={drone} alt="Aerial view of farmland" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-70" />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
            </div>
            <div className="p-8">
              <h3 className="text-xl font-semibold mb-2">Where UG AgroScan focuses</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We start with disease detection because it is the highest-leverage decision a smallholder makes in a season. From there, every additional signal — soil, weather, pest counts — compounds into a more reliable agronomy assistant. The roadmap is wide; the wedge is narrow and deep.
              </p>
              <div className="mt-4">
                <img src={cropMacro} alt="" loading="lazy" className="rounded-sm w-full h-32 object-cover opacity-80" />
              </div>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}