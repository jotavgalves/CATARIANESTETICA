create or replace function public.cq_claim_admin_access()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text := lower(coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'email', ''));
  v_result jsonb;
begin
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  insert into public.cq_site_members(site_id, user_id, role, active)
  select allowlist.site_id, v_user_id, allowlist.role, true
  from public.cq_admin_allowlist allowlist
  where lower(allowlist.email::text) = v_email
  on conflict (site_id, user_id)
  do update set role = excluded.role, active = true;

  select jsonb_build_object(
    'site_id', member.site_id,
    'role', member.role,
    'site', to_jsonb(site) - 'created_at' - 'updated_at'
  )
  into v_result
  from public.cq_site_members member
  join public.cq_sites site on site.id = member.site_id
  where member.user_id = v_user_id
    and member.active
    and site.status = 'active'
  order by case when member.role = 'owner' then 0 else 1 end, member.created_at
  limit 1;

  if v_result is null then
    raise exception 'email_not_authorized' using errcode = '42501';
  end if;

  return v_result;
end;
$$;

revoke all on function public.cq_claim_admin_access() from public;
grant execute on function public.cq_claim_admin_access() to authenticated;
