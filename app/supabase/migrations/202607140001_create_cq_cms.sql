create extension if not exists citext;

create or replace function public.cq_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.cq_sites (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null,
  default_domain text,
  status text not null default 'active' check (status in ('draft','active','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cq_site_domains (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.cq_sites(id) on delete cascade,
  hostname citext not null unique,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.cq_admin_allowlist (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.cq_sites(id) on delete cascade,
  email citext not null,
  role text not null default 'editor' check (role in ('owner','editor')),
  created_at timestamptz not null default now(),
  unique(site_id, email)
);

create table if not exists public.cq_site_members (
  site_id uuid not null references public.cq_sites(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('owner','editor')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (site_id, user_id)
);

create table if not exists public.cq_site_settings (
  site_id uuid primary key references public.cq_sites(id) on delete cascade,
  logo_url text not null default '',
  favicon_url text not null default '',
  professional_name text not null default '',
  professional_title text not null default '',
  whatsapp text not null default '',
  phone text not null default '',
  email text not null default '',
  instagram_url text not null default '',
  address_line text not null default '',
  city text not null default '',
  state text not null default '',
  maps_url text not null default '',
  opening_hours text not null default '',
  seo_title text not null default '',
  seo_description text not null default '',
  footer_text text not null default '',
  hero jsonb not null default '{}'::jsonb,
  theme jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.cq_sections (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.cq_sites(id) on delete cascade,
  section_key text not null,
  eyebrow text not null default '',
  title text not null default '',
  subtitle text not null default '',
  content jsonb not null default '{}'::jsonb,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  status text not null default 'published' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(site_id, section_key)
);

create table if not exists public.cq_procedures (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.cq_sites(id) on delete cascade,
  name text not null,
  slug text not null,
  category text not null default 'Facial',
  short_description text not null default '',
  full_description text not null default '',
  image_url text not null default '',
  indications jsonb not null default '[]'::jsonb,
  benefits jsonb not null default '[]'::jsonb,
  contraindications text not null default '',
  duration text not null default '',
  session_estimate text not null default '',
  whatsapp_message text not null default '',
  is_featured boolean not null default false,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(site_id, slug)
);

create table if not exists public.cq_results (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.cq_sites(id) on delete cascade,
  procedure_id uuid references public.cq_procedures(id) on delete set null,
  title text not null,
  summary text not null default '',
  before_image_url text not null,
  after_image_url text not null,
  body_area text not null default '',
  sessions text not null default '',
  treatment_period text not null default '',
  testimonial_text text not null default '',
  client_display_name text not null default '',
  consent_confirmed boolean not null default false,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not is_published or consent_confirmed)
);

create table if not exists public.cq_testimonials (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.cq_sites(id) on delete cascade,
  procedure_id uuid references public.cq_procedures(id) on delete set null,
  client_display_name text not null,
  photo_url text not null default '',
  testimonial_text text not null,
  rating smallint not null default 5 check (rating between 1 and 5),
  source_name text not null default '',
  source_url text not null default '',
  consent_confirmed boolean not null default false,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not is_published or consent_confirmed)
);

create table if not exists public.cq_faq_items (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.cq_sites(id) on delete cascade,
  question text not null,
  answer text not null,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cq_media_files (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.cq_sites(id) on delete cascade,
  storage_path text not null unique,
  public_url text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  alt_text text not null default '',
  category text not null default 'general',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.cq_content_revisions (
  id bigint generated by default as identity primary key,
  site_id uuid not null references public.cq_sites(id) on delete cascade,
  entity_type text not null,
  entity_id text not null,
  operation text not null check (operation in ('insert','update','delete','publish','restore')),
  snapshot jsonb not null default '{}'::jsonb,
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.cq_tracking_configs (
  site_id uuid primary key references public.cq_sites(id) on delete cascade,
  consent_mode text not null default 'required' check (consent_mode in ('required','informational','disabled')),
  meta_pixel_id text not null default '',
  meta_browser_enabled boolean not null default false,
  meta_server_enabled boolean not null default false,
  ga4_measurement_id text not null default '',
  ga4_browser_enabled boolean not null default false,
  ga4_server_enabled boolean not null default false,
  google_ads_conversion_id text not null default '',
  google_ads_conversion_label text not null default '',
  google_ads_browser_enabled boolean not null default false,
  google_ads_server_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.cq_tracking_secrets (
  site_id uuid primary key references public.cq_sites(id) on delete cascade,
  encrypted_payload text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.cq_tracking_events (
  id bigint generated by default as identity primary key,
  site_id uuid not null references public.cq_sites(id) on delete cascade,
  event_id uuid not null,
  event_name text not null,
  source text not null default 'website',
  page_url text not null default '',
  session_id text not null default '',
  visitor_id text not null default '',
  consent jsonb not null default '{}'::jsonb,
  context jsonb not null default '{}'::jsonb,
  meta_status text not null default 'not_configured',
  ga4_status text not null default 'not_configured',
  google_ads_status text not null default 'not_configured',
  last_error text not null default '',
  retry_count integer not null default 0,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  unique(site_id, event_id)
);

create or replace function public.cq_is_site_member(
  p_site_id uuid,
  p_roles text[] default array['owner','editor']::text[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.cq_site_members member
    where member.site_id = p_site_id
      and member.user_id = auth.uid()
      and member.active
      and member.role = any(p_roles)
  );
$$;

create or replace function public.cq_attach_allowlisted_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.cq_site_members(site_id, user_id, role)
  select allowlist.site_id, new.id, allowlist.role
  from public.cq_admin_allowlist allowlist
  where lower(allowlist.email::text) = lower(coalesce(new.email, ''))
  on conflict (site_id, user_id)
  do update set role = excluded.role, active = true;
  return new;
end;
$$;

drop trigger if exists cq_auth_user_allowlist on auth.users;
create trigger cq_auth_user_allowlist
after insert or update of email on auth.users
for each row execute function public.cq_attach_allowlisted_user();

create or replace function public.cq_get_public_site(p_identifier text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with selected_site as (
  select site.*
  from public.cq_sites site
  left join public.cq_site_domains domain on domain.site_id = site.id
  where site.status = 'active'
    and (
      lower(site.slug) = lower(p_identifier)
      or lower(coalesce(site.default_domain, '')) = lower(p_identifier)
      or lower(coalesce(domain.hostname::text, '')) = lower(p_identifier)
    )
  order by case when lower(coalesce(domain.hostname::text, '')) = lower(p_identifier) then 0 else 1 end
  limit 1
)
select case when exists(select 1 from selected_site) then jsonb_build_object(
  'site', (select to_jsonb(site) - 'created_at' - 'updated_at' from selected_site site),
  'settings', coalesce((select to_jsonb(settings) - 'site_id' - 'updated_at' from public.cq_site_settings settings join selected_site site on site.id = settings.site_id), '{}'::jsonb),
  'tracking', coalesce((select to_jsonb(config) - 'site_id' - 'updated_at' from public.cq_tracking_configs config join selected_site site on site.id = config.site_id), '{}'::jsonb),
  'sections', coalesce((select jsonb_agg(to_jsonb(item) - 'site_id' - 'created_at' - 'updated_at' order by item.sort_order) from public.cq_sections item join selected_site site on site.id = item.site_id where item.is_enabled and item.status = 'published'), '[]'::jsonb),
  'procedures', coalesce((select jsonb_agg(to_jsonb(item) - 'site_id' - 'created_at' - 'updated_at' order by item.sort_order) from public.cq_procedures item join selected_site site on site.id = item.site_id where item.is_published), '[]'::jsonb),
  'results', coalesce((select jsonb_agg((to_jsonb(item) - 'site_id' - 'created_at' - 'updated_at' - 'consent_confirmed') || jsonb_build_object('procedure_name', procedure.name) order by item.sort_order) from public.cq_results item join selected_site site on site.id = item.site_id left join public.cq_procedures procedure on procedure.id = item.procedure_id where item.is_published and item.consent_confirmed), '[]'::jsonb),
  'testimonials', coalesce((select jsonb_agg((to_jsonb(item) - 'site_id' - 'created_at' - 'updated_at' - 'consent_confirmed') || jsonb_build_object('procedure_name', procedure.name) order by item.sort_order) from public.cq_testimonials item join selected_site site on site.id = item.site_id left join public.cq_procedures procedure on procedure.id = item.procedure_id where item.is_published and item.consent_confirmed), '[]'::jsonb),
  'faq', coalesce((select jsonb_agg(to_jsonb(item) - 'site_id' - 'created_at' - 'updated_at' order by item.sort_order) from public.cq_faq_items item join selected_site site on site.id = item.site_id where item.is_published), '[]'::jsonb)
) else null end;
$$;

grant execute on function public.cq_get_public_site(text) to anon, authenticated;
grant execute on function public.cq_is_site_member(uuid, text[]) to authenticated;

alter table public.cq_sites enable row level security;
alter table public.cq_site_domains enable row level security;
alter table public.cq_admin_allowlist enable row level security;
alter table public.cq_site_members enable row level security;
alter table public.cq_site_settings enable row level security;
alter table public.cq_sections enable row level security;
alter table public.cq_procedures enable row level security;
alter table public.cq_results enable row level security;
alter table public.cq_testimonials enable row level security;
alter table public.cq_faq_items enable row level security;
alter table public.cq_media_files enable row level security;
alter table public.cq_content_revisions enable row level security;
alter table public.cq_tracking_configs enable row level security;
alter table public.cq_tracking_secrets enable row level security;
alter table public.cq_tracking_events enable row level security;

create policy cq_sites_member_select on public.cq_sites for select to authenticated using (public.cq_is_site_member(id));
create policy cq_sites_owner_update on public.cq_sites for update to authenticated using (public.cq_is_site_member(id, array['owner'])) with check (public.cq_is_site_member(id, array['owner']));
create policy cq_domains_member_all on public.cq_site_domains for all to authenticated using (public.cq_is_site_member(site_id)) with check (public.cq_is_site_member(site_id));
create policy cq_allowlist_owner_all on public.cq_admin_allowlist for all to authenticated using (public.cq_is_site_member(site_id, array['owner'])) with check (public.cq_is_site_member(site_id, array['owner']));
create policy cq_members_self_select on public.cq_site_members for select to authenticated using (user_id = auth.uid() or public.cq_is_site_member(site_id, array['owner']));
create policy cq_members_owner_all on public.cq_site_members for all to authenticated using (public.cq_is_site_member(site_id, array['owner'])) with check (public.cq_is_site_member(site_id, array['owner']));
create policy cq_settings_member_all on public.cq_site_settings for all to authenticated using (public.cq_is_site_member(site_id)) with check (public.cq_is_site_member(site_id));
create policy cq_sections_member_all on public.cq_sections for all to authenticated using (public.cq_is_site_member(site_id)) with check (public.cq_is_site_member(site_id));
create policy cq_procedures_member_all on public.cq_procedures for all to authenticated using (public.cq_is_site_member(site_id)) with check (public.cq_is_site_member(site_id));
create policy cq_results_member_all on public.cq_results for all to authenticated using (public.cq_is_site_member(site_id)) with check (public.cq_is_site_member(site_id));
create policy cq_testimonials_member_all on public.cq_testimonials for all to authenticated using (public.cq_is_site_member(site_id)) with check (public.cq_is_site_member(site_id));
create policy cq_faq_member_all on public.cq_faq_items for all to authenticated using (public.cq_is_site_member(site_id)) with check (public.cq_is_site_member(site_id));
create policy cq_media_member_all on public.cq_media_files for all to authenticated using (public.cq_is_site_member(site_id)) with check (public.cq_is_site_member(site_id));
create policy cq_revisions_member_select on public.cq_content_revisions for select to authenticated using (public.cq_is_site_member(site_id));
create policy cq_tracking_config_member_all on public.cq_tracking_configs for all to authenticated using (public.cq_is_site_member(site_id)) with check (public.cq_is_site_member(site_id));
create policy cq_tracking_events_member_select on public.cq_tracking_events for select to authenticated using (public.cq_is_site_member(site_id));

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('cq-media', 'cq-media', true, 5242880, array['image/jpeg','image/png','image/webp','image/avif','image/svg+xml'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy cq_media_public_read on storage.objects for select to public using (bucket_id = 'cq-media');
create policy cq_media_member_insert on storage.objects for insert to authenticated with check (bucket_id = 'cq-media' and public.cq_is_site_member(((storage.foldername(name))[1])::uuid));
create policy cq_media_member_update on storage.objects for update to authenticated using (bucket_id = 'cq-media' and public.cq_is_site_member(((storage.foldername(name))[1])::uuid)) with check (bucket_id = 'cq-media' and public.cq_is_site_member(((storage.foldername(name))[1])::uuid));
create policy cq_media_member_delete on storage.objects for delete to authenticated using (bucket_id = 'cq-media' and public.cq_is_site_member(((storage.foldername(name))[1])::uuid));

create trigger cq_sites_touch before update on public.cq_sites for each row execute function public.cq_touch_updated_at();
create trigger cq_settings_touch before update on public.cq_site_settings for each row execute function public.cq_touch_updated_at();
create trigger cq_sections_touch before update on public.cq_sections for each row execute function public.cq_touch_updated_at();
create trigger cq_procedures_touch before update on public.cq_procedures for each row execute function public.cq_touch_updated_at();
create trigger cq_results_touch before update on public.cq_results for each row execute function public.cq_touch_updated_at();
create trigger cq_testimonials_touch before update on public.cq_testimonials for each row execute function public.cq_touch_updated_at();
create trigger cq_faq_touch before update on public.cq_faq_items for each row execute function public.cq_touch_updated_at();
create trigger cq_tracking_configs_touch before update on public.cq_tracking_configs for each row execute function public.cq_touch_updated_at();
create trigger cq_tracking_secrets_touch before update on public.cq_tracking_secrets for each row execute function public.cq_touch_updated_at();
