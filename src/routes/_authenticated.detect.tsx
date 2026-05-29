import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { detectDisease } from "@/lib/detect.functions";
import { supabase } from "@/integrations/supabase/client";
import { SeverityBadge, UrgencyDot } from "@/components/severity-badge";
import { toast } from "sonner";
import { Upload, ScanLine, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/detect")({
  head: () => ({ meta: [{ title: "Detect — AgroVision AI" }] }),
  component: DetectPage,
});

const CROPS = ["Maize", "Tomato", "Cassava", "Pepper", "Plantain", "Cocoyam", "Potato", "Other"];

type Result = {
  crop: string; disease: string; severity: string; confidence: number;
  symptoms: string; treatment: string; urgency: string; prevention: string;
  rag_docs_used?: number;
};

function DetectPage() {
  const navigate = useNavigate();
  const run = useServerFn(detectDisease);
  const [crop, setCrop] = useState("Maize");
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(f);
    setResult(null);
  };

  const analyse = async () => {
    if (!image) { toast.error("Upload a leaf image first"); return; }
    setLoading(true);
    try {
      const r = (await run({ data: { imageBase64: image, crop } })) as Result;
      setResult(r);
      const { data: u } = await supabase.auth.getUser();
      if (u.user) {
        await supabase.from("detections").insert({
          user_id: u.user.id,
          image_url: image,
          crop: r.crop || crop,
          disease: r.disease,
          severity: r.severity,
          confidence: r.confidence,
          symptoms: r.symptoms,
          treatment: r.treatment,
          urgency: r.urgency,
          prevention: r.prevention,
        });
      }
      toast.success("Diagnosis complete");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Detection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      <header>
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
          Operations / Detect
        </p>
        <h1 className="text-3xl font-bold tracking-tight mt-1">Field Diagnostic Scanner</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Capture */}
        <section className="lg:col-span-7 space-y-4">
          <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            Capture
          </h2>
          <div className="rounded-sm border border-border bg-card p-6 space-y-6">
            <label className="block">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Crop type</span>
              <select
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
                className="mt-1.5 w-full bg-background border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
              >
                {CROPS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>

            <div
              onClick={() => fileRef.current?.click()}
              className="relative aspect-video w-full rounded-sm bg-background border border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer overflow-hidden grid place-items-center"
            >
              {image ? (
                <>
                  <img src={image} alt="Crop" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-4 border border-primary/30">
                    <div className="absolute -top-1 -left-1 size-3 border-l-2 border-t-2 border-primary" />
                    <div className="absolute -top-1 -right-1 size-3 border-r-2 border-t-2 border-primary" />
                    <div className="absolute -bottom-1 -left-1 size-3 border-b-2 border-l-2 border-primary" />
                    <div className="absolute -bottom-1 -right-1 size-3 border-b-2 border-r-2 border-primary" />
                    {loading && <div className="absolute left-0 top-0 h-px w-full bg-primary animate-scan-line" />}
                  </div>
                </>
              ) : (
                <div className="text-center space-y-2">
                  <Upload className="size-8 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">Click to upload a leaf image</p>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">JPG · PNG · up to 10MB</p>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
              />
            </div>

            <button
              onClick={analyse}
              disabled={!image || loading}
              className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-sm hover:bg-accent-bright disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (<><Loader2 className="size-4 animate-spin" /> Analysing…</>) : (<><ScanLine className="size-4" /> Run Diagnosis</>)}
            </button>
          </div>
        </section>

        {/* Result */}
        <section className="lg:col-span-5 space-y-4">
          <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            Diagnosis
          </h2>
          <div className="rounded-sm border border-border bg-card p-6 min-h-[300px]">
            {!result ? (
              <div className="h-full grid place-items-center py-12 text-center">
                <div className="space-y-2">
                  <ScanLine className="size-8 text-muted-foreground/40 mx-auto" />
                  <p className="text-sm text-muted-foreground">Awaiting capture.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{result.crop}</p>
                    <h3 className="text-xl font-bold mt-1">{result.disease}</h3>
                  </div>
                  <SeverityBadge severity={result.severity} />
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-border">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Confidence</p>
                    <p className="text-2xl font-mono font-semibold text-primary mt-1">{Math.round(result.confidence * 100)}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Urgency</p>
                    <div className="mt-2"><UrgencyDot urgency={result.urgency} /></div>
                  </div>
                </div>

                <Section title="Symptoms" body={result.symptoms} />
                <Section title="Treatment Protocol" body={result.treatment} />
                <Section title="Prevention" body={result.prevention} />

                <button
                  onClick={() => navigate({ to: "/history" })}
                  className="w-full mt-2 py-2.5 border border-border rounded-sm text-sm font-medium hover:bg-background transition-colors"
                >
                  View in history
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">{title}</p>
      <p className="text-sm leading-relaxed text-foreground/90">{body}</p>
    </div>
  );
}