// Client-side TTS: streams PCM from /api/tts (Lovable AI) with a browser speechSynthesis fallback.
let currentCtx: AudioContext | null = null;
let currentAbort: AbortController | null = null;
let usingFallback = false;

export function stopSpeaking() {
  if (currentAbort) {
    try { currentAbort.abort(); } catch { /* noop */ }
    currentAbort = null;
  }
  if (currentCtx) {
    try { currentCtx.close(); } catch { /* noop */ }
    currentCtx = null;
  }
  if (usingFallback && typeof window !== "undefined" && "speechSynthesis" in window) {
    try { window.speechSynthesis.cancel(); } catch { /* noop */ }
  }
  usingFallback = false;
}

function fallbackSpeak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  usingFallback = true;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    u.pitch = 1;
    u.volume = 1;
    window.speechSynthesis.speak(u);
  } catch { /* noop */ }
}

export async function speak(text: string) {
  if (!text?.trim()) return;
  stopSpeaking();
  const abort = new AbortController();
  currentAbort = abort;

  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: abort.signal,
    });
    if (!res.ok || !res.body) throw new Error(`tts ${res.status}`);

    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC({ sampleRate: 24000 });
    if (ctx.state === "suspended") await ctx.resume().catch(() => {});
    currentCtx = ctx;
    let playhead = 0;
    let pending = new Uint8Array(0);

    const playChunk = (incoming: Uint8Array) => {
      const bytes = new Uint8Array(pending.length + incoming.length);
      bytes.set(pending);
      bytes.set(incoming, pending.length);
      const usable = bytes.length - (bytes.length % 2);
      pending = bytes.slice(usable);
      if (usable === 0) return;
      const samples = new Int16Array(bytes.buffer, 0, usable / 2);
      const floats = Float32Array.from(samples, (s) => s / 32768);
      const buffer = ctx.createBuffer(1, floats.length, 24000);
      buffer.copyToChannel(floats, 0);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(ctx.destination);
      if (playhead === 0) playhead = ctx.currentTime + 0.05;
      else playhead = Math.max(playhead, ctx.currentTime);
      src.start(playhead);
      playhead += buffer.duration;
    };

    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";
      for (const part of parts) {
        const line = part.split("\n").find((l) => l.startsWith("data:"));
        if (!line) continue;
        const payload = line.slice(5).trim();
        if (!payload) continue;
        try {
          const evt = JSON.parse(payload);
          if (evt.type === "speech.audio.delta" && evt.audio) {
            const bin = atob(evt.audio);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            playChunk(bytes);
          }
        } catch { /* ignore */ }
      }
    }
  } catch (err) {
    if ((err as { name?: string })?.name === "AbortError") return;
    fallbackSpeak(text);
  }
}