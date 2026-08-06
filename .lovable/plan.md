# Fix: Knowledge base shows no diseases for signed-in users

## What's wrong

The 33 disease references are in the database and the read rule allows everyone to read them, but the table's **table-level permissions were wiped** by a later security cleanup. The database now has zero permissions granted on `disease_docs` for the app's app-user roles.

Confirmed by inspection:
- `disease_docs` contains 33 rows.
- Read policy `Docs public read` exists and allows all reads.
- Permission list for the table is **empty** — no read permission for the signed-in or anonymous role.

So the browser request is rejected with a permission error before the read rule is ever considered. The page ignores that error (it only reads `data`, never `error`), sets an empty list, and renders a page with no cards and no crop chips — exactly what the screenshot shows.

## The fix

1. **Restore read access** (database change): grant read on `disease_docs` to the signed-in and anonymous roles, and full access to the service role used by server-side diagnosis. Read-only reference content, so this is safe and matches the existing public-read rule.

2. **Stop silent failures on the Knowledge page** (`src/routes/_authenticated.knowledge.tsx`):
   - Capture `error` from the query, not just `data`.
   - Show a clear, farmer-friendly message ("Couldn't load the reference library — retry") with a Retry button instead of a blank page, using the existing error-mapping helper in `src/lib/errors.ts`.
   - Keep the loading state until the request settles so an empty screen is never mistaken for "no data".

3. **Structure check on the client build**: the deployed page in the screenshot is missing the crop filter chips and per-crop group headers that the current code renders, so it is serving an older bundle. After the fix, republish so the grouped layout (crop headings + entry counts + filter chips + search) is live.

## Technical notes

- Migration: `GRANT SELECT ON public.disease_docs TO anon, authenticated;` and `GRANT ALL ON public.disease_docs TO service_role;` No schema or policy changes needed.
- Also verify the same permission loss did not hit other reference tables read directly from the browser; re-grant where a matching read policy exists.
- No changes to diagnosis logic, prompts, or stored records.
