import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ArrowRight, ScanLine, Database, Wifi, Leaf } from "lucide-react";
import heroField from "@/assets/hero-field.jpg";
import cassava from "@/assets/carousel-cassava.jpg";
import tomato from "@/assets/carousel-tomato.jpg";
import maize from "@/assets/carousel-maize.jpg";
import farmer from "@/assets/carousel-farmer.jpg";
import drone from "@/assets/carousel-drone.jpg";
import cropMacro from "@/assets/crop-leaf-macro.jpg";
import farmerTablet from "@/assets/farmer-tablet.jpg";
import diseaseLeaf from "@/assets/disease-leaf.jpg";

export const Route = createFileRoute("/_public/")({
  head: () => ({
    meta: [
      { title: "UG AgroScan AI — Precision Plant Disease Detection" },
      { name: "description", content: "Diagnose crop diseases in seconds with AI vision and an agronomy knowledge base. Built for cassava, maize, tomato, and more." },
      { property: "og:title", content: "UG AgroScan AI" },
      { property: "og:description", content: "AI-powered plant disease detection for every farmer." },
    ],
  }),
  component: Home,
});

const slides = [
  { src: cassava, alt: "Cassava field rows stretching to the horizon" },
  { src: tomato, alt: "Ripe tomatoes on a healthy vine" },
  { src: maize, alt: "Sunlit maize cobs in a mature field" },
  { src: farmer, alt: "Farmer inspecting a crop leaf with a phone" },
  { src: drone, alt: "Aerial view of patchwork farmland" },
];

function Home() {
  const autoplay = useRef(Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true }));
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "center" }, [autoplay.current]);

  useEffect(() => {
    if (!emblaApi) return;
    // Ensure autoplay actually starts post-mount
    autoplay.current?.play();
  }, [emblaApi]);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <img
          src={heroField}
          alt="Aerial view of healthy farmland"
          className="absolute inset-0 w-full h-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32 text-center animate-slide-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full mb-6">
            <Leaf className="size-3.5 text-primary" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-primary">Precision Agriculture · v1.0</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.95]">
            See every leaf. <br />
            <span className="text-primary">Catch every disease.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            UG AgroScan turns a single phone photo into an instant agronomy diagnosis — symptoms, severity, treatment, and prevention, grounded in a curated knowledge base.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link to="/auth" className="inline-flex items-center gap-2 rounded-sm bg-primary px-8 py-4 text-sm font-bold text-primary-foreground hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 transition-all">
              Get Started <ArrowRight className="size-4" />
            </Link>
            <Link to="/about" className="inline-flex items-center gap-2 rounded-sm border border-border bg-card/40 px-8 py-4 text-sm font-bold hover:border-primary/30 hover:text-primary transition-colors">
              Learn more
            </Link>
          </div>
        </div>
      </section>

      {/* Carousel */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-primary mb-2">In the field</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Crops we protect</h2>
          </div>
          <p className="hidden md:block text-sm text-muted-foreground max-w-sm">
            Cassava, tomato, maize, pepper, plantain and more — diagnosed across smallholder fields.
          </p>
        </div>

        <div className="overflow-hidden rounded-md border border-border" ref={emblaRef}>
          <div className="flex">
            {slides.map((s, i) => (
              <div key={i} className="relative min-w-0 shrink-0 grow-0 basis-full md:basis-2/3 lg:basis-1/2 pr-3 last:pr-0">
                <div className="group relative aspect-[16/10] overflow-hidden rounded-md">
                  <img
                    src={s.src}
                    alt={s.alt}
                    loading="lazy"
                    width={1536}
                    height={1024}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />
                  <span className="absolute bottom-4 left-4 text-xs font-mono uppercase tracking-widest text-primary/90">{s.alt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { Icon: ScanLine, title: "Vision-grade diagnosis", body: "Multimodal models trained on field photography classify disease, severity and confidence in under a second.", img: cropMacro },
            { Icon: Database, title: "Agronomy knowledge base", body: "Every diagnosis is grounded in curated, citable disease references — not model hallucinations.", img: diseaseLeaf },
            { Icon: Wifi, title: "Edge-ready", body: "Low-bandwidth flows keep UG AgroScan usable in remote fields with weak connectivity.", img: farmerTablet },
          ].map((f, i) => (
            <div key={f.title} className="group relative overflow-hidden rounded-md border border-border bg-card hover:border-primary/30 hover:-translate-y-1 transition-all animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={f.img} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                <f.Icon className="absolute bottom-4 left-4 size-6 text-primary" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="rounded-md border border-border bg-card p-10 md:p-16 text-center animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Ready to diagnose your first field?</h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Sign in and run your first scan in under a minute. Free to start.</p>
          <Link to="/auth" className="mt-8 inline-flex items-center gap-2 rounded-sm bg-primary px-8 py-4 text-sm font-bold text-primary-foreground hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 transition-all">
            Open UG AgroScan <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}