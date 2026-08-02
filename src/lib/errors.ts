/**
 * Turns any thrown value into a short, human, actionable message.
 * Never leaks stack traces, provider names or internal identifiers.
 */
const MAP: Array<{ test: RegExp; message: string }> = [
  { test: /rate limit|429|too many/i, message: "Too many scans at once. Wait about a minute and try again." },
  { test: /credits|402|quota|insufficient/i, message: "The diagnosis service has run out of capacity. Try again later." },
  { test: /unauthori[sz]ed|401|jwt|not signed in|session/i, message: "Your session expired. Sign in again to continue." },
  { test: /forbidden|403|permission denied|row-level security|policy/i, message: "You don't have access to this record." },
  { test: /not found|404|no rows/i, message: "We couldn't find that record. It may have been deleted." },
  { test: /invalid login credentials/i, message: "Wrong email or password." },
  { test: /email not confirmed/i, message: "Confirm your email address first, then sign in." },
  { test: /user already registered|already exists/i, message: "That email already has an account. Sign in instead." },
  { test: /password/i, message: "Use a password of at least 6 characters." },
  { test: /failed to fetch|network|offline|timeout|ETIMEDOUT/i, message: "No connection. Check your network and retry." },
  { test: /payload too large|413|file size|exceeds/i, message: "That photo is too large. Use an image under 8 MB." },
  { test: /mime|unsupported (file|type)/i, message: "That file isn't a supported photo. Use a JPG or PNG." },
  { test: /camera|NotAllowedError|Permission denied/i, message: "Camera access was blocked. Allow it in your browser settings." },
  { test: /parse|JSON|malformed/i, message: "The diagnosis came back unreadable. Retake the photo and scan again." },
  { test: /storage|bucket/i, message: "The photo couldn't be uploaded. Try again in a moment." },
];

export function friendlyError(e: unknown, fallback = "Something went wrong. Please try again."): string {
  const raw =
    e instanceof Error ? e.message : typeof e === "string" ? e : (e as { message?: string })?.message;
  if (!raw) return fallback;
  for (const m of MAP) if (m.test.test(raw)) return m.message;
  // Short, already-human messages pass through; anything technical is masked.
  if (raw.length <= 120 && !/[{}<>]|at \w+ \(|stack/i.test(raw)) return raw;
  return fallback;
}