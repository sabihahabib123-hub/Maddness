-- MADNESS website: initial schema, constraints, RLS policies and storage.
-- Apply with `supabase db push` (or paste into the SQL editor) on a fresh project.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin users and roles
-- ---------------------------------------------------------------------------

create table public.admin_users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  display_name text check (char_length(display_name) <= 80),
  role text not null default 'branch_editor' check (role in ('owner', 'admin', 'branch_editor')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  address text not null check (char_length(address) <= 300),
  area text check (char_length(area) <= 120),
  city text not null default 'Dubai' check (char_length(city) <= 80),
  phone text check (char_length(phone) <= 40),
  email text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  hours_note text check (char_length(hours_note) <= 300),
  opening_hours jsonb not null default '[]'::jsonb check (jsonb_typeof(opening_hours) = 'array'),
  latitude numeric(9, 6) check (latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude between -180 and 180),
  directions_url text check (directions_url is null or directions_url ~* '^https://'),
  google_review_url text check (google_review_url is null or google_review_url ~* '^https://'),
  image_url text,
  is_active boolean not null default true,
  is_verified boolean not null default false,
  source_note text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index branches_active_order_idx on public.branches (is_active, display_order);

-- Which branches a branch_editor may manage.
create table public.admin_branch_access (
  admin_user_id uuid not null references public.admin_users (id) on delete cascade,
  branch_id uuid not null references public.branches (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (admin_user_id, branch_id)
);
create index admin_branch_access_branch_idx on public.admin_branch_access (branch_id);

-- SECURITY DEFINER so policies can consult admin_users without recursive RLS.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users
    where id = (select auth.uid()) and is_active
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users
    where id = (select auth.uid()) and is_active and role in ('owner', 'admin')
  );
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users
    where id = (select auth.uid()) and is_active and role = 'owner'
  );
$$;

create or replace function public.can_manage_branch(target_branch uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin() or exists (
    select 1
    from public.admin_branch_access a
    join public.admin_users u on u.id = a.admin_user_id
    where a.admin_user_id = (select auth.uid())
      and a.branch_id = target_branch
      and u.is_active
  );
$$;

revoke execute on function public.is_staff(), public.is_admin(), public.is_owner(), public.can_manage_branch(uuid) from public;
grant execute on function public.is_staff(), public.is_admin(), public.is_owner(), public.can_manage_branch(uuid) to authenticated, anon;

-- ---------------------------------------------------------------------------
-- Menu
-- ---------------------------------------------------------------------------

create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text check (char_length(description) <= 300),
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index menu_categories_active_order_idx on public.menu_categories (is_active, display_order);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  -- RESTRICT: a category that still has dishes cannot be deleted by accident.
  category_id uuid references public.menu_categories (id) on delete restrict,
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  short_description text check (char_length(short_description) <= 200),
  description text check (char_length(description) <= 2000),
  price numeric(10, 2) not null check (price >= 0 and price < 100000),
  image_url text,
  image_alt text check (char_length(image_alt) <= 200),
  gallery_urls text[] not null default '{}',
  ingredients text[] not null default '{}',
  allergens text[] not null default '{}' check (
    allergens <@ array['gluten','crustaceans','eggs','fish','peanuts','soy','milk','tree_nuts','celery','mustard','sesame','sulphites','lupin','molluscs']
  ),
  allergens_verified boolean not null default false,
  dietary_labels text[] not null default '{}' check (
    dietary_labels <@ array['vegetarian','vegan','spicy','gluten_free','halal']
  ),
  is_available boolean not null default true,
  is_featured boolean not null default false,
  is_archived boolean not null default false,
  is_sample boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index menu_items_category_idx on public.menu_items (category_id, display_order);
create index menu_items_featured_idx on public.menu_items (is_featured) where is_featured and not is_archived;
create index menu_items_updated_idx on public.menu_items (updated_at desc);

create table public.branch_menu_items (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches (id) on delete cascade,
  menu_item_id uuid not null references public.menu_items (id) on delete cascade,
  price_override numeric(10, 2) check (price_override is null or (price_override >= 0 and price_override < 100000)),
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (branch_id, menu_item_id)
);
create index branch_menu_items_item_idx on public.branch_menu_items (menu_item_id);

-- ---------------------------------------------------------------------------
-- Delivery links
-- ---------------------------------------------------------------------------

create table public.delivery_links (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches (id) on delete cascade,
  platform text not null check (platform in ('talabat', 'noon_food', 'deliveroo', 'careem', 'other')),
  label text check (char_length(label) <= 60),
  url text not null check (url ~* '^https://' and char_length(url) <= 500),
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index delivery_links_branch_idx on public.delivery_links (branch_id, is_active, display_order);

-- ---------------------------------------------------------------------------
-- Customer feedback (private by default)
-- ---------------------------------------------------------------------------

create table public.customer_feedback (
  id uuid primary key default gen_random_uuid(),
  -- RESTRICT: deleting a branch must not destroy its feedback. Deactivate branches instead.
  branch_id uuid references public.branches (id) on delete restrict,
  display_name text not null check (char_length(display_name) between 2 and 60),
  email text check (email is null or (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  phone text check (char_length(phone) <= 30),
  country text not null check (char_length(country) between 2 and 60),
  visit_type text not null check (visit_type in ('dine_in', 'takeaway', 'delivery')),
  rating_overall smallint not null check (rating_overall between 1 and 5),
  rating_food smallint check (rating_food between 1 and 5),
  rating_service smallint check (rating_service between 1 and 5),
  rating_atmosphere smallint check (rating_atmosphere between 1 and 5),
  message text not null check (char_length(message) between 10 and 2000),
  consent_to_contact boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'published', 'rejected')),
  internal_notes text check (char_length(internal_notes) <= 2000),
  published_at timestamptz,
  -- sha256 of normalised name + message + branch, used to reject duplicate submissions.
  dedupe_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint published_has_date check (status <> 'published' or published_at is not null)
);
create index customer_feedback_status_idx on public.customer_feedback (status, created_at desc);
create index customer_feedback_branch_idx on public.customer_feedback (branch_id);
create index customer_feedback_dedupe_idx on public.customer_feedback (dedupe_hash, created_at desc);

-- Contact-page enquiries: private, inserted by the server only.
create table public.contact_enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  email text check (email is null or (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  phone text check (char_length(phone) <= 30),
  topic text not null default 'general' check (topic in ('general', 'events', 'feedback', 'careers', 'press', 'other')),
  branch_id uuid references public.branches (id) on delete set null,
  message text not null check (char_length(message) between 10 and 2000),
  status text not null default 'new' check (status in ('new', 'handled')),
  dedupe_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint enquiry_has_contact check (email is not null or phone is not null)
);
create index contact_enquiries_status_idx on public.contact_enquiries (status, created_at desc);
create index contact_enquiries_dedupe_idx on public.contact_enquiries (dedupe_hash, created_at desc);

-- The ONLY public view of feedback: approved reviews, no contact details.
create or replace function public.get_published_reviews(max_rows integer default 12)
returns table (
  id uuid,
  display_name text,
  rating_overall smallint,
  message text,
  branch_name text,
  published_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select f.id, f.display_name, f.rating_overall, f.message, b.name, f.published_at
  from public.customer_feedback f
  left join public.branches b on b.id = f.branch_id
  where f.status = 'published'
  order by f.published_at desc nulls last
  limit least(greatest(max_rows, 1), 50);
$$;
revoke execute on function public.get_published_reviews(integer) from public;
grant execute on function public.get_published_reviews(integer) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Site content
-- ---------------------------------------------------------------------------

create table public.site_settings (
  key text primary key check (key ~ '^[a-z0-9_]+$'),
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.admin_users (id) on delete set null
);

create table public.hero_slides (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  image_alt text not null check (char_length(image_alt) between 1 and 200),
  heading text not null check (char_length(heading) between 1 and 80),
  subheading text check (char_length(subheading) <= 200),
  primary_label text check (char_length(primary_label) <= 40),
  primary_href text check (char_length(primary_href) <= 300),
  secondary_label text check (char_length(secondary_label) <= 40),
  secondary_href text check (char_length(secondary_href) <= 300),
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  alt text not null check (char_length(alt) between 1 and 200),
  caption text check (char_length(caption) <= 200),
  placement text not null default 'home' check (placement in ('home', 'about')),
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index gallery_images_placement_idx on public.gallery_images (placement, is_active, display_order);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array['admin_users','branches','menu_categories','menu_items','branch_menu_items',
                           'delivery_links','customer_feedback','contact_enquiries','site_settings','hero_slides','gallery_images']
  loop
    execute format('create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- Branch editors may moderate feedback but must not re-assign it or touch customer data.
create or replace function public.guard_feedback_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.display_name is distinct from old.display_name
     or new.email is distinct from old.email
     or new.phone is distinct from old.phone
     or new.message is distinct from old.message
     or new.rating_overall is distinct from old.rating_overall
     or new.branch_id is distinct from old.branch_id
     or new.dedupe_hash is distinct from old.dedupe_hash
     or new.created_at is distinct from old.created_at then
    raise exception 'Customer-submitted fields cannot be edited';
  end if;
  if new.status = 'published' and old.status <> 'published' then
    new.published_at = now();
  elsif new.status <> 'published' then
    new.published_at = null;
  end if;
  return new;
end;
$$;
create trigger customer_feedback_guard before update on public.customer_feedback
  for each row execute function public.guard_feedback_update();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.admin_users enable row level security;
alter table public.admin_branch_access enable row level security;
alter table public.branches enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.branch_menu_items enable row level security;
alter table public.delivery_links enable row level security;
alter table public.customer_feedback enable row level security;
alter table public.contact_enquiries enable row level security;
alter table public.site_settings enable row level security;
alter table public.hero_slides enable row level security;
alter table public.gallery_images enable row level security;

-- admin_users: staff see themselves; admins see everyone; only owners change roles.
create policy "admin_users: read self or admin" on public.admin_users
  for select to authenticated using (id = (select auth.uid()) or public.is_admin());
create policy "admin_users: owner insert" on public.admin_users
  for insert to authenticated with check (public.is_owner());
create policy "admin_users: owner update" on public.admin_users
  for update to authenticated using (public.is_owner()) with check (public.is_owner());
create policy "admin_users: owner delete" on public.admin_users
  for delete to authenticated using (public.is_owner() and id <> (select auth.uid()));

create policy "admin_branch_access: read" on public.admin_branch_access
  for select to authenticated using (admin_user_id = (select auth.uid()) or public.is_admin());
create policy "admin_branch_access: owner write" on public.admin_branch_access
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

-- branches: public reads active; staff read all; admins create/delete; editors update their own.
create policy "branches: public read active" on public.branches
  for select to anon, authenticated using (is_active or public.is_staff());
create policy "branches: admin insert" on public.branches
  for insert to authenticated with check (public.is_admin());
create policy "branches: managers update" on public.branches
  for update to authenticated using (public.can_manage_branch(id)) with check (public.can_manage_branch(id));
create policy "branches: admin delete" on public.branches
  for delete to authenticated using (public.is_admin());

-- menu_categories
create policy "menu_categories: public read active" on public.menu_categories
  for select to anon, authenticated using (is_active or public.is_staff());
create policy "menu_categories: admin write" on public.menu_categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- menu_items
create policy "menu_items: public read" on public.menu_items
  for select to anon, authenticated using (not is_archived or public.is_staff());
create policy "menu_items: admin write" on public.menu_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- branch_menu_items: editors manage overrides for their branches only.
create policy "branch_menu_items: public read" on public.branch_menu_items
  for select to anon, authenticated using (true);
create policy "branch_menu_items: managers write" on public.branch_menu_items
  for all to authenticated using (public.can_manage_branch(branch_id)) with check (public.can_manage_branch(branch_id));

-- delivery_links: brand-wide links (branch_id null) are admin-only.
create policy "delivery_links: public read active" on public.delivery_links
  for select to anon, authenticated using (is_active or public.is_staff());
create policy "delivery_links: managers write" on public.delivery_links
  for all to authenticated
  using (public.is_admin() or (branch_id is not null and public.can_manage_branch(branch_id)))
  with check (public.is_admin() or (branch_id is not null and public.can_manage_branch(branch_id)));

-- customer_feedback: NO anon access at all. Submissions go through the server
-- (validated, rate limited) using the service role. Staff read/moderate within scope.
create policy "customer_feedback: staff read" on public.customer_feedback
  for select to authenticated
  using (public.is_admin() or (branch_id is not null and public.can_manage_branch(branch_id)));
create policy "customer_feedback: staff moderate" on public.customer_feedback
  for update to authenticated
  using (public.is_admin() or (branch_id is not null and public.can_manage_branch(branch_id)))
  with check (public.is_admin() or (branch_id is not null and public.can_manage_branch(branch_id)));
create policy "customer_feedback: admin delete" on public.customer_feedback
  for delete to authenticated using (public.is_admin());

-- contact_enquiries: no anon access; staff read and mark handled within scope.
-- Enquiries with no branch are visible to admins only.
create policy "contact_enquiries: staff read" on public.contact_enquiries
  for select to authenticated
  using (public.is_admin() or (branch_id is not null and public.can_manage_branch(branch_id)));
create policy "contact_enquiries: staff update" on public.contact_enquiries
  for update to authenticated
  using (public.is_admin() or (branch_id is not null and public.can_manage_branch(branch_id)))
  with check (public.is_admin() or (branch_id is not null and public.can_manage_branch(branch_id)));
create policy "contact_enquiries: admin delete" on public.contact_enquiries
  for delete to authenticated using (public.is_admin());

-- site content
create policy "site_settings: public read" on public.site_settings
  for select to anon, authenticated using (true);
create policy "site_settings: admin write" on public.site_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "hero_slides: public read active" on public.hero_slides
  for select to anon, authenticated using (is_active or public.is_staff());
create policy "hero_slides: admin write" on public.hero_slides
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "gallery_images: public read active" on public.gallery_images
  for select to anon, authenticated using (is_active or public.is_staff());
create policy "gallery_images: admin write" on public.gallery_images
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Defence in depth: anon never writes anything directly.
revoke insert, update, delete on all tables in schema public from anon;

-- ---------------------------------------------------------------------------
-- Storage: public-read image bucket, staff-only writes, 5 MB, images only.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "media: staff upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.is_staff());
create policy "media: staff update" on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.is_staff());
create policy "media: admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.is_admin());
