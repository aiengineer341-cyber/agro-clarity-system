import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { detectDisease } from "@/lib/detect.functions";
import { supabase } from "@/integrations/supabase/client";
import { SeverityBadge, UrgencyDot } from "@/components/severity-badge";
import { toast } from "sonner";
import { Upload, ScanLine, Loader2, Camera, Mic, Type, MicOff, X, Video } from "lucide-react";

export const Route = createFileRoute("/_authenticated/detect")({
  head: () => ({ meta: [{ title: "Detect — AgroVision AI" }] }),
  component: DetectPage,
});

const CROPS = ["Maize", "Tomato", "Cassava", "Pepper", "Plantain", "Cocoyam", "Potato", "Other"];

type Prediction = {
  disease: string; confidence: number; severity: string;
  symptoms: string; treatment: string; urgency: string; prevention: string;
  rationale?: string;
};
type Result = {
  crop: string;
  predictions: Prediction[];
  rag_docs_used?: number;
};

type Mode = "upload" | "camera" | "voice" | "text";

function DetectPage() {
  const navigate = useNavigate();
  const run = useServerFn(detectDisease);
  const [crop, setCrop] = useState("Maize");
  const [mode, setMode] = useState<Mode>("upload");
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<number>(0);
  const fileRef = useRef<HTMLInputElement>(null);

  // Camera (live capture)
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camOn, setCamOn] = useState(false);

  // Voice (Web Speech API)
  const recogRef = useRef<unknown>(null);
  const [listening, setListening] = useState(false);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamOn(false);
  };

  const stopVoice = () => {
    const r = recogRef.current as { stop?: () => void } | null;
    r?.stop?.();
    setListening(false);
  };

  useEffect(() => () => { stopCamera(); stopVoice(); }, []);

  // Switch mode → cleanup other inputs
  useEffect(() => {
    if (mode !== "camera") stopCamera();
    if (mode !== "voice") stopVoice();
  }, [mode]);

  const onFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(f);
    setResult(null);
  };

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, audio: false,
      });
      streamRef.current = s;
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
      }
      setCamOn(true);
    } catch {
      toast.error("Camera access denied");
    }
  };

  const captureFrame = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    const data = c.toDataURL("image/jpeg", 0.85);
    setImage(data);
    setResult(null);
    stopCamera();
    toast.success("Frame captured");
  };

  const startVoice = () => {
    const SR =
      (window as unknown as { SpeechRecognition?: new () => unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;
    if (!SR) { toast.error("Voice input not supported in this browser"); return; }
    const r = new (SR as new () => {
      lang: string; interimResults: boolean; continuous: boolean;
      onresult: (e: { results: { 0: { transcript: string } }[] }) => void;
      onend: () => void; onerror: (e: unknown) => void;
      start: () => void; stop: () => void;
    })();
    r.lang = "en-US"; r.interimResults = true; r.continuous = true;
    let final = description;
    r.onresult = (e) => {
      let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        // @ts-expect-error - SpeechRecognitionResult has isFinal
        if (e.results[i].isFinal) final += e.results[i][0].transcript + " ";
        else interim += e.results[i][0].transcript;
      }
      setDescription((final + interim).trim());
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    r.start();
    recogRef.current = r;
    setListening(true);
  };

  const analyse = async () => {
    const hasImage = !!image;
    const hasText = description.trim().length > 5;
    if (!hasImage && !hasText) {
      toast.error("Provide an image, capture, voice note or symptom description");
      return;
    }
    setLoading(true);
    try {
      const r = (await run({
        data: {
          imageBase64: hasImage ? image! : undefined,
          description: hasText ? description.trim() : undefined,
          crop,
        },
      })) as unknown as Result;
      setResult(r);
      setExpanded(0);
      const { data: u } = await supabase.auth.getUser();
      if (u.user && r.predictions?.length) {
        // 1. Upload image to Supabase Storage (if present) → public URL
        let imageUrl: string | null = null;
        if (hasImage && image) {
          try {
            const blob = await (await fetch(image)).blob();
            const ext = (blob.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
            const path = `${u.user.id}/${Date.now()}_scan.${ext}`;
            const { error: upErr } = await supabase.storage
              .from("vision-images")
              .upload(path, blob, { contentType: blob.type, upsert: false });
            if (upErr) throw upErr;
            const { data: pub } = supabase.storage.from("vision-images").getPublicUrl(path);
            imageUrl = pub.publicUrl;
          } catch (err) {
            console.warn("Image upload failed; saving record without image URL", err);
          }
        }

        // 2. Persist every ranked prediction grouped under one scan_id
        const scanId = crypto.randomUUID();
        const rows = r.predictions.map((p, i) => ({
          user_id: u.user!.id,
          scan_id: scanId,
          rank: i + 1,
          image_url: imageUrl,
          crop: r.crop || crop,
          disease: p.disease,
          severity: p.severity,
          confidence: p.confidence,
          symptoms: p.symptoms,
          treatment: p.treatment,
          urgency: p.urgency,
          prevention: p.prevention,
        }));
        const { error: insErr } = await supabase.from("detections").insert(rows);
        if (insErr) throw insErr;
      }
      toast.success("Diagnosis complete");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Detection failed");
    } finally {
      setLoading(false);
    }
  };

  const modes: { id: Mode; label: string; icon: typeof Upload }[] = [
    { id: "upload", label: "Upload", icon: Upload },
    { id: "camera", label: "Live Capture", icon: Video },
    { id: "voice", label: "Voice", icon: Mic },
    { id: "text", label: "Text", icon: Type },
  ];

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
            Input
          </h2>

          {/* Mode switcher */}
          <div className="grid grid-cols-4 gap-1.5 p-1 rounded-sm bg-card border border-border">
            {modes.map((m) => {
              const Icon = m.icon;
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`flex items-center justify-center gap-2 py-2 rounded-sm text-xs font-medium transition-colors ${
                    active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-background"
                  }`}
                >
                  <Icon className="size-3.5" />
                  <span className="hidden sm:inline">{m.label}</span>
                </button>
              );
            })}
          </div>

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

            {/* UPLOAD */}
            {mode === "upload" && (
              <div
                onClick={() => fileRef.current?.click()}
                className="relative aspect-video w-full rounded-sm bg-background border border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer overflow-hidden grid place-items-center"
              >
                {image ? (
                  <ImagePreview image={image} loading={loading} />
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
            )}

            {/* CAMERA */}
            {mode === "camera" && (
              <div className="space-y-3">
                <div className="relative aspect-video w-full rounded-sm bg-black border border-border overflow-hidden grid place-items-center">
                  {image && !camOn ? (
                    <ImagePreview image={image} loading={loading} />
                  ) : (
                    <>
                      <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover" />
                      {!camOn && (
                        <div className="relative z-10 text-center space-y-2">
                          <Camera className="size-8 text-muted-foreground mx-auto" />
                          <p className="text-sm text-muted-foreground">Camera idle</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  {!camOn ? (
                    <button onClick={startCamera} className="flex-1 py-2.5 border border-border rounded-sm text-sm font-medium hover:bg-background transition-colors flex items-center justify-center gap-2">
                      <Camera className="size-4" /> Start camera
                    </button>
                  ) : (
                    <>
                      <button onClick={captureFrame} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-sm text-sm font-bold flex items-center justify-center gap-2">
                        <ScanLine className="size-4" /> Capture frame
                      </button>
                      <button onClick={stopCamera} className="py-2.5 px-4 border border-border rounded-sm text-sm hover:bg-background transition-colors">
                        <X className="size-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* VOICE */}
            {mode === "voice" && (
              <div className="space-y-3">
                <div className="rounded-sm border border-border bg-background p-4 min-h-[140px]">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                    Transcript {listening && <span className="text-primary">· listening</span>}
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {description || <span className="text-muted-foreground/60">Press the mic and describe what you see on the plant…</span>}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={listening ? stopVoice : startVoice}
                    className={`flex-1 py-2.5 rounded-sm text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                      listening ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {listening ? (<><MicOff className="size-4" /> Stop</>) : (<><Mic className="size-4" /> Start dictation</>)}
                  </button>
                  {description && (
                    <button onClick={() => setDescription("")} className="py-2.5 px-4 border border-border rounded-sm text-sm hover:bg-background">
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* TEXT */}
            {mode === "text" && (
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Symptom description</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  placeholder="e.g. Yellowing leaves with brown circular spots and concentric rings on the lower foliage; affecting 30% of the plot."
                  className="w-full bg-background border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary resize-none"
                />
                <p className="text-[10px] font-mono text-muted-foreground">{description.length} chars</p>
              </div>
            )}

            <button
              onClick={analyse}
              disabled={loading || (!image && description.trim().length < 6)}
              className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-sm hover:bg-accent-bright disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (<><Loader2 className="size-4 animate-spin" /> Analysing…</>) : (<><ScanLine className="size-4" /> Run Diagnosis</>)}
            </button>
          </div>
        </section>

        {/* Result */}
        <section className="lg:col-span-5 space-y-4">
          <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            Diagnosis · Ranked Predictions
          </h2>
          <div className="rounded-sm border border-border bg-card p-6 min-h-[300px]">
            {!result || result.predictions.length === 0 ? (
              <div className="h-full grid place-items-center py-12 text-center">
                <div className="space-y-2">
                  <ScanLine className="size-8 text-muted-foreground/40 mx-auto" />
                  <p className="text-sm text-muted-foreground">Awaiting input.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  {result.crop} · {result.predictions.length} candidates · {result.rag_docs_used ?? 0} RAG docs
                </p>
                <ul className="space-y-2">
                  {result.predictions.map((p, i) => (
                    <PredictionRow
                      key={i}
                      p={p}
                      open={expanded === i}
                      rank={i + 1}
                      onToggle={() => setExpanded(expanded === i ? -1 : i)}
                    />
                  ))}
                </ul>
                <button
                  onClick={() => navigate({ to: "/history" })}
                  className="w-full mt-3 py-2.5 border border-border rounded-sm text-sm font-medium hover:bg-background transition-colors"
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

function ImagePreview({ image, loading }: { image: string; loading: boolean }) {
  return (
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
  );
}

function PredictionRow({
  p, open, rank, onToggle,
}: {
  p: Prediction; open: boolean; rank: number; onToggle: () => void;
}) {
  const pct = Math.round(p.confidence * 100);
  return (
    <li className="border border-border rounded-sm bg-background overflow-hidden">
      <button onClick={onToggle} className="w-full text-left p-3 hover:bg-card/50 transition-colors">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-muted-foreground w-5">#{rank}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold truncate">{p.disease}</p>
              <span className="font-mono text-xs font-semibold text-primary shrink-0">{pct}%</span>
            </div>
            <div className="mt-1.5 h-1 w-full rounded-full bg-border overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <SeverityBadge severity={p.severity} />
              <UrgencyDot urgency={p.urgency} />
            </div>
          </div>
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 space-y-3 border-t border-border/60">
          {p.rationale && <Section title="Rationale" body={p.rationale} />}
          <Section title="Symptoms" body={p.symptoms} />
          <Section title="Treatment Protocol" body={p.treatment} />
          <Section title="Prevention" body={p.prevention} />
        </div>
      )}
    </li>
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