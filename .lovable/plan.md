## The error

`{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: missing OAuth secret"}`

Supabase Auth is rejecting the Google request because **no Google OAuth Client ID / Secret is configured** on the Google provider. We switched the sign-in flow to call Supabase directly (so it works on Vercel) — but direct Supabase Google sign-in requires the Google provider to hold real credentials. Lovable Cloud's managed Google credentials only work on the Lovable-hosted broker paths (`/~oauth/*`), which don't exist on your Vercel domain — that's why it errors on `agro-clarity-system.vercel.app` but not on `.lovable.app`.

## The fix — you provide Google OAuth credentials, once

This is a config step only. There is no code change needed on the app side; the code from the previous fix is already correct.

### Step 1 — Create OAuth credentials in Google Cloud Console

1. Google Cloud Console → **APIs & Services → Credentials → Create credentials → OAuth client ID**.
2. Application type: **Web application**.
3. **Authorized redirect URIs** — add exactly this one (Supabase's callback, not your app's):
   ```
   https://siscgtiiibzrlzpeolgm.supabase.co/auth/v1/callback
   ```
4. Copy the generated **Client ID** and **Client secret**.

(If the OAuth consent screen isn't configured yet, do that first — External user type, add your Vercel domain under Authorized domains, and add the `openid`, `email`, `profile` scopes.)

### Step 2 — Paste them into Lovable Cloud

In the Lovable editor: **Cloud → Users → Authentication Settings → Sign-in methods → Google** → paste Client ID + Client Secret → Save. This replaces the managed credentials with your own and makes direct Supabase Google OAuth work from any host.

### Step 3 — Set the Site URL and redirect allow-list

Same Authentication Settings screen → **URL Configuration**:
- **Site URL**: `https://agro-clarity-system.vercel.app`
- **Additional redirect URLs**: add all of
  - `https://agro-clarity-system.vercel.app/auth/callback`
  - `https://id-preview--fc18c52b-f234-4fb5-9f52-83ec2c6f0e90.lovable.app/auth/callback`
  - `http://localhost:8080/auth/callback` (for local dev, optional)

### Step 4 — Verify

Open the Vercel URL, click **Continue with Google**, complete consent, land on `/auth/callback`, then `/dashboard`. If it still fails, the error message on the returned page tells us which of the three fields above is wrong (usually a redirect URI mismatch — must match Step 1's URI byte-for-byte).

## Why not just re-enable Lovable-managed Google?

Managed Google routes through `/~oauth/*` on the Lovable proxy — those paths don't exist on Vercel, so Vercel users get a 404 (the earlier issue we already fixed). Using your own Google credentials is the only way Google sign-in works on a non-Lovable host.

## No code changes

`src/routes/auth.tsx` already calls `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: … /auth/callback } })` and `src/routes/auth.callback.tsx` handles the return. Both are correct — they just need the provider credentials above.
