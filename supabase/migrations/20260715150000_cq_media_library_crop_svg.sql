alter table public.cq_media_files
  add column if not exists media_kind text not null default 'photo',
  add column if not exists width integer not null default 0,
  add column if not exists height integer not null default 0,
  add column if not exists aspect_ratio numeric(12,6) not null default 0,
  add column if not exists checksum text not null default '',
  add column if not exists deleted_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'cq_media_files_media_kind_check'
  ) then
    alter table public.cq_media_files
      add constraint cq_media_files_media_kind_check
      check (media_kind in ('photo','logo','favicon','graphic'));
  end if;
end $$;

create index if not exists cq_media_files_site_deleted_idx
  on public.cq_media_files(site_id, deleted_at, created_at desc);

create table if not exists public.cq_media_variants (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.cq_sites(id) on delete cascade,
  media_id uuid not null references public.cq_media_files(id) on delete cascade,
  slot_key text not null,
  storage_path text not null,
  public_url text not null,
  width integer not null default 0,
  height integer not null default 0,
  mime_type text not null,
  size_bytes bigint not null default 0,
  crop jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(media_id, slot_key)
);

create index if not exists cq_media_variants_site_media_idx
  on public.cq_media_variants(site_id, media_id);

alter table public.cq_media_variants enable row level security;

drop policy if exists cq_media_variants_member_all on public.cq_media_variants;
create policy cq_media_variants_member_all
  on public.cq_media_variants
  for all
  to authenticated
  using (public.cq_is_site_member(site_id))
  with check (public.cq_is_site_member(site_id));

grant select, insert, update, delete on public.cq_media_variants to authenticated;
grant select, insert, update, delete on public.cq_media_files to authenticated;

create or replace function public.cq_media_usage(p_media_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_site_id uuid;
  v_urls text[];
  v_result jsonb;
begin
  select site_id into v_site_id
  from public.cq_media_files
  where id = p_media_id;

  if v_site_id is null then raise exception 'media_not_found'; end if;
  if not public.cq_is_site_member(v_site_id) then raise exception 'media_access_denied'; end if;

  select array_agg(url) into v_urls
  from (
    select public_url as url from public.cq_media_files where id = p_media_id
    union all
    select public_url from public.cq_media_variants where media_id = p_media_id
  ) urls
  where nullif(url, '') is not null;

  select coalesce(jsonb_agg(reference order by reference->>'area', reference->>'label'), '[]'::jsonb)
  into v_result
  from (
    select jsonb_build_object('area','Identidade','label','Logo do site','field','logo_url','record_id',s.site_id::text) reference
      from public.cq_site_settings s where s.site_id = v_site_id and s.logo_url = any(v_urls)
    union all
    select jsonb_build_object('area','Identidade','label','Favicon','field','favicon_url','record_id',s.site_id::text)
      from public.cq_site_settings s where s.site_id = v_site_id and s.favicon_url = any(v_urls)
    union all
    select jsonb_build_object('area','Primeira tela','label','Imagem desktop','field','hero.image_url','record_id',s.site_id::text)
      from public.cq_site_settings s where s.site_id = v_site_id and coalesce(s.hero->>'image_url','') = any(v_urls)
    union all
    select jsonb_build_object('area','Primeira tela','label','Imagem mobile','field','hero.mobile_image_url','record_id',s.site_id::text)
      from public.cq_site_settings s where s.site_id = v_site_id and coalesce(s.hero->>'mobile_image_url','') = any(v_urls)
    union all
    select jsonb_build_object('area','Procedimentos','label',p.name,'field','image_url','record_id',p.id::text)
      from public.cq_procedures p where p.site_id = v_site_id and p.image_url = any(v_urls)
    union all
    select jsonb_build_object('area','Antes e depois','label',r.title || ' — Antes','field','before_image_url','record_id',r.id::text)
      from public.cq_results r where r.site_id = v_site_id and r.before_image_url = any(v_urls)
    union all
    select jsonb_build_object('area','Antes e depois','label',r.title || ' — Depois','field','after_image_url','record_id',r.id::text)
      from public.cq_results r where r.site_id = v_site_id and r.after_image_url = any(v_urls)
    union all
    select jsonb_build_object('area','Depoimentos','label',t.client_display_name,'field','photo_url','record_id',t.id::text)
      from public.cq_testimonials t where t.site_id = v_site_id and t.photo_url = any(v_urls)
    union all
    select jsonb_build_object('area','Seções','label',coalesce(sec.title, sec.section_key),'field','content.image_url','record_id',sec.id::text)
      from public.cq_sections sec where sec.site_id = v_site_id and coalesce(sec.content->>'image_url','') = any(v_urls)
    union all
    select jsonb_build_object('area','Seções','label',coalesce(sec.title, sec.section_key) || ' — imagem secundária','field','content.secondary_image_url','record_id',sec.id::text)
      from public.cq_sections sec where sec.site_id = v_site_id and coalesce(sec.content->>'secondary_image_url','') = any(v_urls)
  ) usages;

  return v_result;
end;
$$;

create or replace function public.cq_trash_media(p_media_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_site_id uuid;
  v_deleted_at timestamptz;
begin
  select site_id into v_site_id from public.cq_media_files where id = p_media_id;
  if v_site_id is null then raise exception 'media_not_found'; end if;
  if not public.cq_is_site_member(v_site_id) then raise exception 'media_access_denied'; end if;
  if jsonb_array_length(public.cq_media_usage(p_media_id)) > 0 then raise exception 'media_in_use'; end if;

  update public.cq_media_files
    set deleted_at = now()
    where id = p_media_id
    returning deleted_at into v_deleted_at;
  return v_deleted_at;
end;
$$;

create or replace function public.cq_restore_media(p_media_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_site_id uuid;
begin
  select site_id into v_site_id from public.cq_media_files where id = p_media_id;
  if v_site_id is null then raise exception 'media_not_found'; end if;
  if not public.cq_is_site_member(v_site_id) then raise exception 'media_access_denied'; end if;
  update public.cq_media_files set deleted_at = null where id = p_media_id;
end;
$$;

create or replace function public.cq_delete_media_metadata(p_media_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_site_id uuid;
  v_deleted_at timestamptz;
begin
  select site_id, deleted_at into v_site_id, v_deleted_at from public.cq_media_files where id = p_media_id;
  if v_site_id is null then raise exception 'media_not_found'; end if;
  if not public.cq_is_site_member(v_site_id) then raise exception 'media_access_denied'; end if;
  if v_deleted_at is null then raise exception 'media_not_in_trash'; end if;
  if jsonb_array_length(public.cq_media_usage(p_media_id)) > 0 then raise exception 'media_in_use'; end if;
  delete from public.cq_media_files where id = p_media_id;
end;
$$;

create or replace function public.cq_replace_media_url(p_site_id uuid, p_old_url text, p_new_url text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
  v_changed integer := 0;
begin
  if not public.cq_is_site_member(p_site_id) then raise exception 'media_access_denied'; end if;
  if nullif(p_old_url, '') is null or nullif(p_new_url, '') is null then raise exception 'media_url_required'; end if;

  update public.cq_site_settings
  set logo_url = case when logo_url = p_old_url then p_new_url else logo_url end,
      favicon_url = case when favicon_url = p_old_url then p_new_url else favicon_url end,
      hero = jsonb_set(
        jsonb_set(hero, '{image_url}', to_jsonb(case when coalesce(hero->>'image_url','') = p_old_url then p_new_url else coalesce(hero->>'image_url','') end), true),
        '{mobile_image_url}', to_jsonb(case when coalesce(hero->>'mobile_image_url','') = p_old_url then p_new_url else coalesce(hero->>'mobile_image_url','') end), true
      )
  where site_id = p_site_id
    and (logo_url = p_old_url or favicon_url = p_old_url or coalesce(hero->>'image_url','') = p_old_url or coalesce(hero->>'mobile_image_url','') = p_old_url);
  get diagnostics v_changed = row_count;
  v_count := v_count + v_changed;

  update public.cq_procedures set image_url = p_new_url where site_id = p_site_id and image_url = p_old_url;
  get diagnostics v_changed = row_count; v_count := v_count + v_changed;

  update public.cq_results
  set before_image_url = case when before_image_url = p_old_url then p_new_url else before_image_url end,
      after_image_url = case when after_image_url = p_old_url then p_new_url else after_image_url end
  where site_id = p_site_id and (before_image_url = p_old_url or after_image_url = p_old_url);
  get diagnostics v_changed = row_count; v_count := v_count + v_changed;

  update public.cq_testimonials set photo_url = p_new_url where site_id = p_site_id and photo_url = p_old_url;
  get diagnostics v_changed = row_count; v_count := v_count + v_changed;

  update public.cq_sections
  set content = jsonb_set(
    jsonb_set(content, '{image_url}', to_jsonb(case when coalesce(content->>'image_url','') = p_old_url then p_new_url else coalesce(content->>'image_url','') end), true),
    '{secondary_image_url}', to_jsonb(case when coalesce(content->>'secondary_image_url','') = p_old_url then p_new_url else coalesce(content->>'secondary_image_url','') end), true
  )
  where site_id = p_site_id
    and (coalesce(content->>'image_url','') = p_old_url or coalesce(content->>'secondary_image_url','') = p_old_url);
  get diagnostics v_changed = row_count; v_count := v_count + v_changed;

  return v_count;
end;
$$;

grant execute on function public.cq_media_usage(uuid) to authenticated;
grant execute on function public.cq_trash_media(uuid) to authenticated;
grant execute on function public.cq_restore_media(uuid) to authenticated;
grant execute on function public.cq_delete_media_metadata(uuid) to authenticated;
grant execute on function public.cq_replace_media_url(uuid, text, text) to authenticated;

update storage.buckets
set file_size_limit = 31457280,
    allowed_mime_types = array[
      'image/jpeg','image/png','image/webp','image/avif','image/svg+xml','image/heic','image/heif'
    ]::text[]
where id = 'cq-media';
