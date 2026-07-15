create or replace function public.cq_get_public_site(p_identifier text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with selected_site as (
  select s.*
  from public.cq_sites s
  left join public.cq_site_domains d on d.site_id = s.id
  where s.status = 'active'
    and (
      lower(s.slug) = lower(p_identifier)
      or lower(coalesce(s.default_domain,'')) = lower(p_identifier)
      or lower(coalesce(d.hostname::text,'')) = lower(p_identifier)
    )
  order by case when lower(coalesce(d.hostname::text,'')) = lower(p_identifier) then 0 else 1 end
  limit 1
), selected_settings as (
  select st.*
  from public.cq_site_settings st
  join selected_site s on s.id = st.site_id
), favicon_media as (
  select matched.media_id
  from public.cq_media_variants matched
  join selected_settings st on st.site_id = matched.site_id and st.favicon_url = matched.public_url
  limit 1
)
select case when exists(select 1 from selected_site) then jsonb_build_object(
  'site', (select to_jsonb(s) - 'created_at' - 'updated_at' from selected_site s),
  'settings', coalesce((select to_jsonb(st) - 'site_id' - 'updated_at' from selected_settings st), '{}'::jsonb),
  'media_assets', jsonb_build_object(
    'favicon', coalesce((
      select jsonb_object_agg(v.slot_key, v.public_url order by v.slot_key)
      from public.cq_media_variants v
      where v.media_id = (select media_id from favicon_media)
    ), '{}'::jsonb)
  ),
  'tracking', coalesce((select to_jsonb(tc) - 'site_id' - 'updated_at' from public.cq_tracking_configs tc join selected_site s on s.id = tc.site_id), '{}'::jsonb),
  'sections', coalesce((select jsonb_agg(to_jsonb(x) - 'site_id' - 'created_at' - 'updated_at' order by x.sort_order) from public.cq_sections x join selected_site s on s.id = x.site_id where x.is_enabled and x.status = 'published'), '[]'::jsonb),
  'procedures', coalesce((select jsonb_agg(to_jsonb(x) - 'site_id' - 'created_at' - 'updated_at' order by x.sort_order) from public.cq_procedures x join selected_site s on s.id = x.site_id where x.is_published), '[]'::jsonb),
  'results', coalesce((select jsonb_agg((to_jsonb(x) - 'site_id' - 'created_at' - 'updated_at' - 'consent_confirmed') || jsonb_build_object('procedure_name', p.name) order by x.sort_order) from public.cq_results x join selected_site s on s.id = x.site_id left join public.cq_procedures p on p.id = x.procedure_id where x.is_published and x.consent_confirmed), '[]'::jsonb),
  'testimonials', coalesce((select jsonb_agg((to_jsonb(x) - 'site_id' - 'created_at' - 'updated_at' - 'consent_confirmed') || jsonb_build_object('procedure_name', p.name) order by x.sort_order) from public.cq_testimonials x join selected_site s on s.id = x.site_id left join public.cq_procedures p on p.id = x.procedure_id where x.is_published and x.consent_confirmed), '[]'::jsonb),
  'faq', coalesce((select jsonb_agg(to_jsonb(x) - 'site_id' - 'created_at' - 'updated_at' order by x.sort_order) from public.cq_faq_items x join selected_site s on s.id = x.site_id where x.is_published), '[]'::jsonb)
) else null end;
$$;
