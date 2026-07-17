# Add Scan Sounds & Voice Narration to Detection

Layer audio feedback onto the existing Detect flow: a background scanning sound while the AI is working, and spoken narration (text-to-speech) of each stage and the final diagnosis.

## What the user will experience

1. Presses **Run Diagnosis** on `/detect` (upload, camera, voice, or text mode).
2. A soft looping "scanner" sound plays while the request is in flight.
3. A calm voice narrates the steps: "Scanning image… analysing symptoms… consulting knowledge base… diagnosis ready."
4. When results arrive: sound stops, voice reads out the top prediction — disease name, confidence, severity, urgency, and the first line of treatment.
5. A small **speaker toggle** in the result panel lets users mute/replay narration, and preferences persist in localStorage.

## Technical approach

**Audio (scan sound)**
- Use Web Audio API to synthesize the scanner tone in-browser (two soft oscillators + gentle sweep). No asset download needed, works offline, respects volume.
- Small helper `src/lib/scan-audio.ts` exposing `startScanSound()` / `stopScanSound()`.
- Started when `analyse()` begins, stopped in the `finally` block; also stopped on unmount.

**Voice narration (TTS)**
- Use Lovable AI Gateway `openai/gpt-4o-mini-tts` (SSE streaming, PCM) via a new server function so the API key stays server-side.
- New server route `src/routes/api/tts.ts` (public-safe: rate-limited by auth middleware; only accepts short text). Returns `text/event-stream`.
- Client helper `src/lib/tts-client.ts` with `speak(text)` and `stopSpeaking()` using the streaming PCM playback pattern from `ai-text-to-speech`.
- Fallback: if the gateway call fails or is unavailable, silently fall back to the browser's built-in `speechSynthesis` so narration still works.

**Detect page wiring** (`src/routes/_authenticated.detect.tsx`)
- Add `voiceEnabled` state (persisted in localStorage, default on).
- Speaker toggle button (Volume2 / VolumeX icon) next to the "Diagnosis" heading.
- On `analyse()` start: `startScanSound()` + `speak("Scanning… analysing symptoms with the knowledge base.")`.
- On success: `stopScanSound()` + `speak(<top prediction summary>)`.
- On error: `stopScanSound()` + `speak("Analysis failed. Please try again.")`.
- Cleanup on unmount and when the user toggles voice off.

**No changes to** database, RAG logic, history, analytics, or auth.

## Files

- Add `src/lib/scan-audio.ts` — Web Audio scanner tone.
- Add `src/lib/tts-client.ts` — streaming PCM playback + speechSynthesis fallback.
- Add `src/routes/api/tts.ts` — server route proxying Lovable AI TTS.
- Edit `src/routes/_authenticated.detect.tsx` — trigger sound + narration, add speaker toggle.

## Out of scope

- Narrating the Analytics or History pages (this plan is Detect-only; happy to extend after).
- Downloadable audio of diagnoses.
- Multi-language voices (English only for now).
