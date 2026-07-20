## The Root Cause

Your app uses Lovable Cloud's **managed Google OAuth** via `lovable.auth.signInWithOAuth("google", …)`. That helper redirects the browser to `/~oauth/initiate` and expects a callback at `/~oauth/callback`. Those paths are **served by Lovable's edge proxy** — they only exist on `*.lovable.app` hosts and custom domains connected through Lovable.

On `agro-clarity-system.vercel.app` those routes don't exist, so Google's redirect lands on Vercel's static handler and returns **404 — Page not found**. This is a hosting/configuration issue, not a database or RLS issue. Nothing in `supabase.auth` or the security policies is blocking sign-in.

There are two clean fixes; pick one.

## Option A — Host on Lovable (recommended, zero code)

1. Publish the app from Lovable (Publish button → get `*.lovable.app` URL).
2. Optionally connect your custom domain in **Project Settings → Domains** (Lovable manages DNS + SSL + the `/~oauth/*` broker paths automatically).
3. Point users at that URL and retire the Vercel deployment (or 301-redirect it to the Lovable domain).

No code changes needed. Google sign-in, third-party OAuth, and the redirect callback all work out of the box because Lovable's proxy handles `/~oauth/*`.

## Option B — Keep Vercel, replace managed OAuth with direct Supabase OAuth

Lovable's managed Google broker cannot run on Vercel. To keep Vercel we bypass it and call Supabase's Google provider directly:

1. **Configure Google in Supabase Auth** — call `supabase--configure_social_auth` with `providers: ["google"]` so the Google provider is enabled at the Supabase project level (managed credentials).
2. **Rewrite the Google button** in `src/routes/auth.tsx` to call:
   ```ts
   supabase.auth.signInWithOAuth({
     provider: "google",
     options: { redirectTo: `${window.location.origin}/auth/callback` },
   })
   ```
   (Drop the `lovable.auth.*` call for Google on this deployment.)
3. **Add a public callback route** `src/routes/auth.callback.tsx` that waits for `supabase.auth.getSession()` to hydrate, then navigates to `/dashboard`. Keep it outside `_authenticated/`.
4. **Whitelist the Vercel origin** in Supabase Auth Site URL / Additional Redirect URLs:
   - Site URL: `https://agro-clarity-system.vercel.app`
   - Redirect URLs: `https://agro-clarity-system.vercel.app/auth/callback`, plus the Lovable preview URL and any custom domain.
5. **Configure the Google Cloud OAuth client** (only needed if you're using your own Google credentials rather than Supabase's managed ones) — add the same callback + Supabase's `https://<project-ref>.supabase.co/auth/v1/callback` as Authorized redirect URIs.
6. **Verify** by hard-refreshing the Vercel deployment, clicking Continue with Google, and confirming the browser round-trips through Google → Supabase → `/auth/callback` → `/dashboard`.

Email/password sign-up already works on both hosts; no change needed there. Existing RLS and security policies are unaffected.

## What is NOT the problem (so we don't rabbit-hole)

- Not RLS / `has_role` / the recent security migration — those govern data access after sign-in, not the OAuth redirect.
- Not the `_authenticated` gate — a 404 on the Google return URL happens before any route guard runs.
- Not `redirect_uri` pointing at a protected route — the helper's underlying broker path itself is missing on Vercel.

## Pick a path

Which option do you want me to execute? **A (host on Lovable)** is one click and needs no code. **B (keep Vercel)** is the code plan above — say the word and I'll implement steps 1–3 and give you the exact values to paste for steps 4–5.