create or replace function public.cq_jsonb_contains_any(p_value jsonb, p_targets text[])
returns boolean
language plpgsql
immutable
set search_path = public
as $$
declare
  v_child jsonb;
begin
  if p_value is null or p_targets is null or cardinality(p_targets) = 0 then return false; end if;
  case jsonb_typeof(p_value)
    when 'string' then return (p_value #>> '{}') = any(p_targets);
    when 'array' then
      for v_child in select value from jsonb_array_elements(p_value)
      loop
        if public.cq_jsonb_contains_any(v_child, p_targets) then return true; end if;
      end loop;
    when 'object' then
      for v_child in select value from jsonb_each(p_value)
      loop
        if public.cq_jsonb_contains_any(v_child, p_targets) then return true; end if;
      end loop;
    else return false;
  end case;
  return false;
end;
$$;

create or replace function public.cq_jsonb_replace_string(p_value jsonb, p_old text, p_new text)
returns jsonb
language plpgsql
immutable
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if p_value is null then return null; end if;
  case jsonb_typeof(p_value)
    when 'string' then
      return case when (p_value #>> '{}') = p_old then to_jsonb(p_new) else p_value end;
    when 'array' then
      select coalesce(jsonb_agg(public.cq_jsonb_replace_string(value, p_old, p_new) order by ordinality), '[]'::jsonb)
      into v_result
      from jsonb_array_elements(p_value) with ordinality;
      return v_result;
    when 'object' then
      select coalesce(jsonb_object_agg(key, public.cq_jsonb_replace_string(value, p_old, p_new)), '{}'::jsonb)
      into v_result
      from jsonb_each(p_value);
      return v_result;
    else return p_value;
  end case;
end;
$$;

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
  select site_id into v_site_id from public.cq_media_files where id = p_media_id;
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
    select jsonb_build_object('area','Seções','label',coalesce(nullif(sec.title,''), sec.section_key),'field','content','record_id',sec.id::text)
      from public.cq_sections sec
      where sec.site_id = v_site_id and public.cq_jsonb_contains_any(sec.content, v_urls)
  ) usages;
  return v_result;
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
      hero = public.cq_jsonb_replace_string(hero, p_old_url, p_new_url),
      theme = public.cq_jsonb_replace_string(theme, p_old_url, p_new_url)
  where site_id = p_site_id
    and (
      logo_url = p_old_url
      or favicon_url = p_old_url
      or public.cq_jsonb_contains_any(hero, array[p_old_url])
      or public.cq_jsonb_contains_any(theme, array[p_old_url])
    );
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
  set content = public.cq_jsonb_replace_string(content, p_old_url, p_new_url)
  where site_id = p_site_id and public.cq_jsonb_contains_any(content, array[p_old_url]);
  get diagnostics v_changed = row_count; v_count := v_count + v_changed;
  return v_count;
end;
$$;

create or replace function public.cq_commit_media_variants(
  p_site_id uuid,
  p_media_id uuid,
  p_variants jsonb,
  p_old_url text default null,
  p_new_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_row public.cq_media_variants%rowtype;
  v_result jsonb := '[]'::jsonb;
begin
  if not public.cq_is_site_member(p_site_id) then raise exception 'media_access_denied'; end if;
  if not exists(select 1 from public.cq_media_files where id = p_media_id and site_id = p_site_id) then raise exception 'media_not_found'; end if;
  if jsonb_typeof(p_variants) <> 'array' or jsonb_array_length(p_variants) = 0 then raise exception 'media_variants_required'; end if;

  for v_item in select value from jsonb_array_elements(p_variants)
  loop
    if nullif(v_item->>'slot_key','') is null or nullif(v_item->>'storage_path','') is null or nullif(v_item->>'public_url','') is null then
      raise exception 'media_variant_invalid';
    end if;
    if (v_item->>'storage_path') not like p_site_id::text || '/%' then raise exception 'media_variant_path_invalid'; end if;

    insert into public.cq_media_variants (
      site_id, media_id, slot_key, storage_path, public_url,
      width, height, mime_type, size_bytes, crop
    ) values (
      p_site_id, p_media_id, v_item->>'slot_key', v_item->>'storage_path', v_item->>'public_url',
      greatest(0, coalesce((v_item->>'width')::integer, 0)),
      greatest(0, coalesce((v_item->>'height')::integer, 0)),
      coalesce(v_item->>'mime_type','application/octet-stream'),
      greatest(0, coalesce((v_item->>'size_bytes')::bigint, 0)),
      coalesce(v_item->'crop','{}'::jsonb)
    )
    on conflict (media_id, slot_key) do update set
      site_id = excluded.site_id,
      storage_path = excluded.storage_path,
      public_url = excluded.public_url,
      width = excluded.width,
      height = excluded.height,
      mime_type = excluded.mime_type,
      size_bytes = excluded.size_bytes,
      crop = excluded.crop,
      created_at = now()
    returning * into v_row;

    v_result := v_result || jsonb_build_array(to_jsonb(v_row));
  end loop;

  if nullif(p_old_url,'') is not null and nullif(p_new_url,'') is not null and p_old_url <> p_new_url then
    perform public.cq_replace_media_url(p_site_id, p_old_url, p_new_url);
  end if;
  return v_result;
end;
$$;

revoke execute on function public.cq_media_usage(uuid) from public, anon;
revoke execute on function public.cq_trash_media(uuid) from public, anon;
revoke execute on function public.cq_restore_media(uuid) from public, anon;
revoke execute on function public.cq_delete_media_metadata(uuid) from public, anon;
revoke execute on function public.cq_replace_media_url(uuid, text, text) from public, anon, authenticated;
revoke execute on function public.cq_commit_media_variants(uuid, uuid, jsonb, text, text) from public, anon;

grant execute on function public.cq_media_usage(uuid) to authenticated;
grant execute on function public.cq_trash_media(uuid) to authenticated;
grant execute on function public.cq_restore_media(uuid) to authenticated;
grant execute on function public.cq_delete_media_metadata(uuid) to authenticated;
grant execute on function public.cq_commit_media_variants(uuid, uuid, jsonb, text, text) to authenticated;
