# MADNESS restaurant website

Public website and staff dashboard for **MADNESS**, a villain/comic-themed restaurant in the UAE
([@madness.uae](https://www.instagram.com/madness.uae/)).

- Public site: home (hero carousel, delivery links, featured dishes, about, reviews, locations, gallery), menu with search,
  category and branch filters, dish pages, About, Locations, Reviews (feedback form), Contact, Privacy, Terms.
- Staff dashboard (`/admin`): menu, categories, branches (hours, links, branch pricing), feedback moderation and enquiries,
  delivery links, hero slides / page copy / gallery, settings.
- Customers order through third-party delivery platforms. There is no cart, checkout or payment.

> **Status: preview.** Menu items, prices, some copy and branch details are **sample or unverified** and must be replaced
> with information supplied by the restaurant before launch. See [Replacing sample content](#replacing-sample-content).

---

## Technology

| Area | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router), React 19, TypeScript (strict) |
| Styling | Tailwind CSS v4 with central design tokens (`src/app/globals.css`) |
| Admin UI | [Arc](https://uiarc.dev) components (`src/components/arc`) |
| Animation | Motion for React (respects `prefers-reduced-motion`) |
| Data, auth, images | Supabase (PostgreSQL + RLS, Auth, Storage) |
| Validation | Zod (shared by client and server), React Hook Form on the feedback form |
| Icons | Lucide React |
| Hosting | Vercel |

## Two data modes

| Mode | When | Data | Admin sign-in | Images |
| --- | --- | --- | --- | --- |
| **Demo** | Supabase variables not set | `.data/demo-db.json` (created on first write, git-ignored; delete it to reset) seeded from `src/lib/data/demo-seed.ts` | One password from `DEMO_ADMIN_PASSWORD` | Saved to `public/uploads/` |
| **Supabase** | `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` set | PostgreSQL with RLS | Supabase Auth + `admin_users` roles | Supabase Storage bucket `media` |

Demo mode is for local development only. It is automatically disabled in production builds
(unless `ALLOW_DEMO_ADMIN_IN_PRODUCTION=true`, which is not recommended), and file writes do not persist on Vercel.

---

## Getting started

Requirements: Node.js 20.9+ (22.18+ to run the seed generator script), npm.

```bash
npm install
```

```bash
cp .env.example .env.local
```

Fill in `.env.local` (see below), then:

```bash
npm run dev
```

Open http://localhost:3000 and http://localhost:3000/admin.

### Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build (includes lint and type checks) |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm run db:seed-sql` | Regenerate `supabase/seed.sql` from `src/lib/data/demo-seed.ts` |
| `npm run photos` | Convert raw photos in `/photo` to optimised WebP in `/public/images` |

## Environment variables

| Variable | Required | Where it's used |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Yes in production | Canonical URLs, sitemap, Open Graph, robots |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase mode | Public client, auth, image host allow-list |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase mode | Public reads (RLS-limited), staff sessions |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase mode | **Server only.** Inserting validated feedback and enquiries. Never prefix with `NEXT_PUBLIC_` |
| `DEMO_ADMIN_PASSWORD` | Demo mode | Local demo sign-in |
| `DEMO_SESSION_SECRET` | Demo mode | Signs the demo session cookie (use 32+ random bytes) |

---

## Supabase setup

1. Create a Supabase project (choose a region close to the UAE, for example Mumbai or Frankfurt).
2. Apply the schema. Either paste `supabase/migrations/20261026000000_initial_schema.sql` into the SQL editor, or with the
   Supabase CLI:

   ```bash
   npx supabase link --project-ref YOUR_PROJECT_REF
   ```

   ```bash
   npx supabase db push
   ```

3. (Optional) load the sample content by running `supabase/seed.sql` in the SQL editor. It contains only sample dishes,
   the two unverified branches, hero slides, gallery and settings. **No reviews and no delivery links.**
4. Copy the project URL, anon key and service-role key into `.env.local` (and into Vercel, see below).

The migration creates:

- Tables: `branches`, `menu_categories`, `menu_items`, `branch_menu_items`, `delivery_links`, `customer_feedback`,
  `contact_enquiries`, `admin_users`, `admin_branch_access`, `site_settings`, `hero_slides`, `gallery_images`.
- UUID keys, `NUMERIC(10,2)` prices (AED), check constraints, indexes and `updated_at` triggers.
- Safe deletes: a category with dishes cannot be deleted (`RESTRICT`); a branch with feedback cannot be deleted
  (`RESTRICT`), so deactivate it instead.
- Row Level Security on every table:
  - Visitors read only active public content. They have **no** access to `customer_feedback` or `contact_enquiries`.
  - Approved reviews are exposed only through `get_published_reviews()`, which returns name, rating, message, branch and
    date. No email, phone or country.
  - Writes require an active row in `admin_users`. Owners/admins manage everything; branch editors manage only their
    branches' details, branch prices, delivery links and feedback.
  - A trigger stops staff editing what a customer wrote (name, message, contact details).
- Storage bucket `media`: public read, 5 MB limit, JPEG/PNG/WebP/AVIF only, staff-only uploads.

### Creating staff accounts

1. Supabase dashboard, Authentication, Users: **Add user** (email + password, or send an invite).
   Turn off public sign-ups under Authentication, Providers, Email, so nobody can register themselves.
2. In the SQL editor, give the user a role (the first one must be an owner):

   ```sql
   insert into public.admin_users (id, email, display_name, role)
   select id, email, 'Owner name', 'owner' from auth.users where email = 'owner@example.com';
   ```

3. For a branch editor, use `role = 'branch_editor'` and link their branches:

   ```sql
   insert into public.admin_branch_access (admin_user_id, branch_id)
   select u.id, b.id from public.admin_users u, public.branches b
   where u.email = 'editor@example.com' and b.slug = 'bluewaters';
   ```

Removing access: set `is_active = false` in `admin_users`.

### Image storage

Uploads from the dashboard go to the `media` bucket under `menu/`, `branches/`, `hero/`, `gallery/` and `content/`, with
random file names. Files are checked by their bytes (not just the extension) and limited to 5 MB. Replacing or deleting an
image removes the old uploaded file. Bundled images in `/public/images` are never deleted.

---

## Deploying to Vercel

1. Push the repository to GitHub and import it in Vercel (framework: Next.js, defaults are fine).
2. Add the environment variables above for Production (and Preview if wanted). Do **not** set the demo variables.
3. Deploy. Then set `NEXT_PUBLIC_SITE_URL` to the final domain and redeploy so the sitemap and canonical URLs are correct.
4. Add the domain in Vercel; HTTPS is automatic. HSTS and other security headers are set in `next.config.ts`.

Public pages are statically generated and refreshed every 60 seconds, and immediately after any dashboard change.

---

## Replacing sample content

Everything below is editable in `/admin`; no code changes needed.

| What | Where | Notes |
| --- | --- | --- |
| Dishes, prices, photos, ingredients | Menu | Untick **Sample content** once a dish is real; the Sample badge disappears. |
| Allergens and dietary labels | Menu, dish page | Fill only with kitchen-verified information, then tick **verified**. Until then guests see “ask our team”. |
| Branch addresses, hours, phones | Branches | Tick **confirmed by the business** to remove the public notice and include the branch in search-engine data. |
| Hero slides, home/About copy, gallery | Website content | The About “Our story” text is a placeholder and must come from the restaurant. |
| Social links, contact email/phone | Settings | |
| “Sample content” banner | Settings | Turn off when everything above is real. |
| Logo | `src/components/site/logo.tsx` | Currently a text wordmark. Drop the official logo in `/public/brand/` and render it there. |
| Colours and fonts | `src/app/globals.css` (`@theme`) | The palette is a proposal; `neon` was sampled from the venue's signage. |
| Privacy policy and terms | `src/app/(site)/privacy`, `src/app/(site)/terms` | Placeholders. Must be completed and legally reviewed. |

The bundled photos (`/public/images`) were converted from the screenshots in `/photo`. They are low resolution (600 to
1000 px wide). Replace them with original files, especially the hero images, and confirm the right to use each one.

### Branch information sources

The two seeded branches are **unverified**:

- **Bluewaters**: phone, hours (12 PM to 1 AM), “no reservation” and the map link come from the @madness.uae Instagram
  bio (checked 26 Oct 2026). The full street address is still needed.
- **Jumeirah**: address (609 Jumeira St, Umm Suqeim 1) and phone come from madnessmadeindubai.shop, which may not be an
  official MADNESS site. Hours are unknown.

## Delivery and Google review links

- **Delivery** (`/admin/delivery`): add one link per platform per branch, using the exact MADNESS listing URL from talabat,
  noon Food, Deliveroo or Careem. Only active links show on the site; with none, the site shows a “call a branch” message.
  Use **Test link** to confirm each one opens the right branch. Links must be `https://`.
- **Google reviews** (`/admin/branches/…`): in Google Business Profile, choose “Ask for reviews” and paste the link into
  the branch's **Google review link**. A brand-wide link can be set in Settings. The site never scrapes or imitates Google
  ratings, and website feedback is clearly labelled as separate from Google reviews.

---

## How feedback works

1. A guest submits the form on `/reviews`. No account is needed; email and phone are optional.
2. The server validates the input with Zod, applies a honeypot and minimum-fill-time check, rate-limits by IP
   (5 per hour) and rejects duplicates sent within 24 hours.
3. The submission is stored as **pending**. Nothing is published automatically.
4. Staff publish, mark as reviewed, or reject it in `/admin/feedback`, and can add internal notes.
5. Only **published** reviews appear on the site, showing display name, rating, comment, branch and date.

## Project structure

```
src/
  app/
    (site)/            public pages (home, menu, about, locations, reviews, contact, legal)
    admin/             login, dashboard pages and server actions (actions/*)
    actions/           public server actions (feedback, contact)
    sitemap.ts, robots.ts
  components/
    site/              public UI (header, hero carousel, cards, forms)
    admin/             dashboard UI built on Arc
    arc/               Arc components (installed with the shadcn CLI)
  config/site.ts       non-sensitive site config
  lib/
    data/              repository interface, Supabase and demo implementations, sample seed
    auth/              session and permission checks
    validation/        Zod schemas
    supabase/          server clients (public, session, service role)
    storage.ts         image upload abstraction
    menu.ts, format.ts business logic and formatting
  middleware.ts        /admin gate and Supabase session refresh
supabase/
  migrations/          schema, RLS, storage
  seed.sql             generated sample content
```

## Security notes

- Every admin page and server action checks the signed-in user on the server (`src/lib/auth/session.ts`), and RLS checks
  again in the database. The middleware is only a first gate.
- The service-role key is used in exactly two server functions (inserting feedback and enquiries) and never reaches the
  browser.
- Public API responses never include email, phone or country from submissions.
- Errors shown to users are generic; logs record error codes, not submitted personal data.
- `/admin` is `noindex` and excluded in `robots.txt`.

### Backups and recovery

- Supabase Pro includes daily backups; enable Point-in-Time Recovery if the business needs finer recovery.
- Export the `media` bucket periodically (Storage does not have PITR).
- Keep the migration file in version control; it can rebuild an empty database.

## Known limitations

- Rate limiting is in memory per server instance. On Vercel this is best-effort; use a shared store (for example
  Upstash Redis) for strict limits. Duplicate detection in the database still applies.
- No CAPTCHA. Add Cloudflare Turnstile if spam appears.
- Instagram is not connected by API; gallery photos are added manually.
- Google reviews are linked, not embedded. A Places API integration needs an API key, billing and Google's display rules.
- No staff-management screen yet; roles are assigned with SQL (above).
- One currency (AED) and one language (English). Arabic and RTL would be a future addition.
- Images in `/public/images` are screenshots and look soft on large screens.
- Demo mode stores data in a local file and is not suitable for production.
- No automated test suite yet; flows were verified manually against a production build.
