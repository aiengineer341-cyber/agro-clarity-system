import { useEffect, useRef, useState } from "react";

type Handlers = {
  onStart?: () => void;
  onStop?: () => void;
  onRepeat?: () => void;
};

type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: (e: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void;
  onend: () => void;
  onerror: (e: unknown) => void;
  start: () => void;
  stop: () => void;
};

export function useVoiceCommands(handlers: Handlers, opts?: { paused?: boolean }) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const recRef = useRef<Recognition | null>(null);
  const activeRef = useRef(false);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR =
      (window as unknown as { SpeechRecognition?: new () => Recognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => Recognition }).webkitSpeechRecognition;
    setSupported(!!SR);
  }, []);

  const parse = (text: string) => {
    const t = text.toLowerCase().trim();
    if (/\b(start|begin|run)\b.*\b(scan|scanning|diagnos|analys|analyz)/.test(t) ||
        /\b(scan|diagnose|analyse|analyze)\s+now\b/.test(t)) {
      setLastCommand("start scan");
      handlersRef.current.onStart?.();
      return;
    }
    if (/\b(stop|cancel|abort|end)\b.*\b(scan|scanning|diagnos|analys|analyz)/.test(t) ||
        /\bstop\b/.test(t)) {
      setLastCommand("stop scan");
      handlersRef.current.onStop?.();
      return;
    }
    if (/\b(repeat|say|read)\b.*\b(result|results|diagnos)/.test(t) ||
        /\brepeat\b/.test(t)) {
      setLastCommand("repeat results");
      handlersRef.current.onRepeat?.();
      return;
    }
  };

  const start = () => {
    if (typeof window === "undefined") return;
    const SR =
      (window as unknown as { SpeechRecognition?: new () => Recognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => Recognition }).webkitSpeechRecognition;
    if (!SR) return;
    if (recRef.current) return;
    const r = new SR();
    r.lang = "en-US";
    r.interimResults = false;
    r.continuous = true;
    r.onresult = (e) => {
      const results = e.results;
      const last = results[results.length - 1];
      if (last && last.isFinal) parse(last[0].transcript);
    };
    r.onerror = () => { /* swallow */ };
    r.onend = () => {
      recRef.current = null;
      setListening(false);
      // auto-restart when active and not paused
      if (activeRef.current) {
        setTimeout(() => { if (activeRef.current) start(); }, 250);
      }
    };
    try {
      r.start();
      recRef.current = r;
      setListening(true);
    } catch { /* noop */ }
  };

  const stop = () => {
    const r = recRef.current;
    recRef.current = null;
    setListening(false);
    try { r?.stop(); } catch { /* noop */ }
  };

  const enable = () => { activeRef.current = true; if (!opts?.paused) start(); };
  const disable = () => { activeRef.current = false; stop(); };
  const toggle = () => { if (activeRef.current) disable(); else enable(); };

  // Pause/resume when opts.paused changes
  useEffect(() => {
    if (!activeRef.current) return;
    if (opts?.paused) stop();
    else start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts?.paused]);

  useEffect(() => () => { activeRef.current = false; stop(); }, []);

  return { supported, listening, lastCommand, enable, disable, toggle, active: activeRef.current };
}