
## Goal

Add 5 new public-facing marketing pages to AgriVision, with a consistent header (existing branding) and a new shared footer. Authenticated app routes (`/dashboard`, `/detect`, etc.) remain untouched.

## Routing changes

Current `src/routes/index.tsx` is the landing/hero page behind no auth. We will:

- Replace `index.tsx` with the new **Homepage** (hero + auto-playing carousel).
- Add 4 new public routes:
  - `src/routes/about.tsx` → `/about`
  - `src/routes/team.tsx` → `/team`
  - `src/routes/research.tsx` → `/research`
  - `src/routes/contact.tsx` → `/contact`
- Add a new shared **public layout** with a marketing top nav + footer:
  - `src/routes/_public.tsx` (pathless layout)
  - Move `index`, `about`, `team`, `research`, `contact` under it as `_public.index.tsx`, `_public.about.tsx`, etc.
- Authenticated routes under `_authenticated.*` are unchanged.

## Shared components (new)

- `src/components/marketing-nav.tsx` — sticky nav with AgroVision logo + links: Home, About, Team, Research, Contact, plus a "Sign in" CTA → `/auth`. Mirrors `top-nav` styling (sticky, blur, active underline, mobile hamburger, allowed animations only).
- `src/components/site-footer.tsx` — consistent footer used on every public page. Sections:
  - Brand + tagline
  - Quick links (mirrors nav)
  - Contact: Gmail link (`mailto:`), location
  - Social: Twitter/X, LinkedIn, GitHub, Instagram (lucide icons, hover transitions)
  - Bottom bar: © AgroVision {year}

## Page-by-page

### 1. Homepage (`/`)
- Hero: headline ("See every leaf. Catch every disease."), subcopy about AgroVision, two CTAs ("Get Started" → `/auth`, "Learn more" → `/about`).
- Uses existing `hero-field.jpg` as backdrop with overlay.
- **Auto-playing carousel** of 5–6 agricultural images using the existing `embla-carousel-react` (already in `components/ui/carousel.tsx`) + `embla-carousel-autoplay` plugin (new dep). Smooth fade/slide transition, image hover scale + brightness via Tailwind.
- Sections: "What AgroVision does" (3-feature grid using existing assets `crop-leaf-macro.jpg`, `farmer-tablet.jpg`, `disease-leaf.jpg`), final CTA band.

### 2. About (`/about`)
- Mission statement: explain AgroVision — AI-powered crop disease detection for smallholder farmers, problem (yield loss from late diagnosis, limited extension services), solution (vision + RAG knowledge), impact.
- **Tech Stack** grid section: React 19, TanStack Start, TanStack Router, Tailwind CSS v4, shadcn/ui, Vite, TypeScript, Lovable Cloud (Supabase: Postgres, Auth, Storage), Python / TensorFlow / Keras (model training), Lovable AI Gateway (Gemini vision), RAG knowledge base. Each item is a card with icon + short blurb.

### 3. Team (`/team`)
- 3 generated profile photos (premium imagegen, transparent_background=false) of young African men — Hayford, Eric, Joseph.
- Generated paths: `src/assets/team-hayford.jpg`, `src/assets/team-eric.jpg`, `src/assets/team-joseph.jpg`.
- Roles: Hayford — Founder & ML Engineer; Eric — Full-Stack Engineer; Joseph — Agronomy & Data Lead.
- Card grid with hover lift, fade-in staggered entry.

### 4. Research & Use Cases (`/research`)
- Long-form article layout: intro on AI in Agriculture, then sections for use cases:
  1. Crop Disease Detection (with reference to AgroVision's own approach)
  2. Yield Prediction
  3. Soil & Nutrient Analysis
  4. Precision Irrigation
  5. Pest Monitoring with Computer Vision
- Mix of prose blocks and blog-style cards. Uses `disease-leaf.jpg` / `crop-leaf-macro.jpg` as section imagery.
- Sticky TOC sidebar on desktop (anchor links to in-page sections — acceptable for long article, per route-architecture guidance).

### 5. Contact (`/contact`)
- Form fields: name, email, message — validated client-side with `zod` (already in deps) + react-hook-form (already installed). Submits to a new `createServerFn` `submitContact` that inserts into a new `contact_messages` table.
- Alongside form: contact info block (Gmail `mailto:hello@agrovision.app`, social icons), reused from footer styles.
- Success/error via existing `sonner` toaster.

## Backend (minimal)

New migration: `contact_messages` table.

```sql
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);
grant insert on public.contact_messages to anon, authenticated;
grant all on public.contact_messages to service_role;
alter table public.contact_messages enable row level security;
create policy "Anyone can submit" on public.contact_messages
  for insert to anon, authenticated with check (true);
```

Server fn `src/lib/contact.functions.ts` validates with zod (name 1–100, email valid, message 1–2000) and inserts via authed/anon supabase client.

## Design system

- Reuse existing tokens in `src/styles.css`. No new colors.
- Animations limited to allowed set: fade-in, fade-out, slide-up, slide-down, hover transitions, micro-interactions.
- Carousel autoplay = 4s, smooth slide.
- All images via `imagegen` (premium for team portraits, standard for crops/landscapes).

## Asset generation

- 5 carousel images (cassava field, tomato vines, maize close-up, farmer inspecting leaf, drone-over-field) → `src/assets/carousel-*.jpg`.
- 3 team portraits.

## Out of scope

- No changes to existing authenticated routes, detect/save flow, dashboard metrics.
- No new auth or roles.
- No email sending — contact form only stores to DB (toast confirms receipt).
- No i18n.

## Files touched

Created:
- `src/routes/_public.tsx`, `_public.index.tsx`, `_public.about.tsx`, `_public.team.tsx`, `_public.research.tsx`, `_public.contact.tsx`
- `src/components/marketing-nav.tsx`, `src/components/site-footer.tsx`
- `src/lib/contact.functions.ts`
- `supabase/migrations/<ts>_contact_messages.sql`
- 5 carousel + 3 team image assets

Edited:
- Delete old `src/routes/index.tsx` (replaced by `_public.index.tsx`)
- `package.json` (add `embla-carousel-autoplay`)

Auto-regenerated:
- `src/routeTree.gen.ts`
