import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ArrowRight, ScanLine, BookOpen, CloudSun } from "lucide-react";
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
      { title: "UG AgroScan — Crop Disease Detection from a Photo" },
      { name: "description", content: "Photograph a leaf and get the likely disease, its severity, the treatment to use and the best time to spray. Cassava, maize, tomato, pepper, plantain and more." },
      { property: "og:title", content: "UG AgroScan — Crop Disease Detection" },
      { property: "og:description", content: "Diagnose crop disease from a photo, with treatment steps and spray timing." },
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
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
        <div className="relative mx-auto max-w-3xl animate-slide-up px-6 py-20 text-center md:py-28">
          <h1 className="text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
            Know what's wrong with your crop <span className="text-primary">today</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Take a photo of the affected leaf. You get the likely disease, how severe it is, what to
            apply, and the best window to spray it.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link to="/auth" className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 active:scale-95">
              Scan a crop <ArrowRight className="size-4" />
            </Link>
            <Link to="/about" className="inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-7 py-3.5 text-sm font-semibold transition-colors hover:border-primary/30 hover:text-primary">
              How it works
            </Link>
          </div>
        </div>
      </section>

      {/* Carousel */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Crops covered</h2>
          </div>
          <p className="hidden max-w-sm text-sm text-muted-foreground md:block">
            Cassava, tomato, maize, pepper, plantain, cocoyam and potato.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border" ref={emblaRef}>
          <div className="flex">
            {slides.map((s, i) => (
              <div key={i} className="relative min-w-0 shrink-0 grow-0 basis-full md:basis-2/3 lg:basis-1/2 pr-3 last:pr-0">
                <div className="group relative aspect-[16/10] overflow-hidden rounded-2xl">
                  <img
                    src={s.src}
                    alt={s.alt}
                    loading="lazy"
                    width={1536}
                    height={1024}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />
                  <span className="absolute bottom-4 left-4 text-xs font-medium text-foreground/90">{s.alt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { Icon: ScanLine, title: "Photo, voice or typed symptoms", body: "Upload a picture, use the camera, describe the problem out loud, or type it. Any of the four works.", img: cropMacro },
            { Icon: BookOpen, title: "Checked against a written reference", body: "Each result is matched to a stored agronomy reference for that crop before it is shown to you.", img: diseaseLeaf },
            { Icon: CloudSun, title: "Spray timing from local weather", body: "Rain, wind and heat for your location decide whether to spray now or wait, and we say which.", img: farmerTablet },
          ].map((f, i) => (
            <div key={f.title} className="group animate-slide-up relative overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/30" style={{ animationDelay: `${i * 80}ms` }}>
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
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="animate-fade-in rounded-3xl border border-border bg-card p-10 text-center md:p-14">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Run your first scan</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">
            Create an account with an email and password. No card needed.
          </p>
          <Link to="/auth" className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 active:scale-95">
            Get started <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}