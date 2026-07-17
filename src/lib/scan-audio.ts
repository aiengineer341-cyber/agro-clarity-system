// Synthesized scanner tone via Web Audio — no asset required.
let ctx: AudioContext | null = null;
let nodes: { osc1: OscillatorNode; osc2: OscillatorNode; gain: GainNode; lfo: OscillatorNode; lfoGain: GainNode } | null = null;

export function startScanSound() {
  if (typeof window === "undefined") return;
  stopScanSound();
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const gain = ctx.createGain();
    gain.gain.value = 0.045;
    gain.connect(ctx.destination);

    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.value = 620;
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = 880;
    osc1.connect(gain);
    osc2.connect(gain);

    // gentle sweep LFO on osc1
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.6;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 120;
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);

    osc1.start();
    osc2.start();
    lfo.start();
    nodes = { osc1, osc2, gain, lfo, lfoGain };
  } catch {
    // ignore
  }
}

export function stopScanSound() {
  if (nodes && ctx) {
    try {
      nodes.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      const n = nodes;
      const c = ctx;
      setTimeout(() => {
        try { n.osc1.stop(); n.osc2.stop(); n.lfo.stop(); } catch { /* noop */ }
        try { c.close(); } catch { /* noop */ }
      }, 200);
    } catch { /* noop */ }
  }
  nodes = null;
  ctx = null;
}