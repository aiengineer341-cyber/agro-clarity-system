## Problem

The `/analysis` page fetches detections once inside a `useEffect` on mount and never listens for new inserts. So after you save a diagnosis on `/detect` (or in another tab), the Analytics page keeps showing the stale snapshot — often "No scan data yet" if it was opened before the first save. It also silently swallows query errors, so an RLS/session hiccup looks identical to "empty".

The database itself is fine: `detections` has 40 rows across 4 users and RLS lets each owner (plus admins / extension officers) read their own rows.

## Fix

Update `src/routes/_authenticated.analysis.tsx` only — no schema or business-logic changes.

1. **Refetch on focus + on route mount**
   - Extract the fetch into a `load()` function.
   - Call it on mount, on `window` `focus`, and on `visibilitychange` when the tab becomes visible.

2. **Realtime subscription**
   - Subscribe to `postgres_changes` on `public.detections` filtered by `user_id=eq.<currentUserId>` for `INSERT`, `UPDATE`, `DELETE`.
   - On any event, call `load()` so charts and KPIs update live while the user watches.
   - Enable realtime for the table via migration: `ALTER PUBLICATION supabase_realtime ADD TABLE public.detections;` (idempotent — wrapped in a `DO` block that ignores "already member").

3. **Surface errors instead of silent empty state**
   - If the Supabase query returns an `error`, show a red inline message with a Retry button instead of "No scan data yet."
   - Distinguish three states: `loading`, `error`, `empty`, `ready`.

4. **Optional small polish**
   - Show a subtle "Updated Xs ago · Live" pill in the header when the realtime channel is subscribed, so it's obvious the page is live.

## Files

- Edited: `src/routes/_authenticated.analysis.tsx`
- New migration: enable realtime replication for `public.detections`.

## Not changing

- Detect/save flow on `/detect`.
- Dashboard charts (`src/components/dashboard-charts.tsx`) — already re-computes from the dashboard's own fetched rows.
- RLS policies — current ones already allow the owner to read their scans.
